import { useCallback } from 'react';
import type { ComponentPropsWithoutRef } from 'react';
import { GridListItem } from 'react-aria-components';

import type { CategoryEntity } from '@actual-app/core/types/models';

import { useNavigate } from '#hooks/useNavigate';
import { useSyncedPref } from '#hooks/useSyncedPref';
import { collapseModals, pushModal } from '#modals/modalsSlice';
import { useDispatch } from '#redux';

import { BudgetMobileIncomeRow } from './v2/BudgetMobileIncomeRow';

type IncomeCategoryListItemProps = ComponentPropsWithoutRef<
  typeof GridListItem<CategoryEntity>
> & {
  month: string;
  isLast: boolean;
  onEdit: (id: CategoryEntity['id']) => void;
  onBudgetAction: (month: string, action: string, args: unknown) => void;
};

/**
 * One income category, as a row of the income group's list.
 *
 * The list item is the react-aria shell; the row itself, and everything it
 * draws, lives in `BudgetMobileIncomeRow`. The balance menu stays here because
 * it is an income-only modal — `envelope-income-balance-menu`, whose carryover
 * decides whether the month's leftover income is held for next month — and it
 * has no counterpart on an expense row.
 */
export function IncomeCategoryListItem({
  month,
  isLast,
  onEdit,
  onBudgetAction,
  ...props
}: IncomeCategoryListItemProps) {
  const { value: category } = props;
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [budgetType = 'envelope'] = useSyncedPref('budgetType');
  const balanceMenuModalName = 'envelope-income-balance-menu';

  const onShowActivity = useCallback(() => {
    if (!category) {
      return;
    }

    void navigate(`/categories/${category.id}?month=${month}`);
  }, [category, month, navigate]);

  const onCarryover = useCallback(
    (carryover: boolean) => {
      if (!category) {
        return;
      }
      onBudgetAction(month, 'carryover', {
        category: category.id,
        flag: carryover,
      });
      dispatch(collapseModals({ rootModalName: balanceMenuModalName }));
    },
    [category, onBudgetAction, month, dispatch, balanceMenuModalName],
  );

  const onOpenBalanceMenu = useCallback(() => {
    if (!category) {
      return;
    }
    dispatch(
      pushModal({
        modal: {
          name: balanceMenuModalName,
          options: {
            month,
            categoryId: category.id,
            onCarryover,
            onShowActivity,
          },
        },
      }),
    );
  }, [
    category,
    balanceMenuModalName,
    dispatch,
    month,
    onShowActivity,
    onCarryover,
  ]);

  if (!category) {
    return null;
  }

  return (
    <GridListItem
      textValue={category.name}
      data-testid="category-row"
      {...props}
    >
      <BudgetMobileIncomeRow
        category={category}
        month={month}
        isLast={isLast}
        isHidden={!!category.hidden}
        onEditCategory={onEdit}
        onBudgetAction={onBudgetAction}
        onPressAmount={
          budgetType === 'envelope' ? onOpenBalanceMenu : onShowActivity
        }
        onShowActivity={onShowActivity}
      />
    </GridListItem>
  );
}
