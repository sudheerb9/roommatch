import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { apiFetch } from '../utils/api';
import GroupAllotmentPage from './GroupAllotmentPage';

jest.mock('../utils/api', () => ({
  apiFetch: jest.fn(),
}));

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/groups/2/allotment']}>
      <Routes>
        <Route path="/groups/:groupId/allotment" element={<GroupAllotmentPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('GroupAllotmentPage', () => {
  beforeEach(() => {
    window.localStorage.setItem('roommatch_bearer_token', 't');
  });

  afterEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
  });

  it('shows no allotment when assignment is empty', async () => {
    apiFetch.mockImplementation(async (path) => {
      if (path === '/groups/2') return { group: { name: 'G2' } };
      if (path === '/groups/2/assignment') return { assignment: null };
      throw new Error(`unexpected ${path}`);
    });

    renderPage();

    expect(await screen.findByText(/no allotment yet/i)).toBeInTheDocument();
  });

  it('renders allotted unit when assignment exists', async () => {
    apiFetch.mockImplementation(async (path) => {
      if (path === '/groups/2') return { group: { name: 'G2' } };
      if (path === '/groups/2/assignment') {
        return {
          assignment: {
            housingUnit: {
              unit_code: 'W-9',
              building: 'West',
              bedrooms: 3,
              bathrooms: 2,
              floor: 2,
              amenities: { parking: true, laundry: true },
            },
          },
        };
      }
      throw new Error(`unexpected ${path}`);
    });

    renderPage();

    expect(await screen.findByText('W-9')).toBeInTheDocument();
    expect(screen.getByText(/allotted/i)).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText(/parking/i)).toBeInTheDocument());
  });
});
