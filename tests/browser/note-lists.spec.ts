import { readFile } from 'node:fs/promises';
import {
  test as base,
  expect,
  type Page,
  type Locator,
  type BrowserContext,
} from '../fixtures/browser';
import type { Editor } from '@tiptap/core';
import type { PlannerBackup } from '../../src/local/backup';

const test = base.extend<{ restoredContext: BrowserContext }>({
  restoredContext: async ({ browser }, provide) => {
    const context = await browser.newContext();
    try {
      await provide(context);
    } finally {
      await context.close();
    }
  },
});

async function ready(page: Page) {
  await page.goto('/');
  await expect(page.getByRole('status')).toHaveText('Saved on this device');
}
async function noteOn(page: Page) {
  const day = page.getByRole('region', {
    name: 'Tuesday, October 6',
    exact: true,
  });
  await day.getByRole('button', { name: '+ Note', exact: true }).click();
  const note = day.getByRole('textbox', { name: 'Note on 2026-10-06' });
  await expect(note).toBeFocused();
  return note;
}
async function slash(note: Locator, page: Page, choice: string) {
  await note.pressSequentially('/');
  await expect(
    page.getByRole('listbox', { name: 'Note list style' }),
  ).toBeVisible();
  await page.getByRole('option', { name: choice, exact: true }).click();
  await expect(
    page.getByRole('listbox', { name: 'Note list style' }),
  ).toBeHidden();
}
async function end(note: Locator) {
  await note.evaluate((node) => {
    const editor = (node as HTMLElement & { editor: Editor }).editor;
    editor.commands.focus('end');
  });
}

test('leading to-dos indent, continue, toggle independently and survive a portable restore', async ({
  page,
  restoredContext,
}, info) => {
  test.setTimeout(60_000);
  await ready(page);
  const note = await noteOn(page);
  await slash(note, page, 'To-do checkbox');
  await note.pressSequentially('Plan hardware');
  await note.press('Enter');
  await note.press('Tab');
  await note.pressSequentially('Compare parts');
  await note.press('Enter');
  await note.press('Shift+Tab');
  await note.pressSequentially('Order parts');
  const lines = note.locator('.note-line');
  await expect(lines).toHaveCount(3);
  await expect(lines.nth(1)).toHaveCSS('padding-left', /[1-9]/);
  await expect(lines.nth(2)).toHaveCSS('padding-left', /[1-9]/);
  const first = note.getByRole('checkbox', {
    name: 'Complete note to-do: Plan hardware',
    exact: true,
  });
  await first.check();
  await expect(first).toBeChecked();
  await expect(
    note.getByRole('checkbox', {
      name: 'Complete note to-do: Compare parts',
      exact: true,
    }),
  ).not.toBeChecked();
  await expect(lines.nth(0)).toHaveCSS('text-decoration-line', 'line-through');
  const box = await first.boundingBox();
  const text = await lines.first().evaluate((node) => {
    const range = document.createRange();
    range.selectNodeContents(node);
    return range.getBoundingClientRect().toJSON();
  });
  expect(box!.x).toBeLessThan(text!.x + 1);
  await end(note);
  await note.press('Enter');
  await note.press('Enter');
  await expect(lines.last()).toHaveAttribute('data-kind', 'plain');
  await note.pressSequentially('A plain closing thought');
  await note.press('Escape');
  await expect(page.getByRole('status')).toHaveText('Saved on this device');
  await page.reload();
  await expect(first).toBeChecked();
  await expect(note.locator('.note-line')).toHaveCount(4);
  await expect(note).toContainText('A plain closing thought');
  await page.screenshot({
    path: `artifacts/note-lists/${info.project.name}-todos.png`,
    fullPage: true,
  });
  await page.getByRole('button', { name: 'Backups', exact: true }).click();
  const downloading = page.waitForEvent('download');
  await page
    .getByRole('button', { name: 'Download backup', exact: true })
    .click();
  const download = await downloading;
  const archive = JSON.parse(
    await readFile((await download.path())!, 'utf8'),
  ) as PlannerBackup;
  expect(archive.version).toBe(3);
  const saved = archive.entries.find((entry) => entry.type === 'note')!;
  expect(saved.type === 'note' && saved.noteLines).toEqual([
    { kind: 'todo', indent: 0, checked: true },
    { kind: 'todo', indent: 1, checked: false },
    { kind: 'todo', indent: 0, checked: false },
    { kind: 'plain', indent: 0 },
  ]);
  const restored = await restoredContext.newPage();
  await restored.goto('/');
  await restored.getByRole('button', { name: 'Backups', exact: true }).click();
  await restored.getByLabel('Backup file', { exact: true }).setInputFiles({
    name: 'synthetic-lists.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(archive)),
  });
  await restored
    .getByRole('button', { name: 'Restore backup', exact: true })
    .click();
  await expect(
    restored.getByRole('checkbox', {
      name: 'Complete note to-do: Plan hardware',
      exact: true,
    }),
  ).toBeChecked();
  await expect(
    restored.getByRole('textbox', { name: 'Note on 2026-10-06' }),
  ).toContainText('A plain closing thought');
  await restored.reload();
  await expect(
    restored.getByRole('checkbox', {
      name: 'Complete note to-do: Plan hardware',
      exact: true,
    }),
  ).toBeChecked();
});

