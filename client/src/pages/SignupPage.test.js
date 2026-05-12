import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import SignupPage from './SignupPage';

function renderSignup() {
  return render(
    <MemoryRouter initialEntries={['/signup']}>
      <Routes>
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/login" element={<div>Login route</div>} />
        <Route path="/" element={<div>Home route</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('SignupPage', () => {
  it('shows signup headline and form', () => {
    renderSignup();
    expect(screen.getByRole('heading', { name: /create your account/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/your full name/i)).toBeInTheDocument();
  });

  it('navigates home when Back to Home is pressed', async () => {
    renderSignup();
    await userEvent.click(screen.getByRole('button', { name: /back to home/i }));
    expect(await screen.findByText('Home route')).toBeInTheDocument();
  });

  it('navigates to login from footer link', async () => {
    renderSignup();
    await userEvent.click(screen.getByRole('button', { name: /^sign in$/i }));
    expect(await screen.findByText('Login route')).toBeInTheDocument();
  });
});
