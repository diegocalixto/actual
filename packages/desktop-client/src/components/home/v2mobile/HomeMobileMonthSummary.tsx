import React from 'react';
import { Trans } from 'react-i18next';

import { View } from '@actual-app/components/view';

import { HomeMobileMonthMetric } from './HomeMobileMonthMetric';

type HomeMobileMonthSummaryProps = {
  income: number | null;
  /** Negative integer amount, as Actual stores outflows. */
  spent: number | null;
  net: number | null;
};

/**
 * The month in three numbers, on one compact surface.
 *
 * Three columns rather than three cards: what came in, what left, and what is
 * left of the two are one thought, and separating them into panels would say
 * they are independent. The dividers are hairlines on the panel's own ground —
 * enough to group the figures, not enough to draw a table.
 *
 * All three come from `useMonthTotals`, the one place on the Home allowed to
 * combine two financial values, so this card can never disagree with anything
 * else that reads the month.
 */
export function HomeMobileMonthSummary({
  income,
  spent,
  net,
}: HomeMobileMonthSummaryProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        padding: '12px 4px',
        borderRadius: 'var(--dfm-radius-sm)',
        border: '1px solid var(--dfl-line)',
        backgroundColor: 'var(--dfl-surface)',
        boxShadow: 'var(--dfl-shadow)',
      }}
    >
      <HomeMobileMonthMetric
        label={<Trans>Entradas</Trans>}
        value={income}
        flow="in"
      />
      <View
        aria-hidden="true"
        style={{
          width: 1,
          alignSelf: 'stretch',
          backgroundColor: 'var(--dfl-line)',
        }}
      />
      <HomeMobileMonthMetric
        label={<Trans>Saídas</Trans>}
        value={spent}
        flow="out"
      />
      <View
        aria-hidden="true"
        style={{
          width: 1,
          alignSelf: 'stretch',
          backgroundColor: 'var(--dfl-line)',
        }}
      />
      <HomeMobileMonthMetric
        label={<Trans>Saldo do mês</Trans>}
        value={net}
        flow="signed"
      />
    </View>
  );
}
