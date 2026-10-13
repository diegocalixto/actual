import * as monthUtils from '@actual-app/core/shared/months';

import { useMonthTotals } from '#components/home/v2/useMonthTotals';
import { useSheetValue } from '#hooks/useSheetValue';
import { envelopeBudget, trackingBudget } from '#spreadsheet/bindings';

import { asMagnitude, usedPercent } from './budgetMobileMoney';

export type BudgetMobileTotals = {
  /** What the month plans to spend, as a positive magnitude. */
  planned: number | null;
  /** What the month has spent, as a positive magnitude. */
  spent: number | null;
  /** What the month took in. */
  income: number | null;
  /** Income minus spending — the engine's own definition of the month's net. */
  monthBalance: number | null;
  /** Whole percent of the plan already spent, or `null` when there is no plan. */
  usedPercent: number | null;
};

/**
 * The four figures the top of the Budget reads, and nothing else.
 *
 * Three of them arrive from `useMonthTotals`, which is the application's single
 * definition of what a month took in, spent and netted — the mobile Home reads
 * the same hook, so the two screens cannot disagree about a figure, and the
 * "Saldo do mês" printed here means exactly what "Resultado" means there:
 * income minus spending. It is deliberately *not* `total-leftover`, which is
 * what is left inside the envelopes and a different number; each group prints
 * its own share of that further down the page.
 *
 * The plan is the one cell this hook reads for itself, because the two budget
 * types disagree about its sign: an envelope budget publishes `total-budgeted`
 * negated, a tracking budget does not. The upstream header already handled that
 * at the point of display; it is handled here instead, once, so nothing below
 * has to know.
 */
export function useBudgetMobileTotals(
  month: string,
  budgetType: 'envelope' | 'tracking',
): BudgetMobileTotals {
  const isTracking = budgetType === 'tracking';

  const { income, spent, net } = useMonthTotals(
    monthUtils.sheetForMonth(month),
    budgetType,
  );

  const budgeted = useSheetValue<
    'envelope-budget' | 'tracking-budget',
    'total-budgeted'
  >(
    isTracking
      ? trackingBudget.totalBudgetedExpense
      : envelopeBudget.totalBudgeted,
  );

  // An envelope budget stores the month's plan negated; a tracking budget does
  // not. Both come out of here as the positive figure the screen labels
  // "Planejado".
  const planned =
    budgeted === null ? null : isTracking ? budgeted : asMagnitude(budgeted);

  // Spending is stored as the negative amount it is. The label carries the
  // direction, so the screen shows the magnitude — by negation rather than by
  // absolute value, so a month whose refunds outran its spending still reads as
  // the negative figure it actually is.
  const spentMagnitude = spent === null ? null : asMagnitude(spent);

  return {
    planned,
    spent: spentMagnitude,
    income,
    monthBalance: net,
    usedPercent: usedPercent(spentMagnitude, planned),
  };
}
