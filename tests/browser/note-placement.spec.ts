import { expect, test, type Page, type Locator } from '@playwright/test';
import type { Entry } from '../../src/domain/model';

const day = (page: Page, right = false) =>
  page.getByRole('region', {
    name: right ? 'Wednesday, October 7' : 'Tuesday, October 6',
    exact: true,
  });
const saved = (page: Page) =>
  expect(page.getByRole('status')).toHaveText('Saved on this device');
async function ready(page: Page) {
  await page.goto('/');
  await saved(page);
}
async function addNote(page: Page, right = false) {
  await day(page, right)
    .getByRole('button', { name: '+ Note', exact: true })
    .click();
  const writing = day(page, right).getByRole('textbox', {
    name: `Note on 2026-10-${right ? '07' : '06'}`,
    exact: true,
  });
  await expect(writing).toBeFocused();
  return writing;
}
const frame = (writing: Locator) =>
  writing.locator('xpath=ancestor::div[contains(@class, "writing-item")][1]');
async function geometry(writing: Locator) {
  return frame(writing).evaluate((node) => {
    const element = node as HTMLElement;
    return {
      x: Math.round(parseFloat(element.style.left) * 1480) / 1000,
      y: Math.round(parseFloat(element.style.top) * 2100) / 1000,
      width: Math.round(parseFloat(element.style.width) * 1480) / 1000,
      height: Math.round(parseFloat(element.style.height) * 2100) / 1000,
    };
  });
}
async function stored(page: Page, writing: Locator) {
  const id = await frame(writing).getAttribute('data-note-id');
  return page.evaluate(async (id) => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('daily-book-v1');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    try {
      return await new Promise<Entry>((resolve, reject) => {
        const request = db
          .transaction('entries')
          .objectStore('entries')
          .get(id!);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } finally {
      db.close();
    }
  }, id);
}
async function startDrag(
  page: Page,
  writing: Locator,
  mode: 'Move' | 'Resize',
) {
  const handle = frame(writing).getByRole('button', {
    name: `${mode} note`,
    exact: true,
  });
  await handle.scrollIntoViewIfNeeded();
  const bounds = (await handle.boundingBox())!;
  const paper = (await writing
    .locator('xpath=ancestor::section[contains(@class, "paper")][1]')
    .boundingBox())!;
  const start = {
    x: bounds.x + bounds.width / 2,
    y: bounds.y + bounds.height / 2,
  };
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  return { handle, start, paper };
}
async function drag(
  page: Page,
  writing: Locator,
  mode: 'Move' | 'Resize',
  dx: number,
  dy: number,
) {
  const { start, paper } = await startDrag(page, writing, mode);
  await page.mouse.move(
    start.x + (dx * paper.width) / 148,
    start.y + (dy * paper.height) / 210,
    { steps: 6 },
  );
  await page.mouse.up();
}

test('pointer movement and resizing save once per gesture and preserve formatted writing through reload, navigation and export', async ({
  page,
}) => {
  await ready(page);
  const writing = await addNote(page);
  await writing.press('Control+b');
  await writing.pressSequentially('Keep');
  await writing.press('Control+b');
  await writing.pressSequentially(' my note');
  await saved(page);
  const before = await stored(page, writing);
  await drag(page, writing, 'Move', 7.4, 3.7);
  await saved(page);
  expect(await geometry(writing)).toEqual({
    x: 35.9,
    y: 131,
    width: 62.9,
    height: 14.8,
  });
  const moved = await stored(page, writing);
  expect(moved.revision).toBe(before.revision + 1);
  expect(moved.text).toBe(before.text);
  expect(moved.formatRuns).toEqual(before.formatRuns);
  await drag(page, writing, 'Resize', 7.4, 7.4);
  await saved(page);
  expect(await geometry(writing)).toEqual({
    x: 35.9,
    y: 131,
    width: 70.3,
    height: 22.2,
  });
  const resized = await stored(page, writing);
  expect(resized.revision).toBe(moved.revision + 1);
  await page.reload();
  await expect(writing.locator('strong')).toHaveText('Keep');
  await page.getByRole('button', { name: 'Next spread', exact: true }).click();
  await page
    .getByRole('button', { name: 'Previous spread', exact: true })
    .click();
  expect(await geometry(writing)).toEqual({
    x: 35.9,
    y: 131,
    width: 70.3,
    height: 22.2,
  });
  await page.getByRole('button', { name: 'Backups', exact: true }).click();
  const download = page.waitForEvent('download');
  await page
    .getByRole('button', { name: 'Download backup', exact: true })
    .click();
  const archive = await (await download).createReadStream();
  const chunks = [];
  for await (const chunk of archive!) chunks.push(chunk);
  const backup = JSON.parse(Buffer.concat(chunks).toString());
  expect(
    backup.entries.find((entry: Entry) => entry.id === resized.id),
  ).toEqual(resized);
});

test('note handles and contextual buttons support keyboard placement without taking over text arrows', async ({
  page,
}) => {
  await ready(page);
  const writing = await addNote(page);
  await writing.fill('A note');
  const original = await geometry(writing);
  await writing.press('ArrowLeft');
  await writing.press('ArrowUp');
  expect(await geometry(writing)).toEqual(original);
  const move = frame(writing).getByRole('button', {
    name: 'Move note',
    exact: true,
  });
  await move.focus();
  await move.press('ArrowRight');
  await move.press('ArrowDown');
  await expect(move).toBeFocused();
  expect(await geometry(writing)).toEqual({ ...original, x: 32.2, y: 131 });
  const resize = frame(writing).getByRole('button', {
    name: 'Resize note',
    exact: true,
  });
  await resize.focus();
  await resize.press('ArrowRight');
  await resize.press('ArrowDown');
  await page
    .getByRole('button', { name: 'Move note left', exact: true })
    .click();
  await page.getByRole('button', { name: 'Wider note', exact: true }).click();
  await page.getByRole('button', { name: 'Taller note', exact: true }).click();
  const expected = { x: 28.5, y: 131, width: 70.3, height: 22.2 };
  expect(await geometry(writing)).toEqual(expected);
  await saved(page);
  await page.reload();
  expect(await geometry(writing)).toEqual(expected);
  await expect(writing).toHaveText('A note');
});

test('Escape, cancelled pointer capture and viewport changes cancel preview without saving or navigating', async ({
  page,
}) => {
  await ready(page);
  const writing = await addNote(page);
  await writing.fill('Unchanged');
  await saved(page);
  const original = await stored(page, writing);
  const bounds = await geometry(writing);
  for (const cancel of ['escape', 'pointercancel', 'lostcapture', 'resize']) {
    const { start, paper, handle } = await startDrag(page, writing, 'Move');
    await page.mouse.move(
      start.x + (7.4 * paper.width) / 148,
      start.y + (3.7 * paper.height) / 210,
    );
    await expect(frame(writing)).toHaveClass(/note-adjusting/);
    await expect(
      page.getByRole('button', { name: 'Next spread', exact: true }),
    ).toBeDisabled();
    await expect(page.getByLabel('Page size')).toBeDisabled();
    if (cancel === 'escape') await page.keyboard.press('Escape');
    else if (cancel === 'pointercancel')
      await handle.dispatchEvent('pointercancel');
    else if (cancel === 'lostcapture')
      await handle.evaluate((element) => {
        for (let id = 0; id < 10; id++)
          if (element.hasPointerCapture(id)) element.releasePointerCapture(id);
      });
    else await page.evaluate(() => window.dispatchEvent(new Event('resize')));
    await page.mouse.up();
    await expect(frame(writing)).not.toHaveClass(/note-adjusting/);
    expect(await geometry(writing), cancel).toEqual(bounds);
    expect(await stored(page, writing)).toEqual(original);
    await expect(
      page.getByRole('button', { name: 'Next spread', exact: true }),
    ).toBeEnabled();
  }
});

test('page zoom, right-page origin and phone focus keep placement in document coordinates', async ({
  page,
}) => {
  await ready(page);
  await page.getByLabel('Page size').selectOption('1.15');
  const writing = await addNote(page, true);
  await writing.fill('Right-hand page');
  await drag(page, writing, 'Move', 7.4, 3.7);
  const expected = { x: 35.9, y: 131, width: 62.9, height: 14.8 };
  expect(await geometry(writing)).toEqual(expected);
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .getByRole('button', { name: 'Wednesday, October 7', exact: true })
    .click();
  await expect(day(page, true)).toBeVisible();
  expect(await geometry(writing)).toEqual(expected);
  await writing.click();
  await drag(page, writing, 'Resize', -7.4, 7.4);
  await saved(page);
  expect(await geometry(writing)).toEqual({
    ...expected,
    width: 55.5,
    height: 22.2,
  });
  if (test.info().project.name === 'chromium')
    await page.screenshot({
      path: 'artifacts/note-placement-phone.png',
      fullPage: true,
    });
  await page.reload();
  expect(await geometry(writing)).toEqual({
    ...expected,
    width: 55.5,
    height: 22.2,
  });
});

test('resizing preserves overflowing text and selected-note controls leave other notes unchanged', async ({
  page,
}) => {
  await ready(page);
  const writing = await addNote(page);
  const text = 'Preserve all my writing. '.repeat(60);
  await writing.fill(text);
  await page.getByRole('button', { name: 'Shorter note', exact: true }).click();
  await page
    .getByRole('button', { name: 'Narrower note', exact: true })
    .click();
  await expect(
    frame(writing).getByRole('button', { name: 'Read overflowing writing' }),
  ).toBeVisible();
  await expect(writing).toHaveText(text);
  await saved(page);
  const first = await stored(page, writing);
  await day(page).getByRole('button', { name: '+ Note', exact: true }).click();
  const second = day(page)
    .getByRole('textbox', { name: 'Note on 2026-10-06', exact: true })
    .nth(1);
  await second.fill('Second note');
  await page
    .getByRole('button', { name: 'Move note right', exact: true })
    .click();
  await saved(page);
  const firstFrame = page.locator(`[data-note-id="${first.id}"]`);
  await expect(firstFrame.getByRole('textbox')).toHaveText(text);
  expect(await stored(page, firstFrame.getByRole('textbox'))).toEqual(first);
  await expect(
    firstFrame.getByRole('button', { name: 'Move note', exact: true }),
  ).toHaveCount(0);
  await firstFrame.getByRole('textbox').click();
  await page
    .getByRole('button', { name: 'Read full writing', exact: true })
    .click();
  await expect(page.getByLabel('Full writing')).toContainText(text.trim());
  await page.keyboard.press('Escape');
  if (test.info().project.name === 'chromium')
    await page.screenshot({
      path: 'artifacts/note-placement-desktop.png',
      fullPage: true,
    });
  await saved(page);
  await page.reload();
  await expect(firstFrame.getByRole('textbox')).toHaveText(text);
});

test('a failed geometry save retains the changed note for retry and blocks navigation', async ({
  page,
}) => {
  await ready(page);
  const writing = await addNote(page);
  await writing.fill('Keep this note');
  await saved(page);
  await page.evaluate(() => {
    const put = IDBObjectStore.prototype.put;
    Object.assign(window, {
      restoreNoteStorage: () => {
        IDBObjectStore.prototype.put = put;
      },
    });
    IDBObjectStore.prototype.put = function (
      ...args: Parameters<IDBObjectStore['put']>
    ) {
      if (this.name === 'entries')
        throw new DOMException(
          'Synthetic storage failure',
          'QuotaExceededError',
        );
      return put.apply(this, args);
    };
  });
  await drag(page, writing, 'Move', 7.4, 3.7);
  await expect(page.getByRole('status')).toHaveText('Storage problem');
  const expected = { x: 35.9, y: 131, width: 62.9, height: 14.8 };
  expect(await geometry(writing)).toEqual(expected);
  await page.getByRole('button', { name: 'Next spread', exact: true }).click();
  await expect(day(page)).toBeVisible();
  await expect(writing).toHaveText('Keep this note');
  await expect(
    page.getByRole('button', { name: 'Next spread', exact: true }),
  ).toBeEnabled();
  await page.evaluate(() =>
    (
      window as typeof window & { restoreNoteStorage: () => void }
    ).restoreNoteStorage(),
  );
  await page.getByRole('button', { name: 'Retry saving', exact: true }).click();
  await saved(page);
  await page.reload();
  expect(await geometry(writing)).toEqual(expected);
});

test('legacy upper-grid notes keep their geometry on handle clicks and remain bounded during keyboard placement', async ({
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
    transaction.objectStore('entries').put({
      id: 'synthetic-legacy-note',
      pageId: 'personal-2026:daily:2026-10-06',
      type: 'note',
      x: 32.2,
      y: 44.4,
      width: 61.1,
      height: 13.2,
      text: 'Legacy note',
      revision: 1,
      deletedAt: null,
      style: { ink: 'purple', emphasis: false },
    });
    await done;
    db.close();
  });
  await page.reload();
  const writing = day(page).getByRole('textbox', {
    name: 'Note on 2026-10-06',
    exact: true,
  });
  await writing.click();
  const original = await stored(page, writing);
  for (const name of ['Move note', 'Resize note']) {
    await frame(writing).getByRole('button', { name, exact: true }).click();
    expect(await stored(page, writing)).toEqual(original);
    expect(await geometry(writing)).toEqual({
      x: 32.2,
      y: 44.4,
      width: 61.1,
      height: 13.2,
    });
  }
  const move = frame(writing).getByRole('button', {
    name: 'Move note',
    exact: true,
  });
  await move.focus();
  for (let count = 0; count < 3; count++) {
    await move.press('Shift+ArrowLeft');
    await move.press('Shift+ArrowUp');
  }
  expect(await geometry(writing)).toEqual({
    x: 10,
    y: 27.4,
    width: 61.1,
    height: 13.2,
  });
  await saved(page);
  await page.reload();
  await expect(writing).toHaveText('Legacy note');
  expect(await geometry(writing)).toEqual({
    x: 10,
    y: 27.4,
    width: 61.1,
    height: 13.2,
  });
});

