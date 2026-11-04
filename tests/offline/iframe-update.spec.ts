import { readFile, writeFile } from 'node:fs/promises';
import { expect, test } from '../fixtures/browser';

test('a srcdoc overlay permits a saved update while an embedded planner still blocks it', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByRole('status')).toHaveText('Saved on this device');
  const offline = page.getByRole('complementary', { name: 'Offline opening' });
  await expect(offline).toContainText('Available offline');
  await expect
    .poll(() => page.evaluate(() => !!navigator.serviceWorker.controller))
    .toBe(true);
  const task = page.getByRole('textbox', {
    name: 'Task 1 on 2026-10-06',
    exact: true,
  });
  await task.fill('SYNTHETIC writing before overlay update');
  await task.press('Escape');
  await expect(page.getByRole('status')).toHaveText('Saved on this device');
  await page.evaluate(() => {
    const overlay = document.createElement('iframe');
    overlay.id = 'synthetic-overlay';
    overlay.srcdoc = '<p>Synthetic provider overlay</p>';
    document.body.append(overlay);
    const editor = document.createElement('iframe');
    editor.id = 'synthetic-embedded-planner';
    editor.src = '/?synthetic-embedded-planner';
    document.body.append(editor);
  });
  await expect(
    page
      .frameLocator('#synthetic-embedded-planner')
      .getByRole('textbox', { name: 'Task 1 on 2026-10-06', exact: true }),
  ).toBeVisible();
  const original = await readFile('public/sw.js', 'utf8');
  try {
    await writeFile(
      'public/sw.js',
      original.replace(
        /const CACHE = PREFIX \+ '[^']+';/,
        `const CACHE = PREFIX + 'iframe-${test.info().project.name}-${Date.now()}';`,
      ),
    );
    await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.getRegistration();
      await registration!.update();
    });
    const update = offline.getByRole('button', {
      name: 'Save and update',
      exact: true,
    });
    await expect(update).toBeVisible();
    await update.click();
    await expect(offline.getByRole('alert')).toContainText(
      'Close other planner tabs',
    );
    await page.evaluate(() =>
      document.getElementById('synthetic-embedded-planner')!.remove(),
    );
    await Promise.all([page.waitForEvent('load'), update.click()]);
    await expect(task).toHaveText('SYNTHETIC writing before overlay update');
    await expect(page.getByRole('status')).toHaveText('Saved on this device');
    await expect(
      offline.getByRole('button', { name: 'Save and update', exact: true }),
    ).toHaveCount(0);
  } finally {
    await writeFile('public/sw.js', original);
  }
});
