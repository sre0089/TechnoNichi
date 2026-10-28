import { expect, test, type Page } from '@playwright/test';
test.use({ timezoneId: 'America/New_York' });
async function ready(page: Page) {
  await page.goto('/');
  await expect(page.getByRole('status')).toHaveText('Saved on this device');
}
async function jump(page: Page, date: string) {
  await page.getByRole('button', { name: 'Jump to date', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Open a date' });
  await dialog.getByLabel('Date', { exact: true }).fill(date);
  await dialog.getByRole('button', { name: 'Open date', exact: true }).click();
  await expect(dialog).toHaveCount(0);
}
test('date jumps save current writing, select the correct phone side and persist resume', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await ready(page);
  const initial = page.getByRole('textbox', {
    name: 'Task 1 on 2026-10-06',
    exact: true,
  });
  await initial.fill('Before jump');
  await jump(page, '2026-01-02');
  await expect(
    page.getByRole('region', { name: 'Friday, January 2', exact: true }),
  ).toBeVisible();
  await page
    .getByRole('textbox', { name: 'Task 1 on 2026-01-02', exact: true })
    .fill('January words');
  await page.reload();
  await expect(
    page.getByRole('region', { name: 'Friday, January 2', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('textbox', { name: 'Task 1 on 2026-01-02', exact: true }),
  ).toHaveText('January words');
  await jump(page, '2026-10-06');
  await expect(initial).toHaveText('Before jump');
  await jump(page, '2026-12-31');
  await expect(
    page.getByRole('region', { name: 'Thursday, December 31', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Next spread', exact: true }),
  ).toBeDisabled();
});
test('Today uses the book timezone and reports a date outside its year', async ({
  page,
}) => {
  await page.clock.setFixedTime(new Date('2026-10-28T02:00:00Z'));
  await ready(page);
  await page.getByRole('button', { name: 'Today', exact: true }).click();
  await expect(
    page.getByRole('region', { name: 'Tuesday, October 27', exact: true }),
  ).toBeVisible();
  await page.clock.setFixedTime(new Date('2027-01-02T12:00:00Z'));
  await page.getByRole('button', { name: 'Today', exact: true }).click();
  await expect(
    page.getByRole('alert').filter({ hasText: 'outside this 2026 book' }),
  ).toBeVisible();
  await expect(
    page.getByRole('region', { name: 'Tuesday, October 27', exact: true }),
  ).toBeVisible();
});
test('miniature calendar opens a keyboard-accessible month browser', async ({
  page,
}) => {
  await ready(page);
  await page
    .getByRole('button', { name: 'Open miniature calendar', exact: true })
    .click();
  const dialog = page.getByRole('dialog', { name: 'Open a date' });
  await dialog
    .getByRole('combobox', { name: 'Month', exact: true })
    .selectOption('2');
  await dialog
    .getByRole('button', { name: 'Saturday, February 28', exact: true })
    .focus();
  await dialog
    .getByRole('button', { name: 'Saturday, February 28', exact: true })
    .press('Enter');
  await expect(dialog).toHaveCount(0);
  await expect(
    page.getByRole('region', { name: 'Saturday, February 28', exact: true }),
  ).toBeVisible();
  if (test.info().project.name === 'chromium')
    await page.screenshot({
      path: 'artifacts/date-navigation.png',
      fullPage: true,
    });
});
test('a failed save prevents date jumps and retains the current writing', async ({
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
  await page
    .getByRole('textbox', { name: 'Task 1 on 2026-10-06', exact: true })
    .fill('Keep draft');
  await expect(page.getByRole('status')).toHaveText('Storage problem');
  await page.getByRole('button', { name: 'Jump to date', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Open a date' });
  await dialog.getByLabel('Date', { exact: true }).fill('2026-12-31');
  await dialog.getByRole('button', { name: 'Open date', exact: true }).click();
  await expect(dialog.getByRole('alert')).toContainText('could not open');
  await dialog
    .getByRole('button', { name: 'Close dialog', exact: true })
    .click();
  await expect(
    page.getByRole('textbox', { name: 'Task 1 on 2026-10-06', exact: true }),
  ).toHaveText('Keep draft');
});
