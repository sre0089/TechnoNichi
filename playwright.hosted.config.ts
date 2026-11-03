import { defineConfig, devices } from '@playwright/test';

const target = process.env.HOSTED_BASE_URL;
if (!target)
  throw new Error('Set HOSTED_BASE_URL to the approved staging HTTPS origin.');
const origin = new URL(target);
if (
  origin.protocol !== 'https:' ||
  origin.pathname !== '/' ||
  origin.search ||
  origin.hash ||
  origin.username ||
  origin.password
)
  throw new Error(
    'HOSTED_BASE_URL must be an HTTPS origin without a path or credentials.',
  );

export default defineConfig({
  testDir: './tests/hosted',
  outputDir: './artifacts/hosted-tests',
  workers: 1,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  use: { baseURL: origin.origin, trace: 'retain-on-failure' },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});
