import {
  expect as baseExpect,
  test,
  type Page,
  type Locator,
} from '@playwright/test';
import type { Editor } from '@tiptap/core';

// Assert visible text for rich writing and native value for interface fields.
const expect = baseExpect.extend({
  async toHaveWriting(locator: Locator, expected: string | RegExp) {
    const value = () =>
      locator.evaluate((node) => {
        if (
          node instanceof HTMLInputElement ||
          node instanceof HTMLTextAreaElement ||
          node instanceof HTMLSelectElement
        )
          return node.value;
        const read = (part: Node): string => {
          if (part.nodeType === Node.TEXT_NODE) return part.textContent ?? '';
          if (part instanceof HTMLBRElement)
            return part.classList.contains('ProseMirror-trailingBreak')
              ? ''
              : '\n';
          const children = [...part.childNodes];
          return children
            .map(
              (child, index) =>
                (child instanceof HTMLParagraphElement && index > 0
                  ? '\n'
                  : '') + read(child),
            )
            .join('');
        };
        return read(node);
      });
    try {
      if (expected instanceof RegExp)
        await baseExpect.poll(value).toMatch(expected);
      else await baseExpect.poll(value).toBe(expected);
      return {
        pass: true,
        message: () => `Expected writing to differ from ${String(expected)}`,
      };
    } catch (error) {
      return { pass: false, message: () => String(error) };
    }
  },
});
async function selectWriting(locator: Locator, from: number, to: number) {
  await locator.focus();
  await expect(async () => {
    await locator.evaluate(
      (node, { from, to }) => {
        const point = (offset: number): [Node, number] => {
          const walk = document.createTreeWalker(
            node,
            NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
          );
          let part: Node | null;
          while ((part = walk.nextNode())) {
            if (part.nodeType === Node.TEXT_NODE) {
              if (offset <= (part.textContent?.length ?? 0))
                return [part, offset];
              offset -= part.textContent?.length ?? 0;
            } else if (
              part instanceof HTMLBRElement &&
              !part.classList.contains('ProseMirror-trailingBreak')
            ) {
              const parent = part.parentNode!;
              const index = [...parent.childNodes].indexOf(part as ChildNode);
              if (!offset) return [parent, index];
              offset--;
            }
          }
          return [node, node.childNodes.length];
        };
        const start = point(from),
          end = point(to);
        window
          .getSelection()!
          .setBaseAndExtent(start[0], start[1], end[0], end[1]);
        document.dispatchEvent(new Event('selectionchange'));
      },
      { from, to },
    );
    // Browser/editor selection can settle asynchronously after undo/redo.
    // Reapply the synthetic selection until it is observed, without a fixed sleep.
    const observed = await locator.evaluate((node) => {
      const editor = (node as HTMLElement & { editor: Editor }).editor;
      const { doc, selection } = editor.state;
      return [selection.from, selection.to].map(
        (position) => doc.textBetween(0, position, '\n', '\n').length,
      );
    });
    expect(observed).toEqual([from, to]);
  }).toPass({ timeout: 5_000, intervals: [10, 20, 50] });
}
async function caretOffset(locator: Locator) {
  return locator.evaluate((node) => {
    const selection = window.getSelection()!;
    const range = document.createRange();
    range.setStart(node, 0);
    range.setEnd(selection.anchorNode!, selection.anchorOffset);
    return range.toString().length;
  });
}

async function ready(page: Page) {
  await page.goto('/');
  await expect(page.getByRole('status')).toHaveText('Saved on this device');
}
async function saved(page: Page) {
  await expect(page.getByRole('status')).toHaveText('Saved on this device');
}
const leftDay = (page: Page) =>
  page.getByRole('region', { name: 'Tuesday, October 6', exact: true });

