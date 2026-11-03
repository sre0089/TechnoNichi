import assert from 'node:assert/strict';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { URL } from 'node:url';
import {
  chromium,
  firefox,
  webkit,
  expect as baseExpect,
} from '@playwright/test';

/* global indexedDB, navigator, IDBObjectStore, window, DOMException, sessionStorage */
// These globals run only inside Playwright's browser-evaluated callbacks.
const expect = baseExpect.configure({ timeout: 20_000 });

// This test never deploys. An operator publishes reviewed staging artifacts at
// its two file checkpoints, leaving every synthetic browser context open.
const target = process.env.HOSTED_BASE_URL;
const baselineFile = process.env.HOSTED_BASELINE_FILE;
const directory = process.env.HOSTED_LIFECYCLE_DIR;
assert(
  target && baselineFile && directory,
  'Set HOSTED_BASE_URL, HOSTED_BASELINE_FILE and a new HOSTED_LIFECYCLE_DIR.',
);
const origin = new URL(target);
assert(
  origin.protocol === 'https:' &&
    origin.pathname === '/' &&
    !origin.search &&
    !origin.hash &&
    !origin.username &&
    !origin.password,
  'Use an explicit HTTPS staging origin without credentials or a path.',
);
const baseline = JSON.parse(await readFile(baselineFile, 'utf8'));
assert.equal(baseline.origin, origin.origin);
assert(baseline.workerVersion && baseline.buildId && baseline.deploymentId);
const runDirectory = resolve(directory);
await mkdir(runDirectory); // Refuse stale checkpoints from any previous run.

const progress = (message) => process.stdout.write(`${message}\n`);
async function record(name, value) {
  const temporary = join(runDirectory, name + '.tmp');
  await writeFile(temporary, JSON.stringify(value, null, 2));
  await rename(temporary, join(runDirectory, name));
}
async function checkpoint(name) {
  const deadline = Date.now() + 15 * 60_000;
  while (Date.now() < deadline) {
    try {
      const signal = JSON.parse(
        await readFile(join(runDirectory, name), 'utf8'),
      );
      assert.equal(signal.origin, origin.origin);
      assert(signal.workerVersion && signal.buildId && signal.deploymentId);
      return signal;
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
    await delay(500);
  }
  throw new Error(`Timed out waiting for operator checkpoint ${name}`);
}
async function snapshot(page) {
  return page.evaluate(async () => {
    const opening = indexedDB.open('daily-book-v1');
    const db = await new Promise((resolve, reject) => {
      opening.onsuccess = () => resolve(opening.result);
      opening.onerror = () => reject(opening.error);
    });
    const names = ['books', 'pages', 'entries', 'preferences'];
    const tx = db.transaction(names);
    const rows = await Promise.all(
      names.map(
        (name) =>
          new Promise((resolve, reject) => {
            const request = tx.objectStore(name).getAll();
            request.onsuccess = () =>
              resolve(request.result.sort((a, b) => a.id.localeCompare(b.id)));
            request.onerror = () => reject(request.error);
          }),
      ),
    );
    db.close();
    return Object.fromEntries(names.map((name, index) => [name, rows[index]]));
  });
}
const offline = (page) =>
  page.getByRole('complementary', { name: 'Offline opening' });
const saved = (page) =>
  expect(page.getByRole('status')).toHaveText('Saved on this device');
const task = (page) =>
  page.getByRole('textbox', { name: 'Task 1 on 2028-01-01', exact: true });
const day = (page) =>
  page.getByRole('region', { name: 'Saturday, January 1', exact: true });
const timed = (page, time) =>
  day(page).getByRole('textbox', {
    name: `Timed writing ${time}`,
    exact: true,
  });
async function ready(page) {
  await saved(page);
  await expect(offline(page)).toContainText('Available offline');
  await expect
    .poll(() => page.evaluate(() => !!navigator.serviceWorker.controller))
    .toBe(true);
}
async function hasBuild(page, buildId) {
  await expect
    .poll(async () => (await page.content()).includes(buildId))
    .toBe(true);
}
async function discover(page) {
  await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) throw new Error('No worker registration');
    await registration.update();
  });
  const button = offline(page).getByRole('button', {
    name: 'Save and update',
    exact: true,
  });
  await expect(button).toBeVisible();
  return button;
}
async function activate(page, button, buildId) {
  await Promise.all([page.waitForEvent('domcontentloaded'), button.click()]);
  await ready(page);
  await hasBuild(page, buildId);
  await expect(
    offline(page).getByRole('button', { name: 'Save and update', exact: true }),
  ).toHaveCount(0);
}
async function assertBook(page, text) {
  await expect(task(page)).toHaveText(text);
  await expect(timed(page, '12:00').locator('strong')).toHaveText('SYNTHETIC');
  await expect(
    day(page).getByRole('checkbox', {
      name: 'Complete timed task 12:00 on 2028-01-01',
      exact: true,
    }),
  ).toBeChecked();
  await expect(
    day(page).getByRole('textbox', {
      name: 'Note on 2028-01-01',
      exact: true,
    }),
  ).toHaveText('SYNTHETIC note geometry survives');
}

