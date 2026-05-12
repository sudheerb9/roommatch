import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { apiFetch } from '../utils/api';
import MatchesPage from './MatchesPage';

jest.mock('../utils/api', () => ({
  apiFetch: jest.fn(),
}));

function renderMatches() {
  return render(
    <MemoryRouter initialEntries={['/matches']}>
      <Routes>
        <Route path="/matches" element={<MatchesPage />} />
        <Route path="/chat" element={<div>Chat stub</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('MatchesPage', () => {
  beforeEach(() => {
    window.localStorage.setItem('roommatch_bearer_token', 't');
  });

  afterEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
  });

  it('shows error and retry', async () => {
    apiFetch.mockRejectedValue(new Error('matches down'));

    renderMatches();

    expect(await screen.findByText(/matches down/i)).toBeInTheDocument();
    apiFetch.mockResolvedValue({
      items: [],
      meta: { matching_eligible: true },
    });
    await userEvent.click(screen.getByRole('button', { name: /retry/i }));
    expect(await screen.findByText(/no matches yet/i)).toBeInTheDocument();
  });

  it('shows not eligible empty state', async () => {
    apiFetch.mockResolvedValue({
      items: [],
      meta: { matching_eligible: false },
    });

    renderMatches();

    expect(await screen.findByText(/matching not active yet/i)).toBeInTheDocument();
  });

  it('expands profile and opens chat', async () => {
    apiFetch.mockImplementation(async (path) => {
      if (String(path).startsWith('/matches?')) {
        return {
          items: [
            {
              user_id: 9,
              display_name: 'Sam Lee',
              email: 'sam@example.com',
              score: 88,
            },
          ],
          meta: { hasMore: false, matching_eligible: true, page: 1, count: 1 },
        };
      }
      if (path === '/profile/9') {
        return { profile: { bio: 'Runner and reader.' }, user: { id: 9 } };
      }
      return {};
    });

    renderMatches();

    expect(await screen.findByText('Sam Lee')).toBeInTheDocument();
    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: /view details/i }));
    });
    expect(await screen.findByText(/runner and reader/i)).toBeInTheDocument();

    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: /start chat/i }));
    });
    expect(await screen.findByText('Chat stub')).toBeInTheDocument();
  });
});
