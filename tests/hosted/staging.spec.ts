import { readFile } from 'node:fs/promises';
import { expect, test, type Page } from '@playwright/test';
import type { PlannerBackup } from '../../src/local/backup';

async function saved(page: Page) {
  await expect(page.getByRole('status')).toHaveText('Saved on this device');
}
async function offlineReady(page: Page) {
  await expect(
    page.getByRole('complementary', { name: 'Offline opening' }),
  ).toContainText('Available offline');
  await expect
    .poll(() => page.evaluate(() => !!navigator.serviceWorker.controller))
    .toBe(true);
}

test('public HTTPS shell serves the generated worker, manifest and every precached resource', async ({
  request,
}) => {
  const worker = await request.get('/sw.js', { maxRedirects: 0 });
  expect(worker.status()).toBe(200);
  const headers = worker.headers();
  expect(headers['content-type']).toContain('javascript');
  expect(headers['cache-control']).toContain('no-cache');
  expect(headers['cache-control']).toContain('no-store');
  expect(headers['cache-control']).toContain('must-revalidate');
  expect(headers['x-content-type-options']).toBe('nosniff');
  expect(headers['content-security-policy']).toBe(
    "default-src 'self'; script-src 'self'",
  );
  const source = await worker.text();
  expect(source).not.toContain('__SHELL_VERSION__');
  const allowlist = source.match(/^const PRECACHE = (\[.*\]);$/m);
  expect(allowlist).not.toBeNull();
  const paths = JSON.parse(allowlist![1]) as string[];
  expect(paths).toContain('/');
  expect(paths).toContain('/manifest.webmanifest');
  for (const path of paths) {
    expect(
      path === '/' ||
        path.startsWith('/_next/static/') ||
        path === '/manifest.webmanifest' ||
        /^\/icons\/(?:book(?:-32|-192|-512|-maskable-512)?\.(?:png|svg)|apple-touch-icon\.png)$/.test(
          path,
        ),
    ).toBe(true);
    const response = await request.get(path, { maxRedirects: 0 });
    expect(response.status(), path).toBe(200);
    expect((await response.body()).byteLength, path).toBeGreaterThan(0);
  }
  const manifest = await (await request.get('/manifest.webmanifest')).json();
  expect(manifest).toMatchObject({
    id: '/',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    name: 'Daily Book',
  });
});

test('independent browser books save, reopen offline and restore a portable backup without touching the original', async ({
  page,
  context,
  browser,
  baseURL,
  browserName,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'Create your book' }),
  ).toBeVisible();
  await page
    .getByLabel('Book name', { exact: true })
    .fill('SYNTHETIC hosted book');
  await page.getByLabel('Year', { exact: true }).fill('2028');
  await page.getByLabel('Today timezone', { exact: true }).fill('UTC');
  await page.getByLabel('Open book to', { exact: true }).selectOption('resume');
  await page.getByRole('button', { name: 'Create book', exact: true }).click();
  await saved(page);
  await offlineReady(page);
  const day = page.getByRole('region', {
    name: 'Saturday, January 1',
    exact: true,
  });
  const writing = day.getByRole('textbox', {
    name: 'Timed writing 12:00',
    exact: true,
  });
  await writing.fill('SYNTHETIC hosted lunch');
  await writing.press('Enter');
  const completed = day.getByRole('checkbox', {
    name: 'Complete timed task 12:00 on 2028-01-01',
    exact: true,
  });
  await completed.check();
  const task = day.getByRole('textbox', {
    name: 'Task 1 on 2028-01-01',
    exact: true,
  });
  await task.fill('SYNTHETIC hosted checklist');
  await task.press('Escape');
  await saved(page);
  await page.reload();
  await expect(writing).toHaveText('SYNTHETIC hosted lunch');
  await expect(completed).toBeChecked();
  await context.setOffline(true);
  await page.reload();
  await expect(task).toHaveText('SYNTHETIC hosted checklist');
  const later = day.getByRole('textbox', {
    name: 'Timed writing 13:00',
    exact: true,
  });
  await later.fill('SYNTHETIC offline writing');
  await later.press('Enter');
  await saved(page);
  await page.reload();
  await expect(later).toHaveText('SYNTHETIC offline writing');
  await expect(completed).toBeChecked();
  await context.setOffline(false);
  await page.getByRole('button', { name: 'Backups', exact: true }).click();
  const downloading = page.waitForEvent('download');
  await page
    .getByRole('button', { name: 'Download backup', exact: true })
    .click();
  const download = await downloading;
  const backup = JSON.parse(
    await readFile((await download.path())!, 'utf8'),
  ) as PlannerBackup;
  expect(backup.pages).toHaveLength(366);
  expect(
    backup.entries.some((entry) => entry.text === 'SYNTHETIC offline writing'),
  ).toBe(true);
  const fresh = await browser.newContext({ baseURL });
  try {
    const restored = await fresh.newPage();
    restored.on('pageerror', (error) => errors.push(error.message));
    await restored.goto('/');
    await expect(
      restored.getByRole('heading', { name: 'Create your book' }),
    ).toBeVisible();
    await restored
      .getByRole('button', { name: 'Backups', exact: true })
      .click();
    await restored.getByLabel('Backup file', { exact: true }).setInputFiles({
      name: 'synthetic-hosted-backup.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(backup)),
    });
    await expect(restored.getByLabel('Backup preview')).toContainText(
      '366 daily pages',
    );
    await restored
      .getByRole('button', { name: 'Restore backup', exact: true })
      .click();
    await saved(restored);
    await offlineReady(restored);
    const restoredDay = restored.getByRole('region', {
      name: 'Saturday, January 1',
      exact: true,
    });
    await expect(
      restoredDay.getByRole('textbox', {
        name: 'Timed writing 12:00',
        exact: true,
      }),
    ).toHaveText('SYNTHETIC hosted lunch');
    await expect(
      restoredDay.getByRole('textbox', {
        name: 'Timed writing 13:00',
        exact: true,
      }),
    ).toHaveText('SYNTHETIC offline writing');
    await expect(
      restoredDay.getByRole('checkbox', {
        name: 'Complete timed task 12:00 on 2028-01-01',
        exact: true,
      }),
    ).toBeChecked();
    await fresh.setOffline(true);
    await restored.reload();
    await expect(
      restoredDay.getByRole('textbox', {
        name: 'Task 1 on 2028-01-01',
        exact: true,
      }),
    ).toHaveText('SYNTHETIC hosted checklist');
    if (browserName === 'chromium')
      await restored.screenshot({
        path: 'artifacts/netlify-staging/restored-book.png',
        fullPage: true,
      });
  } finally {
    await fresh.close();
  }
  await page.keyboard.press('Escape');
  await page.reload();
  await expect(later).toHaveText('SYNTHETIC offline writing');
  expect(errors).toEqual([]);
});