const sessions = [];
const errors = [];
try {
  for (const [engine, browserType] of Object.entries({
    chromium,
    firefox,
    webkit,
  })) {
    const browser = await browserType.launch();
    const context = await browser.newContext({ baseURL: origin.origin });
    const page = await context.newPage();
    sessions.push({ engine, browser, context, page });
    page.on('pageerror', (error) =>
      errors.push({ engine, message: error.message }),
    );
    await page.goto('/');
    await expect(
      page.getByRole('heading', { name: 'Create your book' }),
    ).toBeVisible();
    await page
      .getByLabel('Book name', { exact: true })
      .fill(`SYNTHETIC lifecycle ${engine}`);
    await page.getByLabel('Year', { exact: true }).fill('2028');
    await page.getByLabel('Today timezone', { exact: true }).fill('UTC');
    await page
      .getByLabel('Open book to', { exact: true })
      .selectOption('resume');
    await page
      .getByRole('button', { name: 'Create book', exact: true })
      .click();
    await ready(page);
    await hasBuild(page, baseline.buildId);
    const writing = timed(page, '12:00');
    await writing.fill('SYNTHETIC retained task');
    await writing.evaluate((node) =>
      node.editor.commands.setTextSelection({ from: 1, to: 10 }),
    );
    await writing.press('ControlOrMeta+B');
    await writing.press('Enter');
    await day(page)
      .getByRole('checkbox', {
        name: 'Complete timed task 12:00 on 2028-01-01',
        exact: true,
      })
      .check();
    await day(page)
      .getByRole('button', { name: '+ Note', exact: true })
      .click();
    await day(page)
      .getByRole('textbox', { name: 'Note on 2028-01-01', exact: true })
      .fill('SYNTHETIC note geometry survives');
    await task(page).fill(`SYNTHETIC baseline ${engine}`);
    await task(page).press('Escape');
    await saved(page);
    await assertBook(page, `SYNTHETIC baseline ${engine}`);
    sessions.at(-1).before = await snapshot(page);
    await page.evaluate(() => {
      window.lifecycleMarker = 'baseline-open';
    });
  }
  await record('ready.json', {
    baseline,
    engines: sessions.map((s) => s.engine),
  });
  progress(
    'All three baseline books are open. Publish update, then write update-ready.json.',
  );
  const update = await checkpoint('update-ready.json');
  assert.notEqual(update.workerVersion, baseline.workerVersion);
  assert.notEqual(update.buildId, baseline.buildId);

  for (const session of sessions) {
    const { engine, page, context, before } = session;
    const button = await discover(page);
    const other = await context.newPage();
    await other.goto('/');
    await ready(other);
    await button.click();
    await expect(offline(page).getByRole('alert')).toContainText(
      'Close other planner tabs',
    );
    assert.equal(
      await page.evaluate(() => window.lifecycleMarker),
      'baseline-open',
    );
    await hasBuild(page, baseline.buildId);
    await other.close();
    await page.evaluate(() => {
      const put = IDBObjectStore.prototype.put;
      window.restoreLifecycleWrites = () => {
        IDBObjectStore.prototype.put = put;
      };
      IDBObjectStore.prototype.put = function (...args) {
        if (this.name === 'entries')
          throw new DOMException('Synthetic quota', 'QuotaExceededError');
        return put.apply(this, args);
      };
    });
    const latest = `SYNTHETIC retained update ${engine}`;
    await task(page).fill(latest);
    await task(page).press('Escape');
    await expect(page.getByRole('status')).toHaveText('Storage problem');
    await button.click();
    await expect(offline(page).getByRole('alert')).toContainText(
      'could not save',
    );
    assert.equal(
      await page.evaluate(() => window.lifecycleMarker),
      'baseline-open',
    );
    assert(
      (
        await page.evaluate(() =>
          sessionStorage.getItem('daily-book:tab-draft-v1'),
        )
      ).includes(latest),
    );
    await hasBuild(page, baseline.buildId);
    await page.evaluate(() => window.restoreLifecycleWrites());
    await activate(page, button, update.buildId);
    await assertBook(page, latest);
    const after = await snapshot(page);
    for (const name of ['books', 'pages', 'preferences'])
      assert.deepEqual(after[name], before[name]);
    const editedId = await task(page).getAttribute('id');
    assert.deepEqual(
      after.entries.filter((e) => e.id !== editedId),
      before.entries.filter((e) => e.id !== editedId),
    );
    const prior = before.entries.find((e) => e.id === editedId);
    const edited = after.entries.find((e) => e.id === editedId);
    assert.equal(edited.text, latest);
    assert(edited.revision > prior.revision);
    await context.setOffline(true);
    await page.reload();
    await assertBook(page, latest);
    await hasBuild(page, update.buildId);
    await timed(page, '13:00').fill(`SYNTHETIC new offline ${engine}`);
    await timed(page, '13:00').press('Enter');
    await saved(page);
    await page.reload();
    await expect(timed(page, '13:00')).toHaveText(
      `SYNTHETIC new offline ${engine}`,
    );
    await context.setOffline(false);
    session.afterUpdate = await snapshot(page);
    await page.evaluate(() => {
      window.lifecycleMarker = 'updated-open';
    });
    progress(
      `${engine}: other-window refusal, failed-save retention, saved update and offline edit passed.`,
    );
  }
  await record('updated.json', {
    update,
    engines: sessions.map((s) => s.engine),
  });
  progress(
    'All three updated books are open. Re-publish retained baseline, then write rollback-ready.json.',
  );
  const rollback = await checkpoint('rollback-ready.json');
  assert.equal(rollback.workerVersion, baseline.workerVersion);
  assert.equal(rollback.buildId, baseline.buildId);

  for (const { engine, page, context, afterUpdate } of sessions) {
    const button = await discover(page);
    assert.equal(
      await page.evaluate(() => window.lifecycleMarker),
      'updated-open',
    );
    await hasBuild(page, update.buildId);
    await activate(page, button, baseline.buildId);
    await assertBook(page, `SYNTHETIC retained update ${engine}`);
    await expect(timed(page, '13:00')).toHaveText(
      `SYNTHETIC new offline ${engine}`,
    );
    assert.deepEqual(await snapshot(page), afterUpdate);
    await context.setOffline(true);
    await page.reload();
    await assertBook(page, `SYNTHETIC retained update ${engine}`);
    await expect(timed(page, '13:00')).toHaveText(
      `SYNTHETIC new offline ${engine}`,
    );
    await hasBuild(page, baseline.buildId);
    assert.deepEqual(await snapshot(page), afterUpdate);
    await context.setOffline(false);
    if (engine === 'chromium')
      await page.screenshot({
        path: join(runDirectory, 'after-rollback.png'),
        fullPage: true,
      });
    progress(
      `${engine}: retained baseline active, newer book and offline edit preserved.`,
    );
  }
  assert.deepEqual(errors, []);
  await record('result.json', {
    result: 'passed',
    baseline,
    update,
    rollback,
    engines: sessions.map(({ engine }) => ({
      engine,
      otherWindowRefused: true,
      failedSaveRetained: true,
      updatedOfflineEdit: true,
      rollbackBookPreserved: true,
    })),
    errors,
  });
  progress('Hosted lifecycle verification passed in all three engines.');
} catch (error) {
  await record('failure.json', {
    message: error.message,
    stack: error.stack,
    errors,
  });
  throw error;
} finally {
  for (const { browser } of sessions) await browser.close();
}
