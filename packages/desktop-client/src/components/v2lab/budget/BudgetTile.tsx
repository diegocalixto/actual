import React from 'react';

import { View } from '@actual-app/components/view';

import type { BudgetIcon } from './budgetFixtures';
import { BUDGET_HUE } from './budgetTokens';
import type { BudgetHue } from './budgetTokens';

type BudgetTileProps = {
  Icon: BudgetIcon;
  hue: BudgetHue;
  size?: number;
  /** Circular instead of squircle — used by the advice list. */
  round?: boolean;
  /** A wider, brighter halo. For the few tiles that carry a whole card. */
  glow?: boolean;
};

/**
 * The icon tile at the head of every row.
 *
 * Same construction as the approved Overview's tile — one hue, a dark tinted
 * surface, a hairline a shade stronger, the glyph luminous on top — reimplemented
 * here rather than imported because Budget needs two hues the shared ramp does
 * not define, and editing the shared ramp would touch approved work.
 */
export function BudgetTile({
  Icon,
  hue,
  size = 40,
  round = false,
  glow = false,
}: BudgetTileProps) {
  const color = BUDGET_HUE[hue];

  return (
    <View
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        flexShrink: 0,
        borderRadius: round ? '50%' : size * 0.29,
        alignItems: 'center',
        justifyContent: 'center',
        color,
        backgroundImage: glow
          ? `radial-gradient(circle at 32% 26%, color-mix(in srgb, ${color} 40%, #0a0f18) 0%, color-mix(in srgb, ${color} 14%, #070b12) 62%, color-mix(in srgb, ${color} 6%, #05070c) 100%)`
          : `linear-gradient(145deg, color-mix(in srgb, ${color} 24%, #0a0f18) 0%, color-mix(in srgb, ${color} 9%, #06080e) 100%)`,
        border: `1px solid color-mix(in srgb, ${color} ${glow ? 38 : 26}%, transparent)`,
        boxShadow: glow
          ? `inset 0 1px 0 color-mix(in srgb, ${color} 36%, transparent), 0 0 0 5px color-mix(in srgb, ${color} 7%, transparent), 0 6px 22px -8px color-mix(in srgb, ${color} 70%, transparent)`
          : `inset 0 1px 0 color-mix(in srgb, ${color} 22%, transparent), 0 2px 8px -5px color-mix(in srgb, ${color} 55%, transparent)`,
      }}
    >
      <Icon
        width={size * (glow ? 0.5 : 0.45)}
        height={size * (glow ? 0.5 : 0.45)}
      />
    </View>
  );
}
