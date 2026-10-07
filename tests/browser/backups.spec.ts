import { readFile } from 'node:fs/promises';
import {
  expect,
  test as base,
  type BrowserContext,
  type Page,
} from '@playwright/test';
import type { Editor } from '@tiptap/core';
import { manifest, newEntry, type Book } from '../../src/domain/model';
import type { PlannerBackup } from '../../src/local/backup';

const test = base.extend<{ restoredContext: BrowserContext }>({
  restoredContext: async ({ browser }, provide) => {
    const context = await browser.newContext();
    try {
      await provide(context);
    } finally {
      // Fixture teardown has its own timeout and cannot mask the failing action.
      await context.close();
    }
  },
});

async function ready(page: Page) {
  await page.goto('/');
  await expect(page.getByRole('status')).toHaveText('Saved on this device');
}

async function snapshot(page: Page) {
  return page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('daily-book-v1');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const stores = ['books', 'pages', 'entries', 'preferences'];
    const transaction = db.transaction(stores, 'readonly');
    const done = new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onabort = () => reject(transaction.error);
    });
    const rows = await Promise.all(
      stores.map(
        (store) =>
          new Promise<unknown[]>((resolve, reject) => {
            const request = transaction.objectStore(store).getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
          }),
      ),
    );
    await done;
    db.close();
    return Object.fromEntries(
      stores.map((store, index) => [store, rows[index]]),
    );
  });
}

function file(archive: unknown) {
  return {
    name: 'synthetic-backup.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(archive)),
  };
}

function fixture(): PlannerBackup {
  const book: Book = {
    id: 'imported-2028',
    title: 'Synthetic leap-year book',
    year: 2028,
    startDate: '2028-01-01',
    endDate: '2028-12-31',
    locale: 'en-US',
    todayTimeZone: 'UTC',
    templateVersion: 1,
  };
  const pages = manifest(book);
  return {
    format: 'daily-book-backup',
    version: 1,
    exportedAt: '2026-10-06T12:00:00.000Z',
    book,
    pages,
    entries: [
      {
        ...newEntry(pages[58].id, {
          type: 'scheduled-line',
          minute: 720,
          dayOffset: 0,
        }),
        text: 'Leap year writing',
        revision: 7,
        submitted: true,
        completed: false,
        formatRuns: [{ from: 0, to: 4, bold: true, underline: true }],
      },
    ],
    preferences: {
      id: 'local',
      bookId: book.id,
      pageIndex: 58,
      focusSide: 0,
      toolbarSide: 'left',
      zoom: 0.85,
    },
  };
}

