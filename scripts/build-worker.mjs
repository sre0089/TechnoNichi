import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

async function files(directory) {
  const found = await readdir(directory, { withFileTypes: true });
  return (
    await Promise.all(
      found.map(async (entry) =>
        entry.isDirectory()
          ? files(join(directory, entry.name))
          : [join(directory, entry.name)],
      ),
    )
  ).flat();
}
const assets = (await files('.next/static'))
  .filter((path) => /\.(?:js|css|woff2?|png|svg|ico)$/.test(path))
  .map((path) => '/' + path.replace(/^\.next\//, '_next/'))
  .sort();
const publicAssets = [
  '/manifest.webmanifest',
  '/icons/book.svg',
  '/icons/book-32.png',
  '/icons/book-192.png',
  '/icons/book-512.png',
  '/icons/book-maskable-512.png',
  '/icons/apple-touch-icon.png',
];
const publicContents = await Promise.all(
  publicAssets.map((url) =>
    readFile(
      url === '/manifest.webmanifest'
        ? '.next/server/app/manifest.webmanifest.body'
        : 'public' + url,
    ),
  ),
);
const template = await readFile('src/offline/worker.js', 'utf8');
const html = await readFile('.next/server/app/index.html', 'utf8');
const digest = createHash('sha256')
  .update(template)
  .update(html)
  .update(JSON.stringify([...assets, ...publicAssets]));
for (const content of publicContents) digest.update(content);
const version = digest.digest('hex').slice(0, 20);
const output = template
  .replace('__SHELL_VERSION__', version)
  .replace("/* __SHELL_HTML__ */ ''", () => JSON.stringify(html))
  .replace('/* __PRECACHE__ */ []', () =>
    JSON.stringify(['/', ...assets, ...publicAssets]),
  );
await mkdir('public', { recursive: true });
await writeFile('public/sw.js', output);
process.stdout.write(
  `Offline shell: ${assets.length + publicAssets.length + 1} public resources, version ${version}\n`,
);
