import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { apiFetch } from '../utils/api';
import GroupMatchesPage from './GroupMatchesPage';

jest.mock('../utils/api', () => ({
  apiFetch: jest.fn(),
}));

function renderMatches(groupIdSegment) {
  return render(
    <MemoryRouter initialEntries={[`/groups/${groupIdSegment}/matches`]}>
      <Routes>
        <Route path="/groups/:groupId/matches" element={<GroupMatchesPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('GroupMatchesPage', () => {
  beforeEach(() => {
    window.localStorage.setItem('roommatch_bearer_token', 't');
  });

  afterEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
  });

  it('shows invalid group link for bad id', () => {
    renderMatches('nope');
    expect(screen.getByText(/invalid group link/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to groups/i })).toBeInTheDocument();
  });

  it('loads matches and empty state', async () => {
    apiFetch.mockResolvedValue({
      group: { name: 'G', status: 'ready' },
      items: [],
      meta: { hasMore: false, count: 0 },
    });

    renderMatches('4');

    expect(await screen.findByText(/no matching candidates/i)).toBeInTheDocument();
    expect(screen.getByText(/status:\s*ready for allotment/i)).toBeInTheDocument();
  });

  it('shows retry when fetch fails', async () => {
    apiFetch.mockRejectedValue(new Error('network down'));

    renderMatches('4');

    expect(await screen.findByText(/network down/i)).toBeInTheDocument();
    apiFetch.mockResolvedValue({
      group: { name: 'G' },
      items: [],
      meta: {},
    });
    await userEvent.click(screen.getByRole('button', { name: /retry/i }));
    await waitFor(() =>
      expect(screen.getByText(/no matching candidates/i)).toBeInTheDocument(),
    );
  });
});
