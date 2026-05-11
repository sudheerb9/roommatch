import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './button';

describe('Button', () => {
  it('renders children', () => {
    render(<Button type="button">Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('applies size classes for lg', () => {
    const { container } = render(
      <Button type="button" size="lg">
        Big
      </Button>,
    );
    const btn = container.querySelector('button');
    expect(btn.className).toMatch(/text-lg/);
  });

  it('forwards click handler', async () => {
    const onClick = jest.fn();
    render(
      <Button type="button" onClick={onClick}>
        Go
      </Button>,
    );
    await userEvent.click(screen.getByRole('button', { name: /go/i }));
    expect(onClick).toHaveBeenCalled();
  });
});
