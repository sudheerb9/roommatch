/**
 * UAT – Profile page
 */
const { test, expect } = require('@playwright/test');
const { stubAllApis, setAuthToken } = require('./helpers');

const PROFILE_FIELDS = {
  bio: 'I am a test user',
  gender: 'cis_male',
  sleep_schedule: 'early_bird',
  cleanliness_level: 'clean',
  noise_tolerance: 'moderate',
  smoking_preference: 'no',
  drinking_preference: 'no',
  social_behavior: 'social',
  study_preferences: 'studious',
};

test.describe('Profile page', () => {
  test('renders Profile View badge', async ({ page }) => {
    await setAuthToken(page);
    await stubAllApis(page, {
      profileMeMerge: { profile: PROFILE_FIELDS, user: { display_name: 'Test User' } },
    });
    await page.goto('/profile');
    await expect(page.getByText(/profile view/i)).toBeVisible();
  });

  test('displays loaded bio', async ({ page }) => {
    await setAuthToken(page);
    await stubAllApis(page, {
      profileMeMerge: { profile: PROFILE_FIELDS, user: { display_name: 'Test User' } },
    });
    await page.goto('/profile');
    await expect(page.locator('textarea').first()).toHaveValue(/i am a test user/i);
  });

  test('shows Save profile button', async ({ page }) => {
    await setAuthToken(page);
    await stubAllApis(page, {
      profileMeMerge: { profile: PROFILE_FIELDS, user: { display_name: 'Test User' } },
    });
    await page.goto('/profile');
    await expect(page.getByRole('button', { name: /save profile/i })).toBeVisible();
  });

  test('shows error when profile fetch fails', async ({ page }) => {
    await setAuthToken(page);
    await stubAllApis(page, {
      profileMeGet: { status: 500, json: { error: 'Internal server error' } },
    });
    await page.goto('/profile');
    await expect(page.getByText('Internal server error')).toBeVisible();
  });
});
