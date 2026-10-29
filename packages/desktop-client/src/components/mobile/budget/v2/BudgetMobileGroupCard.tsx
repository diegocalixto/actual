import React from 'react';
import type { ReactNode } from 'react';

import { View } from '@actual-app/components/view';

import { budgetLayout } from './BudgetMobileStyle';

type BudgetMobileGroupCardProps = {
  children: ReactNode;
};

/**
 * The panel a group and its categories sit on.
 *
 * One surface per group, clipped to its own radius so the header's tint and the
 * last row's edge both stop where the card does. Separation from the ground
 * comes from the hairline and the space around it rather than from a brighter
 * fill — the rule every V2 surface follows.
 */
export function BudgetMobileGroupCard({
  children,
}: BudgetMobileGroupCardProps) {
  return (
    <View
      style={{
        marginBottom: budgetLayout.stackGap,
        borderRadius: 'var(--dfmb-radius)',
        border: '1px solid var(--dfl-line-strong)',
        backgroundColor: 'var(--dfl-surface)',
        backgroundImage: 'var(--dfmb-panel-sheen)',
        boxShadow: 'var(--dfl-shadow), 0 1px 0 rgba(0, 0, 0, 0.5)',
        overflow: 'hidden',
      }}
    >
      {children}
    </View>
  );
}
