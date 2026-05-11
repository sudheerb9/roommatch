/**
 * UAT – Invitations inbox
 */
const { test, expect } = require('@playwright/test');
const { stubAllApis, setAuthToken } = require('./helpers');

const INVITATION_ROW = {
  id: 5,
  status: 'pending',
  group: { name: 'Beta House' },
  inviter: { display_name: 'Bob', email: 'bob@test.edu' },
  created_at: new Date().toISOString(),
};

test.describe('Invitations inbox – empty state', () => {
  test('shows Nothing here yet', async ({ page }) => {
    await setAuthToken(page);
    await stubAllApis(page);
    await page.goto('/invitations');
    await expect(page.getByText(/nothing here yet/i)).toBeVisible();
  });
});

test.describe('Invitations inbox – with data', () => {
  test.beforeEach(async ({ page }) => {
    await setAuthToken(page);
    await stubAllApis(page, {
      invitationsMine: { json: { invitations: [INVITATION_ROW] } },
    });
    await page.goto('/invitations');
  });

  test('shows group name', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /beta house/i })).toBeVisible();
  });

  test('shows inviter', async ({ page }) => {
    await expect(page.getByText(/from bob/i)).toBeVisible();
  });

  test('Accept and Reject buttons are present', async ({ page }) => {
    await expect(page.getByRole('button', { name: /^Accept$/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Reject$/ })).toBeVisible();
  });
});

test.describe('Invitations inbox – respond action', () => {
  test('Accept sends POST /invitations/5/respond', async ({ page }) => {
    await setAuthToken(page);
    await stubAllApis(page, {
      invitationsMine: { json: { invitations: [INVITATION_ROW] } },
    });
    const postPromise = page.waitForRequest(
      (r) =>
        r.url().includes('/invitations/5/respond') && r.method() === 'POST',
    );
    await page.goto('/invitations');
    await page.getByRole('button', { name: /^Accept$/ }).click();
    await postPromise;
  });
});

test.describe('Invitations inbox – error state', () => {
  test('shows error when API fails', async ({ page }) => {
    await setAuthToken(page);
    await stubAllApis(page, {
      invitationsMine: { status: 500, json: { error: 'Server error' } },
    });
    await page.goto('/invitations');
    await expect(page.getByText(/server error|could not load/i)).toBeVisible();
  });
});
