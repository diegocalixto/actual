import React from 'react';
import { Trans } from 'react-i18next';

import {
  SvgArrowThinDown,
  SvgArrowThinUp,
  SvgTarget,
} from '@actual-app/components/icons/v1';
import { View } from '@actual-app/components/view';

import { fittedFontSize } from '#components/v2lab/LabStyle';

import {
  BudgetMobileMetric,
  METRIC_FIGURE_TRACKING,
} from './BudgetMobileMetric';
import { formatCurrency, usedPercent } from './budgetMobileMoney';

type BudgetMobileMetricsProps = {
  /** What the month plans to spend, as a positive magnitude. */
  planned: number | null;
  /** What the month has spent, as a positive magnitude. */
  spent: number | null;
  /**
   * Income minus spending, from the engine's own definition of the month's net
   * — deliberately not the categories' leftover, which is a different figure.
   */
  monthBalance: number | null;
  /** What the month took in: the reference the three bars are read against. */
  income: number | null;
};

/**
 * The month in three figures.
 *
 * The third is labelled "Receitas − gasto", never "Saldo": every group further
 * down carries its own balance — what is left inside its envelopes — and the
 * two are different numbers. The label is the arithmetic itself because the
 * figure is the engine's income less its categorized spending, which is not
 * the month's result the Home and the Reports print.
 *
 * Each bar is that figure's share of the month's income, so the three are
 * measured against the same thing and can be compared by eye. A month with no
 * income yet has no share to draw, and `usedPercent` returns `null` rather than
 * dividing by zero.
 *
 * The three figures are set at one size, and that size is the one the longest
 * of them fits its tile at: a third of a phone holds "R$ 9.850,00" and not
 * "-R$ 2.345.398,90", which used to run out of its tile and into the next.
 */
export function BudgetMobileMetrics({
  planned,
  spent,
  monthBalance,
  income,
}: BudgetMobileMetricsProps) {
  const share = (value: number | null) =>
    value === null ? null : usedPercent(Math.abs(value), income);

  const figureSize = fittedFontSize({
    designSize: 'clamp(12px, 3.5vw, 14.5px)',
    room: '100cqi',
    floor: '9px',
    letterSpacing: METRIC_FIGURE_TRACKING,
    figures: [planned, spent, monthBalance].map(value =>
      value === null ? null : formatCurrency(value),
    ),
  });

  return (
    <View style={{ flexDirection: 'row', alignItems: 'stretch', gap: 8 }}>
      <BudgetMobileMetric
        label={<Trans>Orçado</Trans>}
        value={planned}
        figureSize={figureSize}
        Icon={SvgTarget}
        tone="var(--dfl-violet)"
        percent={share(planned)}
      />
      <BudgetMobileMetric
        label={<Trans>Gasto categorizado</Trans>}
        value={spent}
        figureSize={figureSize}
        Icon={SvgArrowThinDown}
        tone="var(--dfmb-watch)"
        percent={share(spent)}
      />
      <BudgetMobileMetric
        label={<Trans>Receitas − gasto</Trans>}
        value={monthBalance}
        figureSize={figureSize}
        Icon={SvgArrowThinUp}
        tone="var(--dfl-positive)"
        percent={share(monthBalance)}
      />
    </View>
  );
}
