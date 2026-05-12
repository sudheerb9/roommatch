import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SignupForm from './SignupForm';

describe('SignupForm', () => {
  beforeEach(() => {
    window.localStorage.clear();
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          token: 'new-token',
          user: { id: 1, email: 'a@b.com', display_name: 'A' },
        }),
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('submits registration and stores token', async () => {
    const onSuccess = jest.fn();
    render(<SignupForm onSuccess={onSuccess} />);

    await userEvent.type(screen.getByPlaceholderText(/your full name/i), 'Alex');
    await userEvent.type(screen.getByPlaceholderText(/you@example.com/i), 'alex@example.com');
    await userEvent.type(screen.getByPlaceholderText(/create a password/i), 'secret123');
    await userEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
    expect(window.localStorage.getItem('roommatch_token')).toBe('new-token');
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3001/auth/register',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('shows server error message when registration fails', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ message: 'Email already registered' }),
    });

    render(<SignupForm />);
    await userEvent.type(screen.getByPlaceholderText(/your full name/i), 'Alex');
    await userEvent.type(screen.getByPlaceholderText(/you@example.com/i), 'dup@example.com');
    await userEvent.type(screen.getByPlaceholderText(/create a password/i), 'secret123');
    await userEvent.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByText(/email already registered/i)).toBeInTheDocument();
  });
});
