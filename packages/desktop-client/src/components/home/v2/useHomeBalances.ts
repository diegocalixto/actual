import type { HomeBudgetType } from '#components/home/useHomeMonth';
import { useHomeSheetCell } from '#components/home/useHomeSheetCell';
import { useSheetValue } from '#hooks/useSheetValue';
import * as bindings from '#spreadsheet/bindings';
import { envelopeBudget } from '#spreadsheet/bindings';

export type HomeBalances = {
  /**
   * Sum of the balances of every on-budget account. This is the money that
   * actually exists and is inside the budget — not an envelope figure.
   */
  onBudget: number | null;
  offBudget: number | null;
  total: number | null;
  /** Envelope budgets only; `null` under a tracking budget, which has no cell. */
  toBudget: number | null;
};

/**
 * Reads the four balance cells the dashboard needs. Presentation components go
 * through this hook so they never touch `#spreadsheet/bindings` themselves.
 * Nothing here computes: every number is a cell the budget engine publishes.
 */
export function useHomeBalances(
  sheetName: string,
  budgetType: HomeBudgetType,
): HomeBalances {
  const onBudget = useSheetValue<'account', 'onbudget-accounts-balance'>(
    bindings.onBudgetAccountBalance(),
  );
  const offBudget = useSheetValue<'account', 'offbudget-accounts-balance'>(
    bindings.offBudgetAccountBalance(),
  );
  const total = useSheetValue<'account', 'accounts-balance'>(
    bindings.allAccountBalance(),
  );

  // Tracking budgets have no "to budget" cell, so the read is skipped there.
  const toBudget = useHomeSheetCell(
    sheetName,
    budgetType === 'envelope' ? envelopeBudget.toBudget : null,
  );

  return { onBudget, offBudget, total, toBudget };
}

/**
 * Total balance across every account, on and off budget. Split out so a card
 * that only needs this one figure does not have to know a sheet name.
 */
export function useTotalBalance(): number | null {
  return useSheetValue<'account', 'accounts-balance'>(
    bindings.allAccountBalance(),
  );
}
