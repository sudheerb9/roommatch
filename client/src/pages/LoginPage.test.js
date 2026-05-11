import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import LoginPage from './LoginPage';

function renderLogin(onBack) {
  return render(
    <MemoryRouter>
      <LoginPage onBack={onBack} />
    </MemoryRouter>,
  );
}

describe('LoginPage', () => {
  it('shows welcome copy and back button', () => {
    const onBack = jest.fn();
    renderLogin(onBack);
    expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /back to home/i })).toBeInTheDocument();
  });

  it('calls onBack when Back is pressed', async () => {
    const onBack = jest.fn();
    renderLogin(onBack);
    await userEvent.click(screen.getByRole('button', { name: /back to home/i }));
    expect(onBack).toHaveBeenCalled();
  });
});
