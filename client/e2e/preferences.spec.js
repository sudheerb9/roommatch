/**
 * UAT – Preferences page
 */
const { test, expect } = require('@playwright/test');
const { stubAllApis, setAuthToken, PREFS_DEFAULT } = require('./helpers');

test.describe('Preferences page', () => {
  test('shows preferences headline', async ({ page }) => {
    await setAuthToken(page);
    await stubAllApis(page, {
      profileMeMerge: { preferences: PREFS_DEFAULT },
    });
    await page.goto('/preferences');
    await expect(
      page.getByRole('heading', { name: /roommate preferences/i }),
    ).toBeVisible();
  });

  test('renders 7 preference selects', async ({ page }) => {
    await setAuthToken(page);
    await stubAllApis(page, {
      profileMeMerge: { preferences: PREFS_DEFAULT },
    });
    await page.goto('/preferences');
    await expect(page.locator('select')).toHaveCount(7);
  });

  test('Save roommate preferences button is present', async ({ page }) => {
    await setAuthToken(page);
    await stubAllApis(page, {
      profileMeMerge: { preferences: PREFS_DEFAULT },
    });
    await page.goto('/preferences');
    await expect(
      page.getByRole('button', { name: /save roommate preferences/i }),
    ).toBeVisible();
  });

  test('saving issues PUT /profile/me', async ({ page }) => {
    await setAuthToken(page);
    await stubAllApis(page, {
      profileMeMerge: { preferences: PREFS_DEFAULT },
    });
    const putPromise = page.waitForRequest(
      (r) => r.url().includes('/profile/me') && r.method() === 'PUT',
    );
    await page.goto('/preferences');
    await page.locator('select').first().selectOption({ index: 1 });
    await page.getByRole('button', { name: /save roommate preferences/i }).click();
    await putPromise;
  });

  test('shows error when preferences fetch fails', async ({ page }) => {
    await setAuthToken(page);
    await stubAllApis(page, {
      profileMeGet: { status: 503, json: { error: 'Service unavailable' } },
    });
    await page.goto('/preferences');
    await expect(page.getByText(/service unavailable|failed to load preferences/i)).toBeVisible();
  });
});
