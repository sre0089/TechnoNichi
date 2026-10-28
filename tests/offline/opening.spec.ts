import { expect, test, type Page } from '@playwright/test';
import { readFile, writeFile } from 'node:fs/promises';

const status = (page: Page) =>
  page.getByRole('complementary', { name: 'Offline opening' });
const task = (page: Page) =>
  page.getByRole('textbox', { name: 'Task 1 on 2026-10-06', exact: true });
async function ready(page: Page) {
  await page.goto('/');
  await expect(page.getByRole('status')).toHaveText('Saved on this device');
  await expect(status(page)).toContainText('Available offline');
  await expect
    .poll(() => page.evaluate(() => !!navigator.serviceWorker.controller))
    .toBe(true);
}
test('cached production opening preserves edits and navigation offline without caching writing', async ({
  page,
  context,
}) => {
  await ready(page);
  await task(page).fill('Synthetic offline words');
  await task(page).press('Control+b');
  await task(page).pressSequentially(' marked');
  await task(page).press('Escape');
  await expect(page.getByRole('status')).toHaveText('Saved on this device');
  await context.setOffline(true);
  await page.reload();
  await expect(task(page)).toHaveText('Synthetic offline words marked');
  await expect(task(page).locator('strong')).toContainText('marked');
  await expect(status(page)).toContainText(
    'Offline — writing saves on this device',
  );
  await task(page).fill('Edited while offline');
  await task(page).press('Escape');
  await page.getByRole('button', { name: 'Search book', exact: true }).click();
  const search = page.getByRole('dialog', { name: 'Search your book' });
  await search
    .getByRole('searchbox', { name: 'Search writing' })
    .fill('Edited while offline');
  await search
    .getByRole('list', { name: 'Search results' })
    .getByRole('button')
    .click();
  await expect(task(page)).toBeFocused();
  await task(page).press('Escape');
  await page.getByRole('button', { name: 'Next spread', exact: true }).click();
  await page
    .getByRole('button', { name: 'Previous spread', exact: true })
    .click();
  await expect(task(page)).toHaveText('Edited while offline');
  await page.reload();
  await expect(task(page)).toHaveText('Edited while offline');
  const urls = await page.evaluate(async () => {
    const result: string[] = [];
    for (const name of await caches.keys()) {
      if (name.startsWith('technonichi-shell-'))
        for (const request of await (await caches.open(name)).keys())
          result.push(new URL(request.url).pathname);
    }
    return result;
  });
  expect(urls.length).toBeGreaterThan(1);
  expect(
    urls.every((url) => url === '/' || url.startsWith('/_next/static/')),
  ).toBe(true);
  await context.setOffline(false);
});
test('an update waits for saving, refuses other tabs and preserves the database through activation', async ({
  page,
  context,
}) => {
  await ready(page);
  await task(page).fill('Original before update');
  await task(page).press('Escape');
  await expect(page.getByRole('status')).toHaveText('Saved on this device');
  const original = await readFile('public/sw.js', 'utf8');
  const version = `test-${test.info().project.name}-${Date.now()}`;
  try {
    await writeFile(
      'public/sw.js',
      original.replace(
        /const CACHE = PREFIX \+ '[^']+';/,
        `const CACHE = PREFIX + '${version}';`,
      ),
    );
    await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.getRegistration();
      await registration!.update();
    });
    const update = status(page).getByRole('button', {
      name: 'Save and update',
      exact: true,
    });
    await expect(update).toBeVisible();
    await expect(task(page)).toHaveText('Original before update');
    const other = await context.newPage();
    await ready(other);
    await update.click();
    await expect(status(page).getByRole('alert')).toContainText(
      'Close other planner tabs',
    );
    await expect(update).toBeFocused();
    await other.close();
    await page.evaluate(() => {
      const put = IDBObjectStore.prototype.put;
      Object.assign(window, {
        restoreOfflineStorage: () => {
          IDBObjectStore.prototype.put = put;
        },
      });
      IDBObjectStore.prototype.put = function (
        ...args: Parameters<IDBObjectStore['put']>
      ) {
        if (this.name === 'entries')
          throw new DOMException('Synthetic quota', 'QuotaExceededError');
        return put.apply(this, args);
      };
    });
    await task(page).fill('Retained update draft');
    await task(page).press('Escape');
    await expect(page.getByRole('status')).toHaveText('Storage problem');
    await expect(task(page)).toHaveText('Retained update draft');
    await update.click();
    await expect(status(page).getByRole('alert')).toContainText(
      'could not save',
    );
    await expect(update).toBeFocused();
    await expect(task(page)).toHaveText('Retained update draft');
    await page.evaluate(() =>
      (
        window as typeof window & { restoreOfflineStorage: () => void }
      ).restoreOfflineStorage(),
    );
    await Promise.all([page.waitForEvent('load'), update.click()]);
    await expect(task(page)).toHaveText('Retained update draft');
    await expect(status(page)).toContainText('Available offline');
    await expect(
      status(page).getByRole('button', {
        name: 'Save and update',
        exact: true,
      }),
    ).toHaveCount(0);
    await expect
      .poll(() => page.evaluate(() => caches.keys()))
      .toContain(`technonichi-shell-${version}`);
    await context.setOffline(true);
    await page.reload();
    await expect(task(page)).toHaveText('Retained update draft');
    await context.setOffline(false);
  } finally {
    await writeFile('public/sw.js', original);
  }
});

test('missing shell files repair online and storage protection does not promise a backup', async ({
  page,
  context,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator.storage, 'persisted', {
      configurable: true,
      value: async () => false,
    });
    Object.defineProperty(navigator.storage, 'persist', {
      configurable: true,
      value: async () => false,
    });
  });
  await ready(page);
  await task(page).fill('Synthetic repair words');
  await task(page).press('Escape');
  await expect(page.getByRole('status')).toHaveText('Saved on this device');
  await status(page)
    .getByRole('button', { name: 'Protect local storage', exact: true })
    .click();
  await expect(status(page)).toContainText('did not grant storage protection');
  await page.evaluate(async () => {
    for (const key of await caches.keys())
      if (key.startsWith('technonichi-shell-')) await caches.delete(key);
  });
  await page.reload();
  await expect(status(page)).toContainText('Available offline');
  await context.setOffline(true);
  await page.reload();
  await expect(task(page)).toHaveText('Synthetic repair words');
  await context.setOffline(false);
});
