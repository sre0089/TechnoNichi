import {
  expect,
  test,
  type Page,
  type BrowserContext,
  type Locator,
} from '@playwright/test';

const day = (page: Page) =>
  page.getByRole('region', {
    name: 'Tuesday, October 6',
    exact: true,
    includeHidden: true,
  });
const task = (page: Page, slot = 1) =>
  day(page).getByRole('textbox', {
    name: `Task ${slot} on 2026-10-06`,
    exact: true,
    includeHidden: true,
  });
const saved = (page: Page) =>
  expect(page.getByRole('status')).toHaveText('Saved on this device');
async function ready(page: Page) {
  await page.goto('/');
  await saved(page);
}
async function durableWriting(page: Page, writing: Locator, text: string) {
  const id = await writing.getAttribute('id');
  await expect
    .poll(() =>
      page.evaluate(async (id) => {
        const db = await new Promise<IDBDatabase>((resolve, reject) => {
          const request = indexedDB.open('daily-book-v1');
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
        try {
          return await new Promise<string | undefined>((resolve, reject) => {
            const request = db
              .transaction('entries')
              .objectStore('entries')
              .get(id!);
            request.onsuccess = () => resolve(request.result?.text);
            request.onerror = () => reject(request.error);
          });
        } finally {
          db.close();
        }
      }, id),
    )
    .toBe(text);
}
async function review(page: Page) {
  await page.getByRole('button', { name: 'Tab changes', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Review tab changes' });
  await expect(dialog.getByText('Reading or saving tab changes…')).toHaveCount(
    0,
  );
  return dialog;
}
async function close(page: Page) {
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Close dialog', exact: true })
    .click();
}
async function pair(page: Page, context: BrowserContext) {
  await ready(page);
  const other = await context.newPage();
  await ready(other);
  await task(page).fill('Saved writing');
  await saved(page);
  await task(other).fill('Local draft');
  await expect(other.getByRole('status')).toHaveText('Storage problem');
  return other;
}
async function history(page: Page) {
  await page
    .getByRole('button', { name: 'Deleted entries', exact: true })
    .click();
  const dialog = page.getByRole('dialog', {
    name: 'Deleted entries',
    exact: true,
  });
  await expect(dialog.getByText('Working on deleted entries…')).toHaveCount(0);
  return dialog;
}

test('notices committed changes without replacing focused writing, and loads explicitly while preserving this page', async ({
  page,
  context,
}) => {
  await ready(page);
  const other = await context.newPage();
  await ready(other);
  await task(other, 2).click();
  await task(page).fill('From the first tab');
  await saved(page);
  await expect(
    other.getByLabel('Other tab changes', { exact: true }),
  ).toBeVisible();
  await expect(task(other)).toHaveText('');
  await expect(task(other, 2)).toBeFocused();
  const dialog = await review(other);
  await dialog.getByRole('button', { name: 'Load saved changes' }).click();
  await expect(
    dialog.getByText('Latest saved changes loaded.', { exact: true }),
  ).toBeVisible();
  await close(other);
  await expect(task(other)).toHaveText('From the first tab');
  await expect(day(other)).toBeVisible();
  await task(other, 2).fill('Independent task');
  await saved(other);
  await durableWriting(other, task(other, 2), 'Independent task');
  await expect(task(page)).toHaveText('From the first tab');
  const latest = await review(page);
  await latest.getByRole('button', { name: 'Load saved changes' }).click();
  await expect(
    latest.getByText('Latest saved changes loaded.', { exact: true }),
  ).toBeVisible();
  await close(page);
  await expect(task(page, 2)).toHaveText('Independent task');
});

test('failed saves do not announce changes, while retry announces only to the other tab', async ({
  page,
  context,
}) => {
  await ready(page);
  const other = await context.newPage();
  await ready(other);
  await page.evaluate(() => {
    const put = IDBObjectStore.prototype.put;
    // Focusing an empty field and entering text can produce separate writes.
    // Keep storage unavailable for both until this test explicitly permits Retry.
    window.addEventListener(
      'test:allow-entry-writes',
      () => {
        IDBObjectStore.prototype.put = put;
      },
      { once: true },
    );
    IDBObjectStore.prototype.put = function (
      ...args: Parameters<IDBObjectStore['put']>
    ) {
      if (this.name === 'entries') {
        Reflect.set(
          window,
          Symbol.for('test:blocked-entry-text'),
          args[0].text,
        );
        throw new DOMException('Synthetic quota failure', 'QuotaExceededError');
      }
      return put.apply(this, args);
    };
  });
  await task(page).click();
  await expect(page.getByRole('status')).toHaveText('Storage problem');
  await task(page).fill('Writing waiting to save');
  await expect
    .poll(() =>
      page.evaluate(() =>
        Reflect.get(window, Symbol.for('test:blocked-entry-text')),
      ),
    )
    .toBe('Writing waiting to save');
  await expect(page.getByRole('status')).toHaveText('Storage problem');
  await expect(
    other.getByLabel('Other tab changes', { exact: true }),
  ).toHaveCount(0);
  expect(
    await page.evaluate(() =>
      localStorage.getItem('daily-book:committed-change-v1'),
    ),
  ).toBeNull();
  expect(
    await page.evaluate(() =>
      sessionStorage.getItem('daily-book:tab-draft-v1'),
    ),
  ).toContain('Writing waiting to save');
  await page.evaluate(() =>
    window.dispatchEvent(new Event('test:allow-entry-writes')),
  );
  await page.getByRole('button', { name: 'Retry saving', exact: true }).click();
  await saved(page);
  await durableWriting(page, task(page), 'Writing waiting to save');
  await expect(
    other.getByLabel('Other tab changes', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByLabel('Other tab changes', { exact: true }),
  ).toHaveCount(0);
});

test('opening a saved book preserves a malformed tab recovery buffer for manual recovery', async ({
  page,
}) => {
  await ready(page);
  await page.evaluate(() =>
    sessionStorage.setItem(
      'daily-book:tab-draft-v1',
      'Malformed recovery fixture',
    ),
  );
  await page.reload();
  await saved(page);
  await expect(day(page)).toBeVisible();
  expect(
    await page.evaluate(() =>
      sessionStorage.getItem('daily-book:tab-draft-v1'),
    ),
  ).toBe('Malformed recovery fixture');
});

for (const choice of [
  'Keep my writing',
  'Use saved writing',
  'Keep both',
] as const) {
  test(`${choice} resolves a stale checklist draft with recoverable copies and survives reload`, async ({
    page,
    context,
  }) => {
    const other = await pair(page, context);
    const dialog = await review(other);
    await expect(
      dialog.getByRole('region', {
        name: 'Your writing in this tab',
        exact: true,
      }),
    ).toContainText('Local draft');
    await expect(
      dialog.getByRole('region', { name: 'Saved writing', exact: true }),
    ).toContainText('Saved writing');
    if (choice === 'Keep both' && test.info().project.name === 'chromium')
      await other.screenshot({
        path: 'artifacts/tab-conflict-desktop.png',
        fullPage: true,
      });
    await dialog.getByRole('button', { name: choice, exact: true }).click();
    await expect(
      dialog.getByText('Reading or saving tab changes…'),
    ).toHaveCount(0);
    await expect(
      dialog.getByRole('region', { name: /^Conflict / }),
    ).toHaveCount(0);
    await close(other);
    await saved(other);
    const expected =
      choice === 'Keep my writing' ? 'Local draft' : 'Saved writing';
    await expect(task(other)).toHaveText(expected);
    await other.reload();
    await saved(other);
    await expect(task(other)).toHaveText(expected);
    const copies = await history(other);
    if (choice === 'Use saved writing')
      await expect(copies.getByText('No deleted entries.')).toBeVisible();
    else
      await expect(
        copies.getByText(
          choice === 'Keep my writing' ? 'Saved writing' : 'Local draft',
          { exact: true },
        ),
      ).toBeVisible();
    await close(other);
    await page.reload();
    await saved(page);
    await expect(task(page)).toHaveText(expected);
  });
}

test('a changed-again saved version refuses the stale decision and refreshes without losing the draft', async ({
  page,
  context,
}) => {
  const other = await pair(page, context);
  const dialog = await review(other);
  await task(page).fill('Changed during review');
  await saved(page);
  await dialog
    .getByRole('button', { name: 'Keep my writing', exact: true })
    .click();
  await expect(dialog.getByRole('alert')).toContainText('Another tab changed');
  await expect(
    dialog.getByRole('region', {
      name: 'Your writing in this tab',
      exact: true,
    }),
  ).toContainText('Local draft');
  await dialog.getByRole('button', { name: 'Refresh review' }).click();
  await expect(
    dialog.getByRole('region', { name: 'Saved writing', exact: true }),
  ).toContainText('Changed during review');
  await dialog.getByRole('button', { name: 'Keep both', exact: true }).click();
  await expect(
    dialog.getByText(
      'Both versions are retained. Your draft is in Deleted entries.',
      { exact: true },
    ),
  ).toBeVisible();
  await close(other);
  await expect(task(other)).toHaveText('Changed during review');
});

test('edit versus deletion protects replacement writing and can retain the edited draft', async ({
  page,
  context,
}) => {
  await ready(page);
  await task(page).fill('Original');
  await saved(page);
  const other = await context.newPage();
  await ready(other);
  await task(page).click();
  await page.getByRole('button', { name: 'Delete entry', exact: true }).click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Delete entry', exact: true })
    .click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await task(page).fill('Replacement task');
  await saved(page);
  await durableWriting(page, task(page), 'Replacement task');
  await task(other).fill('Edit from before deletion');
  await expect(other.getByRole('status')).toHaveText('Storage problem');
  const dialog = await review(other);
  await expect(
    dialog.getByRole('region', { name: 'Saved writing', exact: true }),
  ).toContainText('Deleted');
  await dialog
    .getByRole('button', { name: 'Keep my writing', exact: true })
    .click();
  await expect(dialog.getByRole('alert')).toContainText(
    'original space is occupied',
  );
  await dialog.getByRole('button', { name: 'Keep both', exact: true }).click();
  await expect(
    dialog.getByText(
      'Both versions are retained. Your draft is in Deleted entries.',
      { exact: true },
    ),
  ).toBeVisible();
  await close(other);
  await expect(task(other)).toHaveText('Replacement task');
  const copies = await history(other);
  await expect(
    copies.getByText('Edit from before deletion', { exact: true }),
  ).toBeVisible();
});

test('successful writes in one tab cannot clear another draft, which survives both tabs reloading', async ({
  page,
  context,
}) => {
  const other = await pair(page, context);
  await task(page, 2).fill('A different successful save');
  await saved(page);
  await page.reload();
  await saved(page);
  await expect(task(page)).toHaveText('Saved writing');
  await other.reload();
  await expect(other.getByRole('status')).toHaveText('Storage problem');
  await expect(task(other)).toHaveText('Local draft');
  const dialog = await review(other);
  await expect(
    dialog.getByRole('region', {
      name: 'Your writing in this tab',
      exact: true,
    }),
  ).toContainText('Local draft');
  await dialog.getByRole('button', { name: 'Keep both', exact: true }).click();
  await expect(
    dialog.getByText(
      'Both versions are retained. Your draft is in Deleted entries.',
      { exact: true },
    ),
  ).toBeVisible();
});

test('a failed conflict decision retains both versions and allows retry', async ({
  page,
  context,
}) => {
  const other = await pair(page, context);
  const dialog = await review(other);
  await other.evaluate(() => {
    const add = IDBObjectStore.prototype.add;
    IDBObjectStore.prototype.add = function (
      ...args: Parameters<IDBObjectStore['add']>
    ) {
      if (this.name === 'entries') {
        IDBObjectStore.prototype.add = add;
        throw new DOMException('Synthetic quota failure', 'QuotaExceededError');
      }
      return add.apply(this, args);
    };
  });
  await dialog
    .getByRole('button', { name: 'Keep my writing', exact: true })
    .click();
  await expect(dialog.getByRole('alert')).toBeVisible();
  await expect(
    dialog.getByRole('region', {
      name: 'Your writing in this tab',
      exact: true,
    }),
  ).toContainText('Local draft');
  await expect(task(page)).toHaveText('Saved writing');
  await dialog
    .getByRole('button', { name: 'Keep my writing', exact: true })
    .click();
  await expect(
    dialog.getByText(
      'Your writing is on the page. The replaced version is in Deleted entries.',
      { exact: true },
    ),
  ).toBeVisible();
  await close(other);
  await other.reload();
  await saved(other);
  await expect(task(other)).toHaveText('Local draft');
});

test('retained drafts from a closed tab remain reviewable and can become recovery copies', async ({
  page,
  context,
}) => {
  const other = await pair(page, context);
  await other.close();
  const dialog = await review(page);
  await expect(
    dialog.getByRole('region', { name: 'Retained draft', exact: true }),
  ).toContainText('Local draft');
  await dialog.getByRole('button', { name: 'Save recovery copy' }).click();
  await expect(
    dialog.getByText(
      'Recovery copy saved in Deleted entries. Saved writing on the page was not replaced.',
      { exact: true },
    ),
  ).toBeVisible();
  await close(page);
  await expect(task(page)).toHaveText('Saved writing');
  const copies = await history(page);
  await expect(copies.getByText('Local draft', { exact: true })).toBeVisible();
});

test('storage notifications work without BroadcastChannel and focus checks work without either notification API', async ({
  page,
  context,
}) => {
  await context.addInitScript(() => {
    Object.defineProperty(window, 'BroadcastChannel', {
      value: undefined,
      configurable: true,
    });
  });
  await ready(page);
  const other = await context.newPage();
  await ready(other);
  await task(page).fill('Storage notification');
  await saved(page);
  await expect(
    other.getByLabel('Other tab changes', { exact: true }),
  ).toBeVisible();
  const dialog = await review(other);
  await dialog.getByRole('button', { name: 'Load saved changes' }).click();
  await expect(
    dialog.getByText('Latest saved changes loaded.', { exact: true }),
  ).toBeVisible();
  await close(other);
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key: string, value: string) {
      if (key === 'daily-book:committed-change-v1')
        throw new Error('Synthetic notification denial');
      return original.call(this, key, value);
    };
  });
  await task(page).fill('Missed signal');
  await saved(page);
  await other.evaluate(() => window.dispatchEvent(new Event('focus')));
  await expect(
    other.getByLabel('Other tab changes', { exact: true }),
  ).toBeVisible();
  await expect(task(other)).toHaveText('Storage notification');
  const latest = await review(other);
  await latest.getByRole('button', { name: 'Load saved changes' }).click();
  await expect(
    latest.getByText('Latest saved changes loaded.', { exact: true }),
  ).toBeVisible();
  await close(other);
  await expect(task(other)).toHaveText('Missed signal');
});

test('review works by keyboard at phone size and closing it retains an unresolved draft', async ({
  page,
  context,
}) => {
  const other = await pair(page, context);
  await other.setViewportSize({ width: 320, height: 720 });
  const trigger = other.getByRole('button', {
    name: 'Tab changes',
    exact: true,
  });
  await trigger.focus();
  await trigger.press('Enter');
  const dialog = other.getByRole('dialog', { name: 'Review tab changes' });
  await expect(
    dialog.getByRole('region', {
      name: 'Your writing in this tab',
      exact: true,
    }),
  ).toContainText('Local draft');
  await expect(dialog.getByText('Reading or saving tab changes…')).toHaveCount(
    0,
  );
  const bounds = (await dialog.boundingBox())!;
  expect(bounds.x).toBeGreaterThanOrEqual(0);
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(320);
  if (test.info().project.name === 'chromium')
    await other.screenshot({
      path: 'artifacts/tab-conflict-phone.png',
      fullPage: true,
    });
  await other.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await expect(task(other)).toHaveText('Local draft');
  await expect(other.getByRole('status')).toHaveText('Storage problem');
});
