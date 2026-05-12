import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { apiFetch } from '../utils/api';
import HousingUnitsPage from './HousingUnitsPage';

function renderUnits() {
  return render(
    <MemoryRouter>
      <HousingUnitsPage />
    </MemoryRouter>,
  );
}

jest.mock('../utils/api', () => ({
  apiFetch: jest.fn(),
}));

describe('HousingUnitsPage', () => {
  beforeEach(() => {
    window.localStorage.setItem('roommatch_bearer_token', 't');
  });

  afterEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
  });

  it('loads and lists units', async () => {
    apiFetch.mockResolvedValue({
      items: [
        {
          id: 1,
          unit_code: 'N-101',
          is_available: true,
          building: 'North',
          bedrooms: 2,
          bathrooms: 1,
        },
      ],
    });

    renderUnits();

    expect(await screen.findByRole('heading', { name: /housing units/i })).toBeInTheDocument();
    expect(await screen.findByText('N-101')).toBeInTheDocument();
    expect(screen.getByText(/1 available/i)).toBeInTheDocument();
  });

  it('shows error state when apiFetch fails', async () => {
    const err = new Error('Server error');
    err.status = 500;
    apiFetch.mockRejectedValue(err);

    renderUnits();

    expect(await screen.findByText(/server error/i)).toBeInTheDocument();
  });

  it('changes filter and refetches', async () => {
    apiFetch.mockResolvedValue({ items: [] });

    renderUnits();
    await screen.findByRole('heading', { level: 1, name: /housing units/i });
    await waitFor(() =>
      expect(apiFetch).toHaveBeenCalledWith('/housing-units?available=true'),
    );

    await userEvent.selectOptions(screen.getByRole('combobox'), 'all');
    await waitFor(() =>
      expect(apiFetch).toHaveBeenCalledWith('/housing-units'),
    );
  });
});
