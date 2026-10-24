import { useMemo } from 'react';

import { homeSummary } from '@actual-app/core/shared/month-indicators';
import type { IndicatorTotals } from '@actual-app/core/shared/month-indicators';

import { useMonthIndicators } from '#reports/useMonthIndicators';

export type MonthTotals = {
  /** Classified receipts for the month: positive integer amount, or `null` while loading. */
  income: number | null;
  /**
   * The month's spending, categorized or not, refunds deducted. Negative
   * integer amount, as Actual stores outflows.
   */
  spent: number | null;
  /** `income + spent`: the result of the classified receipts. */
  net: number | null;
  /**
   * Everything behind the three figures — extraordinary inflows, inflows
   * awaiting a category, the uncategorized share of the spending — for the
   * cards that explain them. `null` while loading.
   */
  details: IndicatorTotals | null;
  isLoading: boolean;
};

/**
 * The month's headline totals, read through the same rules Relatórios uses
 * (`@actual-app/core/shared/month-indicators`), so the two screens print one month.
 *
 * This replaced reading the budget engine's `total-income` and `total-spent`
 * cells. Those are the envelope budget's own figures and stay on the Budget
 * screen: they count a starting balance and an extraordinary inflow as income
 * and leave an uncategorized outflow out of the spending, which is right for
 * assigning envelopes and wrong for answering "how much did I spend".
 */
export function useMonthTotals(month: string): MonthTotals {
  const { totals, isLoading } = useMonthIndicators(month);

  return useMemo(() => {
    if (totals === null) {
      return { income: null, spent: null, net: null, details: null, isLoading };
    }
    const summary = homeSummary(totals);
    return {
      income: summary.income,
      spent: summary.spent,
      net: summary.net,
      details: totals,
      isLoading,
    };
  }, [totals, isLoading]);
}
