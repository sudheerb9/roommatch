import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { apiFetch } from '../utils/api';
import GroupInvitationComposePage from './GroupInvitationComposePage';

jest.mock('../utils/api', () => ({
  apiFetch: jest.fn(),
}));

function renderCompose(path = '/groups/1/invite') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/groups/:groupId/invite" element={<GroupInvitationComposePage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('GroupInvitationComposePage', () => {
  beforeEach(() => {
    window.localStorage.setItem('roommatch_bearer_token', 't');
  });

  afterEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
  });

  it('loads group name and candidates after debounce', async () => {
    apiFetch.mockImplementation(async (path) => {
      if (path === '/groups/1') {
        return { group: { name: 'Study Hall' } };
      }
      if (path.startsWith('/groups/1/invite-candidates')) {
        return {
          current_members: [],
          candidates: [{ id: 22, email: 'c@d.com', display_name: 'Casey' }],
        };
      }
      throw new Error(`unexpected ${path}`);
    });

    renderCompose();

    expect(await screen.findByText('Study Hall', {}, { timeout: 4000 })).toBeInTheDocument();
    expect(await screen.findByText('Casey', {}, { timeout: 4000 })).toBeInTheDocument();
    expect(
      await screen.findByText(/invite people to/i, {}, { timeout: 4000 }),
    ).toBeInTheDocument();
  });
});
