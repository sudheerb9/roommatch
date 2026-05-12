import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import * as api from '../../utils/api';
import AuthForm from './AuthForm';

jest.mock('@react-oauth/google', () => ({
  GoogleLogin: ({ onSuccess, onError }) => (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={() => onSuccess({ credential: 'mock-google-credential' })}
      >
        Hidden Google trigger
      </div>
      <button type="button" onClick={() => onError()}>
        Simulate Google widget error
      </button>
    </div>
  ),
}));

function renderAuth() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login" element={<AuthForm />} />
        <Route path="/profile" element={<div>Profile route</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('AuthForm', () => {
  beforeEach(() => {
    window.localStorage.clear();
    jest.spyOn(api, 'setBearerToken').mockImplementation(() => {});
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          token: 'session-from-api',
          user: { id: 1, email: 'g@example.com' },
        }),
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('clicks through to Google success, stores token, and navigates to profile', async () => {
    renderAuth();

    await userEvent.click(screen.getByRole('button', { name: /sign in with google/i }));

    await waitFor(() =>
      expect(window.localStorage.getItem('roommatch_bearer_token')).toBe(
        'session-from-api',
      ),
    );
    expect(api.setBearerToken).toHaveBeenCalledWith('session-from-api');
    expect(await screen.findByText('Profile route')).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3001/auth/callback',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ credential: 'mock-google-credential' }),
      }),
    );
  });

  it('shows API error message when callback returns non-OK', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ message: 'Invalid credential' }),
    });

    renderAuth();
    await userEvent.click(screen.getByRole('button', { name: /sign in with google/i }));

    expect(await screen.findByText(/invalid credential/i)).toBeInTheDocument();
  });

  it('shows network error when fetch throws', async () => {
    global.fetch.mockRejectedValueOnce(new TypeError('failed'));

    renderAuth();
    await userEvent.click(screen.getByRole('button', { name: /sign in with google/i }));

    expect(
      await screen.findByText(/unable to connect to the server/i),
    ).toBeInTheDocument();
  });

  it('shows message when GoogleLogin reports onError', async () => {
    renderAuth();

    await userEvent.click(
      screen.getByRole('button', { name: /simulate google widget error/i }),
    );

    expect(
      await screen.findByText(/google sign in failed\. please try again/i),
    ).toBeInTheDocument();
  });
});
