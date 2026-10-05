import { expect, test, type Page } from '@playwright/test';

async function ready(page: Page) {
  await page.goto('/');
  await expect(page.getByRole('status')).toHaveText('Saved on this device');
}
async function saved(page: Page) {
  await expect(page.getByRole('status')).toHaveText('Saved on this device');
}
const leftDay = (page: Page) =>
  page.getByRole('region', { name: 'Tuesday, October 6', exact: true });

test('timed writing, note geometry, task text and completion survive turns and reload', async ({
  page,
}) => {
  await ready(page);
  const day = leftDay(page);
  await day.getByRole('button', { name: '+ Timed line', exact: true }).click();
  await page
    .getByRole('textbox', { name: 'Timed writing 09:00', exact: true })
    .fill('Read chapter four');
  await page.getByLabel('Exact time').fill('14:15');
  await day.getByRole('button', { name: '+ Note', exact: true }).click();
  await page
    .getByRole('textbox', { name: 'Note on 2026-10-06' })
    .fill('A quiet afternoon\nRemember the small things.');
  await day
    .getByRole('textbox', { name: 'Task 1 on 2026-10-06', exact: true })
    .fill('Review notes');
  await day
    .getByRole('checkbox', { name: 'Complete task 1 on 2026-10-06' })
    .check();
  // Immediately turn: this deliberately does not wait for autosave.
  await page.getByRole('button', { name: 'Next spread', exact: true }).click();
  await expect(
    page.getByRole('region', { name: 'Thursday, October 8', exact: true }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Previous spread', exact: true })
    .click();
  await expect(
    page.getByRole('textbox', { name: 'Timed writing 14:15', exact: true }),
  ).toHaveValue('Read chapter four');
  const note = page.getByRole('textbox', { name: 'Note on 2026-10-06' });
  const geometry = await note.locator('..').getAttribute('style');
  await page.reload();
  await saved(page);
  await expect(note).toHaveValue(
    'A quiet afternoon\nRemember the small things.',
  );
  expect(await note.locator('..').getAttribute('style')).toBe(geometry);
  await expect(
    day.getByRole('textbox', { name: 'Task 1 on 2026-10-06', exact: true }),
  ).toHaveValue('Review notes');
  await expect(
    day.getByRole('checkbox', { name: 'Complete task 1 on 2026-10-06' }),
  ).toBeChecked();
  await expect(
    page.getByRole('textbox', { name: 'Timed writing 14:15', exact: true }),
  ).toHaveCount(1);
});

test('clicking the timetable and memo grid creates writing at document coordinates', async ({
  page,
}) => {
  await ready(page);
  const bounds = await leftDay(page).boundingBox();
  if (!bounds) throw new Error('Page has no layout');
  await page.mouse.click(
    bounds.x + (21 / 148) * bounds.width,
    bounds.y + (44.4 / 210) * bounds.height,
  );
  await expect(
    page.getByRole('textbox', { name: 'Timed writing 09:00', exact: true }),
  ).toBeFocused();
  await page
    .getByRole('textbox', { name: 'Timed writing 09:00', exact: true })
    .fill('Writing by the printed time');
  await page.mouse.click(
    bounds.x + (65 / 148) * bounds.width,
    bounds.y + (140 / 210) * bounds.height,
  );
  const note = page.getByRole('textbox', { name: 'Note on 2026-10-06' });
  await expect(note).toBeFocused();
  await note.fill('Placed directly on the page');
  expect(
    await note
      .locator('..')
      .evaluate((element) => parseFloat((element as HTMLElement).style.left)),
  ).toBeCloseTo((65.5 / 148) * 100);
  await saved(page);
  await page.reload();
  await saved(page);
  await expect(note).toHaveValue('Placed directly on the page');
});

test('native text editing, IME and geometry survive resizing and focused phone layout', async ({
  page,
}) => {
  await ready(page);
  await leftDay(page)
    .getByRole('button', { name: '+ Note', exact: true })
    .click();
  const note = page.getByRole('textbox', { name: 'Note on 2026-10-06' });
  await note.fill('First line');
  await note.press('End');
  await note.press('Enter');
  await note.press('A');
  await expect(note).toHaveValue('First line\nA');
  const style = await note.locator('..').getAttribute('style');
  await note.press('ControlOrMeta+A');
  await expect(leftDay(page)).toBeVisible();
  await note.dispatchEvent('compositionstart');
  await note.dispatchEvent('keydown', { key: 'Enter', isComposing: true });
  await note.dispatchEvent('compositionend');
  await note.press('Escape');
  await expect(note).toHaveValue('First line\nA');
  await page.getByLabel('Page size').selectOption('1.15');
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(leftDay(page)).toBeVisible();
  await expect(
    page.getByRole('region', { name: 'Wednesday, October 7', exact: true }),
  ).toBeHidden();
  expect(await note.locator('..').getAttribute('style')).toBe(style);
  await page
    .getByRole('button', { name: 'Wednesday, October 7', exact: true })
    .click();
  await expect(
    page.getByRole('region', { name: 'Wednesday, October 7', exact: true }),
  ).toBeVisible();
  await saved(page);
});

test('focused editor preserves long text and native Escape keeps its draft', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await ready(page);
  await leftDay(page)
    .getByRole('button', { name: '+ Note', exact: true })
    .click();
  const note = page.getByRole('textbox', { name: 'Note on 2026-10-06' });
  await note.fill('Beginning');
  await page.getByRole('button', { name: 'Edit writing', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'A little more room' });
  await expect(dialog).toBeVisible();
  await dialog
    .getByLabel('Your writing')
    .fill(
      'A readable phone draft\n' +
        'All of this writing stays intact. '.repeat(20),
    );
  await dialog.getByLabel('Your writing').press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(note).toHaveValue(/^A readable phone draft/);
  await saved(page);
  await page.reload();
  await saved(page);
  await expect(note).toHaveValue(/^A readable phone draft/);
});

test('a failed write retains the editor and blocks navigation until retry succeeds', async ({
  page,
}) => {
  await ready(page);
  await page.evaluate(() => {
    const original = IDBObjectStore.prototype.put;
    Object.defineProperty(window, '__originalPut', {
      value: original,
      configurable: true,
    });
    IDBObjectStore.prototype.put = function (
      ...args: Parameters<IDBObjectStore['put']>
    ) {
      if (this.name === 'entries')
        throw new DOMException('Synthetic quota failure', 'QuotaExceededError');
      return original.apply(this, args);
    };
  });
  const task = leftDay(page).getByRole('textbox', {
    name: 'Task 1 on 2026-10-06',
    exact: true,
  });
  await task.fill('Keep this draft');
  await expect(page.getByRole('status')).toHaveText('Storage problem');
  await page.getByRole('button', { name: 'Next spread', exact: true }).click();
  await expect(leftDay(page)).toBeVisible();
  await expect(task).toHaveValue('Keep this draft');
  await page
    .getByRole('button', { name: 'Recover writing', exact: true })
    .click();
  await expect(page.getByLabel('Recoverable writing')).toHaveValue(
    /Keep this draft/,
  );
  await page.evaluate(() => {
    const original = (
      window as unknown as {
        __originalPut: typeof IDBObjectStore.prototype.put;
      }
    ).__originalPut;
    IDBObjectStore.prototype.put = original;
  });
  await page.getByRole('button', { name: 'Retry saving', exact: true }).click();
  await saved(page);
  await page.reload();
  await saved(page);
  await expect(task).toHaveValue('Keep this draft');
});

test('a second tab cannot silently overwrite a stale checklist entry', async ({
  page,
  context,
}) => {
  await ready(page);
  const other = await context.newPage();
  await ready(other);
  await leftDay(page)
    .getByRole('textbox', { name: 'Task 1 on 2026-10-06', exact: true })
    .fill('First tab writing');
  await saved(page);
  await leftDay(other)
    .getByRole('textbox', { name: 'Task 1 on 2026-10-06', exact: true })
    .fill('Second tab draft');
  await expect(other.getByRole('status')).toHaveText('Storage problem');
  await expect(
    other.getByRole('alert').filter({ hasText: 'Another tab changed' }),
  ).toContainText('Your draft is retained');
  await page.reload();
  // Local recovery is shared by these tabs; the stale draft remains visible and recoverable.
  await expect(page.getByRole('status')).toHaveText('Storage problem');
  await expect(
    leftDay(page).getByRole('textbox', {
      name: 'Task 1 on 2026-10-06',
      exact: true,
    }),
  ).toHaveValue('Second tab draft');
});

test('synthetic blank, normal, dense and focused visual fixtures', async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'chromium',
    'Visual inspection uses a fixed Chromium/font baseline.',
  );
  await page.setViewportSize({ width: 1440, height: 1120 });
  await ready(page);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: 'artifacts/m1-blank.png', fullPage: true });
  const day = leftDay(page);
  for (const [slot, text] of [
    'Review notes',
    'Read 30 minutes',
    'Plan weekend trip',
  ].entries()) {
    await day
      .getByRole('textbox', {
        name: `Task ${slot + 1} on 2026-10-06`,
        exact: true,
      })
      .fill(text);
  }
  await day
    .getByRole('checkbox', { name: 'Complete task 1 on 2026-10-06' })
    .check();
  await day.getByRole('button', { name: '+ Timed line', exact: true }).click();
  await page
    .getByRole('textbox', { name: 'Timed writing 09:00', exact: true })
    .fill('Morning reading · a little time to think');
  await day.getByRole('button', { name: '+ Note', exact: true }).click();
  await page
    .getByRole('textbox', { name: 'Note on 2026-10-06' })
    .fill('Small steps still make\nbig progress.');
  await page.getByRole('button', { name: 'Done', exact: true }).click();
  const right = page.getByRole('region', {
    name: 'Wednesday, October 7',
    exact: true,
  });
  await right
    .getByRole('textbox', { name: 'Task 1 on 2026-10-07', exact: true })
    .fill('Finish reading');
  await right
    .getByRole('button', { name: '+ Timed line', exact: true })
    .click();
  await right
    .getByRole('textbox', { name: 'Timed writing 09:00', exact: true })
    .fill('A walk before the day begins');
  await page.getByLabel('Exact time').fill('06:30');
  await page.getByRole('button', { name: 'Done', exact: true }).click();
  await saved(page);
  await page.screenshot({ path: 'artifacts/m1-normal.png', fullPage: true });
  for (const [index, text] of [
    'Lunch with a friend',
    'Project reading',
    'A short walk',
    'Cook something good',
    'Evening reflection',
    'Late-night notes',
  ].entries()) {
    await day
      .getByRole('button', { name: '+ Timed line', exact: true })
      .click();
    await day
      .getByRole('textbox', { name: 'Timed writing 09:00', exact: true })
      .last()
      .fill(text);
    await page
      .getByLabel('Exact time')
      .fill(`${String(11 + index * 2).padStart(2, '0')}:00`);
    await page.getByRole('button', { name: 'Done', exact: true }).click();
  }
  for (const [index, text] of [
    'Call a friend',
    'Take time to rest',
  ].entries()) {
    await day
      .getByRole('textbox', {
        name: `Task ${index + 4} on 2026-10-06`,
        exact: true,
      })
      .fill(text);
  }
  await page
    .getByRole('textbox', { name: 'Note on 2026-10-06' })
    .fill(
      'A fuller day, with space for everything.\n' +
        'This writing is preserved beyond its box. '.repeat(14),
    );
  await expect(
    page.getByRole('button', { name: 'Read overflowing writing' }),
  ).toBeVisible();
  await page
    .getByRole('textbox', { name: 'Note on 2026-10-06' })
    .press('Escape');
  await saved(page);
  await page.screenshot({ path: 'artifacts/m1-dense.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: 'artifacts/m1-phone.png', fullPage: true });
  await page.getByRole('button', { name: 'Edit writing', exact: true }).click();
  await page.screenshot({
    path: 'artifacts/m1-phone-editor.png',
    fullPage: true,
  });
});