test('slash choices work with keyboard and pointer, numbering follows depth and ordinary slashes/IME stay text', async ({
  page,
}, info) => {
  await ready(page);
  const note = await noteOn(page);
  await note.pressSequentially('/');
  await page.screenshot({
    path: `artifacts/note-lists/${info.project.name}-menu.png`,
    fullPage: true,
  });
  await note.press('ArrowDown');
  await note.press('ArrowDown');
  await note.press('Enter');
  await note.pressSequentially('First');
  await note.press('Enter');
  await note.press('Tab');
  await note.pressSequentially('Child');
  await note.press('Enter');
  await note.press('Shift+Tab');
  await note.pressSequentially('Second');
  const markers = note.locator('.note-line');
  await expect(markers.nth(0)).toHaveAttribute('data-marker', '1.');
  await expect(markers.nth(1)).toHaveAttribute('data-marker', '1.');
  await expect(markers.nth(2)).toHaveAttribute('data-marker', '2.');
  await note.press('Enter');
  await slash(note, page, 'Bullet list');
  await note.pressSequentially('A bullet');
  await note.press('Enter');
  await note.press('Enter');
  await note.pressSequentially('/');
  await note.press('Escape');
  await expect(note).toBeFocused();
  await expect(page.getByRole('listbox')).toBeHidden();
  await note.pressSequentially('ordinary/path');
  await expect(page.getByRole('listbox')).toBeHidden();
  await expect(note.locator('.note-line').last()).toHaveText('/ordinary/path');
  await note.press('Enter');
  await note.dispatchEvent('compositionstart');
  await note.dispatchEvent('keydown', { key: 'Tab', isComposing: true });
  await note.dispatchEvent('keydown', { key: 'Enter', isComposing: true });
  await note.dispatchEvent('compositionend');
  await expect
    .poll(() =>
      note.evaluate(
        (node) =>
          (node as HTMLElement & { editor: Editor }).editor.view.composing,
      ),
    )
    .toBe(false);
  await expect(note.locator('.note-line')).toHaveCount(6);
  await note.pressSequentially('/bul');
  await expect(
    page.getByRole('listbox', { name: 'Note list style' }).getByRole('option'),
  ).toHaveCount(1);
  await note.press('Enter');
  await note.pressSequentially('Filtered bullet');
  await expect(note.locator('.note-line').last()).toHaveAttribute(
    'data-kind',
    'bullet',
  );
  await note.press('Escape');
  await expect(page.getByRole('status')).toHaveText('Saved on this device');
  await page.reload();
  await expect(note.locator('.note-line').nth(2)).toHaveAttribute(
    'data-marker',
    '2.',
  );
});

test('note list editing keeps word formatting and native undo, and leaves timed tasks alone', async ({
  page,
}) => {
  await ready(page);
  const note = await noteOn(page);
  await slash(note, page, 'To-do checkbox');
  await note.press('ControlOrMeta+B');
  await note.pressSequentially('Bold task');
  await note.press('ControlOrMeta+B');
  await note.press('Enter');
  await note.pressSequentially('Child');
  await note.press('Tab');
  await note.press('ControlOrMeta+Z');
  await note.press('ControlOrMeta+Shift+Z');
  await expect(note.locator('strong')).toHaveText('Bold task');
  await expect(note.locator('.note-line').nth(1)).toHaveCSS(
    'padding-left',
    /[1-9]/,
  );
  await note.press('Backspace');
  await note.press('Escape');
  const row = page
    .getByRole('region', { name: 'Tuesday, October 6', exact: true })
    .getByRole('textbox', { name: 'Timed writing 12:00', exact: true });
  await row.fill('Timed / still plain');
  await row.press('Enter');
  await expect(
    page.getByRole('checkbox', { name: /Complete timed task 12:00/ }),
  ).toBeVisible();
  await expect(row.locator('.note-line')).toHaveCount(0);
  await expect(page.getByRole('listbox')).toBeHidden();
});