test('arrow keys move between hourly rows without taking over selection, multiline editing or page turns', async ({
  page,
}) => {
  await ready(page);
  const day = leftDay(page);
  const row = (time: string) =>
    day.getByRole('textbox', { name: `Timed writing ${time}`, exact: true });
  const noon = row('12:00');
  await noon.fill('Lunch');
  await selectWriting(noon, 2, 2);
  await noon.press('ArrowDown');
  await expect(row('13:00')).toBeFocused();
  await expect(row('13:00')).toHaveWriting('');
  await row('13:00').fill('Project');
  await selectWriting(row('13:00'), 2, 2);
  await row('13:00').press('ArrowUp');
  await expect(noon).toBeFocused();
  await expect.poll(() => caretOffset(noon)).toBe(2);
  await noon.press('ArrowLeft');
  await expect(noon).toBeFocused();
  await expect.poll(() => caretOffset(noon)).toBe(1);
  await noon.press('Shift+ArrowDown');
  await expect(noon).toBeFocused();
  await noon.dispatchEvent('keydown', { key: 'ArrowDown', isComposing: true });
  await expect(noon).toBeFocused();
  await selectWriting(noon, 0, 3);
  await noon.press('ArrowDown');
  await expect(noon).toBeFocused();
  await noon.fill('First line\nSecond line');
  await selectWriting(noon, 0, 0);
  await noon.press('ArrowDown');
  await expect(noon).toBeFocused();
  await selectWriting(noon, 22, 22);
  await noon.press('ArrowDown');
  await expect(row('13:00')).toBeFocused();
  await row('23:00').focus();
  await row('23:00').press('ArrowDown');
  await expect(row('00:00 +1')).toBeFocused();
  await row('06:00').focus();
  await row('06:00').press('ArrowUp');
  await expect(row('06:00')).toBeFocused();
  await row('03:00 +1').focus();
  await row('03:00 +1').press('ArrowDown');
  await expect(row('03:00 +1')).toBeFocused();
  await saved(page);
  await page.reload();
  await expect(noon).toHaveWriting('First line\nSecond line');
  await expect(row('13:00')).toHaveWriting('Project');
  await expect(day).toBeVisible();
});

