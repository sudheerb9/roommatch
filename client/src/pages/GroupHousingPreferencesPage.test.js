import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { apiFetch } from '../utils/api';
import GroupHousingPreferencesPage from './GroupHousingPreferencesPage';

jest.mock('../utils/api', () => ({
  apiFetch: jest.fn(),
}));

function renderPage(groupId) {
  return render(
    <MemoryRouter initialEntries={[`/groups/${groupId}/housing-preferences`]}>
      <Routes>
        <Route
          path="/groups/:groupId/housing-preferences"
          element={<GroupHousingPreferencesPage />}
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe('GroupHousingPreferencesPage', () => {
  beforeEach(() => {
    window.localStorage.setItem('roommatch_bearer_token', 't');
  });

  afterEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
  });

  it('shows invalid group link for non-numeric id', () => {
    renderPage('abc');
    expect(screen.getByText(/invalid group link/i)).toBeInTheDocument();
  });

  it('loads form after successful fetch', async () => {
    apiFetch.mockImplementation(async (path) => {
      if (path === '/groups/6/housing-preferences') {
        return { housing_preferences: null };
      }
      if (path === '/groups/6') {
        return { group: { name: 'Sixers' } };
      }
      throw new Error(`unexpected ${path}`);
    });

    renderPage('6');

    expect(
      await screen.findByText(/housing preferences for/i),
    ).toBeInTheDocument();
    expect(await screen.findByText('Sixers')).toBeInTheDocument();
    expect(
      screen.getByText(/describes what kind of apartment/i),
    ).toBeInTheDocument();
  });
});
