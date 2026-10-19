import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import type { BudgetType } from '@actual-app/core/server/prefs';
import type { CategoryEntity } from '@actual-app/core/types/models';

import { useCategoriesById } from '#hooks/useCategories';
import { useFormat } from '#hooks/useFormat';
import { useSheetValue } from '#hooks/useSheetValue';
import { useSyncedPref } from '#hooks/useSyncedPref';
import { useUndo } from '#hooks/useUndo';
import { collapseModals, pushModal } from '#modals/modalsSlice';
import { useDispatch } from '#redux';
import { envelopeBudget, trackingBudget } from '#spreadsheet/bindings';

type UseCategoryBalanceMenuProps = {
  category: CategoryEntity;
  month: string;
  onBudgetAction: (month: string, action: string, args: unknown) => void;
};

/**
 * Opens an expense category's balance menu: carry the balance over, transfer it
 * somewhere else, or cover an overspend from another envelope.
 *
 * Lifted out of `ExpenseCategoryListItem` unchanged, for the same reason as
 * `useCategoryBudgetMenu`: the approved row raises the menu from a different
 * control, and the three actions behind it — with their undo notifications and
 * their modal collapse — have to stay one implementation.
 */
export function useCategoryBalanceMenu({
  category,
  month,
  onBudgetAction,
}: UseCategoryBalanceMenuProps) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const format = useFormat();
  const { showUndoNotification } = useUndo();
  const [budgetType = 'envelope'] = useSyncedPref('budgetType');

  const balanceMenuModalName =
    `${budgetType as BudgetType}-balance-menu` as const;

  const {
    data: { list: categoriesById } = {
      list: {} as Record<string, CategoryEntity>,
    },
  } = useCategoriesById();

  const catBalance = useSheetValue<
    'envelope-budget' | 'tracking-budget',
    'leftover'
  >(
    budgetType === 'envelope'
      ? envelopeBudget.catBalance(category.id)
      : trackingBudget.catBalance(category.id),
  );

  const onCarryover = useCallback(
    (carryover: boolean) => {
      onBudgetAction(month, 'carryover', {
        category: category.id,
        flag: carryover,
      });
      dispatch(collapseModals({ rootModalName: balanceMenuModalName }));
    },
    [category.id, onBudgetAction, month, dispatch, balanceMenuModalName],
  );

  const onTransfer = useCallback(() => {
    dispatch(
      pushModal({
        modal: {
          name: 'transfer',
          options: {
            title: category.name,
            categoryId: category.id,
            month,
            amount: catBalance || 0,
            onSubmit: (amount, toCategoryId) => {
              onBudgetAction(month, 'transfer-category', {
                amount,
                from: category.id,
                to: toCategoryId,
                currencyCode: format.currency.code,
              });
              dispatch(collapseModals({ rootModalName: balanceMenuModalName }));
              showUndoNotification({
                message: t(
                  'Transferred {{amount}} from {{fromCategoryName}} to {{toCategoryName}}.',
                  {
                    amount: format(amount, 'financial'),
                    fromCategoryName: category.name,
                    toCategoryName: categoriesById[toCategoryId].name,
                  },
                ),
              });
            },
            showToBeBudgeted: true,
          },
        },
      }),
    );
  }, [
    category.id,
    category.name,
    dispatch,
    month,
    catBalance,
    onBudgetAction,
    balanceMenuModalName,
    showUndoNotification,
    categoriesById,
    format,
    t,
  ]);

  const onCover = useCallback(() => {
    dispatch(
      pushModal({
        modal: {
          name: 'cover',
          options: {
            title: category.name,
            month,
            amount: catBalance,
            categoryId: category.id,
            onSubmit: (amount, fromCategoryId) => {
              onBudgetAction(month, 'cover-overspending', {
                to: category.id,
                from: fromCategoryId,
                amount,
                currencyCode: format.currency.code,
              });
              dispatch(collapseModals({ rootModalName: balanceMenuModalName }));
              showUndoNotification({
                message: t(
                  `Covered {{amount}} {{toCategoryName}} overspending from {{fromCategoryName}}.`,
                  {
                    amount: format(amount, 'financial'),
                    toCategoryName: category.name,
                    fromCategoryName: categoriesById[fromCategoryId].name,
                  },
                ),
              });
            },
          },
        },
      }),
    );
  }, [
    category.id,
    category.name,
    dispatch,
    month,
    catBalance,
    onBudgetAction,
    balanceMenuModalName,
    showUndoNotification,
    t,
    categoriesById,
    format,
  ]);

  return useCallback(() => {
    if (balanceMenuModalName === 'envelope-balance-menu') {
      dispatch(
        pushModal({
          modal: {
            name: balanceMenuModalName,
            options: {
              month,
              categoryId: category.id,
              onCarryover,
              onTransfer,
              onCover,
            },
          },
        }),
      );
    } else {
      dispatch(
        pushModal({
          modal: {
            name: balanceMenuModalName,
            options: {
              month,
              categoryId: category.id,
              onCarryover,
            },
          },
        }),
      );
    }
  }, [
    category.id,
    balanceMenuModalName,
    dispatch,
    month,
    onCarryover,
    onTransfer,
    onCover,
  ]);
}
