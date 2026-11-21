import { render } from '@testing-library/react';
import {
  ArrowLeft,
  BotCheck,
  Cinema,
  Doghouse,
  HandTruck,
  HouseArrowLeft,
  HouseArrowRight,
  Loader2,
  NigerianNaira,
  StrokeWidth,
  WarehouseWaves,
} from 'lucide-react';

describe('lucide-react icon compatibility', () => {
  it('keeps existing app icons and exposes the 1.74 renamed and added icons', () => {
    const icons = [
      ArrowLeft,
      Loader2,
      NigerianNaira,
      StrokeWidth,
      BotCheck,
      Cinema,
      Doghouse,
      HandTruck,
      HouseArrowLeft,
      HouseArrowRight,
      WarehouseWaves,
    ];

    const { container } = render(
      <>
        {icons.map((Icon, index) => (
          <Icon key={index} data-testid={`icon-${index}`} />
        ))}
      </>,
    );

    expect(container.querySelectorAll('svg')).toHaveLength(icons.length);
  });
});
