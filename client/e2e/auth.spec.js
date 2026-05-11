/**
 * UAT – Authentication flows
 */
const { test, expect } = require('@playwright/test');
const { stubAllApis, clearAuthToken, setAuthToken } = require('./helpers');

test.describe('Login page', () => {
  test('renders sign-in heading', async ({ page }) => {
    await clearAuthToken(page);
    await stubAllApis(page);
    await page.goto('/login');
    await expect(page.getByText(/welcome back/i)).toBeVisible();
  });

  test('shows Google sign-in', async ({ page }) => {
    await clearAuthToken(page);
    await stubAllApis(page);
    await page.goto('/login');
    await expect(page.getByRole('button', { name: /sign in with google/i })).toBeVisible();
  });

  test('"Back to Home" navigates to /home', async ({ page }) => {
    await clearAuthToken(page);
    await stubAllApis(page);
    await page.goto('/login');
    await page.getByRole('button', { name: /back to home/i }).click();
    await expect(page).toHaveURL(/\/home$/);
  });

  test('authenticated user visiting /login is redirected to /profile', async ({ page }) => {
    await setAuthToken(page);
    await stubAllApis(page);
    await page.goto('/login');
    await expect(page).toHaveURL(/\/profile/);
  });
});

test.describe('Auth redirect guards', () => {
  test('/chat redirects to /login when unauthenticated', async ({ page }) => {
    await clearAuthToken(page);
    await stubAllApis(page);
    await page.goto('/chat');
    await expect(page).toHaveURL(/\/login/);
  });
});
