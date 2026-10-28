import { expect, test, type Page } from '@playwright/test';
async function ready(page: Page) {
  await page.goto('/');
  await expect(page.getByRole('status')).toHaveText('Saved on this device');
}
test('search opens the original off-spread item, retains formatting and filters dates/types', async ({
  page,
}) => {
  await ready(page);
  const initial = page.getByRole('textbox', {
    name: 'Task 1 on 2026-10-06',
    exact: true,
  });
  await initial.click();
  await initial.press('Control+b');
  await initial.pressSequentially('SYNTHETIC comet plan');
  await initial.press('Escape');
  await page.getByRole('button', { name: 'Search book', exact: true }).click();
  const samePage = page.getByRole('dialog', { name: 'Search your book' });
  await samePage
    .getByRole('searchbox', { name: 'Search writing' })
    .fill('comet');
  await samePage
    .getByRole('list', { name: 'Search results' })
    .getByRole('button')
    .click();
  await expect(initial).toBeFocused();
  await initial.press('Escape');
  await page.getByRole('button', { name: 'Next spread', exact: true }).click();
  await page.getByRole('button', { name: 'Search book', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Search your book' });
  await dialog
    .getByRole('searchbox', { name: 'Search writing', exact: true })
    .fill('COMET');
  await expect(
    dialog.getByRole('list', { name: 'Search results' }).getByRole('button'),
  ).toHaveCount(1);
  await dialog
    .getByRole('combobox', { name: 'Entry type' })
    .selectOption('note');
  await expect(
    dialog.getByRole('list', { name: 'Search results' }).getByRole('button'),
  ).toHaveCount(0);
  await dialog
    .getByRole('combobox', { name: 'Entry type' })
    .selectOption('task');
  await dialog.getByLabel('On date', { exact: true }).fill('2026-10-06');
  await dialog
    .getByRole('list', { name: 'Search results' })
    .getByRole('button')
    .click();
  await expect(dialog).toHaveCount(0);
  await expect(initial).toHaveText('SYNTHETIC comet plan');
  await expect(initial).toBeFocused();
  await expect(initial.locator('strong')).toHaveText('SYNTHETIC comet plan');
  await initial.fill('SYNTHETIC comet plan revised');
  await initial.press('Escape');
  await expect(page.getByRole('status')).toHaveText('Saved on this device');
  await page.reload();
  await expect(initial).toHaveText('SYNTHETIC comet plan revised');
});
test('search excludes deleted entries and refuses to hide unsaved failed drafts', async ({
  page,
}) => {
  await ready(page);
  const writing = page.getByRole('textbox', {
    name: 'Task 1 on 2026-10-06',
    exact: true,
  });
  await writing.fill('Hidden deleted wording');
  await writing.press('Escape');
  await page.getByRole('button', { name: 'Delete entry', exact: true }).click();
  await page
    .getByRole('dialog', { name: 'Delete entry?' })
    .getByRole('button', { name: 'Delete entry', exact: true })
    .click();
  await page.getByRole('button', { name: 'Search book', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Search your book' });
  await dialog
    .getByRole('searchbox', { name: 'Search writing' })
    .fill('Hidden deleted');
  await expect(
    dialog.getByRole('list', { name: 'Search results' }).getByRole('button'),
  ).toHaveCount(0);
  await dialog
    .getByRole('button', { name: 'Close dialog', exact: true })
    .click();
  await page.evaluate(() => {
    const put = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (
      ...args: Parameters<IDBObjectStore['put']>
    ) {
      if (this.name === 'entries')
        throw new DOMException('Synthetic quota', 'QuotaExceededError');
      return put.apply(this, args);
    };
  });
  await writing.fill('Keep failed draft');
  await expect(page.getByRole('status')).toHaveText('Storage problem');
  await page.getByRole('button', { name: 'Search book', exact: true }).click();
  await expect(dialog.getByRole('alert')).toContainText('could not save');
  await dialog
    .getByRole('button', { name: 'Close dialog', exact: true })
    .click();
  await expect(writing).toHaveText('Keep failed draft');
});
