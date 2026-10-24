import type { HomeBudgetType } from '#components/home/useHomeMonth';
import { useHomeSheetCell } from '#components/home/useHomeSheetCell';
import { envelopeBudget, trackingBudget } from '#spreadsheet/bindings';

export type BudgetMonthCells = {
  /** The engine's `total-income`: positive integer amount. */
  income: number | null;
  /** The engine's `total-spent`: negative integer amount, as Actual stores outflows. */
  spent: number | null;
  /** Income plus spending, or the tracking budget's own `real-saved` cell. */
  net: number | null;
};

/**
 * The budget engine's own month totals, as the Budget screen prints them.
 *
 * These are the envelope budget's figures and they are kept on the Budget
 * deliberately: `total-income` counts every income category — a starting
 * balance and an extraordinary inflow included, because both are money the
 * envelopes can be filled from — and `total-spent` counts only what has a
 * category, because only that has left an envelope. They answer "what can I
 * assign", not "what did I spend"; the Home and the Reports answer the second
 * question through `@actual-app/core/shared/month-indicators`, and the Budget says on screen
 * where the two differ.
 *
 * A tracking budget publishes the net as its own `real-saved` cell, so that
 * cell is read rather than recomputed. An envelope budget defines no such cell;
 * `income + spent` mirrors exactly what the tracking cell means (spending is
 * already negative).
 */
export function useBudgetMonthCells(
  sheetName: string,
  budgetType: HomeBudgetType,
): BudgetMonthCells {
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
