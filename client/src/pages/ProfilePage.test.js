import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { apiFetch } from '../utils/api';
import ProfilePage from './ProfilePage';

jest.mock('../utils/api', () => ({
  apiFetch: jest.fn(),
}));

const FULL_PROFILE = {
  user: {
    id: 1,
    email: 'tester@example.com',
    display_name: 'Tester',
    is_active: true,
  },
  profile: {
    bio: 'Quiet neighbor.',
    gender: 'cis_male',
    sleep_schedule: 'early_bird',
    cleanliness_level: 'clean',
    noise_tolerance: 'moderate',
    smoking_preference: 'no',
    drinking_preference: 'no',
    social_behavior: 'social',
    study_preferences: 'studious',
  },
  preferences: {},
  matching_eligible: true,
};

describe('ProfilePage', () => {
  beforeEach(() => {
    window.localStorage.setItem('roommatch_bearer_token', 't');
  });

  afterEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
  });

  it('loads and shows profile view', async () => {
    apiFetch.mockResolvedValue(FULL_PROFILE);

    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>,
    );

    expect(await screen.findByText(/profile view/i)).toBeInTheDocument();
    expect(await screen.findByText('Tester')).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/tell roommates what/i),
    ).toHaveValue('Quiet neighbor.');
  });

  it('saves profile', async () => {
    let getCount = 0;
    apiFetch.mockImplementation(async (path, opts) => {
      if (path === '/profile/me' && opts?.method === 'PUT') {
        return {};
      }
      if (path === '/profile/me') {
        getCount += 1;
        if (getCount >= 2) {
          return {
            ...FULL_PROFILE,
            profile: { ...FULL_PROFILE.profile, bio: 'Updated bio line.' },
          };
        }
        return FULL_PROFILE;
      }
      return {};
    });

    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>,
    );

    await screen.findByText(/profile view/i);
    await userEvent.clear(screen.getByPlaceholderText(/tell roommates what/i));
    await userEvent.type(
      screen.getByPlaceholderText(/tell roommates what/i),
      'Updated bio line.',
    );

    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: /save profile/i }));
    });

    await waitFor(() =>
      expect(screen.getByText(/profile saved/i)).toBeInTheDocument(),
    );
    expect(apiFetch).toHaveBeenCalledWith(
      '/profile/me',
      expect.objectContaining({
        method: 'PUT',
        body: expect.objectContaining({ bio: 'Updated bio line.' }),
      }),
    );
  });

  it('shows validation when lifestyle fields would be empty on save', async () => {
    apiFetch.mockResolvedValue({
      ...FULL_PROFILE,
      profile: { ...FULL_PROFILE.profile, gender: '' },
    });

    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>,
    );

    await screen.findByText(/profile view/i);
    await userEvent.click(screen.getByRole('button', { name: /save profile/i }));

    expect(
      await screen.findByText(/please answer: how do you identify/i),
    ).toBeInTheDocument();
  });
});
