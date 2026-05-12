import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { apiFetch } from '../utils/api';
import GroupsPage from './GroupsPage';

jest.mock('../utils/api', () => ({
  apiFetch: jest.fn(),
}));

describe('GroupsPage', () => {
  beforeEach(() => {
    window.localStorage.setItem('roommatch_bearer_token', 't');
  });

  afterEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
  });

  it('renders empty state when user has no groups', async () => {
    apiFetch.mockImplementation(async (path) => {
      if (path === '/groups') return { groups: [] };
      throw new Error(`unexpected ${path}`);
    });

    render(
      <MemoryRouter>
        <GroupsPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole('heading', { name: /my groups/i })).toBeInTheDocument();
    expect(await screen.findByText(/no groups yet/i)).toBeInTheDocument();
  });

  it('lists a group after load', async () => {
    apiFetch.mockImplementation(async (path) => {
      if (path === '/groups') {
        return {
          groups: [{ id: '3', name: 'Floor 4 Crew', status: 'forming' }],
        };
      }
      if (path === '/groups/3/assignment') {
        return { assignment: null };
      }
      throw new Error(`unexpected ${path}`);
    });

    render(
      <MemoryRouter>
        <GroupsPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText('Floor 4 Crew')).toBeInTheDocument();
  });

  it('opens create-group panel from button', async () => {
    apiFetch.mockImplementation(async (path) => {
      if (path === '/groups') return { groups: [] };
      throw new Error(`unexpected ${path}`);
    });

    render(
      <MemoryRouter>
        <GroupsPage />
      </MemoryRouter>,
    );

    await screen.findByText(/no groups yet/i);
    await userEvent.click(screen.getByRole('button', { name: /create group/i }));
    expect(
      screen.getByRole('heading', { name: /create a new group/i }),
    ).toBeInTheDocument();
  });

  it('shows error panel when list fails', async () => {
    const err = new Error('boom');
    err.status = 503;
    apiFetch.mockRejectedValue(err);

    render(
      <MemoryRouter>
        <GroupsPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText(/boom/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reload groups/i })).toBeInTheDocument();
  });
});
