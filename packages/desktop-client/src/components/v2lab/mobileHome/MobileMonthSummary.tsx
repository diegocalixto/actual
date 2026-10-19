import React from 'react';
import { Trans } from 'react-i18next';

import { View } from '@actual-app/components/view';

import { MobileMonthMetric } from './MobileMonthMetric';

type MobileMonthSummaryProps = {
  income: number;
  outflow: number;
  net: number;
};

/**
 * The month in three numbers, on one compact surface.
 *
 * Three columns rather than three cards: what came in, what left, and what is
 * left of the two are one thought, and separating them into panels would say
 * they are independent. The dividers are hairlines on the panel's own ground —
 * enough to group the figures, not enough to draw a table.
 *
 * The net keeps the same green as the income because it is positive here; the
 * colour is a statement about the sign of the figure, not about the label.
 */
export function MobileMonthSummary({
  income,
  outflow,
  net,
}: MobileMonthSummaryProps) {
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
      <MobileMonthMetric
        label={<Trans>Entradas</Trans>}
        amount={income}
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
      <MobileMonthMetric
        label={<Trans>Saídas</Trans>}
        amount={outflow}
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
      <MobileMonthMetric
        label={<Trans>Saldo do mês</Trans>}
        amount={net}
        flow="in"
      />
    </View>
  );
}
