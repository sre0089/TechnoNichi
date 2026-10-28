import { expect, test, type Page, type Locator } from '@playwright/test';
import type { Entry } from '../../src/domain/model';
const day = (page: Page) =>
  page.getByRole('region', {
    name: 'Tuesday, October 6',
    exact: true,
    includeHidden: true,
  });
const field = (page: Page) =>
  day(page).getByRole('textbox', {
    name: /^Duration writing/,
    includeHidden: true,
  });
async function record(page: Page, id: string): Promise<Entry> {
  return page.evaluate(async (id) => {
    const db = await new Promise<IDBDatabase>((resolve) => {
      const request = indexedDB.open('daily-book-v1');
      request.onsuccess = () => resolve(request.result);
    });
    try {
      return await new Promise<Entry>((resolve) => {
        const request = db
          .transaction('entries')
          .objectStore('entries')
          .get(id);
        request.onsuccess = () => resolve(request.result);
      });
    } finally {
      db.close();
    }
  }, id);
}
async function ready(page: Page) {
  await page.goto('/');
  await expect(page.getByRole('status')).toHaveText('Saved on this device');
}
async function create(page: Page) {
  await ready(page);
  await day(page)
    .getByRole('button', { name: '+ Duration', exact: true })
    .click();
  await field(page).fill('Keep these words');
  await field(page).press('Enter');
  const id = (await field(page).getAttribute('id'))!;
  await expect
    .poll(() => record(page, id))
    .toMatchObject({ text: 'Keep these words', submitted: true });
  return id;
}
async function startDrag(page: Page, handle: Locator, hours: number) {
  await handle.scrollIntoViewIfNeeded();
  const point = (await handle.boundingBox())!;
  const paper = (await day(page).boundingBox())!;
  const x = point.x + point.width / 2,
    y = point.y + point.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x, y + ((hours * 3.7) / 210) * paper.height, {
    steps: 5,
  });
}
test('duration move and end resize preview then save one change per release', async ({
  page,
}) => {
  const id = await create(page);
  const before = await record(page, id);
  await startDrag(
    page,
    day(page).getByRole('button', { name: 'Move duration', exact: true }),
    1,
  );
  await expect(day(page).locator('.duration-span')).toHaveAttribute(
    'data-start',
    '780',
  );
  expect(await record(page, id)).toEqual(before);
  await expect(
    page.getByRole('button', { name: 'Next spread', exact: true }),
  ).toBeDisabled();
  await page.mouse.up();
  await expect
    .poll(() => record(page, id))
    .toMatchObject({
      minute: 780,
      endMinute: 840,
      revision: before.revision + 1,
    });
  await startDrag(
    page,
    day(page).getByRole('button', { name: 'Resize duration end', exact: true }),
    2,
  );
  await expect(day(page).locator('.duration-span')).toHaveAttribute(
    'data-end',
    '960',
  );
  expect((await record(page, id)).revision).toBe(before.revision + 1);
  await page.mouse.up();
  await expect
    .poll(() => record(page, id))
    .toMatchObject({
      minute: 780,
      endMinute: 960,
      text: 'Keep these words',
      revision: before.revision + 2,
    });
  if (test.info().project.name === 'chromium')
    await page.screenshot({
      path: 'artifacts/duration-placement.png',
      fullPage: true,
    });
  await page.reload();
  await expect(field(page)).toHaveText('Keep these words');
  await expect(field(page)).toHaveAttribute(
    'aria-label',
    'Duration writing 13:00–16:00',
  );
});
test('handle clicks and cancelled drags preserve exact times; keyboard and contextual controls move them', async ({
  page,
}) => {
  const id = await create(page);
  await page
    .getByRole('button', { name: 'Edit duration', exact: true })
    .click();
  const dialog = page.getByRole('dialog', {
    name: 'Task duration',
    exact: true,
  });
  await dialog.getByLabel('Start time', { exact: true }).fill('12:07');
  await dialog.getByLabel('End time', { exact: true }).fill('13:22');
  await dialog
    .getByRole('button', { name: 'Apply duration', exact: true })
    .click();
  await expect
    .poll(() => record(page, id))
    .toMatchObject({ minute: 727, endMinute: 802 });
  const before = await record(page, id);
  const move = day(page).getByRole('button', {
    name: 'Move duration',
    exact: true,
  });
  await move.click();
  expect(await record(page, id)).toEqual(before);
  await startDrag(page, move, 2);
  await page.keyboard.press('Escape');
  await page.mouse.up();
  expect(await record(page, id)).toEqual(before);
  await expect(day(page).locator('.duration-span')).toHaveAttribute(
    'data-start',
    '727',
  );
  await startDrag(page, move, 1);
  await page.evaluate(() => window.dispatchEvent(new Event('resize')));
  await page.mouse.up();
  expect(await record(page, id)).toEqual(before);
  await move.focus();
  await move.press('ArrowDown');
  await expect
    .poll(() => record(page, id))
    .toMatchObject({ minute: 742, endMinute: 817 });
  await expect(move).toBeFocused();
  await move.press('Shift+ArrowUp');
  await expect
    .poll(() => record(page, id))
    .toMatchObject({ minute: 682, endMinute: 757 });
  await page
    .getByRole('button', { name: 'Longer duration by 15 minutes', exact: true })
    .click();
  await expect
    .poll(() => record(page, id))
    .toMatchObject({ minute: 682, endMinute: 772 });
});
test('a stale duration movement remains a recoverable draft with both ranges available', async ({
  page,
  context,
}) => {
  const id = await create(page);
  const other = await context.newPage();
  await ready(other);
  await field(other).click();
  await page
    .getByRole('button', { name: 'Later duration by 15 minutes', exact: true })
    .click();
  await expect
    .poll(() => record(page, id))
    .toMatchObject({ minute: 735, endMinute: 795 });
  await other
    .getByRole('button', { name: 'Longer duration by 15 minutes', exact: true })
    .click();
  await expect(other.getByRole('status')).toHaveText('Storage problem');
  await expect(field(other)).toHaveAttribute(
    'aria-label',
    'Duration writing 12:00–13:15',
  );
  await other.getByRole('button', { name: 'Tab changes', exact: true }).click();
  const review = other.getByRole('dialog', {
    name: 'Review tab changes',
    exact: true,
  });
  await expect(
    review.getByRole('region', {
      name: 'Your writing in this tab',
      exact: true,
    }),
  ).toContainText('12:00–13:15');
  await expect(
    review.getByRole('region', { name: 'Saved writing', exact: true }),
  ).toContainText('12:15–13:15');
  await review.getByRole('button', { name: 'Keep both', exact: true }).click();
  await expect(review.getByRole('status')).toContainText(
    'Both versions are retained',
  );
  expect(await record(page, id)).toMatchObject({ minute: 735 });
});
