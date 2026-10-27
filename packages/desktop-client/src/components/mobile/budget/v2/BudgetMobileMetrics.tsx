import React from 'react';
import type { ReactNode } from 'react';
import { Trans } from 'react-i18next';

import {
  SvgArrowThinDown,
  SvgArrowThinUp,
  SvgCalendar,
  SvgTarget,
} from '@actual-app/components/icons/v1';
import { View } from '@actual-app/components/view';

import { fittedFontSize } from '#components/v2lab/LabStyle';
import type { EntityIcon } from '#components/v2lab/LabStyle';

import {
  BudgetMobileMetric,
  METRIC_FIGURE_TRACKING,
} from './BudgetMobileMetric';
import { formatCurrency, usedPercent } from './budgetMobileMoney';

type BudgetMobileMetricsProps = {
  /** What the month plans to spend, as a positive magnitude. */
  planned: number | null;
  /**
   * What the month has spent, as a positive magnitude. Given, it takes a tile;
   * absent, the hero above already carries it and the row does not repeat it.
   */
  spent?: number | null;
  /**
   * Income minus spending, from the engine's own definition of the month's net
   * — deliberately not the categories' leftover, which is a different figure.
   */
  monthBalance: number | null;
  /** What the month took in: the reference the bars are read against. */
  income: number | null;
  /**
   * The envelope engine's "to budget" cell. Given, the row ends with it as
   * "A planejar": the income not yet given an envelope, added up month after
   * month. It is a planning figure and not a balance, so it takes the last
   * tile, in the quieter blue, and no bar — a share of this month's income
   * would be a false reading of a figure that spans every month. Absent under
   * a tracking budget, which has no such cell.
   */
  toBudget?: number | null;
};

type Tile = {
  key: string;
  label: ReactNode;
  value: number | null;
  Icon: EntityIcon;
  tone: string;
  percent: number | null;
};

/**
 * The month in three figures.
 *
 * The balance is labelled "Receitas − gasto", never "Saldo": every group
 * further down carries its own balance — what is left inside its envelopes —
 * and the two are different numbers. The label is the arithmetic itself
 * because the figure is the engine's income less its categorized spending,
 * which is not the month's result the Home and the Reports print.
 *
 * Each bar is that figure's share of the month's income, so the tiles are
 * measured against the same thing and can be compared by eye. A month with no
 * income yet has no share to draw, and `usedPercent` returns `null` rather than
 * dividing by zero.
 *
 * The figures are set at one size, and that size is the one the longest of
 * them fits its tile at: a third of a phone holds "R$ 9.850,00" and not
 * "-R$ 2.345.398,90", which used to run out of its tile and into the next.
 */
export function BudgetMobileMetrics({
  planned,
  spent,
  monthBalance,
  income,
  toBudget,
}: BudgetMobileMetricsProps) {
  const share = (value: number | null) =>
    value === null ? null : usedPercent(Math.abs(value), income);

  const tiles: Tile[] = [
    {
      key: 'planned',
      label: <Trans>Orçado</Trans>,
      value: planned,
      Icon: SvgTarget,
      tone: 'var(--dfl-violet)',
      percent: share(planned),
    },
    ...(spent !== undefined
      ? [
          {
            key: 'spent',
            label: <Trans>Gasto categorizado</Trans>,
            value: spent,
            Icon: SvgArrowThinDown,
            // The spending's own colour, as on Início and Relatórios. Amber
            // is the alerts' on this screen: something to do, not a figure.
            tone: 'var(--dfl-negative)',
            percent: share(spent),
          },
        ]
      : []),
    {
      key: 'balance',
      label: <Trans>Receitas − gasto</Trans>,
      value: monthBalance,
      Icon: SvgArrowThinUp,
      tone: 'var(--dfl-positive)',
      percent: share(monthBalance),
    },
    ...(toBudget !== undefined
      ? [
          {
            key: 'toBudget',
            // A negative cell means more has been budgeted than exists, which
            // is a different sentence and not a smaller amount of the same
            // one — so it gets its own words rather than a minus in front of
            // "A planejar".
            label:
              toBudget !== null && toBudget < 0 ? (
                <Trans>Orçado a mais</Trans>
              ) : (
                <Trans>A planejar</Trans>
              ),
            value: toBudget,
            Icon: SvgCalendar,
            tone: 'var(--dfl-blue)',
            percent: null,
          },
        ]
      : []),
  ];

  const figureSize = fittedFontSize({
    designSize: 'clamp(12px, 3.5vw, 14.5px)',
    room: '100cqi',
    floor: '9px',
    letterSpacing: METRIC_FIGURE_TRACKING,
    figures: tiles.map(tile =>
      tile.value === null ? null : formatCurrency(tile.value),
    ),
  });

  return (
    <View style={{ flexDirection: 'row', alignItems: 'stretch', gap: 8 }}>
      {tiles.map(tile => (
        <BudgetMobileMetric
          key={tile.key}
          label={tile.label}
          value={tile.value}
          figureSize={figureSize}
          Icon={tile.Icon}
          tone={tile.tone}
          percent={tile.percent}
        />
      ))}
    </View>
  );
}
