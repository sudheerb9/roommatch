/**
 * UAT – Groups page
 */
const { test, expect } = require('@playwright/test');
const { stubAllApis, setAuthToken } = require('./helpers');

const GROUP_ROW = {
  id: 42,
  name: 'Test Group Alpha',
  status: 'forming',
  member_count: 2,
  role: 'owner',
};

test.describe('Groups page – empty state', () => {
  test('shows No groups yet and Create group', async ({ page }) => {
    await setAuthToken(page);
    await stubAllApis(page, {
      groupsList: { json: { groups: [] } },
    });
    await page.goto('/groups');
    await expect(page.getByText(/no groups yet/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /^Create group$/i })).toBeVisible();
  });
});

test.describe('Groups page – with data', () => {
  test('renders group name', async ({ page }) => {
    await setAuthToken(page);
    await stubAllApis(page, {
      groupsList: { json: { groups: [GROUP_ROW] } },
    });
    await page.goto('/groups');
    await expect(page.getByText(/test group alpha/i)).toBeVisible();
  });

  test('renders forming status label', async ({ page }) => {
    await setAuthToken(page);
    await stubAllApis(page, {
      groupsList: { json: { groups: [GROUP_ROW] } },
    });
    await page.goto('/groups');
    await expect(page.getByText(/^forming$/i)).toBeVisible();
  });

  test('clicking group name navigates to /groups/42', async ({ page }) => {
    await setAuthToken(page);
    await stubAllApis(page, {
      groupsList: { json: { groups: [GROUP_ROW] } },
      groupByIdGet: {
        42: {
          json: {
            group: GROUP_ROW,
          },
        },
      },
      groupMembersGet: { 42: { json: { members: [] } } },
      groupAssignmentGet: { 42: { json: { assignment: null } } },
    });
    await page.goto('/groups');
    await page.getByRole('link', { name: /test group alpha/i }).click();
    await expect(page).toHaveURL(/\/groups\/42/);
  });
});

test.describe('Groups page – create form', () => {
  test('Create group opens the name field', async ({ page }) => {
    await setAuthToken(page);
    await stubAllApis(page, { groupsList: { json: { groups: [] } } });
    await page.goto('/groups');
    await page.getByRole('button', { name: /^Create group$/i }).click();
    await expect(page.getByPlaceholder(/roommatch study crew/i)).toBeVisible();
  });

  test('submitting the form POSTs to /groups', async ({ page }) => {
    await setAuthToken(page);
    await stubAllApis(page, { groupsList: { json: { groups: [] } } });
    const postPromise = page.waitForRequest((r) => {
      const p = new URL(r.url()).pathname;
      return p === '/groups' && r.method() === 'POST';
    });
    await page.goto('/groups');
    await page.getByRole('button', { name: /^Create group$/i }).click();
    await page.getByPlaceholder(/roommatch study crew/i).fill('My New Group');
    await page
      .locator('form')
      .getByRole('button', { name: /^Create group$/i })
      .click();
    await postPromise;
  });
});

test.describe('Groups page – error state', () => {
  test('shows error UI when API fails', async ({ page }) => {
    await setAuthToken(page);
    await stubAllApis(page, {
      groupsList: { status: 500, json: { error: 'Server error' } },
    });
    await page.goto('/groups');
    await expect(
      page.getByRole('heading', { name: /something went wrong/i }),
    ).toBeVisible();
  });
});
