import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import HomeRedirect from './HomeRedirect';

describe('HomeRedirect', () => {
  it('redirects to /profile', () => {
    render(
      <MemoryRouter initialEntries={['/any']}>
        <Routes>
          <Route path="/any" element={<HomeRedirect />} />
          <Route path="/profile" element={<div>Profile destination</div>} />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByText('Profile destination')).toBeInTheDocument();
  });
});
