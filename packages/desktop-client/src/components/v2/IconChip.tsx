import React from 'react';
import type { ComponentType, SVGProps } from 'react';

import { View } from '@actual-app/components/view';

import { shellColors, shellRadius } from '#components/appshell/shellTheme';

type IconChipProps = {
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  size?: number;
  /** `accent` marks the primary kind; `muted` everything else. */
  tone?: 'accent' | 'muted' | 'positive' | 'negative';
};

/**
 * The rounded-square icon tile the reference puts at the head of every list
 * row. It gives a list a rhythm without adding a border per item.
 */
export function IconChip({ Icon, size = 34, tone = 'muted' }: IconChipProps) {
  const color =
    tone === 'accent'
      ? shellColors.accent
      : tone === 'positive'
        ? shellColors.positive
        : tone === 'negative'
          ? shellColors.negative
          : shellColors.textSecondary;

  return (
    <View
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        flexShrink: 0,
        borderRadius: shellRadius.chip,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor:
          tone === 'accent'
            ? shellColors.accentSoft
            : shellColors.surfaceSunken,
        color,
      }}
    >
      <Icon width={size * 0.47} height={size * 0.47} />
    </View>
  );
}
