import React from 'react';
import type { ReactNode } from 'react';

import type { CSSProperties } from '@actual-app/components/styles';
import { View } from '@actual-app/components/view';

import {
  shellColors,
  shellRadius,
  shellShadow,
} from '#components/appshell/shellTheme';

type SurfaceProps = {
  children: ReactNode;
  /** Raises the panel and warms the hairline. For the one panel that leads. */
  emphasized?: boolean;
  /** Drops the fill and keeps only the hairline: a group, not a card. */
  plain?: boolean;
  style?: CSSProperties;
};

/**
 * The single panel primitive of the V2 pages.
 *
 * Following the product reference, a panel sits only a few levels above the
 * canvas — it reads as a separate surface through its radius, its hairline and
 * the space around it, not through a brighter fill. That is what stops a screen
 * full of data from looking like a spreadsheet with borders.
 */
export function Surface({
  children,
  emphasized = false,
  plain = false,
  style,
}: SurfaceProps) {
  return (
    <View
      style={{
        backgroundColor: plain
          ? 'transparent'
          : emphasized
            ? shellColors.surfaceElevated
            : shellColors.surface,
        border: `1px solid ${emphasized ? shellColors.borderStrong : shellColors.border}`,
        borderRadius: shellRadius.card,
        boxShadow: plain ? undefined : shellShadow,
        overflow: 'hidden',
        ...style,
      }}
    >
      {children}
    </View>
  );
}
