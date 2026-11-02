import { expect, test, type Page } from '@playwright/test';
import { manifest, newEntry } from '../../src/domain/model';
import { legacyBook, legacyPreferences } from '../fixtures/legacy-book';

async function start(page: Page) {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'Create your book' }),
  ).toBeVisible();
}
async function counts(page: Page) {
  return page.evaluate(async () => {
    const request = indexedDB.open('daily-book-v1');
    const db = await new Promise<IDBDatabase>((resolve) => {
      request.onsuccess = () => resolve(request.result);
    });
    const stores = ['books', 'pages', 'entries', 'preferences'];
    const tx = db.transaction(stores);
    const values = await Promise.all(
      stores.map(
        (name) =>
          new Promise<number>((resolve) => {
            const count = tx.objectStore(name).count();
            count.onsuccess = () => resolve(count.result);
          }),
      ),
    );
    db.close();
    return values;
  });
}
async function create(page: Page, year = '2027') {
  await page.getByLabel('Book name', { exact: true }).fill('My planning book');
  await page.getByLabel('Year', { exact: true }).fill(year);
  await page.getByLabel('Today timezone', { exact: true }).fill('UTC');
  await page.getByRole('button', { name: 'Create book', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('Saved on this device');
}

test('a fresh yearly book starts at January 1 outside its year and resumes writing after reopening', async ({
  page,
}, info) => {
  await page.clock.install({ time: new Date('2026-10-07T12:00:00Z') });
  await start(page);
  expect(await counts(page)).toEqual([0, 0, 0, 0]);
  await page.getByLabel('Open book to', { exact: true }).selectOption('resume');
  if (info.project.name === 'chromium')
    await page.screenshot({ path: 'artifacts/book-setup-desktop.png' });
  await create(page);
  await expect(
    page.getByRole('region', { name: 'Friday, January 1', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Next spread', exact: true }).click();
  const writing = page.getByRole('textbox', {
    name: 'Task 1 on 2027-01-03',
    exact: true,
  });
  await writing.fill('A new year');
  await writing.press('Escape');
  await expect(page.getByRole('status')).toHaveText('Saved on this device');
  await page.reload();
  await expect(writing).toHaveText('A new year');
  expect(await counts(page)).toEqual([1, 365, 1, 1]);
});

test('Today uses the selected timezone and opens its correct page side on a phone', async ({
  page,
}, info) => {
  await page.clock.install({ time: new Date('2026-10-07T01:00:00Z') });
  await page.setViewportSize({ width: 375, height: 844 });
  await start(page);
  if (info.project.name === 'chromium')
    await page.screenshot({ path: 'artifacts/book-setup-phone.png' });
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(375);
  await create(page, '2026');
  await expect(
    page.getByRole('region', { name: 'Wednesday, October 7', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Next spread', exact: true }).click();
  await page.reload();
  await expect(
    page.getByRole('region', { name: 'Wednesday, October 7', exact: true }),
  ).toBeVisible();
});

test('failed setup rolls back every table and retry preserves the new empty book', async ({
  page,
}) => {
  await start(page);
  await page.evaluate(() => {
    const add = IDBObjectStore.prototype.add;
    IDBObjectStore.prototype.add = function (
      ...args: Parameters<IDBObjectStore['add']>
    ) {
      if (this.name === 'preferences') {
        IDBObjectStore.prototype.add = add;
        throw new DOMException('Synthetic quota failure', 'QuotaExceededError');
      }
      return add.apply(this, args);
    };
  });
  await page.getByRole('button', { name: 'Create book', exact: true }).click();
  await expect(page.getByRole('main').getByRole('alert')).toContainText(
    'Your book could not be saved',
  );
  expect(await counts(page)).toEqual([0, 0, 0, 0]);
  await create(page, '2028');
  expect(await counts(page)).toEqual([1, 366, 0, 1]);
  await page.reload();
  await expect(page.getByRole('status')).toHaveText('Saved on this device');
  await expect(
    page.getByRole('heading', { name: 'Create your book' }),
  ).toHaveCount(0);
});

test('invalid timezone and malformed backup keep first use intact', async ({
  page,
}) => {
  await start(page);
  await page.getByLabel('Today timezone', { exact: true }).fill('Made/Up');
  await page.getByRole('button', { name: 'Create book', exact: true }).click();
  await expect(page.getByRole('main').getByRole('alert')).toContainText(
    'valid timezone',
  );
  expect(await counts(page)).toEqual([0, 0, 0, 0]);
  await page.getByRole('button', { name: 'Backups', exact: true }).click();
  await page.getByLabel('Backup file', { exact: true }).setInputFiles({
    name: 'invalid.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{'),
  });
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText(
    'not a valid Daily Book backup',
  );
  expect(await counts(page)).toEqual([0, 0, 0, 0]);
});

test('retained drafts block new creation and survive restoring their original book', async ({
  page,
}) => {
  const draft = {
    ...newEntry('personal-2026:daily:2026-10-06', { type: 'task', slot: 0 }),
    text: 'Retained before setup',
  };
  await page.addInitScript(
    (raw) => {
      if (!sessionStorage.getItem('seeded')) {
        sessionStorage.setItem('daily-book:tab-draft-v1', raw);
        sessionStorage.setItem('seeded', 'yes');
      }
    },
    JSON.stringify([draft]),
  );
  await start(page);
  await expect(
    page.getByRole('button', { name: 'Create book', exact: true }),
  ).toBeDisabled();
  await expect(page.getByRole('main').getByRole('alert')).toContainText(
    'Retained writing',
  );
  expect(await counts(page)).toEqual([0, 0, 0, 0]);
  expect(
    await page.evaluate(() =>
      sessionStorage.getItem('daily-book:tab-draft-v1'),
    ),
  ).toContain(draft.text);
  await page.getByRole('button', { name: 'Backups', exact: true }).click();
  await page.getByLabel('Backup file', { exact: true }).setInputFiles({
    name: 'original.json',
    mimeType: 'application/json',
    buffer: Buffer.from(
      JSON.stringify({
        format: 'daily-book-backup',
        version: 1,
        exportedAt: '2026-10-06T12:00:00.000Z',
        book: legacyBook,
        pages: manifest(legacyBook),
        entries: [],
        preferences: legacyPreferences,
      }),
    ),
  });
  await page
    .getByRole('button', { name: 'Restore backup', exact: true })
    .click();
  const writing = page.getByRole('textbox', {
    name: 'Task 1 on 2026-10-06',
    exact: true,
  });
  await expect(writing).toHaveText(draft.text);
  await expect(page.getByRole('status')).toHaveText('Saved on this device');
  await page.reload();
  await expect(writing).toHaveText(draft.text);
});

test('two first-use tabs cannot replace one another and the losing tab can open the created book', async ({
  page,
  context,
}) => {
  await start(page);
  const other = await context.newPage();
  await start(other);
  await create(page, '2027');
  await other.getByRole('button', { name: 'Create book', exact: true }).click();
  await expect(other.getByRole('main').getByRole('alert')).toContainText(
    'already contains a book',
  );
  await other
    .getByRole('button', { name: 'Try opening again', exact: true })
    .click();
  await expect(other.getByRole('status')).toHaveText('Saved on this device');
  await expect(
    other.getByRole('region', { name: 'Friday, January 1', exact: true }),
  ).toBeVisible();
});
