import { readFile } from 'node:fs/promises';
import { test, expect } from '../fixtures/browser';
import type { Editor } from '@tiptap/core';
import type { PlannerBackup } from '../../src/local/backup';

test('structured notes reopen, accept new list writing and export completion and depth offline', async ({
  page,
  context,
}) => {
  await page.goto('/');
  await expect(page.getByRole('status')).toHaveText('Saved on this device');
  await expect(
    page.getByRole('complementary', { name: 'Offline opening' }),
  ).toContainText('Available offline');
  await expect
    .poll(() => page.evaluate(() => !!navigator.serviceWorker.controller))
    .toBe(true);
  const day = page.getByRole('region', {
    name: 'Tuesday, October 6',
    exact: true,
  });
  await day.getByRole('button', { name: '+ Note', exact: true }).click();
  const note = day.getByRole('textbox', { name: 'Note on 2026-10-06' });
  await note.pressSequentially('/');
  await page
    .getByRole('option', { name: 'To-do checkbox', exact: true })
    .click();
  await note.pressSequentially('Plan offline');
  await note.press('Enter');
  await note.press('Tab');
  await note.pressSequentially('Nested writing');
  const completed = note.getByRole('checkbox', {
    name: 'Complete note to-do: Plan offline',
    exact: true,
  });
  await completed.check();
  await note.press('Escape');
  await expect(page.getByRole('status')).toHaveText('Saved on this device');
  await context.setOffline(true);
  await page.reload();
  await expect(completed).toBeChecked();
  await note.evaluate((node) =>
    (node as HTMLElement & { editor: Editor }).editor.commands.focus('end'),
  );
  await note.press('Enter');
  await note.press('Shift+Tab');
  await note.pressSequentially('Added without internet');
  await note.press('Escape');
  await expect(page.getByRole('status')).toHaveText('Saved on this device');
  await page.reload();
  await expect(completed).toBeChecked();
  await expect(note).toContainText('Added without internet');
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
  ]);
  expect(saved.text).toBe(
    'Plan offline\nNested writing\nAdded without internet',
  );
  await context.setOffline(false);
});
