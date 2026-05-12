import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { apiFetch } from '../utils/api';
import PreferencesPage from './PreferencesPage';

jest.mock('../utils/api', () => ({
  apiFetch: jest.fn(),
}));

const LOAD_PAYLOAD = {
  user: { id: 1, display_name: 'Me', email: 'me@example.com' },
  profile: { gender: 'cis_male' },
  preferences: {
    preferred_sleep_schedule: 'early_bird',
    preferred_cleanliness_level: 'clean',
    preferred_noise_tolerance: 'moderate',
    preferred_smoking_preference: 'no',
    preferred_drinking_preference: 'no',
    preferred_social_behavior: 'social',
    preferred_study_preferences: 'studious',
  },
  matching_eligible: true,
};

describe('PreferencesPage', () => {
  beforeEach(() => {
    window.localStorage.setItem('roommatch_bearer_token', 't');
  });

  afterEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
  });

  it('loads preferences from profile/me', async () => {
    apiFetch.mockResolvedValue(LOAD_PAYLOAD);

    render(
      <MemoryRouter>
        <PreferencesPage />
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole('heading', { level: 1, name: /roommate/i }),
    ).toBeInTheDocument();
    const sleepSelect = screen.getByLabelText(/preferred sleep schedule/i);
    expect(sleepSelect).toHaveValue('early_bird');
  });

  it('saves preferences on submit', async () => {
    apiFetch.mockResolvedValueOnce(LOAD_PAYLOAD);
    apiFetch.mockResolvedValueOnce({});

    render(
      <MemoryRouter>
        <PreferencesPage />
      </MemoryRouter>,
    );

    await screen.findByLabelText(/preferred sleep schedule/i);
    await userEvent.selectOptions(
      screen.getByLabelText(/preferred sleep schedule/i),
      'night_owl',
    );
    await userEvent.click(
      screen.getByRole('button', { name: /save roommate preferences/i }),
    );

    await waitFor(() => expect(screen.getByText(/saved/i)).toBeInTheDocument());
    expect(apiFetch).toHaveBeenCalledWith(
      '/profile/me',
      expect.objectContaining({
        method: 'PUT',
        body: expect.objectContaining({
          preferred_sleep_schedule: 'night_owl',
        }),
      }),
    );
  });

  it('shows load error', async () => {
    apiFetch.mockRejectedValue(new Error('prefs unavailable'));

    render(
      <MemoryRouter>
        <PreferencesPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText(/prefs unavailable/i)).toBeInTheDocument();
  });
});