test('focused note editing preserves the first line when a multiline draft replaces existing writing', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await ready(page);
  const note = await noteOn(page);
  await note.fill('Beginning');
  await page.getByRole('button', { name: 'Edit writing', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'A little more room' });
  const focused = dialog.getByRole('textbox', { name: 'Your writing' });
  const text =
    'A readable phone draft\n' +
    'All of this writing stays intact. '.repeat(20);
  await focused.fill(text);
  await focused.press('Escape');
  await expect(note.locator('.note-line').first()).toContainText(
    'A readable phone draft',
  );
  await page.reload();
  await expect(note.locator('.note-line').first()).toHaveText(
    'A readable phone draft',
  );
});

test('checkbox keyboard undo, bounded indentation and failed list saves retain the latest recoverable draft', async ({
  page,
}) => {
  await ready(page);
  const note = await noteOn(page);
  await slash(note, page, 'To-do checkbox');
  await note.pressSequentially('Keep this task');
  const checkbox = note.getByRole('checkbox', {
    name: 'Complete note to-do: Keep this task',
    exact: true,
  });
  await checkbox.focus();
  await checkbox.press('Space');
  await expect(checkbox).toBeChecked();
  await end(note);
  await note.press('ControlOrMeta+Z');
  await expect(checkbox).not.toBeChecked();
  await note.press('ControlOrMeta+Shift+Z');
  await expect(checkbox).toBeChecked();
  await note.press('Enter');
  await note.pressSequentially('Child survives');
  for (let index = 0; index < 8; index++) await note.press('Tab');
  await expect(note.locator('.note-line').last()).toHaveAttribute(
    'style',
    '--note-indent: 6;',
  );
  await end(note);
  await note.evaluate((node) => {
    const editor = (node as HTMLElement & { editor: Editor }).editor;
    editor.commands.setTextSelection(editor.state.selection.$from.start());
  });
  await note.press('Backspace');
  await expect(note.locator('.note-line').last()).toHaveAttribute(
    'style',
    '--note-indent: 5;',
  );
  await note.press('Escape');
  await expect(page.getByRole('status')).toHaveText('Saved on this device');
  await page.evaluate(() => {
    const put = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (
      ...args: Parameters<IDBObjectStore['put']>
    ) {
      if (this.name === 'entries')
        throw new DOMException('Synthetic failure', 'QuotaExceededError');
      return put.apply(this, args);
    };
  });
  const child = note.getByRole('checkbox', {
    name: 'Complete note to-do: Child survives',
    exact: true,
  });
  await child.check();
  await expect(page.getByRole('status')).toHaveText('Storage problem');
  await expect(child).toBeChecked();
  await page.reload();
  await expect(page.getByRole('status')).toHaveText('Saved on this device');
  await expect(child).toBeChecked();
  await expect(note.locator('.note-line').last()).toHaveAttribute(
    'style',
    '--note-indent: 5;',
  );
});

test('the slash menu works inside the focused phone editor and Escape dismisses it before the dialog', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await ready(page);
  const note = await noteOn(page);
  await page.getByRole('button', { name: 'Edit writing', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'A little more room' });
  const focused = dialog.getByRole('textbox', { name: 'Your writing' });
  await focused.pressSequentially('/');
  await expect(
    dialog.getByRole('listbox', { name: 'Note list style' }),
  ).toBeVisible();
  await focused.press('Escape');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('listbox')).toBeHidden();
  await focused.press('Backspace');
  await slash(focused, page, 'To-do checkbox');
  await focused.pressSequentially('A focused to-do');
  await focused.press('Enter');
  await slash(focused, page, 'Bullet list');
  await focused.pressSequentially('A focused bullet');
  await focused.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(
    note.getByRole('checkbox', {
      name: 'Complete note to-do: A focused to-do',
      exact: true,
    }),
  ).not.toBeChecked();
  await expect(note.locator('.note-line').last()).toHaveAttribute(
    'data-kind',
    'bullet',
  );
});
