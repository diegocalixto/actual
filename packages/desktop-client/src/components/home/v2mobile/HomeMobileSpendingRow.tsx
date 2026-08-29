import React from 'react';

import { TextOneLine } from '@actual-app/components/text-one-line';
import { View } from '@actual-app/components/view';

import { FinancialText } from '#components/FinancialText';
import type { HomeCategorySpending } from '#components/home/useHomeCategorySpending';
import { iconForCategory } from '#components/v2lab/LabStyle';

import { HomeMobileIconTile } from './HomeMobileIconTile';
import { CURRENCY, formatAmount } from './mobileMoneyFormat';

type HomeMobileSpendingRowProps = {
  entry: HomeCategorySpending;
  /**
   * The month's official `total-spent` cell when it is an outflow, else `null`.
   * Shares are taken against the month's own total rather than the sum of the
   * rows shown, which is the financially correct denominator — and also why the
   * visible shares need not add up to 100%: refunded categories are left out of
   * the list but still counted in the total.
   */
  denominator: number | null;
};

/**
 * One category's share of the month.
 *
 * The bar restates the percentage beside it and nothing else — it is not a
 * budget or a target, neither of which this row reads. The row carries no
 * chevron: the panel's header is what opens the budget, and a second arrow
 * here would promise a destination the row does not have.
 */
export function HomeMobileSpendingRow({
  entry,
  denominator,
}: HomeMobileSpendingRowProps) {
  const Icon = iconForCategory(entry.category.name);

  // Both values are negative, so the ratio comes out positive.
  const share = denominator === null ? null : entry.amount / denominator;
  const barWidth = share === null ? 0 : Math.min(Math.max(share, 0.02), 1);
  // A share above 100% is real — refunds elsewhere can shrink the month's net
  // total below a single category's outflow — but printing "118%" reads as a
  // bug, so the bar saturates and the number is left off.
  const percent =
    share !== null && share >= 0 && share <= 1 ? Math.round(share * 100) : null;

  const amount = `${CURRENCY} ${formatAmount(Math.abs(entry.amount))}`;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: '10px 14px',
      }}
    >
      <HomeMobileIconTile Icon={Icon} hue="var(--dfl-hue-crimson)" />

      <View style={{ flex: '0 1 auto', minWidth: 0, gap: 1 }}>
        <TextOneLine
          style={{
            fontSize: 15,
            fontWeight: 600,
            letterSpacing: -0.2,
            color: 'var(--dfl-text)',
          }}
        >
          {entry.category.name}
        </TextOneLine>
        <FinancialText
          style={{
            fontSize: 12,
            whiteSpace: 'nowrap',
            color: 'var(--dfl-text-3)',
          }}
        >
          {percent === null ? amount : `${percent}% • ${amount}`}
        </FinancialText>
      </View>

      <View
        aria-hidden="true"
        style={{
          flex: 1,
          minWidth: 40,
          height: 5,
          borderRadius: 999,
          backgroundColor: 'var(--dfl-inset)',
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            width: `${barWidth * 100}%`,
            height: '100%',
            borderRadius: 999,
            backgroundColor: 'var(--dfl-negative)',
          }}
        />
      </View>
    </View>
  );
}
