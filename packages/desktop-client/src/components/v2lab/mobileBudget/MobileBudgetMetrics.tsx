import React from 'react';
import { Trans } from 'react-i18next';

import {
  SvgArrowThinDown,
  SvgArrowThinUp,
  SvgTarget,
} from '@actual-app/components/icons/v1';
import { View } from '@actual-app/components/view';

import { MobileBudgetMetric } from './MobileBudgetMetric';
import { usedPercent } from './mobileBudgetMoney';

type MobileBudgetMetricsProps = {
  planned: number;
  spent: number;
  /** Income minus spending — deliberately not the categories' leftover. */
  monthBalance: number;
  /** What the month took in, the reference the three bars are read against. */
  income: number;
};

/**
 * The month in three figures.
 *
 * The third is labelled "Saldo do mês" in full, never just "Saldo": the expense
 * group further down carries its own balance — what is left inside the
 * envelopes — and the two are different numbers. Shortening the label here
 * would put two meanings on one word on a single screen.
 *
 * Each bar is that figure's share of the month's income, so the three are
 * measured against the same thing and can be compared by eye.
 */
export function MobileBudgetMetrics({
  planned,
  spent,
  monthBalance,
  income,
}: MobileBudgetMetricsProps) {
  const share = (value: number) => usedPercent(Math.abs(value), income) ?? 0;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'stretch', gap: 8 }}>
      <MobileBudgetMetric
        label={<Trans>Planejado</Trans>}
        value={planned}
        Icon={SvgTarget}
        tone="var(--dfl-violet)"
        percent={share(planned)}
      />
      <MobileBudgetMetric
        label={<Trans>Gasto</Trans>}
        value={spent}
        Icon={SvgArrowThinDown}
        tone="var(--dfmb-watch)"
        percent={share(spent)}
      />
      <MobileBudgetMetric
        label={<Trans>Saldo do mês</Trans>}
        value={monthBalance}
        Icon={SvgArrowThinUp}
        tone="var(--dfl-positive)"
        percent={share(monthBalance)}
      />
    </View>
  );
}
