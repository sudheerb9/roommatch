import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import ApiErrorState from './ApiErrorState';

function wrap(ui) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('ApiErrorState', () => {
  it('shows default title and message for unknown status', () => {
    wrap(<ApiErrorState />);
    expect(screen.getByRole('heading', { name: /something went wrong/i })).toBeInTheDocument();
    expect(
      screen.getByText(/an unexpected error occurred while loading this page/i),
    ).toBeInTheDocument();
  });

  it('shows 403 copy', () => {
    wrap(<ApiErrorState status={403} />);
    expect(screen.getByRole('heading', { name: /access denied/i })).toBeInTheDocument();
  });

  it('shows 404 copy', () => {
    wrap(<ApiErrorState status={404} />);
    expect(screen.getByRole('heading', { name: /not found/i })).toBeInTheDocument();
  });

  it('uses custom title and message', () => {
    wrap(<ApiErrorState title="Custom" message="Details here" />);
    expect(screen.getByRole('heading', { name: 'Custom' })).toBeInTheDocument();
    expect(screen.getByText('Details here')).toBeInTheDocument();
  });

  it('renders retry when onRetry provided', async () => {
    const onRetry = jest.fn();
    wrap(
      <ApiErrorState status={500} onRetry={onRetry} retryLabel="Reload group" />,
    );
    await userEvent.click(screen.getByRole('button', { name: /reload group/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('links to groups routes', () => {
    wrap(<ApiErrorState />);
    expect(screen.getByRole('link', { name: /my groups/i })).toHaveAttribute('href', '/groups');
    expect(screen.getByRole('link', { name: /group housing/i })).toHaveAttribute(
      'href',
      '/group-housing',
    );
  });
});
