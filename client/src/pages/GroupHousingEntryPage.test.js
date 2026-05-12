import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import GroupHousingEntryPage from './GroupHousingEntryPage';

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/entry']}>
      <Routes>
        <Route path="/entry" element={<GroupHousingEntryPage />} />
        <Route
          path="/groups/:groupId/housing-preferences"
          element={<div>Housing prefs page</div>}
        />
        <Route
          path="/groups/:groupId/matches"
          element={<div>Group matches page</div>}
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe('GroupHousingEntryPage', () => {
  it('shows validation for invalid group code', async () => {
    renderPage();
    await userEvent.type(screen.getByLabelText(/group code/i), 'x');
    await userEvent.click(screen.getByRole('button', { name: /housing preferences/i }));
    expect(screen.getByRole('alert')).toHaveTextContent(/valid group code/i);
  });

  it('navigates to housing preferences', async () => {
    renderPage();
    await userEvent.type(screen.getByLabelText(/group code/i), '7');
    await userEvent.click(screen.getByRole('button', { name: /housing preferences/i }));
    expect(await screen.findByText('Housing prefs page')).toBeInTheDocument();
  });

  it('navigates to group matches', async () => {
    renderPage();
    await userEvent.type(screen.getByLabelText(/group code/i), '7');
    await userEvent.click(screen.getByRole('button', { name: /matches & assignment/i }));
    expect(await screen.findByText('Group matches page')).toBeInTheDocument();
  });
});
