import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

const PREFS = {
  preferred_sleep_schedule: 'no_preference',
  preferred_cleanliness_level: 'no_preference',
  preferred_noise_tolerance: 'no_preference',
  preferred_smoking_preference: 'no_preference',
  preferred_drinking_preference: 'no_preference',
  preferred_social_behavior: 'no_preference',
  preferred_study_preferences: 'no_preference',
};

const PROFILE_ME = {
  user: {
    id: 1,
    email: 'tester@example.com',
    display_name: 'Tester',
    is_active: true,
  },
  profile: {
    bio: '',
    gender: 'cis_male',
    sleep_schedule: 'early_bird',
    cleanliness_level: 'clean',
    noise_tolerance: 'moderate',
    smoking_preference: 'no',
    drinking_preference: 'no',
    social_behavior: 'social',
    study_preferences: 'studious',
  },
  preferences: PREFS,
  matching_eligible: true,
};

beforeEach(() => {
  window.localStorage.setItem('roommatch_bearer_token', 'unit-test-token');
  jest.spyOn(global, 'fetch').mockImplementation((url) => {
    const u = String(url);
    if (u.includes('/profile/me')) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(PROFILE_ME),
        text: () => Promise.resolve(JSON.stringify(PROFILE_ME)),
      });
    }
    if (u.includes('/matches')) {
      const emptyMatches = {
        items: [],
        meta: {
          hasMore: false,
          count: 0,
          page: 1,
          matching_eligible: true,
        },
      };
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(emptyMatches),
        text: () => Promise.resolve(JSON.stringify(emptyMatches)),
      });
    }
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
      text: () => Promise.resolve('{}'),
    });
  });
});

afterEach(() => {
  jest.restoreAllMocks();
  window.localStorage.clear();
});

test('shows Profile View badge on profile page', async () => {
  render(
    <MemoryRouter initialEntries={['/profile']}>
      <App />
    </MemoryRouter>,
  );

  const badge = await screen.findByText(/profile view/i);
  expect(badge).toBeInTheDocument();
});

test('shows preferences page headline', async () => {
  render(
    <MemoryRouter initialEntries={['/preferences']}>
      <App />
    </MemoryRouter>,
  );

  const headline = await screen.findByRole('heading', {
    name: /roommate preferences/i,
  });
  expect(headline).toBeInTheDocument();
});

test('shows matches page title', async () => {
  render(
    <MemoryRouter initialEntries={['/matches']}>
      <App />
    </MemoryRouter>,
  );

  expect(
    await screen.findByRole('heading', { name: /your matches/i }),
  ).toBeInTheDocument();
});

test('home Get Started goes to login when unauthenticated', async () => {
  window.localStorage.clear();
  render(
    <MemoryRouter initialEntries={['/home']}>
      <App />
    </MemoryRouter>,
  );

  await userEvent.click(
    await screen.findByRole('button', { name: /^get started$/i }),
  );
  expect(await screen.findByText(/welcome back/i)).toBeInTheDocument();
});

test('home Get Started goes to profile when token is present', async () => {
  window.localStorage.setItem('roommatch_bearer_token', 'unit-test-token');
  render(
    <MemoryRouter initialEntries={['/home']}>
      <App />
    </MemoryRouter>,
  );

  await userEvent.click(
    await screen.findByRole('button', { name: /^get started$/i }),
  );
  expect(await screen.findByText(/profile view/i)).toBeInTheDocument();
});
