import React from 'react';
import { Trans } from 'react-i18next';

import { Text } from '@actual-app/components/text';
import { View } from '@actual-app/components/view';
import type { IndicatorTotals } from '@actual-app/core/shared/month-indicators';

import { monthDetailLines } from '#components/home/v2/MonthSummaryCard';
import { fittedFontSize } from '#components/v2lab/LabStyle';

import { HomeMobileMoney } from './HomeMobileMoney';
import {
  HomeMobileMonthMetric,
  MONTH_FIGURE_ROOM,
  MONTH_FIGURE_TRACKING,
  shownAmount,
} from './HomeMobileMonthMetric';
import { formatCurrency } from './mobileMoneyFormat';

type HomeMobileMonthSummaryProps = {
  /** Classified receipts: positive integer amount. */
  income: number | null;
  /** Negative integer amount, as Actual stores outflows. */
  spent: number | null;
  /** The result of the classified receipts: `income + spent`. */
  net: number | null;
  /** The facts under the three figures, or `null` while they load. */
  details: IndicatorTotals | null;
};

/**
 * The month in three numbers, on one compact surface.
 *
 * Three columns rather than three cards: what the classified receipts were, what
 * left, and what is left of the two are one thought, and separating them into
 * panels would say they are independent. The dividers are hairlines on the
 * panel's own ground — enough to group the figures, not enough to draw a
 * table.
 *
 * Under them, one small line per thing the three figures leave out —
 * extraordinary inflows, inflows still without a category, the uncategorized
 * share of the spending — and nothing when there is nothing to say.
 *
 * All of it comes from `useMonthTotals`, which reads the rules in
 * `@actual-app/core/shared/month-indicators`, so this card can never disagree with anything
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
  details,
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

  const lines = details ? monthDetailLines(details) : [];

  return (
    <View
      style={{
        borderRadius: 'var(--dfm-radius-sm)',
        border: '1px solid var(--dfl-line)',
        backgroundColor: 'var(--dfl-surface)',
        boxShadow: 'var(--dfl-shadow)',
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          padding: '12px 4px',
        }}
      >
        <HomeMobileMonthMetric
          label={<Trans>Receitas classificadas</Trans>}
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
          label={<Trans>Gastos</Trans>}
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
          label={<Trans>Resultado</Trans>}
          value={net}
          flow="signed"
          figureSize={figureSize}
        />
      </View>

      {lines.length > 0 && (
        <View
          style={{
            gap: 4,
            padding: '8px 12px 10px',
            borderTop: '1px solid var(--dfl-line)',
          }}
        >
          {lines.map(line => (
            <View
              key={line.key}
              style={{
                flexDirection: 'row',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                gap: 10,
              }}
            >
              <Text style={{ fontSize: 11.5, color: 'var(--dfl-text-2)' }}>
                {line.label}
              </Text>
              {line.value !== null && (
                <HomeMobileMoney
                  value={line.value}
                  withCurrency
                  style={{
                    fontSize: 11.5,
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    color: 'var(--dfl-text)',
                  }}
                />
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
