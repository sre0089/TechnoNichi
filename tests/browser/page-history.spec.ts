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
const checkbox = (page: Page) =>
  day(page).getByRole('checkbox', {
    name: 'Complete timed task 12:00 on 2026-10-06',
  });
async function ready(page: Page) {
  await page.goto('/');
  await expect(page.getByRole('status')).toHaveText('Saved on this device');
}
async function create(page: Page) {
  await ready(page);
  await row(page).fill('Plan');
  await row(page).press('Enter');
  await expect(page.getByRole('status')).toHaveText('Saved on this device');
}
test('page undo and redo retain later words, handle deletion and persist', async ({
  page,
}) => {
  await create(page);
  await checkbox(page).check();
  await row(page).fill('Plan with newer words');
  await row(page).press('Escape');
  await page
    .getByRole('button', { name: 'Undo page action', exact: true })
    .click();
  await expect(checkbox(page)).not.toBeChecked();
  await expect(row(page)).toHaveText('Plan with newer words');
  await page
    .getByRole('button', { name: 'Redo page action', exact: true })
    .click();
  await expect(checkbox(page)).toBeChecked();
  await row(page).click();
  await page.getByRole('button', { name: 'Delete entry', exact: true }).click();
  await page
    .getByRole('dialog', { name: 'Delete entry?' })
    .getByRole('button', { name: 'Delete entry', exact: true })
    .click();
  await expect(row(page)).toHaveText('');
  await page
    .getByRole('button', { name: 'Undo page action', exact: true })
    .click();
  await expect(row(page)).toHaveText('Plan with newer words');
  await expect(checkbox(page)).toBeChecked();
  if (test.info().project.name === 'chromium')
    await page.screenshot({
      path: 'artifacts/page-history.png',
      fullPage: true,
    });
  await page.reload();
  await expect(row(page)).toHaveText('Plan with newer words');
  await expect(
    page.getByRole('button', { name: 'Undo page action', exact: true }),
  ).toBeDisabled();
});
test('document keyboard undo follows its page while focused writing retains native undo', async ({
  page,
}) => {
  await create(page);
  await checkbox(page).check();
  // Remount the writing editor with saved words as its starting document.
  await page.getByRole('button', { name: 'Next spread', exact: true }).click();
  await page
    .getByRole('button', { name: 'Previous spread', exact: true })
    .click();
  await row(page).click();
  await row(page).press('End');
  await row(page).pressSequentially(' typed');
  await row(page).press('ControlOrMeta+z');
  await expect(row(page)).toHaveText('Plan');
  await expect(checkbox(page)).toBeChecked();
  await row(page).press('Escape');
  await page.getByRole('button', { name: 'Next spread', exact: true }).click();
  await page.locator('#book').press('ControlOrMeta+z');
  await expect(row(page)).toHaveText('Plan');
  await expect(checkbox(page)).not.toBeChecked();
  await page.locator('#book').press('ControlOrMeta+Shift+z');
  await expect(checkbox(page)).toBeChecked();
});
test('one duration placement action undoes and redoes without changing its writing', async ({
  page,
}) => {
  await ready(page);
  await day(page)
    .getByRole('button', { name: '+ Duration', exact: true })
    .click();
  const writing = day(page).getByRole('textbox', {
    name: /^Duration writing/,
    includeHidden: true,
  });
  await writing.fill('Read');
  await writing.press('Enter');
  await page
    .getByRole('button', { name: 'Later duration by 15 minutes', exact: true })
    .click();
  await expect(day(page).locator('.duration-span')).toHaveAttribute(
    'data-start',
    '735',
  );
  await page
    .getByRole('button', { name: 'Undo page action', exact: true })
    .click();
  await expect(day(page).locator('.duration-span')).toHaveAttribute(
    'data-start',
    '720',
  );
  await expect(writing).toHaveText('Read');
  await page
    .getByRole('button', { name: 'Redo page action', exact: true })
    .click();
  await expect(day(page).locator('.duration-span')).toHaveAttribute(
    'data-start',
    '735',
  );
});
