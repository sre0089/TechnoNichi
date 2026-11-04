import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import type { Editor } from '@tiptap/core';
import type { PlannerBackup } from '../../src/local/backup';

test('hosted note lists retain old writing, leading completion and depth through offline edits and independent restoration', async ({
  page,
  context,
  browser,
  baseURL,
  browserName,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await page
    .getByLabel('Book name', { exact: true })
    .fill('SYNTHETIC hosted list book');
  await page.getByLabel('Year', { exact: true }).fill('2028');
  await page.getByLabel('Today timezone', { exact: true }).fill('UTC');
  await page.getByLabel('Open book to', { exact: true }).selectOption('resume');
  await page.getByRole('button', { name: 'Create book', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('Saved on this device');
  await expect(
    page.getByRole('complementary', { name: 'Offline opening' }),
  ).toContainText('Available offline');
  await expect
    .poll(() => page.evaluate(() => !!navigator.serviceWorker.controller))
    .toBe(true);
  const day = page.getByRole('region', {
    name: 'Saturday, January 1',
    exact: true,
  });
  await day.getByRole('button', { name: '+ Note', exact: true }).click();
  const note = day.getByRole('textbox', {
    name: 'Note on 2028-01-01',
    exact: true,
  });
  await note.fill('SYNTHETIC original plain writing');
  await note.press('Enter');
  await note.pressSequentially('/');
  await page
    .getByRole('option', { name: 'To-do checkbox', exact: true })
    .click();
  await note.pressSequentially('SYNTHETIC first task');
  await note.press('Enter');
  await note.press('Tab');
  await note.pressSequentially('SYNTHETIC nested task');
  const complete = note.getByRole('checkbox', {
    name: 'Complete note to-do: SYNTHETIC first task',
    exact: true,
  });
  await complete.check();
  await note.press('Escape');
  await expect(page.getByRole('status')).toHaveText('Saved on this device');
  await page.reload();
  await expect(complete).toBeChecked();
  await context.setOffline(true);
  await page.reload();
  await expect(note).toContainText('SYNTHETIC original plain writing');
  await expect(complete).toBeChecked();
  await note.evaluate((node) =>
    (node as HTMLElement & { editor: Editor }).editor.commands.focus('end'),
  );
  await note.press('Enter');
  await note.press('Shift+Tab');
  await note.pressSequentially('SYNTHETIC offline task');
  await note.press('Escape');
  await expect(page.getByRole('status')).toHaveText('Saved on this device');
  await page.reload();
  await expect(note).toContainText('SYNTHETIC offline task');
  await page.getByRole('button', { name: 'Backups', exact: true }).click();
  const downloading = page.waitForEvent('download');
  await page
    .getByRole('button', { name: 'Download backup', exact: true })
    .click();
  const archive = JSON.parse(
    await readFile((await (await downloading).path())!, 'utf8'),
  ) as PlannerBackup;
  expect(archive.version).toBe(3);
  const saved = archive.entries.find((entry) => entry.type === 'note')!;
  expect(saved.type === 'note' && saved.noteLines).toEqual([
    { kind: 'plain', indent: 0 },
    { kind: 'todo', indent: 0, checked: true },
    { kind: 'todo', indent: 1, checked: false },
    { kind: 'todo', indent: 0, checked: false },
  ]);
  const restoredContext = await browser.newContext();
  try {
    const restored = await restoredContext.newPage();
    restored.on('pageerror', (error) => errors.push(error.message));
    await restored.goto(baseURL!);
    await restored
      .getByRole('button', { name: 'Backups', exact: true })
      .click();
    await restored.getByLabel('Backup file', { exact: true }).setInputFiles({
      name: 'synthetic-hosted-note-lists.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(archive)),
    });
    await restored
      .getByRole('button', { name: 'Restore backup', exact: true })
      .click();
    const restoredNote = restored.getByRole('textbox', {
      name: 'Note on 2028-01-01',
      exact: true,
    });
    await expect(
      restoredNote.getByRole('checkbox', {
        name: 'Complete note to-do: SYNTHETIC first task',
        exact: true,
      }),
    ).toBeChecked();
    await expect(restoredNote).toContainText('SYNTHETIC offline task');
    await expect(
      restored.getByRole('complementary', { name: 'Offline opening' }),
    ).toContainText('Available offline');
    await restoredContext.setOffline(true);
    await restored.reload();
    await expect(restoredNote).toContainText(
      'SYNTHETIC original plain writing',
    );
    await restored.screenshot({
      path: `artifacts/note-lists-release/${new URL(baseURL!).hostname}/${browserName}-restored.png`,
      fullPage: true,
    });
  } finally {
    await restoredContext.close();
  }
  await page.getByRole('button', { name: 'Close dialog', exact: true }).click();
  await expect(complete).toBeChecked();
  expect(errors).toEqual([]);
  await context.setOffline(false);
});
