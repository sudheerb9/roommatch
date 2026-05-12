import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import HomePage from './HomePage';

describe('HomePage', () => {
  function renderHome() {
    return render(
      <MemoryRouter>
        <HomePage onLoginClick={jest.fn()} />
      </MemoryRouter>,
    );
  }

  it('renders marketing sections', () => {
    renderHome();
    expect(screen.getByText(/why choose roommatch/i)).toBeInTheDocument();
    expect(screen.getByText(/simplicity at its best/i)).toBeInTheDocument();
  });

  it('calls onLoginClick when Get Started is pressed', async () => {
    const onLoginClick = jest.fn();
    render(
      <MemoryRouter>
        <HomePage onLoginClick={onLoginClick} />
      </MemoryRouter>,
    );
    await userEvent.click(
      screen.getByRole('button', { name: /^get started$/i }),
    );
    expect(onLoginClick).toHaveBeenCalled();
  });
});
