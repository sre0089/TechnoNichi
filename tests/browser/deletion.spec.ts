import { expect, test, type Page } from '@playwright/test';

const day = (page: Page) =>
  page.getByRole('region', {
    name: 'Tuesday, October 6',
    exact: true,
    includeHidden: true,
  });
const row = (page: Page) =>
  day(page).getByRole('textbox', {
    name: 'Timed writing 12:00',
    exact: true,
    includeHidden: true,
  });
async function ready(page: Page) {
  await page.goto('/');
  await expect(page.getByRole('status')).toHaveText('Saved on this device');
}
async function deleted(page: Page) {
  await page.getByRole('button', { name: 'Delete entry', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Delete entry?' });
  await dialog
    .getByRole('button', { name: 'Delete entry', exact: true })
    .click();
  await expect(dialog).toHaveCount(0);
}
async function panel(page: Page) {
  await page
    .getByRole('button', { name: 'Deleted entries', exact: true })
    .click();
  const dialog = page.getByRole('dialog', {
    name: 'Deleted entries',
    exact: true,
  });
  await expect(dialog.getByText('Working on deleted entries…')).toHaveCount(0);
  return dialog;
}
async function close(page: Page) {
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Close dialog', exact: true })
    .click();
}

test('a formatted completed timed task can be deleted, rewritten safely and restored after reload', async ({
  page,
}) => {
  await ready(page);
  const writing = row(page);
  await writing.click();
  await writing.press('Control+b');
  await writing.pressSequentially('Lunch');
  await expect(writing.locator('strong')).toHaveText('Lunch');
  await writing.press('Enter');
  await day(page)
    .getByRole('checkbox', { name: 'Complete timed task 12:00 on 2026-10-06' })
    .check();
  await deleted(page);
  await expect(writing).toHaveText('');
  await expect(day(page).locator('.schedule-line')).toHaveCount(0);
  await page.reload();
  await writing.fill('Replacement');
  await expect(page.getByRole('status')).toHaveText('Saved on this device');
  let recovery = await panel(page);
  const original = recovery
    .getByRole('region', { name: '2026-10-06 · Timed task 12:00' })
    .filter({ hasText: 'Lunch' });
  await expect(original.getByText('Lunch', { exact: true })).toHaveCSS(
    'font-weight',
    '700',
  );
  await expect(original.getByText('Completed', { exact: true })).toBeVisible();
  if (test.info().project.name === 'chromium')
    await page.screenshot({
      path: 'artifacts/deletion-desktop.png',
      fullPage: true,
    });
  await original.getByRole('button', { name: 'Restore entry' }).click();
  await expect(recovery.getByRole('alert')).toContainText(
    'original space is occupied',
  );
  await close(page);
  await expect(writing).toHaveText('Replacement');
  await writing.click();
  await deleted(page);
  recovery = await panel(page);
  await recovery
    .getByRole('region', { name: '2026-10-06 · Timed task 12:00' })
    .filter({ hasText: 'Lunch' })
    .getByRole('button', { name: 'Restore entry' })
    .click();
  await expect(recovery.getByRole('status')).toHaveText(
    'Entry restored to its original page.',
  );
  await close(page);
  await expect(writing.locator('strong')).toHaveText('Lunch');
  await expect(
    day(page).getByRole('checkbox', {
      name: 'Complete timed task 12:00 on 2026-10-06',
    }),
  ).toBeChecked();
  await page.reload();
  await expect(writing.locator('strong')).toHaveText('Lunch');
  await writing.fill('Lunch updated');
  await expect(page.getByRole('status')).toHaveText('Saved on this device');
  await page.reload();
  await expect(writing).toHaveText('Lunch updated');
});

test('checklist slots retain their deleted history and reject restoration over newer writing', async ({
  page,
}) => {
  await ready(page);
  const task = day(page).getByRole('textbox', {
    name: 'Task 1 on 2026-10-06',
    exact: true,
  });
  await task.fill('Old checklist');
  await deleted(page);
  await task.fill('New checklist');
  await expect(page.getByRole('status')).toHaveText('Saved on this device');
  const recovery = await panel(page);
  await recovery.getByRole('button', { name: 'Restore entry' }).click();
  await expect(recovery.getByRole('alert')).toContainText(
    'original space is occupied',
  );
  await close(page);
  await expect(task).toHaveText('New checklist');
  await task.click();
  await deleted(page);
  const list = await panel(page);
  await list
    .getByRole('region')
    .filter({ hasText: 'Old checklist' })
    .getByRole('button', { name: 'Restore entry' })
    .click();
  await close(page);
  await expect(task).toHaveText('Old checklist');
  await page.reload();
  await expect(task).toHaveText('Old checklist');
});

test('free notes retain formatting and position and can be recovered from a different spread', async ({
  page,
}) => {
  await ready(page);
  await day(page).getByRole('button', { name: '+ Note', exact: true }).click();
  const note = day(page).getByRole('textbox', {
    name: 'Note on 2026-10-06',
    exact: true,
  });
  await note.fill('A free note');
  const bounds = await note.locator('..').locator('..').getAttribute('style');
  await deleted(page);
  await expect(note).toHaveCount(0);
  await page.getByRole('button', { name: 'Next spread', exact: true }).click();
  const recovery = await panel(page);
  await recovery
    .getByRole('region', { name: '2026-10-06 · Free note' })
    .getByRole('button', { name: 'Restore entry' })
    .click();
  await close(page);
  await expect(day(page)).toHaveCount(0);
  await page
    .getByRole('button', { name: 'Previous spread', exact: true })
    .click();
  await expect(note).toHaveText('A free note');
  await expect(note.locator('..').locator('..')).toHaveAttribute(
    'style',
    bounds!,
  );
  await page.reload();
  await expect(note).toHaveText('A free note');
});

test('delete cancellation and storage failures retain writing; restoration can retry', async ({
  page,
}) => {
  await ready(page);
  const writing = row(page);
  await writing.fill('Keep my writing');
  await expect(page.getByRole('status')).toHaveText('Saved on this device');
  await page.getByRole('button', { name: 'Delete entry', exact: true }).click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Keep entry' })
    .click();
  await expect(writing).toHaveText('Keep my writing');
  const failNextWrite = async () =>
    page.evaluate(() => {
      const original = IDBObjectStore.prototype.put;
      IDBObjectStore.prototype.put = function (
        ...args: Parameters<IDBObjectStore['put']>
      ) {
        if (this.name === 'entries') {
          IDBObjectStore.prototype.put = original;
          throw new DOMException(
            'Synthetic storage failure',
            'QuotaExceededError',
          );
        }
        return original.apply(this, args);
      };
    });
  await failNextWrite();
  await page.getByRole('button', { name: 'Delete entry', exact: true }).click();
  const confirmation = page.getByRole('dialog', { name: 'Delete entry?' });
  await confirmation
    .getByRole('button', { name: 'Delete entry', exact: true })
    .click();
  await expect(confirmation.getByRole('alert')).toBeVisible();
  await expect(writing).toHaveText('Keep my writing');
  await confirmation
    .getByRole('button', { name: 'Delete entry', exact: true })
    .click();
  await expect(confirmation).toHaveCount(0);
  const recovery = await panel(page);
  await failNextWrite();
  await recovery.getByRole('button', { name: 'Restore entry' }).click();
  await expect(recovery.getByRole('alert')).toBeVisible();
  await expect(
    recovery.getByText('Keep my writing', { exact: true }),
  ).toBeVisible();
  await recovery.getByRole('button', { name: 'Restore entry' }).click();
  await expect(recovery.getByRole('status')).toHaveText(
    'Entry restored to its original page.',
  );
  await close(page);
  await expect(writing).toHaveText('Keep my writing');
});

test('the recovery panel works by keyboard at phone size and returns focus to its trigger', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await ready(page);
  const trigger = page.getByRole('button', {
    name: 'Deleted entries',
    exact: true,
  });
  await trigger.focus();
  await trigger.press('Enter');
  const recovery = page.getByRole('dialog', {
    name: 'Deleted entries',
    exact: true,
  });
  await expect(recovery.getByText('No deleted entries.')).toBeVisible();
  if (test.info().project.name === 'chromium')
    await page.screenshot({
      path: 'artifacts/deletion-phone.png',
      fullPage: true,
    });
  const bounds = await recovery.boundingBox();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(320);
  await page.keyboard.press('Escape');
  await expect(recovery).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test('failed draft saving prevents deletion and retains the latest writing for retry', async ({
  page,
}) => {
  await ready(page);
  await page.evaluate(() => {
    const original = IDBObjectStore.prototype.put;
    Object.assign(window, {
      restoreWritingStorage: () => {
        IDBObjectStore.prototype.put = original;
      },
    });
    IDBObjectStore.prototype.put = function (
      ...args: Parameters<IDBObjectStore['put']>
    ) {
      if (this.name === 'entries')
        throw new DOMException('Synthetic quota failure', 'QuotaExceededError');
      return original.apply(this, args);
    };
  });
  await row(page).fill('Latest unsaved writing');
  await page.getByRole('button', { name: 'Delete entry', exact: true }).click();
  const confirmation = page.getByRole('dialog', { name: 'Delete entry?' });
  await confirmation
    .getByRole('button', { name: 'Delete entry', exact: true })
    .click();
  await expect(confirmation.getByRole('alert')).toContainText(
    'latest writing could not save',
  );
  await expect(row(page)).toHaveText('Latest unsaved writing');
  await page.evaluate(() =>
    (
      window as typeof window & { restoreWritingStorage: () => void }
    ).restoreWritingStorage(),
  );
  await confirmation
    .getByRole('button', { name: 'Delete entry', exact: true })
    .click();
  await expect(confirmation).toHaveCount(0);
  const recovery = await panel(page);
  await expect(
    recovery.getByText('Latest unsaved writing', { exact: true }),
  ).toBeVisible();
});

test('book-wide recovery renders twenty entries per page and can restore the last page', async ({
  page,
}) => {
  await ready(page);
  await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('daily-book-v1');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const transaction = db.transaction('entries', 'readwrite');
    const done = new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onabort = () => reject(transaction.error);
    });
    for (let index = 0; index < 21; index++)
      transaction.objectStore('entries').put({
        id: `synthetic-deleted-${index}`,
        pageId: 'personal-2026:daily:2026-10-06',
        type: 'note',
        x: 28.5,
        y: 127.3,
        width: 62.9,
        height: 14.8,
        text: `Deleted note ${index + 1}`,
        revision: 1,
        deletedAt: new Date(Date.UTC(2026, 9, 6, 0, index)).toISOString(),
        style: { ink: 'purple', emphasis: false },
      });
    await done;
    db.close();
  });
  await page.reload();
  const recovery = await panel(page);
  await expect(
    recovery.getByRole('button', { name: 'Restore entry' }),
  ).toHaveCount(20);
  await recovery.getByRole('button', { name: 'Next deleted entries' }).click();
  await expect(
    recovery.getByRole('button', { name: 'Restore entry' }),
  ).toHaveCount(1);
  await expect(
    recovery.getByText('Deleted note 1', { exact: true }),
  ).toBeVisible();
  await recovery.getByRole('button', { name: 'Restore entry' }).click();
  await expect(
    recovery.getByRole('button', { name: 'Restore entry' }),
  ).toHaveCount(20);
  await close(page);
  await expect(
    day(page).getByRole('textbox', { name: 'Note on 2026-10-06' }),
  ).toHaveText('Deleted note 1');
});
