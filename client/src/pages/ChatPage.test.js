import { act, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { apiFetch } from '../utils/api';
import ChatPage from './ChatPage';

jest.mock('../utils/api', () => ({
  apiFetch: jest.fn(),
}));

function renderChat(search = '') {
  return render(
    <MemoryRouter initialEntries={[`/chat${search}`]}>
      <Routes>
        <Route path="/chat" element={<ChatPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ChatPage', () => {
  let intervalSpy;

  beforeEach(() => {
    window.localStorage.setItem('roommatch_bearer_token', 't');
    intervalSpy = jest.spyOn(window, 'setInterval').mockReturnValue(999);
  });

  afterEach(() => {
    intervalSpy.mockRestore();
    jest.clearAllMocks();
    window.localStorage.clear();
  });

  it('bootstraps a direct chat with a match candidate', async () => {
    apiFetch.mockImplementation(async (path, opts) => {
      if (path === '/profile/me') return { user: { id: 1 } };
      if (path === '/matches?page=1&limit=100') {
        return {
          items: [
            {
              user_id: 2,
              display_name: 'Riley',
              email: 'r@example.com',
            },
          ],
        };
      }
      if (path === '/groups') return { groups: [] };
      if (path === '/chats' && opts?.method === 'POST') {
        return { chat: { id: 50 } };
      }
      if (path.startsWith('/chats/50/messages')) {
        return { messages: [] };
      }
      throw new Error(`unexpected ${path}`);
    });

    await act(async () => {
      renderChat();
    });

    expect((await screen.findAllByText(/riley/i)).length).toBeGreaterThan(0);
  });
});
