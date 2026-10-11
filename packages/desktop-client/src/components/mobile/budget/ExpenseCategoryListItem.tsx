import { useCallback } from 'react';
import type { ComponentPropsWithoutRef } from 'react';
import { GridListItem } from 'react-aria-components';

import type { CategoryEntity } from '@actual-app/core/types/models';

import { useNavigate } from '#hooks/useNavigate';

import { BudgetMobileCategoryRow } from './v2/BudgetMobileCategoryRow';

type ExpenseCategoryListItemProps = ComponentPropsWithoutRef<
  typeof GridListItem<CategoryEntity>
> & {
  month: string;
  isHidden: boolean;
  /** Position within its group, which is what chooses the row's tile colour. */
  index: number;
  /** The last row closes the group's card, so it draws no divider. */
  isLast: boolean;
  onEditCategory: (id: CategoryEntity['id']) => void;
  onBudgetAction: (month: string, action: string, args: unknown) => void;
};

/**
 * One expense category, as a row of the group's list.
 *
 * The list item itself is only the drag-and-drop and selection shell that
 * react-aria needs; everything visible, and every menu the row raises, lives in
 * `BudgetMobileCategoryRow`.
 */
export function ExpenseCategoryListItem({
  month,
  isHidden,
  index,
  isLast,
  onEditCategory,
  onBudgetAction,
  ...props
}: ExpenseCategoryListItemProps) {
  const { value: category } = props;
  const navigate = useNavigate();

  const onShowActivity = useCallback(() => {
    if (!category) {
      return;
    }
    void navigate(`/categories/${category.id}?month=${month}`);
  }, [category, month, navigate]);

  if (!category) {
    return null;
  }

  return (
    <GridListItem
      textValue={category.name}
      data-testid="category-row"
      {...props}
    >
      <BudgetMobileCategoryRow
        category={category}
        month={month}
        index={index}
        isLast={isLast}
        isHidden={isHidden}
        onEditCategory={onEditCategory}
        onBudgetAction={onBudgetAction}
        onShowActivity={onShowActivity}
      />
    </GridListItem>
  );
}
