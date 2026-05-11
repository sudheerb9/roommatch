const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { browsersPath, ensurePlaywrightBrowsersPath } = require('../playwright.paths.cjs');

ensurePlaywrightBrowsersPath();

const lock = path.join(browsersPath, '__dirlock');
try {
  fs.rmSync(lock, { force: true });
} catch {
  /* ignore */
}

execSync('npx playwright install chromium', { stdio: 'inherit', env: process.env });
