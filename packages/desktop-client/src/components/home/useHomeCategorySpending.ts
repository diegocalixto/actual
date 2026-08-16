import { useEffect, useMemo, useState } from 'react';

import { groupById } from '@actual-app/core/shared/util';
import type { CategoryEntity } from '@actual-app/core/types/models';

import { useCategories } from '#hooks/useCategories';
import { useSpreadsheet } from '#hooks/useSpreadsheet';
import { envelopeBudget, trackingBudget } from '#spreadsheet/bindings';

import type { HomeBudgetType } from './useHomeMonth';

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
  /** Total outflow across every spending category, not just the listed ones. */
  totalSpent: number;
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

  return useMemo(() => {
    const spent = spendingCategories
      .map(category => ({
        category,
        amount: amountsByCategory[category.id] ?? 0,
      }))
      .filter(entry => entry.amount < 0)
      // Most negative first, i.e. largest outflow.
      .sort((a, b) => a.amount - b.amount);

    return {
      categories: spent.slice(0, limit),
      totalSpent: spent.reduce((total, entry) => total + entry.amount, 0),
    };
  }, [spendingCategories, amountsByCategory, limit]);
}
