import { cpus, platform, arch } from 'node:os';
import { mkdir, writeFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import type { PageRecord } from '../../src/domain/model';
test('a synthetic full year keeps live editors bounded and search results paginated', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByRole('status')).toHaveText('Saved on this device');
  await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('daily-book-v1');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    try {
      const pages = await new Promise<PageRecord[]>((resolve, reject) => {
        const request = db.transaction('pages').objectStore('pages').getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction('entries', 'readwrite');
        const store = transaction.objectStore('entries');
        for (const page of pages)
          for (let slot = 0; slot < 5; slot++)
            store.put({
              id: `synthetic-scale-${page.id}-${slot}`,
              pageId: page.id,
              type: 'task',
              slot,
              text: `Performance synthetic ${page.date} task ${slot}`,
              completed: false,
              revision: 1,
              deletedAt: null,
              style: { ink: 'purple', emphasis: false },
            });
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      });
    } finally {
      db.close();
    }
  });
  const opening = Date.now();
  await page.reload();
  await expect(page.getByRole('status')).toHaveText('Saved on this device');
  const openMs = Date.now() - opening;
  const liveEditors = await page.locator('[contenteditable="true"]').count();
  expect(liveEditors).toBeLessThan(80);
  const searching = Date.now();
  await page.getByRole('button', { name: 'Search book', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Search your book' });
  await dialog
    .getByRole('searchbox', { name: 'Search writing' })
    .fill('Performance synthetic');
  await expect(dialog.getByText('1825 results', { exact: true })).toBeVisible();
  await expect(
    dialog.getByRole('list', { name: 'Search results' }).getByRole('button'),
  ).toHaveCount(20);
  const searchMs = Date.now() - searching;
  await dialog
    .getByRole('button', { name: 'Next search results', exact: true })
    .click();
  await expect(
    dialog
      .getByRole('list', { name: 'Search results' })
      .getByRole('button')
      .first(),
  ).toContainText('2026-01-05');
  const measurement = JSON.stringify({
    browser: test.info().project.name,
    platform: platform(),
    arch: arch(),
    cpu: cpus()[0]?.model,
    entries: 1825,
    liveEditors,
    openMs,
    searchMs,
  });
  await mkdir('artifacts', { recursive: true });
  await writeFile(
    `artifacts/year-metrics-${test.info().project.name}.json`,
    measurement,
  );
  await test.info().attach('synthetic-year-measurement', {
    body: measurement,
    contentType: 'application/json',
  });
  if (test.info().project.name === 'chromium')
    await page.screenshot({
      path: 'artifacts/local-search.png',
      fullPage: true,
    });
});
