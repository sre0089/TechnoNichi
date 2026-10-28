import { readFile } from 'node:fs/promises';
import { expect, test, type Page, type Locator } from '@playwright/test';
import type { Entry } from '../../src/domain/model';
import type { PlannerBackup } from '../../src/local/backup';

const day = (page: Page) =>
  page.getByRole('region', {
    name: 'Tuesday, October 6',
    exact: true,
    includeHidden: true,
  });
const duration = (page: Page) =>
  day(page).getByRole('textbox', {
    name: /^Duration writing /,
    includeHidden: true,
  });
const point = (page: Page) =>
  day(page).getByRole('textbox', {
    name: 'Timed writing 12:00',
    exact: true,
    includeHidden: true,
  });
const saved = (page: Page) =>
  expect(page.getByRole('status')).toHaveText('Saved on this device');
async function paperPosition(field: Locator) {
  return field.evaluate((node) => {
    const field = node.getBoundingClientRect();
    const paper = node.closest('.paper')!.getBoundingClientRect();
    return { x: field.left - paper.left, y: field.top - paper.top };
  });
}
async function ready(page: Page) {
  await page.goto('/');
  await saved(page);
}
async function records(page: Page): Promise<Entry[]> {
  return page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('daily-book-v1');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    try {
      return await new Promise<Entry[]>((resolve, reject) => {
        const request = db
          .transaction('entries')
          .objectStore('entries')
          .getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } finally {
      db.close();
    }
  });
}
async function stored(page: Page, id: string, expected: Partial<Entry>) {
  await expect
    .poll(async () => (await records(page)).find((entry) => entry.id === id))
    .toMatchObject(expected);
}
async function close(page: Page) {
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Close dialog', exact: true })
    .click();
}
async function editRange(
  page: Page,
  {
    start,
    end,
    startDay,
    endDay,
  }: { start?: string; end?: string; startDay?: string; endDay?: string },
) {
  await page
    .getByRole('button', { name: 'Edit duration', exact: true })
    .click();
  const dialog = page.getByRole('dialog', {
    name: 'Task duration',
    exact: true,
  });
  if (start) await dialog.getByLabel('Start time', { exact: true }).fill(start);
  if (end) await dialog.getByLabel('End time', { exact: true }).fill(end);
  if (startDay)
    await dialog
      .getByLabel('Start day', { exact: true })
      .selectOption(startDay);
  if (endDay)
    await dialog.getByLabel('End day', { exact: true }).selectOption(endDay);
  await dialog
    .getByRole('button', { name: 'Apply duration', exact: true })
    .click();
  await expect(dialog).toHaveCount(0);
}
async function create(page: Page, text: string) {
  await day(page)
    .getByRole('button', { name: '+ Duration', exact: true })
    .click();
  const field = duration(page);
  await field.fill(text);
  const id = (await field.getAttribute('id'))!;
  await field.press('Enter');
  await stored(page, id, { text, type: 'scheduled-block', submitted: true });
  return id;
}
async function history(page: Page) {
  await page
    .getByRole('button', { name: 'Deleted entries', exact: true })
    .click();
  const panel = page.getByRole('dialog', {
    name: 'Deleted entries',
    exact: true,
  });
  await expect(panel.getByText('Working on deleted entries…')).toHaveCount(0);
  return panel;
}
async function remove(page: Page) {
  await page.getByRole('button', { name: 'Delete entry', exact: true }).click();
  const panel = page.getByRole('dialog', {
    name: 'Delete entry?',
    exact: true,
  });
  await panel
    .getByRole('button', { name: 'Delete entry', exact: true })
    .click();
  await expect(panel).toHaveCount(0);
}

test('a formatted hourly task gains exact duration, completion and stable placement through turns and reloads', async ({
  page,
}) => {
  await ready(page);
  await point(page).click();
  await point(page).press('Control+b');
  await point(page).pressSequentially('Study');
  await point(page).press('Control+b');
  await point(page).pressSequentially(' notes');
  await point(page).press('Enter');
  const id = (await point(page).getAttribute('id'))!;
  const before = await paperPosition(point(page));
  await page.getByRole('button', { name: 'Add duration', exact: true }).click();
  await editRange(page, { end: '13:30' });
  await expect(duration(page).locator('strong')).toHaveText('Study');
  const after = await paperPosition(duration(page));
  expect(after.x).toBeCloseTo(before.x);
  expect(after.y).toBeCloseTo(before.y);
  await day(page)
    .getByRole('checkbox', {
      name: 'Complete duration task 12:00–13:30 on 2026-10-06',
      exact: true,
    })
    .check();
  await stored(page, id, {
    type: 'scheduled-block',
    minute: 720,
    endMinute: 810,
    completed: true,
  });
  await expect(day(page).locator('.duration-span')).toHaveAttribute(
    'data-end',
    '810',
  );
  await page.getByRole('button', { name: 'Next spread', exact: true }).click();
  await page
    .getByRole('button', { name: 'Previous spread', exact: true })
    .click();
  await expect(duration(page)).toHaveText('Study notes');
  await page.reload();
  await expect(duration(page).locator('strong')).toHaveText('Study');
  await expect(duration(page)).toHaveAttribute('id', id);
  await expect(
    day(page).getByRole('checkbox', {
      name: 'Complete duration task 12:00–13:30 on 2026-10-06',
      exact: true,
    }),
  ).toBeChecked();
});