test('word formatting preserves independent marks, selected-word buttons, typed styles and reload', async ({
  page,
}) => {
  await ready(page);
  const day = leftDay(page);
  const noon = day.getByRole('textbox', {
    name: 'Timed writing 12:00',
    exact: true,
  });
  await noon.fill('Lunch with friends');
  await selectWriting(noon, 0, 5);
  await noon.press('Meta+b');
  await expect(noon.locator('strong')).toHaveText('Lunch');
  await expect(noon.locator('strong')).toHaveCSS('font-weight', '700');
  await selectWriting(noon, 6, 10);
  await noon.press('Control+i');
  await expect(noon.locator('em')).toHaveText('with');
  await selectWriting(noon, 11, 18);
  await noon.press('Meta+u');
  await expect(noon.locator('u')).toHaveText('friends');
  await expect(noon.locator('strong')).toHaveText('Lunch');
  await expect(
    page.getByRole('button', { name: 'Underline', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await noon.dispatchEvent('keydown', {
    key: 'u',
    ctrlKey: true,
    isComposing: true,
  });
  await expect(noon.locator('u')).toHaveText('friends');
  await selectWriting(noon, 0, 5);
  await page.getByRole('button', { name: 'Bold', exact: true }).click();
  await expect(noon.locator('strong')).toHaveCount(0);
  await expect(noon).toBeFocused();
  await noon.press('Control+b');
  await expect(noon.locator('strong')).toHaveText('Lunch');
  // Toggle new typing without changing any existing word.
  await selectWriting(noon, 18, 18);
  await noon.press('Control+u');
  await noon.press('Meta+b');
  await noon.pressSequentially(' later');
  await expect(noon.locator('strong')).toHaveText(['Lunch', ' later']);
  await expect(noon.locator('u')).toHaveText('friends');
  await noon.press('Enter');
  await day
    .getByRole('checkbox', { name: 'Complete timed task 12:00 on 2026-10-06' })
    .check();
  await expect(noon).toHaveCSS('text-decoration-line', 'line-through');
  await expect(noon.locator('u')).toHaveText('friends');
  await page.getByRole('button', { name: 'Next spread', exact: true }).click();
  await page
    .getByRole('button', { name: 'Previous spread', exact: true })
    .click();
  await page.reload();
  await expect(noon).toHaveWriting('Lunch with friends later');
  await expect(noon.locator('strong')).toHaveText(['Lunch', ' later']);
  await expect(noon.locator('em')).toHaveText('with');
  await expect(noon.locator('u')).toHaveText('friends');
  await noon.focus();
  await page.getByRole('button', { name: 'Edit writing', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'A little more room' });
  const writing = dialog.getByLabel('Your writing');
  await expect(writing).toBeFocused();
  await expect(writing.locator('strong')).toHaveText(['Lunch', ' later']);
  await selectWriting(writing, 11, 18);
  await writing.press('Control+b');
  await expect(writing.locator('u strong, strong u')).toHaveText('friends');
  await writing.press('Escape');
  await expect(noon).toBeFocused();
  await expect(noon.locator('u strong, strong u')).toHaveText('friends');
  await page
    .getByRole('button', { name: 'Read full writing', exact: true })
    .click();
  await expect(
    page.getByRole('dialog', { name: 'Full writing' }),
  ).toHaveWriting('Lunch with friends later');
  await page.getByRole('dialog', { name: 'Full writing' }).press('Escape');
  const task = day.getByRole('textbox', {
    name: 'Task 1 on 2026-10-06',
    exact: true,
  });
  await task.fill('Top checklist');
  await selectWriting(task, 4, 13);
  await task.press('Control+u');
  await day
    .getByRole('checkbox', { name: 'Complete task 1 on 2026-10-06' })
    .check();
  await expect(task.locator('u')).toHaveText('checklist');
  await saved(page);
  await page.reload();
  await expect(task.locator('u')).toHaveText('checklist');
});

test('word formatting follows edits, supports local undo and pastes plain text safely', async ({
  page,
}) => {
  await ready(page);
  const day = leftDay(page);
  const row = day.getByRole('textbox', {
    name: 'Timed writing 12:00',
    exact: true,
  });
  await row.fill('Plan quiet reading');
  await selectWriting(row, 5, 10);
  await row.press('Control+b');
  await expect(row.locator('strong')).toHaveText('quiet');
  await row.press('ControlOrMeta+z');
  await expect(row.locator('strong')).toHaveCount(0);
  await row.press('ControlOrMeta+Shift+z');
  await expect(row.locator('strong')).toHaveText('quiet');
  await selectWriting(row, 0, 0);
  await row.pressSequentially('Today: ');
  await expect(row.locator('strong')).toHaveText('quiet');
  await selectWriting(row, 7, 12);
  await row.press('Backspace');
  await expect(row).toHaveWriting('Today: quiet reading');
  await selectWriting(row, 7, 12);
  await row.pressSequentially('calm');
  await expect(row.locator('strong')).toHaveText('calm');
  // Repeated rapid replacements must keep every typed character in the mark,
  // even while React acknowledges earlier edits and local saves are queued.
  for (const word of ['steady', 'clear', 'peaceful', 'calm']) {
    const previous = await row.locator('strong').textContent();
    await selectWriting(row, 7, 7 + previous!.length);
    await row.pressSequentially(word);
    await expect(row).toHaveWriting(`Today: ${word} reading`);
    await expect(row.locator('strong')).toHaveText(word);
  }
  await row.press('Enter');
  await day.getByRole('button', { name: '+ Note', exact: true }).click();
  const note = day.getByRole('textbox', { name: 'Note on 2026-10-06' });
  await note.fill('Keep words\nand spaces');
  await selectWriting(note, 5, 10);
  await page.getByRole('button', { name: 'Italic', exact: true }).click();
  await expect(note.locator('em')).toHaveText('words');
  await selectWriting(note, 21, 21);
  await note.evaluate((node) => {
    const event = new ClipboardEvent('paste', {
      bubbles: true,
      cancelable: true,
    });
    // Synthetic Firefox DataTransfer hides clipboard payloads. Supply a stable
    // clipboard boundary here; physical clipboard behavior remains a device check.
    Object.defineProperty(event, 'clipboardData', {
      value: {
        types: ['text/plain', 'text/html'],
        getData: (type: string) =>
          type === 'text/plain'
            ? '\n<script>literal</script>'
            : '<img src="invalid" onerror="window.unsafePaste=true">',
      },
    });
    node.dispatchEvent(event);
  });
  await expect(note).toHaveWriting(
    'Keep words\nand spaces\n<script>literal</script>',
  );
  await expect(note.locator('img, script')).toHaveCount(0);
  await saved(page);
  await page.reload();
  await expect(row).toHaveWriting('Today: calm reading');
  await expect(row.locator('strong')).toHaveText('calm');
  await expect(note.locator('em')).toHaveText('words');
  await expect(note).toHaveWriting(
    'Keep words\nand spaces\n<script>literal</script>',
  );
});

test('timed writing, note geometry, task text and completion survive turns and reload', async ({
  page,
}) => {
  await ready(page);
  const day = leftDay(page);
  await leftDay(page)
    .getByRole('textbox', { name: 'Timed writing 09:00', exact: true })
    .fill('Read chapter four');
  await page.getByLabel('Exact time').fill('14:15');
  await day
    .getByRole('textbox', { name: 'Timed writing 09:00', exact: true })
    .fill('Another morning line');
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
  ).toHaveWriting('Read chapter four');
  const note = page.getByRole('textbox', { name: 'Note on 2026-10-06' });
  const geometry = await note
    .locator('xpath=ancestor::div[contains(@class, "writing-item")][1]')
    .getAttribute('style');
  await page.reload();
  await saved(page);
  await expect(note).toHaveWriting(
    'A quiet afternoon\nRemember the small things.',
  );
  expect(
    await note
      .locator('xpath=ancestor::div[contains(@class, "writing-item")][1]')
      .getAttribute('style'),
  ).toBe(geometry);
  await expect(
    day.getByRole('textbox', { name: 'Task 1 on 2026-10-06', exact: true }),
  ).toHaveWriting('Review notes');
  await expect(
    day.getByRole('checkbox', { name: 'Complete task 1 on 2026-10-06' }),
  ).toBeChecked();
  await expect(
    page.getByRole('textbox', { name: 'Timed writing 14:15', exact: true }),
  ).toHaveCount(1);
  await expect(
    day.getByRole('textbox', { name: 'Timed writing 09:00', exact: true }),
  ).toHaveWriting('Another morning line');
});

test('timed task completion appears on Enter and survives turns and reload', async ({
  page,
}) => {
  await ready(page);
  const day = leftDay(page);
  const row = day.getByRole('textbox', {
    name: 'Timed writing 12:00',
    exact: true,
  });
  const checkbox = day.getByRole('checkbox', {
    name: 'Complete timed task 12:00 on 2026-10-06',
    exact: true,
  });
  await row.fill('Lunch with a friend');
  await expect(checkbox).toHaveCount(0);
  await row.press('Shift+Enter');
  await expect(checkbox).toHaveCount(0);
  await row.fill('Lunch with a friend');
  await row.dispatchEvent('keydown', { key: 'Enter', isComposing: true });
  await expect(checkbox).toHaveCount(0);
  await row.press('Enter');
  await expect(checkbox).toBeVisible();
  await expect(checkbox).not.toBeChecked();
  for (const viewport of [
    { width: 1440, height: 1120 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    const centers = await checkbox.evaluate((node) => {
      const box = node.getBoundingClientRect();
      const row = node.closest('.timed')!.getBoundingClientRect();
      const grid = node.closest('.paper')!.querySelector('.paper-grid')!;
      const stroke = parseFloat(
        getComputedStyle(grid).getPropertyValue('--grid-stroke'),
      );
      return {
        checkbox: box.top + box.height / 2,
        row: row.top + stroke + (row.height - stroke) / 2,
      };
    });
    expect(Math.abs(centers.checkbox - centers.row)).toBeLessThan(0.1);
  }
  await page.setViewportSize({ width: 1440, height: 1120 });
  await checkbox.focus();
  await checkbox.press('Space');
  await expect(checkbox).toBeChecked();
  expect(
    await row.evaluate((node) => getComputedStyle(node).textDecorationLine),
  ).toBe('line-through');
  const lineColor = await row.evaluate(
    (node) => getComputedStyle(node).textDecorationColor,
  );
  expect(lineColor).toMatch(/0\.4|40%/);
  await expect(row).toHaveWriting('Lunch with a friend');
  await page.getByRole('button', { name: 'Next spread', exact: true }).click();
  await page
    .getByRole('button', { name: 'Previous spread', exact: true })
    .click();
  await expect(checkbox).toBeChecked();
  await page.reload();
  await saved(page);
  await expect(checkbox).toBeChecked();
  await checkbox.uncheck();
  expect(
    await row.evaluate((node) => getComputedStyle(node).textDecorationLine),
  ).toBe('none');
  await row.fill('');
  await expect(checkbox).toHaveCount(0);
  await expect(day.locator('.schedule-line')).toHaveCount(0);
  await saved(page);
});

test('consecutive occupied hours share the requested line and clearing splits it', async ({
  page,
}) => {
  await ready(page);
  const day = leftDay(page);
  for (const [hour, text] of [
    [12, 'Lunch'],
    [13, 'Project work'],
    [14, 'Reading'],
    [16, 'A walk'],
  ] as const) {
    const row = day.getByRole('textbox', {
      name: `Timed writing ${hour}:00`,
      exact: true,
    });
    await row.fill(text);
    await row.press('Enter');
  }
  const run = day.locator('.schedule-line[data-start="720"][data-end="840"]');
  await expect(run).toHaveCount(1);
  await expect(day.locator('.schedule-line')).toHaveCount(2);
  for (const viewport of [
    { width: 1440, height: 1120 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    const geometry = await run.evaluate((node) => {
      const line = node.getBoundingClientRect();
      const paper = node.closest('.paper')!;
      const paperBox = paper.getBoundingClientRect();
      const grid = paper.querySelector('.paper-grid')!;
      const gridBox = grid.getBoundingClientRect();
      const pitch = parseFloat(getComputedStyle(grid).backgroundSize);
      const stroke = parseFloat(
        getComputedStyle(grid).getPropertyValue('--grid-stroke'),
      );
      const first = paper
        .querySelector('[aria-label="Timed writing 12:00"]')!
        .getBoundingClientRect();
      const last = paper
        .querySelector('[aria-label="Timed writing 14:00"]')!
        .getBoundingClientRect();
      return {
        center: line.x + line.width / 2,
        gridCenter: gridBox.x + 3 * pitch + stroke / 2,
        width: line.width,
        stroke,
        top: line.top,
        bottom: line.bottom,
        firstTop: first.top,
        textGap: first.left - line.right,
        textInsetInSquares: (first.left - (gridBox.x + 3 * pitch)) / pitch,
        lastBottom: last.bottom,
        y: ((line.y - paperBox.y) / paperBox.height) * 210,
        height: (line.height / paperBox.height) * 210,
      };
    });
    expect(Math.abs(geometry.center - geometry.gridCenter)).toBeLessThan(0.1);
    expect(geometry.width).toBeGreaterThan(geometry.stroke);
    expect(geometry.textGap).toBeGreaterThan(0);
    expect(geometry.textInsetInSquares).toBeCloseTo(0.25, 2);
    expect(Math.abs(geometry.top - geometry.firstTop)).toBeLessThan(1);
    expect(Math.abs(geometry.bottom - geometry.lastBottom)).toBeLessThan(1);
    expect(geometry.y).toBeCloseTo(53.3, 1);
    expect(geometry.height).toBeCloseTo(11.1, 1);
  }
  const middle = day.getByRole('textbox', {
    name: 'Timed writing 13:00',
    exact: true,
  });
  await middle.fill('');
  await expect(run).toHaveCount(0);
  await expect(day.locator('.schedule-line')).toHaveCount(3);
  await middle.fill('Project work');
  await middle.press('Enter');
  await saved(page);
  await page.reload();
  await saved(page);
  await expect(run).toHaveCount(1);
  await expect(
    day.getByRole('checkbox', {
      name: 'Complete timed task 13:00 on 2026-10-06',
      exact: true,
    }),
  ).not.toBeChecked();
});

test('hourly text fields, printed intersections and page-only font stay aligned', async ({
  page,
}) => {
  await ready(page);
  const day = leftDay(page);
  await expect(day.locator('.timed .writing-input')).toHaveCount(22);
  await expect(
    day.getByRole('button', { name: '+ Timed line', exact: true }),
  ).toHaveCount(0);
  await expect(day.locator('.memo-divider')).toHaveCount(0);
  await expect(day.locator('.time-dot')).toHaveCount(14);
  expect(await day.locator('.time-marker').allTextContents()).toEqual([
    '6',
    '9',
    '12',
    '15',
    '18',
    '21',
    '0',
    '3',
  ]);
  const geometry = await day.evaluate((paper) => {
    const bounds = paper.getBoundingClientRect();
    const grid = paper.querySelector('.paper-grid')!.getBoundingClientRect();
    return [...paper.querySelectorAll('.time-marker, .time-dot')].map(
      (element) => {
        const rect = element.getBoundingClientRect();
        return {
          x: ((rect.x + rect.width / 2 - grid.x) / bounds.width) * 148,
          row:
            (((rect.y + rect.height / 2 - grid.y) / bounds.height) * 210) / 3.7,
        };
      },
    );
  });
  for (const mark of geometry) {
    expect(mark.x).toBeCloseTo(3.7, 1);
    expect(mark.row).toBeCloseTo(Math.round(mark.row), 1);
  }
  const row = day.getByRole('textbox', {
    name: 'Timed writing 00:00 +1',
    exact: true,
  });
  await row.fill('Midnight row');
  await row.press('Enter');
  await expect(row).not.toBeFocused();
  await expect(
    day.getByRole('textbox', { name: 'Timed writing 01:00 +1', exact: true }),
  ).toHaveWriting('');
  const font = (selector: string) =>
    day
      .locator(selector)
      .first()
      .evaluate((element) => getComputedStyle(element).fontFamily);
  expect(await font('.timed .writing-input')).toContain('monospace');
  expect(await font('.task-row .writing-input')).toContain('monospace');
  expect(await font('.time-marker')).not.toContain('monospace');
  expect(await font('.date-number')).toContain('Georgia');
  await day.getByRole('button', { name: '+ Note', exact: true }).click();
  expect(await font('.note .writing-input')).toContain('monospace');
  await saved(page);
  await page.reload();
  await saved(page);
  await expect(row).toHaveWriting('Midnight row');
});

test('old exact times, duplicate-hour writing and upper notes retain their data', async ({
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
    const base = {
      pageId: 'personal-2026:daily:2026-10-06',
      revision: 1,
      deletedAt: null,
      style: { ink: 'purple', emphasis: false },
    };
    const store = transaction.objectStore('entries');
    store.put({
      ...base,
      id: 'legacy-a',
      type: 'scheduled-line',
      minute: 855,
      dayOffset: 0,
      text: 'Original exact-time writing',
    });
    store.put({
      ...base,
      id: 'legacy-b',
      type: 'scheduled-line',
      minute: 885,
      dayOffset: 0,
      text: 'Second entry in the same hour. '.repeat(30),
    });
    store.put({
      ...base,
      id: 'legacy-note',
      type: 'note',
      x: 32.2,
      y: 44.4,
      width: 62.9,
      height: 14.8,
      text: 'Keep my original note position',
    });
    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
    db.close();
  });
  await page.reload();
  await saved(page);
  const day = leftDay(page);
  const first = day.getByRole('textbox', {
    name: 'Timed writing 14:15',
    exact: true,
  });
  await expect(first).toHaveWriting('Original exact-time writing');
  await first.click();
  await expect(page.getByLabel('Exact time')).toHaveWriting('14:15');
  const note = day.getByRole('textbox', { name: 'Note on 2026-10-06' });
  await expect(note).toHaveWriting('Keep my original note position');
  const style = await note
    .locator('xpath=ancestor::div[contains(@class, "writing-item")][1]')
    .getAttribute('style');
  await day
    .getByRole('button', {
      name: 'Other writing in this hour (2 entries)',
      exact: true,
    })
    .click();
  const second = day.getByRole('textbox', {
    name: 'Timed writing 14:45',
    exact: true,
  });
  await expect(second).toHaveWriting(
    'Second entry in the same hour. '.repeat(30),
  );
  await expect(
    day.getByRole('button', { name: 'Read overflowing writing', exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel('Exact time')).toHaveWriting('14:45');
  await second.fill('Second entry updated');
  await expect(
    day.getByRole('button', { name: 'Read overflowing writing', exact: true }),
  ).toHaveCount(0);
  await saved(page);
  await page.reload();
  await saved(page);
  expect(
    await note
      .locator('xpath=ancestor::div[contains(@class, "writing-item")][1]')
      .getAttribute('style'),
  ).toBe(style);
  await expect(first).toHaveWriting('Original exact-time writing');
  await day
    .getByRole('button', {
      name: 'Other writing in this hour (2 entries)',
      exact: true,
    })
    .click();
  await expect(second).toHaveWriting('Second entry updated');
});

test('two tabs editing the same initially empty hourly row reject a stale write', async ({
  page,
  context,
}) => {
  await ready(page);
  const other = await context.newPage();
  await ready(other);
  await leftDay(page)
    .getByRole('textbox', { name: 'Timed writing 10:00', exact: true })
    .fill('First tab hourly writing');
  await saved(page);
  const stale = leftDay(other).getByRole('textbox', {
    name: 'Timed writing 10:00',
    exact: true,
  });
  await stale.fill('Retain the second tab draft');
  await expect(other.getByRole('status')).toHaveText('Storage problem');
  await expect(stale).toHaveWriting('Retain the second tab draft');
  await expect(
    other.getByRole('alert').filter({ hasText: 'Another tab changed' }),
  ).toContainText('Your draft is retained');
});

test('clicking across an hourly row edits it and the lower grid creates notes', async ({
  page,
}) => {
  await ready(page);
  const bounds = await leftDay(page).boundingBox();
  if (!bounds) throw new Error('Page has no layout');
  await page.mouse.click(
    bounds.x + (115 / 148) * bounds.width,
    bounds.y + (44 / 210) * bounds.height,
  );
  await expect(
    leftDay(page).getByRole('textbox', {
      name: 'Timed writing 09:00',
      exact: true,
    }),
  ).toBeFocused();
  await leftDay(page)
    .getByRole('textbox', { name: 'Timed writing 09:00', exact: true })
    .fill('Writing directly in the row');
  await page.mouse.click(
    bounds.x + (65 / 148) * bounds.width,
    bounds.y + (140 / 210) * bounds.height,
  );
  const note = page.getByRole('textbox', { name: 'Note on 2026-10-06' });
  await expect(note).toBeFocused();
  await note.fill('Placed directly on the page');
  expect(
    await note
      .locator('xpath=ancestor::div[contains(@class, "writing-item")][1]')
      .evaluate((element) => parseFloat((element as HTMLElement).style.left)),
  ).toBeCloseTo((65.5 / 148) * 100);
  await saved(page);
  await page.reload();
  await saved(page);
  await expect(note).toHaveWriting('Placed directly on the page');
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
  await expect(note).toHaveWriting('First line\nA');
  const style = await note
    .locator('xpath=ancestor::div[contains(@class, "writing-item")][1]')
    .getAttribute('style');
  await note.press('ControlOrMeta+A');
  await expect(leftDay(page)).toBeVisible();
  await note.dispatchEvent('compositionstart');
  await note.dispatchEvent('keydown', { key: 'Enter', isComposing: true });
  await note.dispatchEvent('compositionend');
  await note.press('Escape');
  await expect(note).toHaveWriting('First line\nA');
  await page.getByLabel('Page size').selectOption('1.15');
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(leftDay(page)).toBeVisible();
  await expect(
    page.getByRole('region', { name: 'Wednesday, October 7', exact: true }),
  ).toBeHidden();
  expect(
    await note
      .locator('xpath=ancestor::div[contains(@class, "writing-item")][1]')
      .getAttribute('style'),
  ).toBe(style);
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
  await expect(note).toHaveWriting(/^A readable phone draft/);
  await saved(page);
  await page.reload();
  await saved(page);
  await expect(note).toHaveWriting(/^A readable phone draft/);
});

test('view settings trap focus, retain preferences and leave writing intact at desktop and phone sizes', async ({
  page,
}) => {
  await ready(page);
  const row = leftDay(page).getByRole('textbox', {
    name: 'Timed writing 12:00',
    exact: true,
  });
  await row.fill('Keep my lunchtime plan');
  await row.press('Enter');
  await saved(page);
  const id = await row.getAttribute('id');
  for (const [viewport, zoom, side] of [
    [{ width: 1440, height: 1120 }, '1.15', 'left'],
    [{ width: 390, height: 844 }, '0.85', 'right'],
  ] as const) {
    await page.setViewportSize(viewport);
    const trigger = page.getByRole('button', {
      name: 'View settings',
      exact: true,
    });
    await trigger.focus();
    await trigger.press('Enter');
    const dialog = page.getByRole('dialog', { name: 'View settings' });
    await expect(dialog).toBeVisible();
    const select = dialog.getByLabel('Page size');
    const close = dialog.getByRole('button', { name: 'Close dialog' });
    await expect(select).toBeFocused();
    await select.press('Shift+Tab');
    await expect(close).toBeFocused();
    await close.press('Tab');
    await expect(select).toBeFocused();
    await select.selectOption(zoom);
    await dialog
      .getByRole('button', {
        name: side === 'left' ? 'Left side' : 'Right side',
      })
      .click();
    await expect(
      dialog.getByRole('button', {
        name: side === 'left' ? 'Left side' : 'Right side',
      }),
    ).toHaveAttribute('aria-pressed', 'true');
    const bounds = await dialog.boundingBox();
    expect(bounds!.x).toBeGreaterThanOrEqual(15);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(viewport.width - 15);
    expect(bounds!.height).toBeLessThanOrEqual(viewport.height * 0.85 + 1);
    await dialog.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(trigger).toBeFocused();
    // Await the actual preference transaction, rather than the entry save status.
    await expect
      .poll(() =>
        page.evaluate(async () => {
          const db = await new Promise<IDBDatabase>((resolve, reject) => {
            const request = indexedDB.open('daily-book-v1');
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
          });
          const value = await new Promise<{
            zoom: number;
            toolbarSide: string;
          }>((resolve, reject) => {
            const request = db
              .transaction('preferences')
              .objectStore('preferences')
              .get('local');
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
          });
          db.close();
          return { zoom: value.zoom, toolbarSide: value.toolbarSide };
        }),
      )
      .toEqual({ zoom: Number(zoom), toolbarSide: side });
    await page.reload();
    await saved(page);
    await expect(page.getByLabel('Page size')).toHaveWriting(zoom);
    await expect(page.locator('main')).toHaveClass(
      new RegExp(`toolbar-${side}`),
    );
    await expect(row).toHaveWriting('Keep my lunchtime plan');
    await expect(row).toHaveAttribute('id', id!);
    await expect(
      leftDay(page).getByRole('checkbox', {
        name: 'Complete timed task 12:00 on 2026-10-06',
      }),
    ).not.toBeChecked();
  }
});

test('full-writing popovers fit the phone and the enlarged editor restores row focus without losing drafts', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await ready(page);
  const row = leftDay(page).getByRole('textbox', {
    name: 'Timed writing 12:00',
    exact: true,
  });
  const text = 'A long plan with details. '.repeat(35) + '\nFinal detail.';
  await row.fill(text);
  const read = page.getByRole('button', { name: 'Read full writing' });
  await read.focus();
  await read.press('Enter');
  const popover = page.getByRole('dialog', { name: 'Full writing' });
  await expect(popover).toBeVisible();
  await expect(popover).toHaveText(text);
  const bounds = await popover.boundingBox();
  expect(bounds!.x).toBeGreaterThanOrEqual(15);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(375);
  expect(bounds!.height).toBeLessThanOrEqual(361);
  await popover.press('Escape');
  await expect(popover).toHaveCount(0);
  await expect(read).toBeFocused();
  await page.getByRole('button', { name: 'Edit writing', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'A little more room' });
  const writing = dialog.getByLabel('Your writing');
  await expect(writing).toBeFocused();
  await writing.dispatchEvent('compositionstart');
  await writing.dispatchEvent('keydown', { key: 'Escape', isComposing: true });
  await expect(dialog).toBeVisible();
  await expect(writing).toBeFocused();
  await writing.dispatchEvent('compositionend');
  await writing.fill(text + '\nKept on Escape.');
  await writing.press('Tab');
  // Native Safari tab order depends on its full keyboard access preference.
  await expect
    .poll(() =>
      dialog.evaluate((node) => node.contains(document.activeElement)),
    )
    .toBe(true);
  await dialog.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(row).toBeFocused();
  await expect(row).toHaveWriting(text + '\nKept on Escape.');
  await saved(page);
  await page.reload();
  await saved(page);
  await expect(row).toHaveWriting(text + '\nKept on Escape.');
  await expect(
    leftDay(page).getByRole('checkbox', {
      name: 'Complete timed task 12:00 on 2026-10-06',
    }),
  ).toHaveCount(0);
  await row.focus();
  await page.getByRole('button', { name: 'Edit writing', exact: true }).click();
  const done = dialog.getByRole('button', { name: 'Done editing' });
  await done.focus();
  await done.press('Space');
  await expect(dialog).toHaveCount(0);
  await expect(row).toBeFocused();
  await expect(
    leftDay(page).getByRole('checkbox', {
      name: 'Complete timed task 12:00 on 2026-10-06',
    }),
  ).not.toBeChecked();
});

test('icon controls expose keyboard hints without moving focus or navigating', async ({
  page,
}) => {
  await ready(page);
  const next = page.getByRole('button', { name: 'Next spread', exact: true });
  await next.focus();
  await expect(page.getByRole('tooltip')).toHaveText('Next two days');
  await expect(next).toBeFocused();
  await next.press('Escape');
  await expect(page.getByRole('tooltip')).toHaveCount(0);
  await expect(leftDay(page)).toBeVisible();
  await expect(next).toBeFocused();
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
  await expect(task).toHaveWriting('Keep this draft');
  await page
    .getByRole('button', { name: 'Recover writing', exact: true })
    .click();
  await expect(page.getByLabel('Recoverable writing')).toHaveWriting(
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
  await expect(task).toHaveWriting('Keep this draft');
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
  ).toHaveWriting('Second tab draft');
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
  await leftDay(page)
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
    .getByRole('textbox', { name: 'Timed writing 09:00', exact: true })
    .fill('A walk before the day begins');
  await page.getByLabel('Exact time').fill('06:30');
  await page.getByRole('button', { name: 'Done', exact: true }).click();
  await saved(page);
  await page.screenshot({ path: 'artifacts/m1-normal.png', fullPage: true });
  await page
    .getByRole('button', { name: 'View settings', exact: true })
    .click();
  await page.screenshot({
    path: 'artifacts/m1-ui-settings.png',
    fullPage: true,
  });
  await page.getByRole('dialog', { name: 'View settings' }).press('Escape');
  for (const [index, text] of [
    'Lunch with a friend',
    'Project reading',
    'A short walk',
    'Cook something good',
    'Evening reflection',
    'Late-night notes',
  ].entries()) {
    await day
      .getByRole('textbox', {
        name: `Timed writing ${String(11 + index * 2).padStart(2, '0')}:00`,
        exact: true,
      })
      .fill(text);
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
  await page
    .getByRole('button', { name: 'View settings', exact: true })
    .click();
  await page.screenshot({
    path: 'artifacts/m1-ui-phone-settings.png',
    fullPage: true,
  });
  await page.getByRole('dialog', { name: 'View settings' }).press('Escape');
  await page
    .getByRole('button', { name: 'Read full writing', exact: true })
    .click();
  await page.screenshot({
    path: 'artifacts/m1-ui-phone-popover.png',
    fullPage: true,
  });
  await page.getByRole('dialog', { name: 'Full writing' }).press('Escape');
  await page.getByRole('button', { name: 'Edit writing', exact: true }).click();
  await page.screenshot({
    path: 'artifacts/m1-phone-editor.png',
    fullPage: true,
  });
});
