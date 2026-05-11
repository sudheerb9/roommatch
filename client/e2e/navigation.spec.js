/**
 * UAT – App-wide navigation & routing
 */
const { test, expect } = require('@playwright/test');
const { stubAllApis, setAuthToken, clearAuthToken } = require('./helpers');

test.describe('Marketing routes', () => {
  test('/ serves the landing page (same content as /home)', async ({ page }) => {
    await clearAuthToken(page);
    await stubAllApis(page);
    await page.goto('/');
    await expect(page.getByText(/why choose roommatch/i)).toBeVisible();
  });
});

test.describe('Authenticated navigation', () => {
  test.beforeEach(async ({ page }) => {
    await setAuthToken(page);
    await stubAllApis(page);
  });

  test('navigates to /profile', async ({ page }) => {
    await page.goto('/profile');
    await expect(page).toHaveURL(/\/profile/);
  });

  test('navigates to /preferences', async ({ page }) => {
    await page.goto('/preferences');
    await expect(page).toHaveURL(/\/preferences/);
  });

  test('navigates to /groups', async ({ page }) => {
    await page.goto('/groups');
    await expect(page).toHaveURL(/\/groups$/);
  });

  test('navigates to /matches', async ({ page }) => {
    await page.goto('/matches');
    await expect(page).toHaveURL(/\/matches/);
  });

  test('navigates to /invitations', async ({ page }) => {
    await page.goto('/invitations');
    await expect(page).toHaveURL(/\/invitations/);
  });

  test('/housing-units redirects to /groups', async ({ page }) => {
    await page.goto('/housing-units');
    await expect(page).toHaveURL(/\/groups$/);
  });

  test('/group-housing redirects to /groups', async ({ page }) => {
    await page.goto('/group-housing');
    await expect(page).toHaveURL(/\/groups$/);
  });

  test('unknown route falls back to /profile', async ({ page }) => {
    await page.goto('/this-does-not-exist-xyz');
    await expect(page).toHaveURL(/\/profile/);
  });
});
