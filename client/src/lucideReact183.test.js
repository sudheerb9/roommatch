import { render } from '@testing-library/react';
import * as LucideIcons from 'lucide-react';

// Icons added in lucide-react 1.83.0. They are not exported by the version
// currently pinned by the app, so this test fails until the dependency is
// bumped and guards that the icons the app expects remain available.
const ICONS_ADDED_IN_1_83 = [
  'MailSend',
  'Balcony',
  'BoxingGlove',
  'StairsArrowDownLeft',
  'StairsArrowUpRight',
  'ChevronsDownUpOffset',
  'ChevronsRightLeftOffset',
  'SquareTextAlignBottomCenter',
];

describe('lucide-react 1.83 icon compatibility', () => {
  it('exposes the icons added in lucide-react 1.83.0', () => {
    ICONS_ADDED_IN_1_83.forEach((iconName) => {
      expect(LucideIcons[iconName]).toBeDefined();
    });

    const { container } = render(
      <>
        {ICONS_ADDED_IN_1_83.map((iconName) => {
          const Icon = LucideIcons[iconName];
          return <Icon key={iconName} data-testid={iconName} />;
        })}
      </>,
    );

    expect(container.querySelectorAll('svg')).toHaveLength(
      ICONS_ADDED_IN_1_83.length,
    );
  });
});
