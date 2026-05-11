const path = require('path');

const browsersPath = path.join(
  __dirname,
  'node_modules',
  '.cache',
  'ms-playwright',
);

/**
 * Pin browsers under this package so `npm run test:e2e:install` matches runtime.
 * Some tools pre-set PLAYWRIGHT_BROWSERS_PATH to a temp dir without a browser
 * download — that makes every e2e fail. Opt out: PW_USE_GLOBAL_PLAYWRIGHT=1
 */
function ensurePlaywrightBrowsersPath() {
  if (process.env.PW_USE_GLOBAL_PLAYWRIGHT === '1') return;
  process.env.PLAYWRIGHT_BROWSERS_PATH = browsersPath;
}

module.exports = { browsersPath, ensurePlaywrightBrowsersPath };
