import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { apiFetch } from '../utils/api';
import GroupInvitationsInboxPage from './GroupInvitationsInboxPage';

jest.mock('../utils/api', () => ({
  apiFetch: jest.fn(),
}));

describe('GroupInvitationsInboxPage', () => {
  beforeEach(() => {
    window.localStorage.setItem('roommatch_bearer_token', 't');
  });

  afterEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
  });

  it('shows empty pending copy when there are no invitations', async () => {
    apiFetch.mockResolvedValue({ invitations: [] });

    render(<GroupInvitationsInboxPage />);

    expect(await screen.findByRole('heading', { name: /invitations/i })).toBeInTheDocument();
    expect(
      await screen.findByText(/when someone invites you to a group/i),
    ).toBeInTheDocument();
  });

  it('lists a pending invitation', async () => {
    apiFetch.mockResolvedValue({
      invitations: [
        {
          id: 9,
          status: 'pending',
          created_at: '2026-01-02T12:00:00.000Z',
          group: { name: 'Hall Crew' },
          inviter: { display_name: 'Alex', email: 'a@b.com' },
        },
      ],
    });

    render(<GroupInvitationsInboxPage />);

    expect(await screen.findByText('Hall Crew')).toBeInTheDocument();
    expect(screen.getByText(/alex/i)).toBeInTheDocument();
  });

  it('shows load error with retry', async () => {
    apiFetch.mockRejectedValue(new Error('offline'));

    render(<GroupInvitationsInboxPage />);

    expect(await screen.findByText(/offline/i)).toBeInTheDocument();
    apiFetch.mockResolvedValue({ invitations: [] });
    await userEvent.click(screen.getByRole('button', { name: /^retry$/i }));
    await waitFor(() =>
      expect(screen.getByText(/when someone invites you to a group/i)).toBeInTheDocument(),
    );
  });
});
