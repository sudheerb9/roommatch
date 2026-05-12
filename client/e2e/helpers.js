/**
 * Intercepts calls to the Express API (`getApiBaseUrl()` defaults to http://localhost:3001)
 * so e2e tests run without a real backend.
 */

const API_BASE = 'http://localhost:3001';

const PREFS_DEFAULT = {
  preferred_sleep_schedule: 'no_preference',
  preferred_cleanliness_level: 'no_preference',
  preferred_noise_tolerance: 'no_preference',
  preferred_smoking_preference: 'no_preference',
  preferred_drinking_preference: 'no_preference',
  preferred_social_behavior: 'no_preference',
  preferred_study_preferences: 'no_preference',
};

const DEFAULT_PROFILE_ME = {
  user: {
    id: 1,
    email: 'e2e@test.edu',
    display_name: 'E2E User',
    is_active: true,
  },
  profile: {
    bio: 'Hello from e2e',
    gender: 'cis_male',
    sleep_schedule: 'early_bird',
    cleanliness_level: 'clean',
    noise_tolerance: 'moderate',
    smoking_preference: 'no',
    drinking_preference: 'no',
    social_behavior: 'social',
    study_preferences: 'studious',
  },
  preferences: { ...PREFS_DEFAULT },
  matching_eligible: true,
};

function fulfillJson(route, status, json) {
  return route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(json ?? {}),
  });
}

function mergeProfileMe(overrides) {
  const base = JSON.parse(JSON.stringify(DEFAULT_PROFILE_ME));
  if (!overrides) return base;
  return {
    user: { ...base.user, ...(overrides.user || {}) },
    profile: { ...base.profile, ...(overrides.profile || {}) },
    preferences: { ...base.preferences, ...(overrides.preferences || {}) },
    matching_eligible:
      overrides.matching_eligible !== undefined
        ? overrides.matching_eligible
        : base.matching_eligible,
  };
}

/**
 * Install default API stubs. Optional `options` merges into JSON bodies or sets status codes.
 *
 * @param {import('@playwright/test').Page} page
 * @param {{
 *   profileMeGet?: { status?: number, json?: object },
 *   profileMePut?: { status?: number, json?: object },
 *   groupsList?: { status?: number, json?: object },
 *   matchesList?: { status?: number, json?: object },
 *   invitationsMine?: { status?: number, json?: object },
 * }} [options]
 */
async function stubAllApis(page, options = {}) {
  await page.route(`${API_BASE}/**`, async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const pathname = url.pathname;
    const method = req.method();

    if (pathname === '/auth/logout' && method === 'POST') {
      return route.fulfill({ status: 204 });
    }
    if (pathname === '/auth/callback' && method === 'POST') {
      return fulfillJson(route, 200, { token: 'e2e-google-mock-token' });
    }

    if (pathname === '/profile/me') {
      if (method === 'GET') {
        const o = options.profileMeGet;
        if (o) {
          const json =
            o.json !== undefined ? o.json : mergeProfileMe(options.profileMeMerge);
          return fulfillJson(route, o.status ?? 200, json);
        }
        if (options.profileMeMerge) {
          return fulfillJson(route, 200, mergeProfileMe(options.profileMeMerge));
        }
        return fulfillJson(route, 200, mergeProfileMe());
      }
      if (method === 'PUT') {
        const o = options.profileMePut;
        if (o) {
          const json =
            o.json !== undefined ? o.json : mergeProfileMe(options.profileMeMerge);
          return fulfillJson(route, o.status ?? 200, json);
        }
        return fulfillJson(route, 200, mergeProfileMe(options.profileMeMerge));
      }
    }

    const profileUserMatch = pathname.match(/^\/profile\/(\d+)$/);
    if (profileUserMatch && method === 'GET') {
      const uid = profileUserMatch[1];
      const o = options.profileByUserIdGet;
      if (o?.[uid]) {
        return fulfillJson(route, o[uid].status ?? 200, o[uid].json);
      }
      return fulfillJson(route, 200, {
        profile: { bio: `Bio for user ${uid}` },
        user: { id: Number(uid), display_name: `User ${uid}`, email: `${uid}@e2e.test` },
      });
    }

    if (pathname === '/groups' && method === 'GET') {
      const o = options.groupsList;
      return fulfillJson(route, o?.status ?? 200, o?.json ?? { groups: [] });
    }

    if (pathname === '/groups' && method === 'POST') {
      const o = options.groupsPost;
      if (o?.json) return fulfillJson(route, o.status ?? 201, o.json);
      let body = {};
      try {
        body = req.postDataJSON() || {};
      } catch {
        /* ignore */
      }
      const name = body.name || 'Untitled';
      return fulfillJson(route, 201, {
        group: {
          id: 99,
          name,
          status: 'forming',
          member_count: 1,
          role: 'owner',
        },
      });
    }

    const assignMatch = pathname.match(/^\/groups\/(\d+)\/assignment$/);
    if (assignMatch && method === 'GET') {
      const gid = assignMatch[1];
      const o = options.groupAssignmentGet?.[gid];
      return fulfillJson(route, o?.status ?? 200, o?.json ?? { assignment: null });
    }

    const membersMatch = pathname.match(/^\/groups\/(\d+)\/members$/);
    if (membersMatch && method === 'GET') {
      const gid = membersMatch[1];
      const o = options.groupMembersGet?.[gid];
      return fulfillJson(route, o?.status ?? 200, o?.json ?? { members: [] });
    }

    const groupIdMatch = pathname.match(/^\/groups\/(\d+)$/);
    if (groupIdMatch && method === 'GET') {
      const gid = groupIdMatch[1];
      const o = options.groupByIdGet?.[gid];
      if (o?.json) return fulfillJson(route, o.status ?? 200, o.json);
      return fulfillJson(route, 200, {
        group: {
          id: Number(gid),
          name: `Group ${gid}`,
          status: 'forming',
          member_count: 2,
          role: 'member',
        },
      });
    }

    if (pathname.startsWith('/matches') && method === 'GET') {
      const o = options.matchesList;
      return fulfillJson(
        route,
        o?.status ?? 200,
        o?.json ?? {
          items: [],
          meta: { hasMore: false, count: 0, page: 1, matching_eligible: true },
        },
      );
    }

    if (pathname === '/invitations/mine' && method === 'GET') {
      const o = options.invitationsMine;
      return fulfillJson(
        route,
        o?.status ?? 200,
        o?.json ?? { invitations: [] },
      );
    }

    const respondMatch = pathname.match(/^\/invitations\/(\d+)\/respond$/);
    if (respondMatch && method === 'POST') {
      const o = options.invitationRespondPost;
      if (o?.json) return fulfillJson(route, o.status ?? 200, o.json);
      return fulfillJson(route, 200, { ok: true });
    }

    if (pathname === '/chats' && method === 'GET') {
      return fulfillJson(route, 200, { chats: [] });
    }

    return fulfillJson(route, 200, {});
  });
}

async function setAuthToken(page) {
  await page.addInitScript(() => {
    window.localStorage.setItem('roommatch_bearer_token', 'fake-test-token');
  });
}

async function clearAuthToken(page) {
  await page.addInitScript(() => {
    window.localStorage.removeItem('roommatch_bearer_token');
  });
}

module.exports = {
  stubAllApis,
  setAuthToken,
  clearAuthToken,
  API_BASE,
  PREFS_DEFAULT,
  DEFAULT_PROFILE_ME,
};
