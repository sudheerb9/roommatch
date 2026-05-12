import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import AppLayout from './AppLayout';
import * as api from '../utils/api';

describe('AppLayout', () => {
  beforeEach(() => {
    jest.spyOn(api, 'getBearerToken').mockReturnValue('fake-token');
    jest.spyOn(api, 'setBearerToken').mockImplementation(() => {});
    window.localStorage.setItem('roommatch_bearer_token', 'fake-token');
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    window.localStorage.clear();
  });

  it('renders outlet and logout calls API then clears token', async () => {
    render(
      <MemoryRouter initialEntries={['/profile']}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/profile" element={<div>Profile body</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText('Profile body')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /^logout$/i }));

    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3001/auth/logout',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer fake-token',
          }),
        }),
      ),
    );
    expect(window.localStorage.getItem('roommatch_bearer_token')).toBeNull();
  });
});
