import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

test('shows Profile View badge on profile page', async () => {
  render(
    <MemoryRouter initialEntries={['/profile']}>
      <App />
    </MemoryRouter>,
  );

  const badge = await screen.findByText(/profile view/i);
  expect(badge).toBeInTheDocument();
});

test('shows preferences page headline', async () => {
  render(
    <MemoryRouter initialEntries={['/preferences']}>
      <App />
    </MemoryRouter>,
  );

  const headline = await screen.findByText(/curate your/i);
  expect(headline).toBeInTheDocument();
});
