import type { HomeBudgetType } from '#components/home/useHomeMonth';
import { useHomeSheetCell } from '#components/home/useHomeSheetCell';
import { envelopeBudget, trackingBudget } from '#spreadsheet/bindings';

export type MonthTotals = {
  /** Positive integer amount. */
  income: number | null;
  /** Negative integer amount, as Actual stores outflows. */
  spent: number | null;
  /** Income minus spending for the month. */
  net: number | null;
};

/**
 * The month's headline totals, and the **only** place on the dashboard where
 * two financial values are combined.
 *
 * A tracking budget publishes the net as its own `real-saved` cell, so that
 * cell is read rather than recomputed. An envelope budget defines no such cell;
 * `income + spent` mirrors exactly what the tracking cell means (spending is
 * already negative), so the same figure is produced instead of inventing a
 * different definition. Any card that needs the month's net asks here, which
 * is what keeps the summary and the trend from ever disagreeing.
 */
export function useMonthTotals(
  sheetName: string,
  budgetType: HomeBudgetType,
): MonthTotals {
  const isTracking = budgetType === 'tracking';

  const income = useHomeSheetCell(
    sheetName,
    isTracking ? trackingBudget.totalIncome : envelopeBudget.totalIncome,
  );
  const spent = useHomeSheetCell(
    sheetName,
    isTracking ? trackingBudget.totalSpent : envelopeBudget.totalSpent,
  );
  const trackingSaved = useHomeSheetCell(
    sheetName,
    isTracking ? trackingBudget.totalSaved : null,
  );

  if (isTracking) {
    return { income, spent, net: trackingSaved };
  }

  return {
    income,
    spent,
    net: income === null || spent === null ? null : income + spent,
  };
}
