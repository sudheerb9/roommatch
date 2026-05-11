import { render } from '@testing-library/react';
import FloatingElements from './floating-elements';

describe('FloatingElements', () => {
  it('renders without crashing', () => {
    const { container } = render(<FloatingElements />);
    expect(container.querySelector('.pointer-events-none')).toBeInTheDocument();
  });
});
