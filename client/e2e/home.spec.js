/**
 * UAT – Home / marketing page
 *
 * Covers:
 *  - Page loads and headline is visible
 *  - "Get Started Now" CTA is present
 *  - Unauthenticated click on CTA navigates to /login
 *  - Authenticated click on CTA navigates to /profile
 *  - "Why Choose RoomMatch?" features section renders
 */
const { test, expect } = require('@playwright/test');
const { stubAllApis, clearAuthToken, setAuthToken } = require('./helpers');

test.describe('Home page', () => {
  test('shows marketing headline', async ({ page }) => {
    await clearAuthToken(page);
    await stubAllApis(page);
    await page.goto('/home');
    await expect(page.getByText(/find your perfect roommate/i)).toBeVisible();
  });

  test('shows "Why Choose RoomMatch?" features section', async ({ page }) => {
    await clearAuthToken(page);
    await stubAllApis(page);
    await page.goto('/home');
    await expect(page.getByText(/why choose roommatch/i)).toBeVisible();
  });

  test('CTA navigates unauthenticated user to /login', async ({ page }) => {
    await clearAuthToken(page);
    await stubAllApis(page);
    await page.goto('/home');
    await page.getByRole('button', { name: /get started now/i }).click();
    await expect(page).toHaveURL(/\/login/);
  });

  test('CTA navigates authenticated user to /profile', async ({ page }) => {
    await setAuthToken(page);
    await stubAllApis(page);
    await page.goto('/home');
    await page.getByRole('button', { name: /get started now/i }).click();
    await expect(page).toHaveURL(/\/profile/);
  });
});
