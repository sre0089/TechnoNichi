// Build substitutes only the version and an allowlist of public shell resources.
const PREFIX = 'technonichi-shell-';
const CACHE = PREFIX + '__SHELL_VERSION__';
const PRECACHE = /* __PRECACHE__ */ [];
const HTML = /* __SHELL_HTML__ */ '';
async function prepareOffline() {
  const cache = await caches.open(CACHE);
  await cache.addAll(
    PRECACHE.filter((url) => url !== '/').map(
      (url) => new Request(url, { cache: 'reload' }),
    ),
  );
  await cache.put(
    '/',
    new Response(HTML, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    }),
  );
}
self.addEventListener('install', (event) => {
  event.waitUntil(prepareOffline());
  // Updates wait for an explicit saved-and-approved message from the app.
});
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = (await caches.keys()).filter((key) =>
        key.startsWith(PREFIX),
      );
      // Keep the prior shell for in-flight old chunks during the explicit reload.
      await Promise.all(
        keys
          .filter((key) => key !== CACHE)
          .slice(0, -1)
          .map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  const root = request.mode === 'navigate' && url.pathname === '/';
  const asset =
    url.pathname.startsWith('/_next/static/') &&
    /\.(?:js|css|woff2?|png|svg|ico)$/.test(url.pathname);
  if (!root && !asset) return;
  event.respondWith(
    (async () => {
      const current = await caches.open(CACHE);
      const cached = await current.match(root ? '/' : url.pathname);
      if (cached) return cached;
      if (asset) {
        for (const key of (await caches.keys()).filter(
          (key) => key.startsWith(PREFIX) && key !== CACHE,
        )) {
          const prior = await (await caches.open(key)).match(url.pathname);
          if (prior) return prior;
        }
      }
      return fetch(request);
    })(),
  );
});
self.addEventListener('message', (event) => {
  const port = event.ports[0];
  if (!port) return;
  event.waitUntil(
    (async () => {
      try {
        if (event.data?.type === 'REPAIR_CACHE') {
          await prepareOffline();
          port.postMessage({ ready: true });
        } else if (event.data?.type === 'CACHE_STATUS') {
          const cache = await caches.open(CACHE);
          const present = await Promise.all(
            PRECACHE.map((url) => cache.match(url)),
          );
          port.postMessage({
            ready: present.length > 0 && present.every(Boolean),
          });
        } else if (event.data?.type === 'APPLY_UPDATE') {
          const windows = await self.clients.matchAll({
            type: 'window',
            includeUncontrolled: true,
          });
          if (windows.length > 1) {
            port.postMessage({
              error: 'Close other planner tabs, then try updating again.',
            });
            return;
          }
          port.postMessage({ accepted: true });
          await self.skipWaiting();
        }
      } catch {
        port.postMessage({
          error: 'Offline setup could not finish. Please retry while online.',
        });
      }
    })(),
  );
});
