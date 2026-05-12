import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import GroupInvitationEntryPage from './GroupInvitationEntryPage';

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/entry']}>
      <Routes>
        <Route path="/entry" element={<GroupInvitationEntryPage />} />
        <Route
          path="/groups/:groupId/invite"
          element={<div>Invite hub</div>}
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe('GroupInvitationEntryPage', () => {
  it('shows validation when group code is not numeric', async () => {
    renderPage();
    await userEvent.type(screen.getByLabelText(/group code/i), 'abc');
    await userEvent.click(screen.getByRole('button', { name: /continue/i }));
    expect(screen.getByRole('alert')).toHaveTextContent(/valid group code/i);
  });

  it('navigates to invite flow for a numeric code', async () => {
    renderPage();
    await userEvent.type(screen.getByLabelText(/group code/i), '42');
    await userEvent.click(screen.getByRole('button', { name: /continue/i }));
    expect(await screen.findByText('Invite hub')).toBeInTheDocument();
  });
});
