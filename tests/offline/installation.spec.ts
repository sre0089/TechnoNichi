import { expect, test, type Page } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  // These journeys test the event protocol, not the operating system's chooser.
  await page.addInitScript(() =>
    window.addEventListener('beforeinstallprompt', (event) => {
      if (event.isTrusted) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    }),
  );
});
async function ready(page: Page) {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'Create your book' }),
  ).toBeVisible();
  await page
    .getByLabel('Book name', { exact: true })
    .fill('Synthetic install book');
  await page.getByLabel('Year', { exact: true }).fill('2028');
  await page.getByLabel('Open book to', { exact: true }).selectOption('resume');
  await page.getByRole('button', { name: 'Create book', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('Saved on this device');
  await expect(
    page.getByRole('complementary', { name: 'Offline opening' }),
  ).toContainText('Available offline');
  await expect
    .poll(() => page.evaluate(() => !!navigator.serviceWorker.controller))
    .toBe(true);
}
async function offer(
  page: Page,
  outcome: 'accepted' | 'dismissed' | 'error',
  legacy = false,
) {
  await page.evaluate(
    ({ outcome, legacy }) => {
      const state = window as typeof window & { installCalls?: number };
      state.installCalls = 0;
      const event = new Event('beforeinstallprompt', { cancelable: true });
      const choice = {
        outcome: outcome === 'accepted' ? 'accepted' : 'dismissed',
      };
      Object.assign(event, {
        prompt: async () => {
          state.installCalls! += 1;
          if (outcome === 'error')
            throw new DOMException(
              'Synthetic chooser error',
              'NotAllowedError',
            );
          return legacy ? undefined : choice;
        },
        userChoice: Promise.resolve(choice),
      });
      window.dispatchEvent(event);
    },
    { outcome, legacy },
  );
}
async function calls(page: Page) {
  return page.evaluate(
    () => (window as typeof window & { installCalls: number }).installCalls,
  );
}
async function openGuide(page: Page) {
  await page.getByRole('button', { name: 'App setup', exact: true }).click();
  const guide = page.getByRole('dialog', { name: 'Keep your book close' });
  await expect(guide).toBeVisible();
  return guide;
}

test('manifest and opaque app icons are valid, same-origin and available offline with the book', async ({
  page,
  context,
  browserName,
}) => {
  await ready(page);
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute(
    'href',
    '/manifest.webmanifest',
  );
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute(
    'href',
    '/icons/apple-touch-icon.png',
  );
  const manifest = await page.evaluate(async () =>
    (await fetch('/manifest.webmanifest')).json(),
  );
  expect(manifest).toMatchObject({
    id: '/',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    name: 'Daily Book',
  });
  expect(JSON.stringify(manifest)).not.toContain('Synthetic install book');
  expect(manifest.icons).toContainEqual(
    expect.objectContaining({ sizes: '192x192', purpose: 'any' }),
  );
  expect(manifest.icons).toContainEqual(
    expect.objectContaining({ sizes: '512x512', purpose: 'maskable' }),
  );
  if (browserName === 'chromium') {
    const cdp = await context.newCDPSession(page);
    const eligibility = await cdp.send('Page.getInstallabilityErrors');
    expect(eligibility.installabilityErrors).toEqual([]);
    await cdp.detach();
  }
  for (const [url, size] of [
    ['/icons/book-192.png', 192],
    ['/icons/book-512.png', 512],
    ['/icons/book-maskable-512.png', 512],
    ['/icons/apple-touch-icon.png', 180],
    ['/icons/book-32.png', 32],
  ] as const) {
    const actual = await page.evaluate(async (url) => {
      const image = new Image();
      image.src = url;
      await image.decode();
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext('2d')!;
      context.drawImage(image, 0, 0);
      return {
        width: image.naturalWidth,
        height: image.naturalHeight,
        alpha: context.getImageData(0, 0, 1, 1).data[3],
      };
    }, url);
    expect(actual).toEqual({ width: size, height: size, alpha: 255 });
  }
  const task = page.getByRole('textbox', {
    name: 'Task 1 on 2028-01-01',
    exact: true,
  });
  await task.fill('Synthetic installed writing');
  await task.press('Escape');
  await expect(page.getByRole('status')).toHaveText('Saved on this device');
  await context.setOffline(true);
  await page.reload();
  await expect(task).toHaveText('Synthetic installed writing');
  const metadata = await page.evaluate(async () => {
    const manifestResponse = await fetch('/manifest.webmanifest');
    const iconResponse = await fetch('/icons/book-512.png');
    return {
      type: manifestResponse.headers.get('content-type'),
      manifest: await manifestResponse.json(),
      icon: iconResponse.ok,
    };
  });
  expect(metadata.type).toContain('application/manifest+json');
  expect(metadata.manifest).toEqual(manifest);
  expect(metadata.icon).toBe(true);
  await expect(
    page.getByRole('complementary', { name: 'Offline opening' }),
  ).toContainText('Offline — writing saves on this device');
  await context.setOffline(false);
});

test('first-use guidance fits a phone, explains separate stores and restores trigger focus', async ({
  page,
  browserName,
}) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto('/');
  const trigger = page.getByRole('button', { name: 'App setup', exact: true });
  await trigger.focus();
  await page.keyboard.press('Enter');
  const guide = page.getByRole('dialog', { name: 'Keep your book close' });
  await expect(guide).toContainText('separate storage from browser tabs');
  await expect(guide).toContainText('Download your book first');
  await expect(guide).toContainText(
    'Installation and offline readiness are separate',
  );
  await expect(
    guide.getByRole('button', { name: 'Install Daily Book', exact: true }),
  ).toHaveCount(0);
  await guide.getByText('iPhone or iPad', { exact: true }).click();
  await expect(guide).toContainText('Add to Home Screen');
  const bounds = await guide.boundingBox();
  expect(bounds!.x).toBeGreaterThanOrEqual(15);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(305);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(320);
  if (browserName === 'chromium')
    await page.screenshot({ path: 'artifacts/install-guide-phone.png' });
  await page.keyboard.press('Escape');
  await expect(guide).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test('native offers are one-use, can be dismissed and re-offered, and acceptance is not a false installed claim', async ({
  page,
}) => {
  await ready(page);
  await offer(page, 'dismissed');
  const guide = await openGuide(page);
  await guide
    .getByRole('button', { name: 'Install Daily Book', exact: true })
    .click();
  await expect(guide.getByRole('status')).toContainText(
    'keep using your book here',
  );
  expect(await calls(page)).toBe(1);
  await expect(
    guide.getByRole('button', { name: 'Install Daily Book', exact: true }),
  ).toHaveCount(0);
  await offer(page, 'accepted', true);
  await guide
    .getByRole('button', { name: 'Install Daily Book', exact: true })
    .click();
  await expect(guide.getByRole('status')).toContainText(
    'Installation requested',
  );
  expect(await calls(page)).toBe(1);
  await expect(guide).not.toContainText('was installed');
  await page.evaluate(() => window.dispatchEvent(new Event('appinstalled')));
  await expect(guide.getByRole('status')).toContainText('was installed');
  await expect(
    guide.getByRole('button', { name: 'Install Daily Book', exact: true }),
  ).toHaveCount(0);
});

test('a refused chooser consumes only that offer and a new offer can retry', async ({
  page,
}) => {
  await ready(page);
  await offer(page, 'error');
  const guide = await openGuide(page);
  await guide
    .getByRole('button', { name: 'Install Daily Book', exact: true })
    .click();
  await expect(guide.getByRole('alert')).toContainText(
    'Use its installation menu',
  );
  expect(await calls(page)).toBe(1);
  await offer(page, 'dismissed');
  await guide
    .getByRole('button', { name: 'Install Daily Book', exact: true })
    .click();
  await expect(guide.getByRole('status')).toContainText(
    'keep using your book here',
  );
  expect(await calls(page)).toBe(1);
});

test('failed draft saving prevents the native prompt, preserves the offer and retries without losing writing', async ({
  page,
}) => {
  await ready(page);
  await offer(page, 'dismissed');
  await page.evaluate(() => {
    const put = IDBObjectStore.prototype.put;
    Object.assign(window, {
      restoreInstallWrites: () => {
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
  const task = page.getByRole('textbox', {
    name: 'Task 1 on 2028-01-01',
    exact: true,
  });
  await task.fill('Retained through installation');
  await task.press('Escape');
  await expect(page.getByRole('status')).toHaveText('Storage problem');
  const guide = await openGuide(page);
  await guide
    .getByRole('button', { name: 'Install Daily Book', exact: true })
    .click();
  await expect(guide.getByRole('alert')).toContainText(
    'latest writing could not save',
  );
  expect(await calls(page)).toBe(0);
  expect(
    await page.evaluate(() =>
      sessionStorage.getItem('daily-book:tab-draft-v1'),
    ),
  ).toContain('Retained through installation');
  await page.evaluate(() =>
    (
      window as typeof window & { restoreInstallWrites: () => void }
    ).restoreInstallWrites(),
  );
  await guide
    .getByRole('button', { name: 'Install Daily Book', exact: true })
    .click();
  await expect(guide.getByRole('status')).toContainText(
    'keep using your book here',
  );
  expect(await calls(page)).toBe(1);
  await page.keyboard.press('Escape');
  await page.reload();
  await expect(task).toHaveText('Retained through installation');
});

for (const signal of ['standalone-media', 'apple-standalone'] as const) {
  test(`app mode via ${signal} offers recovery before creation, works from the cover and reopens offline`, async ({
    page,
    context,
    browserName,
  }) => {
    await page.addInitScript((signal) => {
      if (signal === 'apple-standalone') {
        Object.defineProperty(navigator, 'standalone', {
          configurable: true,
          value: true,
        });
      } else {
        const original = window.matchMedia.bind(window);
        window.matchMedia = (query) => {
          const media = original(query);
          if (query === '(display-mode: standalone)')
            Object.defineProperty(media, 'matches', { get: () => true });
          return media;
        };
      }
    }, signal);
    await page.goto('/');
    await expect(
      page.getByText('If your browser book isn’t here', { exact: false }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'App info', exact: true }).click();
    const guide = page.getByRole('dialog', { name: 'Keep your book close' });
    await expect(guide).toContainText('in app mode');
    await expect(
      guide.getByRole('button', { name: 'Install Daily Book', exact: true }),
    ).toHaveCount(0);
    await page.keyboard.press('Escape');
    await ready(page);
    await page.getByRole('button', { name: 'Close book', exact: true }).click();
    await page.getByRole('button', { name: 'App info', exact: true }).click();
    await expect(
      page.getByRole('dialog', { name: 'Keep your book close' }),
    ).toContainText('in app mode');
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Open book', exact: true }).click();
    const task = page.getByRole('textbox', {
      name: 'Task 1 on 2028-01-01',
      exact: true,
    });
    await task.fill('Standalone synthetic writing');
    await task.press('Escape');
    await expect(page.getByRole('status')).toHaveText('Saved on this device');
    if (browserName === 'chromium' && signal === 'standalone-media')
      await page.screenshot({
        path: 'artifacts/install-app-mode.png',
        fullPage: true,
      });
    await context.setOffline(true);
    await page.reload();
    await expect(task).toHaveText('Standalone synthetic writing');
    await expect(
      page.getByRole('button', { name: 'App info', exact: true }),
    ).toBeVisible();
    await context.setOffline(false);
  });
}
