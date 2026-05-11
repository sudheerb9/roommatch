// @ts-check
const { ensurePlaywrightBrowsersPath } = require('./playwright.paths.cjs');

ensurePlaywrightBrowsersPath();
const { defineConfig, devices } = require('@playwright/test');

const E2E_PORT = process.env.E2E_PORT || '3100';

/**
 * Playwright e2e — see `e2e/*.spec.js`.
 *
 * First time (or CI): `npm run test:e2e:install`  → downloads Chromium into node_modules/.cache
 * Run: `npm run test:e2e`
 *
 * If you have Google Chrome installed and prefer not to download browsers:
 *   PW_USE_SYSTEM_CHROME=1 npm run test:e2e
 *
 * Uses PORT 3100 so tests do not fight `npm start` on 3000 during development.
 */
module.exports = defineConfig({
  testDir: './e2e',
  timeout: 45_000,
  retries: process.env.CI ? 1 : 0,
  /* Parallel workers + one webpack server can be flaky on slow machines */
  workers: process.env.CI ? 1 : 2,

  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],

  use: {
    baseURL: `http://localhost:${E2E_PORT}`,
    /* Default: Playwright’s bundled Chromium (run `npm run test:e2e:install`). Use system Chrome only when you opt in. */
    ...(process.env.PW_USE_SYSTEM_CHROME === '1' ? { channel: 'chrome' } : {}),
    headless: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: `BROWSER=none PORT=${E2E_PORT} npm start`,
    url: `http://localhost:${E2E_PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
