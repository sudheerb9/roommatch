/**
 * UAT – Matches page
 */
const { test, expect } = require('@playwright/test');
const { stubAllApis, setAuthToken } = require('./helpers');

const MATCH_ROW = {
  user_id: 7,
  display_name: 'Alice',
  email: 'alice@umn.edu',
  score: 90,
};

test.describe('Matches page – empty state', () => {
  test('shows No matches yet', async ({ page }) => {
    await setAuthToken(page);
    await stubAllApis(page);
    await page.goto('/matches');
    await expect(page.getByText(/no matches yet/i)).toBeVisible();
  });
});

test.describe('Matches page – with data', () => {
  test('renders match name', async ({ page }) => {
    await setAuthToken(page);
    await stubAllApis(page, {
      matchesList: {
        json: {
          items: [MATCH_ROW],
          meta: { hasMore: false, count: 1, page: 1, matching_eligible: true },
        },
      },
    });
    await page.goto('/matches');
    await expect(page.getByRole('button', { name: /^Alice$/i })).toBeVisible();
  });

  test('shows Excellent fit badge for score 90', async ({ page }) => {
    await setAuthToken(page);
    await stubAllApis(page, {
      matchesList: {
        json: {
          items: [MATCH_ROW],
          meta: { hasMore: false, count: 1, page: 1 },
        },
      },
    });
    await page.goto('/matches');
    await expect(page.getByText(/excellent fit/i)).toBeVisible();
  });

  test('shows Strong fit badge for score 75', async ({ page }) => {
    await setAuthToken(page);
    await stubAllApis(page, {
      matchesList: {
        json: {
          items: [{ ...MATCH_ROW, score: 75 }],
          meta: { hasMore: false, count: 1, page: 1 },
        },
      },
    });
    await page.goto('/matches');
    await expect(page.getByText(/strong fit/i)).toBeVisible();
  });

  test('enables Next when meta.hasMore is true', async ({ page }) => {
    await setAuthToken(page);
    await stubAllApis(page, {
      matchesList: {
        json: {
          items: [MATCH_ROW],
          meta: { hasMore: true, count: 1, page: 1 },
        },
      },
    });
    await page.goto('/matches');
    await expect(page.getByRole('button', { name: /^Next$/ })).toBeEnabled();
  });
});

test.describe('Matches page – error state', () => {
  test('shows error when API fails', async ({ page }) => {
    await setAuthToken(page);
    await stubAllApis(page, {
      matchesList: { status: 500, json: { error: 'Server error' } },
    });
    await page.goto('/matches');
    await expect(page.getByText(/server error|request failed/i)).toBeVisible();
  });
});