test('overlapping ranges use separate brackets and a readable chooser while existing writing stays in place', async ({
  page,
}) => {
  await ready(page);
  await point(page).fill('Existing hourly writing');
  await point(page).press('Enter');
  const originalId = (await point(page).getAttribute('id'))!;
  await stored(page, originalId, { text: 'Existing hourly writing' });
  const first = await create(page, 'Long study session');
  await editRange(page, { end: '14:00' });
  const second = await create(page, 'Overlapping reading');
  await editRange(page, { start: '12:30', end: '13:00' });
  await stored(page, second, { minute: 750, endMinute: 780 });
  const spans = day(page).locator('.duration-span');
  await expect(spans).toHaveCount(2);
  expect(
    await spans.evaluateAll((nodes) =>
      nodes.map((node) => node.getAttribute('data-lane')).sort(),
    ),
  ).toEqual(['0', '1']);
  const before = await records(page);
  await day(page)
    .getByRole('button', {
      name: 'Other writing in this hour (3 entries)',
      exact: true,
    })
    .click();
  const chooser = page.getByRole('dialog', {
    name: 'Writing in this hour',
    exact: true,
  });
  await expect(chooser).toContainText('Existing hourly writing');
  await expect(chooser).toContainText('Long study session');
  await expect(chooser).toContainText('Overlapping reading');
  await expect(chooser).toContainText('12:30–13:00');
  await chooser
    .getByRole('button', { name: /Existing hourly writing/ })
    .click();
  await expect(point(page)).toHaveText('Existing hourly writing');
  await expect(point(page)).toHaveAttribute('id', originalId);
  await expect(point(page)).toBeFocused();
  await day(page)
    .getByRole('button', {
      name: 'Other writing in this hour (3 entries)',
      exact: true,
    })
    .click();
  await page
    .getByRole('dialog', { name: 'Writing in this hour', exact: true })
    .getByRole('button', { name: /Long study session/ })
    .click();
  await expect(duration(page)).toHaveAttribute('id', first);
  await expect(duration(page)).toBeFocused();
  if (test.info().project.name === 'chromium')
    await page.screenshot({
      path: 'artifacts/durations-overlap-desktop.png',
      fullPage: true,
    });
  await page.setViewportSize({ width: 320, height: 720 });
  const trigger = day(page).getByRole('button', {
    name: 'Other writing in this hour (3 entries)',
    exact: true,
  });
  await trigger.focus();
  await trigger.press('Enter');
  if (test.info().project.name === 'chromium')
    await page.screenshot({
      path: 'artifacts/durations-phone-chooser.png',
      fullPage: true,
    });
  await page.keyboard.press('Escape');
  await expect(trigger).toBeFocused();
  await trigger.press('Enter');
  await page
    .getByRole('dialog', { name: 'Writing in this hour', exact: true })
    .getByRole('button', { name: /Long study session/ })
    .press('Enter');
  await expect(duration(page)).toBeFocused();
  expect(await records(page)).toEqual(before);
  await page.reload();
  await expect(point(page)).toHaveText('Existing hourly writing');
  expect(
    (await records(page)).filter((entry) => [first, second].includes(entry.id)),
  ).toHaveLength(2);
});

