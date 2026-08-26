import React from 'react';

import { View } from '@actual-app/components/view';

import { BUDGET_HUE } from './budgetTokens';
import type { BudgetHue } from './budgetTokens';

type BudgetBarProps = {
  /** spent ÷ budgeted. Values above 1 mean the envelope is overspent. */
  ratio: number;
  hue: BudgetHue;
};

/**
 * How much of an envelope is consumed.
 *
 * The fill length *is* the ratio between the two amounts printed on the same
 * row — nothing decorative, nothing padded to look full. A floor of 2% keeps a
 * barely-touched envelope from reading as a rendering fault; past that the
 * length is linear, so two bars can be compared by eye. Overspend switches the
 * fill to the negative colour and pins it at full width, because "more than
 * everything" has no length.
 */
export function BudgetBar({ ratio, hue }: BudgetBarProps) {
  const isOverspent = ratio > 1;
  const filled = Math.max(0.02, Math.min(1, ratio));
  const color = isOverspent ? 'var(--dfl-negative)' : BUDGET_HUE[hue];

  return (
    <View
      style={{
        height: 8,
        borderRadius: 999,
        backgroundColor: 'rgba(6, 10, 18, 0.9)',
        border: '1px solid var(--dfl-line-strong)',
        overflow: 'hidden',
      }}
    >
      <View
        style={{
          width: `${filled * 100}%`,
          height: '100%',
          borderRadius: 999,
          backgroundImage: `linear-gradient(90deg, color-mix(in srgb, ${color} 55%, transparent) 0%, ${color} 100%)`,
          boxShadow: `0 0 10px -2px color-mix(in srgb, ${color} 60%, transparent)`,
        }}
      />
    </View>
  );
}
