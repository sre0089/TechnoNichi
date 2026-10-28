import { expect, test, type Page } from '@playwright/test';
const day = (page: Page) =>
  page.getByRole('region', {
    name: 'Tuesday, October 6',
    exact: true,
    includeHidden: true,
  });
async function ready(page: Page) {
  await page.goto('/');
  await expect(page.getByRole('status')).toHaveText('Saved on this device');
}
test('close saves writing and opens a single live book at the same date', async ({
  page,
}) => {
  await ready(page);
  const writing = day(page).getByRole('textbox', {
    name: 'Timed writing 12:00',
    exact: true,
    includeHidden: true,
  });
  await writing.fill('Before closing');
  await writing.press('Enter');
  await page.getByRole('button', { name: 'Close book', exact: true }).click();
  const cover = page.getByRole('region', { name: 'Book cover', exact: true });
  await expect(cover).toBeVisible();
  await expect(day(page)).toBeHidden();
  await expect(
    cover.getByRole('button', { name: 'Open book', exact: true }),
  ).toBeFocused();
  if (test.info().project.name === 'chromium')
    await page.screenshot({ path: 'artifacts/book-cover.png', fullPage: true });
  await cover
    .getByRole('button', { name: 'Open book', exact: true })
    .press('Enter');
  await expect(
    page.getByRole('button', { name: 'Close book', exact: true }),
  ).toBeEnabled();
  await expect(writing).toHaveText('Before closing');
  await expect(day(page)).toHaveCount(1);
  await expect(writing).toHaveCount(1);
  await page.reload();
  await expect(writing).toHaveText('Before closing');
  await expect(cover).toHaveCount(0);
});
test('text selection never turns a page; reduced and no-motion preferences keep navigation usable', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await ready(page);
  const writing = day(page).getByRole('textbox', {
    name: 'Timed writing 12:00',
    exact: true,
    includeHidden: true,
  });
  await writing.fill('Select these words');
  await writing.press('ControlOrMeta+a');
  await expect(day(page)).toBeVisible();
  await expect(page.locator('#book')).toHaveClass(/book-open/);
  await writing.press('Escape');
  await page.getByRole('button', { name: 'Next spread', exact: true }).click();
  await expect(page.locator('#book')).toHaveClass(/book-open/);
  await expect(page.locator('#book')).toHaveCSS('animation-name', 'none');
  await page
    .getByRole('button', { name: 'View settings', exact: true })
    .click();
  const settings = page.getByRole('dialog', { name: 'View settings' });
  await settings
    .getByRole('combobox', { name: 'Book motion' })
    .selectOption('none');
  await settings.getByRole('button', { name: 'Done', exact: true }).click();
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.reload();
  await page
    .getByRole('button', { name: 'Previous spread', exact: true })
    .click();
  await expect(day(page)).toBeVisible();
  await expect(page.locator('#book')).toHaveCSS('animation-name', 'none');
});
test('failed saving keeps the book open with its recoverable writing', async ({
  page,
}) => {
  await ready(page);
  await page.evaluate(() => {
    const original = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (
      ...args: Parameters<IDBObjectStore['put']>
    ) {
      if (this.name === 'entries')
        throw new DOMException('Synthetic quota', 'QuotaExceededError');
      return original.apply(this, args);
    };
  });
  const writing = day(page).getByRole('textbox', {
    name: 'Timed writing 12:00',
    exact: true,
    includeHidden: true,
  });
  await writing.fill('Keep my draft');
  await expect(page.getByRole('status')).toHaveText('Storage problem');
  await page.getByRole('button', { name: 'Close book', exact: true }).click();
  await expect(day(page)).toBeVisible();
  await expect(writing).toHaveText('Keep my draft');
  await expect(
    page.getByRole('region', { name: 'Book cover', exact: true }),
  ).toHaveCount(0);
});
test('rapid turns and viewport changes settle without duplicate editors', async ({
  page,
}) => {
  await ready(page);
  await page.getByRole('button', { name: 'Next spread', exact: true }).click();
  await page.setViewportSize({ width: 900, height: 900 });
  await page.getByRole('button', { name: 'Next spread', exact: true }).click();
  await page
    .getByRole('button', { name: 'Previous spread', exact: true })
    .click();
  await expect(
    page.getByRole('region', { name: 'Thursday, October 8', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Next spread', exact: true }),
  ).toBeEnabled();
  const ids = await page
    .locator('[contenteditable="true"]')
    .evaluateAll((nodes) => nodes.map((node) => node.id));
  expect(ids.length).toBe(new Set(ids).size);
});
