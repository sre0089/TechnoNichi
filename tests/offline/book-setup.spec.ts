import { expect, test } from '@playwright/test';

test('a personally created book saves and reopens offline without showing setup again', async ({
  page,
  context,
}) => {
  const fontOrigins = new Set<string>();
  page.on('request', (request) => {
    if (request.resourceType() === 'font')
      fontOrigins.add(new URL(request.url()).origin);
  });
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'Create your book' }),
  ).toBeVisible();
  const interfaceFamilies = await page.evaluate(async () => {
    await document.fonts.ready;
    return [document.body, document.querySelector('h1')!].map((node) =>
      getComputedStyle(node)
        .fontFamily.split(',')[0]
        .replace(/["']/g, '')
        .trim(),
    );
  });
  await page
    .getByLabel('Book name', { exact: true })
    .fill('Synthetic offline book');
  await page.getByLabel('Year', { exact: true }).fill('2028');
  await page.getByLabel('Today timezone', { exact: true }).fill('UTC');
  await page.getByLabel('Open book to', { exact: true }).selectOption('resume');
  await page.getByRole('button', { name: 'Create book', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('Saved on this device');
  const status = page.getByRole('complementary', { name: 'Offline opening' });
  await expect(status).toContainText('Available offline');
  await expect
    .poll(() => page.evaluate(() => !!navigator.serviceWorker.controller))
    .toBe(true);
  const task = page.getByRole('textbox', {
    name: 'Task 1 on 2028-01-01',
    exact: true,
  });
  await task.fill('My own saved book');
  await task.press('Escape');
  await expect(page.getByRole('status')).toHaveText('Saved on this device');
  await context.setOffline(true);
  await page.reload();
  await expect(task).toHaveText('My own saved book');
  await expect
    .poll(() =>
      page.evaluate(
        (families) =>
          families.every((family) =>
            [...document.fonts].some(
              (font) =>
                font.family.replace(/["']/g, '') === family &&
                font.status === 'loaded',
            ),
          ),
        interfaceFamilies,
      ),
    )
    .toBe(true);
  expect([...fontOrigins]).toEqual([new URL(page.url()).origin]);
  await expect(status).toContainText('Offline — writing saves on this device');
  await task.fill('Edited in my own book offline');
  await task.press('Escape');
  await expect(page.getByRole('status')).toHaveText('Saved on this device');
  await page.reload();
  await expect(task).toHaveText('Edited in my own book offline');
  await expect(
    page.getByRole('heading', { name: 'Create your book' }),
  ).toHaveCount(0);
  await context.setOffline(false);
});