test('overnight controls reject invalid ranges, cancel safely and work by keyboard on a narrow phone', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await ready(page);
  const id = await create(page, 'Late reading');
  await page
    .getByRole('button', { name: 'Edit duration', exact: true })
    .focus();
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog', {
    name: 'Task duration',
    exact: true,
  });
  await dialog.getByLabel('Start time', { exact: true }).fill('23:00');
  await dialog.getByLabel('End time', { exact: true }).fill('01:30');
  await dialog
    .getByRole('button', { name: 'Apply duration', exact: true })
    .click();
  await expect(dialog.getByRole('alert')).toContainText(
    'End must be after start',
  );
  await stored(page, id, { minute: 720, endMinute: 780 });
  await dialog.getByLabel('End day', { exact: true }).selectOption('1');
  const bounds = (await dialog.boundingBox())!;
  expect(bounds.x).toBeGreaterThanOrEqual(0);
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(320);
  if (test.info().project.name === 'chromium')
    await page.screenshot({
      path: 'artifacts/durations-phone-controls.png',
      fullPage: true,
    });
  await dialog
    .getByRole('button', { name: 'Apply duration', exact: true })
    .click();
  await expect(dialog).toHaveCount(0);
  await stored(page, id, {
    minute: 1380,
    dayOffset: 0,
    endMinute: 90,
    endDayOffset: 1,
  });
  await expect(duration(page)).toHaveAttribute(
    'aria-label',
    'Duration writing 23:00–01:30 +1',
  );
  await page
    .getByRole('button', { name: 'Edit duration', exact: true })
    .click();
  await dialog.getByLabel('End time', { exact: true }).fill('03:01');
  await dialog
    .getByRole('button', { name: 'Apply duration', exact: true })
    .click();
  await expect(dialog.getByRole('alert')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'Edit duration', exact: true }),
  ).toBeFocused();
  await page.reload();
  await expect(duration(page)).toHaveText('Late reading');
  await stored(page, id, { endMinute: 90, endDayOffset: 1 });
});

test('removing duration keeps the same formatted task, identity and completion', async ({
  page,
}) => {
  await ready(page);
  const id = await create(page, 'Retain this task');
  await duration(page).click();
  await duration(page).press('ControlOrMeta+a');
  await duration(page).press('Control+i');
  await expect(duration(page).locator('em')).toHaveText('Retain this task');
  await duration(page).press('Enter');
  await day(page)
    .getByRole('checkbox', {
      name: 'Complete duration task 12:00–13:00 on 2026-10-06',
      exact: true,
    })
    .check();
  await page
    .getByRole('button', { name: 'Remove duration', exact: true })
    .click();
  await expect(point(page)).toHaveAttribute('id', id);
  await expect(point(page).locator('em')).toHaveText('Retain this task');
  await stored(page, id, { type: 'scheduled-line', completed: true });
  expect(
    (await records(page)).find((entry) => entry.id === id),
  ).not.toHaveProperty('endMinute');
  await expect(day(page).locator('.duration-span')).toHaveCount(0);
  await page.reload();
  await expect(point(page).locator('em')).toHaveText('Retain this task');
  await expect(
    day(page).getByRole('checkbox', {
      name: 'Complete timed task 12:00 on 2026-10-06',
      exact: true,
    }),
  ).toBeChecked();
});

test('duration deletion and recovery preserve range and writing while permitting an overlapping task', async ({
  page,
}) => {
  await ready(page);
  const original = await create(page, 'Original duration');
  await editRange(page, { end: '14:30' });
  await remove(page);
  const newer = await create(page, 'New overlapping duration');
  const panel = await history(page);
  await expect(panel).toContainText('Duration task 12:00–14:30');
  await panel
    .getByRole('button', { name: 'Restore entry', exact: true })
    .click();
  await expect(panel.getByRole('status')).toHaveText(
    'Entry restored to its original page.',
  );
  await close(page);
  await stored(page, original, {
    endMinute: 870,
    text: 'Original duration',
    deletedAt: null,
  });
  await stored(page, newer, {
    text: 'New overlapping duration',
    deletedAt: null,
  });
  await expect(day(page).locator('.duration-span')).toHaveCount(2);
  await page.reload();
  await day(page)
    .getByRole('button', {
      name: 'Other writing in this hour (2 entries)',
      exact: true,
    })
    .click();
  const choices = page.getByRole('dialog', {
    name: 'Writing in this hour',
    exact: true,
  });
  await expect(choices).toContainText('Original duration');
  await expect(choices).toContainText('New overlapping duration');
});

test('competing endpoint edits retain both complete ranges through explicit tab review', async ({
  page,
  context,
}) => {
  await ready(page);
  const id = await create(page, 'Shared duration');
  const other = await context.newPage();
  await ready(other);
  await duration(other).click();
  await editRange(page, { end: '13:30' });
  await stored(page, id, { endMinute: 810 });
  await editRange(other, { end: '14:30' });
  await expect(other.getByRole('status')).toHaveText('Storage problem');
  await expect(duration(other)).toHaveAttribute(
    'aria-label',
    'Duration writing 12:00–14:30',
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
  ).toContainText('12:00–14:30');
  await expect(
    review.getByRole('region', { name: 'Saved writing', exact: true }),
  ).toContainText('12:00–13:30');
  await review.getByRole('button', { name: 'Keep both', exact: true }).click();
  await expect(review.getByRole('status')).toHaveText(
    'Both versions are retained. Your draft is in Deleted entries.',
  );
  await close(other);
  await expect(duration(other)).toHaveAttribute(
    'aria-label',
    'Duration writing 12:00–13:30',
  );
  const panel = await history(other);
  await expect(panel).toContainText('Duration task 12:00–14:30');
  await close(other);
  await other.reload();
  await stored(other, id, { endMinute: 810 });
});

