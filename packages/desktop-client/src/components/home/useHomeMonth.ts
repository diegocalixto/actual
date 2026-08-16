import { useEffect } from 'react';

import * as monthUtils from '@actual-app/core/shared/months';

import { prewarmMonth } from '#components/budget/util';
import { useSpreadsheet } from '#hooks/useSpreadsheet';
import { useSyncedPref } from '#hooks/useSyncedPref';

export type HomeBudgetType = 'envelope' | 'tracking';

type UseHomeMonthResult = {
  /** The current month in `YYYY-MM` form. */
  month: string;
  /** Spreadsheet sheet holding that month's budget cells. */
  sheetName: string;
  budgetType: HomeBudgetType;
};

/**
 * Resolves the current budget month and warms its cells in the client-side
 * spreadsheet cache, the same way the Budget pages do, so the dashboard totals
 * appear without a flash of empty values.
 *
 * Warming is read-only: `envelope-budget-month` and `tracking-budget-month`
 * are registered as plain queries on the server, not mutators, so opening the
 * Home screen never changes the budget.
 */
export function useHomeMonth(): UseHomeMonthResult {
  const spreadsheet = useSpreadsheet();
  const [budgetTypePref] = useSyncedPref('budgetType');
  const budgetType: HomeBudgetType =
    budgetTypePref === 'tracking' ? 'tracking' : 'envelope';

  const month = monthUtils.currentMonth();

  useEffect(() => {
    async function warmMonth() {
      try {
        await prewarmMonth(budgetType, spreadsheet, month);
      } catch {
        // Values still load through their own bindings; this only skips the
        // cache warm-up, so the dashboard degrades to a brief empty state.
      }
    }

    void warmMonth();
  }, [budgetType, month, spreadsheet]);

  return {
    month,
    sheetName: monthUtils.sheetForMonth(month),
    budgetType,
  };
}
