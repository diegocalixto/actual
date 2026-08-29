import React from 'react';
import type { ReactNode } from 'react';

import type { CSSProperties } from '@actual-app/components/styles';
import { View } from '@actual-app/components/view';

import {
  shellColors,
  shellRadius,
  shellShadow,
} from '#components/appshell/shellTheme';

type DashboardCardProps = {
  children: ReactNode;
  /** Raises the surface and adds the accent wash. Reserved for the hero. */
  emphasized?: boolean;
  style?: CSSProperties;
};

/**
 * The single surface primitive of the dashboard. Every panel on the Home is
 * this card, so elevation and corner radius can only be tuned in one place.
 */
export function DashboardCard({
  children,
  emphasized = false,
  style,
}: DashboardCardProps) {
  return (
    <View
      style={{
        backgroundColor: emphasized
          ? shellColors.surfaceElevated
          : shellColors.surface,
        border: `1px solid ${emphasized ? shellColors.borderStrong : shellColors.border}`,
        borderRadius: shellRadius.card,
        boxShadow: shellShadow,
        // The wash is anchored to the top-right corner and fades out well
        // before the middle, so it reads as light falling on the panel rather
        // than as a gradient fill competing with the numbers.
        backgroundImage: emphasized
          ? 'radial-gradient(120% 140% at 100% 0%, color-mix(in srgb, var(--palette-blue400) 20%, transparent) 0%, transparent 62%)'
          : undefined,
        overflow: 'hidden',
        ...style,
      }}
    >
      {children}
    </View>
  );
}
