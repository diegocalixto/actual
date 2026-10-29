import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { UNCATEGORIZED_ID } from '@actual-app/core/shared/month-indicators';
import type { CategoryEntity } from '@actual-app/core/types/models';

import { useMonthIndicators } from '#reports/useMonthIndicators';

export type HomeCategorySpending = {
  /**
   * The category, or a stand-in for the month's uncategorized outflows: its
   * `id` is `UNCATEGORIZED_ID` and its name the screen's "Sem categoria".
   */
  category: CategoryEntity;
  /** Negative integer amount, as stored by Actual. */
  amount: number;
  isUncategorized: boolean;
};

export type HomeSpendingCredit = {
  id: string;
  name: string;
  /** Positive: what the category gave back beyond what it took this month. */
  amount: number;
};

type UseHomeCategorySpendingProps = {
  /** `YYYY-MM`. */
  month: string;
  limit?: number;
};

type UseHomeCategorySpendingResult = {
  /** Highest-spending first, capped at `limit`; "Sem categoria" ranks like any other. */
  categories: HomeCategorySpending[];
  /**
   * Categories the month ends up owing nothing to: refunded more than they were
   * spent. They lower the total instead of adding to it, so the list has to
   * show them for its rows to add up to the figure above them.
   */
  credits: HomeSpendingCredit[];
  /**
   * The **month's** outflow side, positive — not the sum of the rows listed,
   * which `limit` may have cut. Every bar and every share is taken on this: on
   * the net total a single category can exceed the whole month, and a month
   * that ends in credit has no whole at all.
   */
  outflows: number;
  /** Sum of `credits`, positive. */
  credited: number;
  /**
   * The month's spending under the shared rules — the same figure the summary's
   * "Gastos" tile prints — as a negative integer, or `null` while it loads.
   * `outflows - credited`, with the sign Actual gives an outflow.
   */
  totalSpent: number | null;
  isLoading: boolean;
};

/**
 * Where the month's money went, read through
 * `@actual-app/core/shared/month-indicators` so the list, the Home's summary
 * and the Reports agree on what a gasto is: outflows of the budget's accounts
 * that are not transfers, refunds netted inside their category, and the
 * uncategorized ones counted and shown as such.
 */
export function useHomeCategorySpending({
  month,
  limit = 5,
}: UseHomeCategorySpendingProps): UseHomeCategorySpendingResult {
  const { t } = useTranslation();
  const { totals, composition, isLoading } = useMonthIndicators(month);

  const listed = useMemo(() => {
    const top = composition.entries.slice(0, limit);
    // The uncategorized row is the one with somewhere to go — it opens the
    // transactions still waiting for a category — so it is never cut off the
    // end of the list. Ranked below the limit it is appended instead, which is
    // why the list can hold one row more than `limit`.
    const uncategorized = composition.entries.find(
      entry => entry.isUncategorized,
    );
    return uncategorized && !top.includes(uncategorized)
      ? [...top, uncategorized]
      : top;
  }, [composition, limit]);

  const categories = useMemo(
    () =>
      listed.map(entry => ({
        category: {
          id: entry.id,
          name: entry.isUncategorized
            ? t('Sem categoria')
            : (entry.name ?? t('Sem categoria')),
          group: '',
        },
        // The module hands net outflows as positive amounts; the Home keeps
        // Actual's sign so a row reads like a transaction.
        amount: -entry.amount,
        isUncategorized: entry.id === UNCATEGORIZED_ID,
      })),
    [listed, t],
  );

  const credits = useMemo(
    () =>
      composition.credits.map(entry => ({
        id: entry.id,
        name: entry.name ?? t('Sem categoria'),
        amount: entry.amount,
      })),
    [composition, t],
  );

  return {
    categories,
    credits,
    outflows: composition.outflows,
    credited: composition.credited,
    totalSpent: totals === null ? null : -totals.spending,
    isLoading,
  };
}