test('download and restore a complete book with word formatting, completion, notes and off-spread entries', async ({
  page,
  restoredContext,
}, testInfo) => {
  // This journey writes a book, opens another full editor, restores, reloads and
  // verifies refusal in the source profile. Linux WebKit exhausts 30s doing both.
  // Keep the usual 5s assertions and the 30s default for every other journey.
  test.setTimeout(60_000);
  const { backup, before } =
    await test.step('Write entries and download the complete year', async () => {
      await ready(page);
      const day = page.getByRole('region', {
        name: 'Tuesday, October 6',
        exact: true,
      });
      const writing = day.getByRole('textbox', {
        name: 'Timed writing 12:00',
        exact: true,
      });
      await writing.fill('Read notes');
      // Set the fixture's word selection through the mounted editor, then exercise
      // the real format shortcut. Native Home varies across desktop platforms.
      await writing.evaluate((node) => {
        (
          node as HTMLElement & { editor: Editor }
        ).editor.commands.setTextSelection({ from: 1, to: 5 });
      });
      await writing.press('ControlOrMeta+B');
      await expect(writing.locator('strong')).toHaveText('Read');
      await writing.press('Enter');
      await day
        .getByRole('checkbox', {
          name: 'Complete timed task 12:00 on 2026-10-06',
          exact: true,
        })
        .check();
      await day
        .getByRole('textbox', { name: 'Task 1 on 2026-10-06', exact: true })
        .fill('Review project');
      await day.getByRole('button', { name: '+ Note', exact: true }).click();
      await day
        .getByRole('textbox', { name: 'Note on 2026-10-06', exact: true })
        .fill('Free note\nSecond line');
      await page
        .getByRole('button', { name: 'Next spread', exact: true })
        .click();
      await page
        .getByRole('region', { name: 'Thursday, October 8', exact: true })
        .getByRole('textbox', { name: 'Timed writing 10:00', exact: true })
        .fill('Later writing');
      await page
        .getByRole('button', { name: 'Previous spread', exact: true })
        .click();
      await page.getByRole('button', { name: 'Backups', exact: true }).click();
      const downloading = page.waitForEvent('download');
      await page
        .getByRole('button', { name: 'Download backup', exact: true })
        .click();
      const download = await downloading;
      expect(download.suggestedFilename()).toMatch(
        /^daily-book-2026-\d{4}-\d{2}-\d{2}\.json$/,
      );
      const backupText = await readFile((await download.path())!, 'utf8');
      const backup = JSON.parse(backupText) as PlannerBackup;
      expect(backup.pages).toHaveLength(365);
      expect(
        backup.entries.some((entry) => entry.text === 'Later writing'),
      ).toBe(true);
      const before = await snapshot(page);
      return { backup, before };
    });
  await test.step('Restore the downloaded book in a fresh profile and reopen it', async () => {
    const target = await restoredContext.newPage();
    await ready(target);
    await target.getByRole('button', { name: 'Backups', exact: true }).click();
    await target
      .getByLabel('Backup file', { exact: true })
      .setInputFiles(file(backup));
    await expect(target.getByLabel('Backup preview')).toContainText(
      '365 daily pages',
    );
    if (testInfo.project.name === 'chromium')
      await target.screenshot({
        path: 'artifacts/backups-desktop.png',
      });
    // Choosing/reviewing a file must not write it yet.
    expect((await snapshot(target)).entries).toHaveLength(0);
    await target
      .getByRole('button', { name: 'Restore backup', exact: true })
      .click();
    await expect(target.getByRole('dialog').getByRole('status')).toHaveText(
      'Backup restored. Your book is ready.',
    );
    expect(await snapshot(target)).toEqual(before);
    await target
      .getByRole('button', { name: 'Close dialog', exact: true })
      .click();
    const restoredWriting = target
      .getByRole('region', { name: 'Tuesday, October 6', exact: true })
      .getByRole('textbox', { name: 'Timed writing 12:00', exact: true });
    await expect(restoredWriting).toHaveText('Read notes');
    await expect(restoredWriting.locator('strong')).toHaveText('Read');
    await expect(
      target.getByRole('checkbox', {
        name: 'Complete timed task 12:00 on 2026-10-06',
        exact: true,
      }),
    ).toBeChecked();
    await target.reload();
    await expect(restoredWriting).toHaveText('Read notes');
    await target
      .getByRole('button', { name: 'Next spread', exact: true })
      .click();
    await expect(
      target
        .getByRole('region', { name: 'Thursday, October 8', exact: true })
        .getByRole('textbox', { name: 'Timed writing 10:00', exact: true }),
    ).toHaveText('Later writing');
  });
  await test.step('Refuse restoration into the source book without changing it', async () => {
    await page
      .getByLabel('Backup file', { exact: true })
      .setInputFiles(file(backup));
    await page
      .getByRole('button', { name: 'Restore backup', exact: true })
      .click();
    await expect(page.getByRole('alert')).toContainText('has saved entries');
    expect(await snapshot(page)).toEqual(before);
  });
});

