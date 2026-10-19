import React from 'react';
import type { ReactNode } from 'react';

import { Text } from '@actual-app/components/text';
import { View } from '@actual-app/components/view';

import type { EntityIcon } from '#components/v2lab/LabStyle';

type MobileBudgetNavItemProps = {
  label: ReactNode;
  Icon: EntityIcon;
  /** Degrees to turn the glyph by, for icons the library ships rotated. */
  iconRotation?: number;
  isActive?: boolean;
};

/**
 * One destination in the bar.
 *
 * Drawn, not wired: this is a laboratory, the real bar lives in
 * `appshell/AppBottomNav`, and a second set of working links would be two
 * navigations claiming the same job. Violet marks the active destination, which
 * on this screen is Budget.
 */
export function MobileBudgetNavItem({
  label,
  Icon,
  iconRotation,
  isActive,
}: MobileBudgetNavItemProps) {
  const tone = isActive ? 'var(--dfl-violet)' : 'var(--dfl-text-3)';

  return (
    <View
      style={{
        flex: '1 1 0',
        minWidth: 0,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
      }}
    >
      <Icon
        aria-hidden="true"
        width={20}
        height={20}
        style={{
          color: tone,
          transform: iconRotation ? `rotate(${iconRotation}deg)` : undefined,
        }}
      />
      <Text
        style={{
          fontSize: 10,
          fontWeight: isActive ? 600 : 500,
          letterSpacing: 0.1,
          whiteSpace: 'nowrap',
          color: tone,
        }}
      >
        {label}
      </Text>
    </View>
  );
}