test('a failed duration save retains endpoints and blocks navigation until retry succeeds', async ({
  page,
}) => {
  await ready(page);
  const id = await create(page, 'Recover this duration');
  await page.evaluate(() => {
    const put = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (
      ...args: Parameters<IDBObjectStore['put']>
    ) {
      if (this.name === 'entries') {
        IDBObjectStore.prototype.put = put;
        throw new DOMException('Synthetic quota failure', 'QuotaExceededError');
      }
      return put.apply(this, args);
    };
  });
  await editRange(page, { end: '14:00' });
  await expect(page.getByRole('status')).toHaveText('Storage problem');
  await expect(duration(page)).toHaveAttribute(
    'aria-label',
    'Duration writing 12:00–14:00',
  );
  expect(
    await page.evaluate(() =>
      sessionStorage.getItem('daily-book:tab-draft-v1'),
    ),
  ).toContain('"endMinute":840');
  await stored(page, id, { endMinute: 780 });
  // Keep the failure active for the navigation attempt, then let Retry commit it.
  await page.evaluate(() => {
    const put = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (
      ...args: Parameters<IDBObjectStore['put']>
    ) {
      if (this.name === 'entries') {
        IDBObjectStore.prototype.put = put;
        throw new DOMException('Synthetic quota failure', 'QuotaExceededError');
      }
      return put.apply(this, args);
    };
  });
  await page.getByRole('button', { name: 'Next spread', exact: true }).click();
  await expect(day(page)).toBeVisible();
  await page.getByRole('button', { name: 'Retry saving', exact: true }).click();
  await stored(page, id, { endMinute: 840 });
  await saved(page);
  await page.reload();
  await expect(duration(page)).toHaveText('Recover this duration');
  await expect(duration(page)).toHaveAttribute(
    'aria-label',
    'Duration writing 12:00–14:00',
  );
});

test('v2 JSON export and restore preserve duration endpoints, completion and deleted history', async ({
  page,
  browser,
}) => {
  test.setTimeout(60_000);
  await ready(page);
  const id = await create(page, 'Duration in archive');
  await editRange(page, { start: '23:00', end: '01:30', endDay: '1' });
  await day(page)
    .getByRole('checkbox', {
      name: 'Complete duration task 23:00–01:30 +1 on 2026-10-06',
      exact: true,
    })
    .check();
  await stored(page, id, { completed: true });
  await remove(page);
  await page.getByRole('button', { name: 'Backups', exact: true }).click();
  const downloading = page.waitForEvent('download');
  await page
    .getByRole('button', { name: 'Download backup', exact: true })
    .click();
  const text = await readFile((await (await downloading).path())!, 'utf8');
  const archive = JSON.parse(text) as PlannerBackup;
  expect(archive.version).toBe(2);
  expect(archive.entries.find((entry) => entry.id === id)).toMatchObject({
    type: 'scheduled-block',
    minute: 1380,
    dayOffset: 0,
    endMinute: 90,
    endDayOffset: 1,
    completed: true,
    deletedAt: expect.any(String),
  });
  const isolated = await browser.newContext();
  try {
    const target = await isolated.newPage();
    await ready(target);
    await target.getByRole('button', { name: 'Backups', exact: true }).click();
    await target.getByLabel('Backup file', { exact: true }).setInputFiles({
      name: 'durations.json',
      mimeType: 'application/json',
      buffer: Buffer.from(text),
    });
    await target
      .getByRole('button', { name: 'Restore backup', exact: true })
      .click();
    await expect(target.getByRole('dialog').getByRole('status')).toHaveText(
      'Backup restored. Your book is ready.',
    );
    expect(await records(target)).toEqual(archive.entries);
    await close(target);
    const panel = await history(target);
    await expect(panel).toContainText('Duration task 23:00–01:30 +1');
    await panel
      .getByRole('button', { name: 'Restore entry', exact: true })
      .click();
    await expect(panel.getByRole('status')).toHaveText(
      'Entry restored to its original page.',
    );
    await close(target);
    await target.reload();
    await expect(duration(target)).toHaveText('Duration in archive');
    await expect(
      day(target).getByRole('checkbox', {
        name: 'Complete duration task 23:00–01:30 +1 on 2026-10-06',
        exact: true,
      }),
    ).toBeChecked();
  } finally {
    await isolated.close();
  }
});
