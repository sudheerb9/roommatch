import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { apiFetch } from '../utils/api';
import GroupDetailPage from './GroupDetailPage';

jest.mock('../utils/api', () => ({
  apiFetch: jest.fn(),
}));

function renderWithGroupId(groupId) {
  return render(
    <MemoryRouter initialEntries={[`/groups/${groupId}`]}>
      <Routes>
        <Route path="/groups/:groupId" element={<GroupDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('GroupDetailPage', () => {
  beforeEach(() => {
    window.localStorage.setItem('roommatch_bearer_token', 't');
  });

  afterEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
  });

  it('shows invalid group id message', async () => {
    renderWithGroupId('bad');

    expect(
      await screen.findByRole('button', { name: /reload group/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/invalid group id/i)).toBeInTheDocument();
  });

  it('loads group header after successful fetch', async () => {
    apiFetch.mockImplementation(async (path) => {
      if (path === '/groups/5') {
        return { group: { id: 5, name: 'Team Alpha', status: 'forming' } };
      }
      if (path === '/groups/5/members') {
        return { members: [] };
      }
      if (path === '/groups/5/assignment') {
        return { assignment: null };
      }
      throw new Error(`unexpected ${path}`);
    });

    renderWithGroupId('5');

    expect(await screen.findByText('Team Alpha')).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.queryByText(/loading group details/i)).not.toBeInTheDocument(),
    );
  });
});
