import React from 'react';
import { Trans } from 'react-i18next';

import { View } from '@actual-app/components/view';

import { fittedFontSize } from '#components/v2lab/LabStyle';

import {
  HomeMobileMonthMetric,
  MONTH_FIGURE_ROOM,
  MONTH_FIGURE_TRACKING,
  shownAmount,
} from './HomeMobileMonthMetric';
import { formatCurrency } from './mobileMoneyFormat';

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
 *
 * A third of the width has to hold "R$ 15.490,00" and its badge on one line.
 * The figures track the viewport up to the approved size, and all three give
 * up size together when the longest of them would not fit its column — a
 * month in the hundreds of thousands used to push its badge out of the card.
 */
export function HomeMobileMonthSummary({
  income,
  spent,
  net,
}: HomeMobileMonthSummaryProps) {
  const figureSize = fittedFontSize({
    designSize: 'clamp(11px, 3.3vw, 14px)',
    room: MONTH_FIGURE_ROOM,
    floor: '9px',
    letterSpacing: MONTH_FIGURE_TRACKING,
    figures: [
      shownAmount(income, 'in'),
      shownAmount(spent, 'out'),
      shownAmount(net, 'signed'),
    ].map(amount => (amount === null ? null : formatCurrency(amount))),
  });

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
        figureSize={figureSize}
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
        figureSize={figureSize}
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
        figureSize={figureSize}
      />
    </View>
  );
}