test('touch input moves a note with its handle in a phone viewport', async ({
  page,
  browserName,
}) => {
  test.skip(
    browserName !== 'chromium',
    'Trusted touch injection uses Chromium CDP; phone pointer journeys run in every engine.',
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await ready(page);
  const writing = await addNote(page);
  await writing.fill('Touch note');
  const handle = frame(writing).getByRole('button', {
    name: 'Move note',
    exact: true,
  });
  await handle.scrollIntoViewIfNeeded();
  const bounds = (await handle.boundingBox())!;
  const paper = (await day(page).boundingBox())!;
  const touch = await page.context().newCDPSession(page);
  const x = bounds.x + bounds.width / 2,
    y = bounds.y + bounds.height / 2;
  await touch.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x, y }],
  });
  await touch.send('Input.dispatchTouchEvent', {
    type: 'touchMove',
    touchPoints: [
      { x: x + (7.4 * paper.width) / 148, y: y + (3.7 * paper.height) / 210 },
    ],
  });
  await touch.send('Input.dispatchTouchEvent', {
    type: 'touchEnd',
    touchPoints: [],
  });
  await saved(page);
  expect(await geometry(writing)).toEqual({
    x: 35.9,
    y: 131,
    width: 62.9,
    height: 14.8,
  });
  await page.reload();
  expect(await geometry(writing)).toEqual({
    x: 35.9,
    y: 131,
    width: 62.9,
    height: 14.8,
  });
});