test('invalid imports leave data intact and the backup dialog works by keyboard at phone size', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await ready(page);
  const trigger = page.getByRole('button', { name: 'Backups', exact: true });
  await trigger.focus();
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  const bounds = await dialog.boundingBox();
  expect(bounds!.x).toBeGreaterThanOrEqual(15);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(305);
  expect(bounds!.height).toBeLessThanOrEqual(844 * 0.85 + 1);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(320);
  const before = await snapshot(page);
  const invalid = fixture();
  invalid.entries.push(invalid.entries[0]);
  await page
    .getByLabel('Backup file', { exact: true })
    .setInputFiles(file(invalid));
  await expect(page.getByRole('alert')).toContainText(
    'not a valid Daily Book backup',
  );
  if (testInfo.project.name === 'chromium')
    await page.screenshot({
      path: 'artifacts/backups-phone.png',
    });
  await expect(
    page.getByRole('button', { name: 'Restore backup', exact: true }),
  ).toHaveCount(0);
  expect(await snapshot(page)).toEqual(before);
  await page.getByLabel('Backup file', { exact: true }).setInputFiles({
    name: 'broken.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{'),
  });
  await expect(page.getByRole('alert')).toContainText(
    'not a valid Daily Book backup',
  );
  expect(await snapshot(page)).toEqual(before);
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test('a storage failure rolls back restore; retry activates the imported leap-year book and survives reload', async ({
  page,
}) => {
  await ready(page);
  const before = await snapshot(page);
  await page.evaluate(() => {
    const original = IDBObjectStore.prototype.add;
    IDBObjectStore.prototype.add = function (
      ...args: Parameters<IDBObjectStore['add']>
    ) {
      if (this.name === 'preferences') {
        IDBObjectStore.prototype.add = original;
        throw new DOMException('Synthetic quota failure', 'QuotaExceededError');
      }
      return original.apply(this, args);
    };
  });
  await page.getByRole('button', { name: 'Backups', exact: true }).click();
  await page
    .getByLabel('Backup file', { exact: true })
    .setInputFiles(file(fixture()));
  await page
    .getByRole('button', { name: 'Restore backup', exact: true })
    .click();
  await expect(page.getByRole('alert')).toHaveText(
    'Restore could not finish. Your existing planner has not been changed.',
  );
  expect(await snapshot(page)).toEqual(before);
  await page
    .getByRole('button', { name: 'Restore backup', exact: true })
    .click();
  await expect(page.getByRole('dialog').getByRole('status')).toHaveText(
    'Backup restored. Your book is ready.',
  );
  await page.getByRole('button', { name: 'Close dialog', exact: true }).click();
  const writing = page
    .getByRole('region', { name: 'Monday, February 28', exact: true })
    .getByRole('textbox', { name: 'Timed writing 12:00', exact: true });
  await expect(writing).toHaveText('Leap year writing');
  await expect(writing.locator('strong u, u strong')).toHaveText('Leap');
  await expect(
    page.getByRole('region', { name: 'Tuesday, February 29', exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(writing).toHaveText('Leap year writing');
  await writing.fill('Leap year writing updated');
  await expect(page.getByRole('status')).toHaveText('Saved on this device');
  await page.reload();
  await expect(writing).toHaveText('Leap year writing updated');
  expect((await snapshot(page)).books).toHaveLength(1);
});

test('failed draft saving prevents a misleading backup download and retains recovery writing', async ({
  page,
}) => {
  await ready(page);
  await page.evaluate(() => {
    const original = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (
      ...args: Parameters<IDBObjectStore['put']>
    ) {
      if (this.name === 'entries')
        throw new DOMException('Synthetic quota failure', 'QuotaExceededError');
      return original.apply(this, args);
    };
  });
  await page
    .getByRole('region', { name: 'Tuesday, October 6', exact: true })
    .getByRole('textbox', { name: 'Timed writing 12:00', exact: true })
    .fill('Keep this newest draft');
  await page.getByRole('button', { name: 'Backups', exact: true }).click();
  let downloads = 0;
  page.on('download', () => {
    downloads++;
  });
  await page
    .getByRole('button', { name: 'Download backup', exact: true })
    .click();
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText(
    'latest writing could not save',
  );
  expect(downloads).toBe(0);
  expect(
    await page.evaluate(() => localStorage.getItem('daily-book:unsaved-v1')),
  ).toContain('Keep this newest draft');
});
