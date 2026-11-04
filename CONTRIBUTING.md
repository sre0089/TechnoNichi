# Contributing and testing

Use Node.js 24 LTS and install the locked dependencies with `npm ci`.

## Checks

```sh
npm run check
```

This runs formatting, lint, strict TypeScript checks, unit tests and a production
build. Individual commands are available in [package.json](package.json).

## Browser tests

```sh
npx playwright install chromium firefox webkit
npm run test:browser
```

The suite starts a local development server. To test production/offline behavior
after a successful build, run:

```sh
npm run test:offline
```

It starts its own production server on port 3100; leave that port free.

## Installable offline preview

```sh
npm run build
npm run start -- --port 3100
```

Open <http://127.0.0.1:3100> and wait for **Available offline**. Use **App setup**
for installation guidance. The development server on port 3000 does not register
the offline worker, and its browser-local book is separate from the port 3100
book. Transfer writing with a retained backup and restore into an empty store.

## Hosted checks

To test a deployed copy of the app, replace the example with its HTTPS origin:

```sh
HOSTED_BASE_URL=https://your-preview.example npm run test:hosted
```

These checks use disposable browser stores and synthetic writing.

## Changes and bug reports

Keep pull requests focused and describe the behavior changed and checks run.
For bugs, include reproduction steps, expected/actual behavior, browser and OS.
Use synthetic examples; keep personal book contents, backups, credentials and
generated build/test artifacts out of commits, screenshots and reports.
