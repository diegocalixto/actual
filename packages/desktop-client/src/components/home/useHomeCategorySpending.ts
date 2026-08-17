import { useEffect, useMemo, useState } from 'react';

import { groupById } from '@actual-app/core/shared/util';
import type { CategoryEntity } from '@actual-app/core/types/models';

import { useCategories } from '#hooks/useCategories';
import { useSpreadsheet } from '#hooks/useSpreadsheet';
import { envelopeBudget, trackingBudget } from '#spreadsheet/bindings';

import type { HomeBudgetType } from './useHomeMonth';
import { useHomeSheetCell } from './useHomeSheetCell';

export type HomeCategorySpending = {
  category: CategoryEntity;
  /** Negative integer amount, as stored by Actual. */
  amount: number;
};

type UseHomeCategorySpendingProps = {
  sheetName: string;
  budgetType: HomeBudgetType;
  limit?: number;
};

type UseHomeCategorySpendingResult = {
  /** Highest-spending categories first, capped at `limit`. */
  categories: HomeCategorySpending[];
  /**
   * The month's official `total-spent` cell, i.e. the same value the "Saídas"
   * tile reads, or `null` while it loads. Deliberately not derived from the
   * listed categories: those drop refunded (net positive) categories, which
   * Actual's own total keeps.
   */
  totalSpent: number | null;
};

/**
 * Reads the already-computed per-category totals for a budget month. Mirrors
 * the subscription approach of `useOverspentCategories`: one spreadsheet
 * binding per category, read-only.
 */
export function useHomeCategorySpending({
  sheetName,
  budgetType,
  limit = 5,
}: UseHomeCategorySpendingProps): UseHomeCategorySpendingResult {
  const spreadsheet = useSpreadsheet();
  const {
    data: { list: categories, grouped: categoryGroups } = {
      list: [],
      grouped: [],
    },
  } = useCategories();

  const categoryGroupsById = useMemo(
    () => groupById(categoryGroups),
    [categoryGroups],
  );

  const spendingCategories = useMemo(
    () =>
      categories.filter(
        category =>
          !category.is_income &&
          !category.hidden &&
          !categoryGroupsById[category.group]?.hidden,
      ),
    [categories, categoryGroupsById],
  );

  const bindings = useMemo(
    () =>
      spendingCategories.map(
        category =>
          [
            category.id,
            budgetType === 'tracking'
              ? trackingBudget.catSumAmount(category.id)
              : envelopeBudget.catSumAmount(category.id),
          ] as const,
      ),
    [spendingCategories, budgetType],
  );

  const [amountsByCategory, setAmountsByCategory] = useState<
    Record<CategoryEntity['id'], number>
  >({});

  useEffect(() => {
    setAmountsByCategory({});
  }, [sheetName]);

  useEffect(() => {
    const unbinds = bindings.map(([categoryId, binding]) =>
      spreadsheet.bind(sheetName, binding, result => {
        const amount = typeof result.value === 'number' ? result.value : 0;
        setAmountsByCategory(previous =>
          previous[categoryId] === amount
            ? previous
            : { ...previous, [categoryId]: amount },
        );
      }),
    );

    return () => unbinds.forEach(unbind => unbind());
  }, [bindings, sheetName, spreadsheet]);

  const totalSpent = useHomeSheetCell(
    sheetName,
    budgetType === 'tracking'
      ? trackingBudget.totalSpent
      : envelopeBudget.totalSpent,
  );

  const topCategories = useMemo(
    () =>
      spendingCategories
        .map(category => ({
          category,
          amount: amountsByCategory[category.id] ?? 0,
        }))
        // Refunded categories are left out of the list so no row can render a
        // negative-width bar; they still count towards `totalSpent`.
        .filter(entry => entry.amount < 0)
        // Most negative first, i.e. largest outflow.
        .sort((a, b) => a.amount - b.amount)
        .slice(0, limit),
    [spendingCategories, amountsByCategory, limit],
  );

  return { categories: topCategories, totalSpent };
}
