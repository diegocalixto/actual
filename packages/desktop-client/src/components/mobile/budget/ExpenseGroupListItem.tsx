import { useCallback, useMemo } from 'react';
import type { ComponentPropsWithoutRef } from 'react';
import { GridListItem } from 'react-aria-components';
import { Trans } from 'react-i18next';

import { SvgLayers } from '@actual-app/components/icons/v1';
import type {
  CategoryEntity,
  CategoryGroupEntity,
} from '@actual-app/core/types/models';

import { useSheetValue } from '#hooks/useSheetValue';
import { useSyncedPref } from '#hooks/useSyncedPref';
import { envelopeBudget, trackingBudget } from '#spreadsheet/bindings';

import { ExpenseCategoryList } from './ExpenseCategoryList';
import { BudgetMobileGroupCard } from './v2/BudgetMobileGroupCard';
import { BudgetMobileGroupHeader } from './v2/BudgetMobileGroupHeader';

type ExpenseGroupListItemProps = ComponentPropsWithoutRef<
  typeof GridListItem<CategoryGroupEntity>
> & {
  month: string;
  showHiddenCategories: boolean;
  onEditCategoryGroup: (id: CategoryGroupEntity['id']) => void;
  onEditCategory: (id: string) => void;
  onBudgetAction: (month: string, action: string, args: unknown) => void;
  isCollapsed: (id: CategoryGroupEntity['id']) => boolean;
  onToggleCollapse: (id: CategoryGroupEntity['id']) => void;
  isHidden: boolean;
};

export function ExpenseGroupListItem({
  onEditCategoryGroup,
  onEditCategory,
  month,
  onBudgetAction,
  showHiddenCategories,
  isCollapsed,
  onToggleCollapse,
  isHidden,
  ...props
}: ExpenseGroupListItemProps) {
  const { value: categoryGroup } = props;

  const categories = useMemo(
    () =>
      !categoryGroup || isCollapsed(categoryGroup.id)
        ? []
        : (categoryGroup.categories?.filter(
            category => !category.hidden || showHiddenCategories,
          ) ?? []),
    [categoryGroup, isCollapsed, showHiddenCategories],
  );

  const shouldHideCategory = useCallback(
    (category: CategoryEntity) => {
      return !!(category.hidden || categoryGroup?.hidden);
    },
    [categoryGroup?.hidden],
  );

  if (!categoryGroup) {
    return null;
  }

  return (
    <GridListItem textValue={categoryGroup.name} {...props}>
      <BudgetMobileGroupCard>
        <ExpenseGroupHeader
          categoryGroup={categoryGroup}
          showHiddenCategories={showHiddenCategories}
          onEditCategoryGroup={onEditCategoryGroup}
          isCollapsed={isCollapsed}
          onToggleCollapse={onToggleCollapse}
          isHidden={isHidden}
        />

        <ExpenseCategoryList
          categoryGroup={categoryGroup}
          categories={categories}
          month={month}
          onEditCategory={onEditCategory}
          onBudgetAction={onBudgetAction}
          shouldHideCategory={shouldHideCategory}
        />
      </BudgetMobileGroupCard>
    </GridListItem>
  );
}

type ExpenseGroupHeaderProps = {
  categoryGroup: CategoryGroupEntity;
  showHiddenCategories: boolean;
  onEditCategoryGroup: (id: CategoryGroupEntity['id']) => void;
  isCollapsed: (id: CategoryGroupEntity['id']) => boolean;
  onToggleCollapse: (id: CategoryGroupEntity['id']) => void;
  isHidden: boolean;
};

/**
 * A group's own line.
 *
 * The two figures are the engine's `group-budget` and `group-leftover` cells,
 * not a sum of the rows below: a group stays right while one of its categories
 * is still resolving, and a collapsed group still tells the truth about itself.
 *
 * Every expense group is drawn in the same violet, with the same glyph. The
 * name is what distinguishes one from another; giving each a colour of its own
 * would spend the screen's one semantic channel on identity, which is exactly
 * what the category rows need it for.
 */
export function ExpenseGroupHeader({
  categoryGroup,
  showHiddenCategories,
  onEditCategoryGroup,
  isCollapsed,
  onToggleCollapse,
  isHidden,
}: ExpenseGroupHeaderProps) {
  const [budgetType = 'envelope'] = useSyncedPref('budgetType');
  const isTracking = budgetType === 'tracking';

  const budgeted = useSheetValue<
    'envelope-budget' | 'tracking-budget',
    'group-budget'
  >(
    isTracking
      ? trackingBudget.groupBudgeted(categoryGroup.id)
      : envelopeBudget.groupBudgeted(categoryGroup.id),
  );

  const balance = useSheetValue<
    'envelope-budget' | 'tracking-budget',
    'group-leftover'
  >(
    isTracking
      ? trackingBudget.groupBalance(categoryGroup.id)
      : envelopeBudget.groupBalance(categoryGroup.id),
  );

  // Counted from the group itself rather than from the rendered rows, which are
  // empty while the group is folded.
  const count =
    categoryGroup.categories?.filter(
      category => !category.hidden || showHiddenCategories,
    ).length ?? 0;

  return (
    <BudgetMobileGroupHeader
      name={categoryGroup.name}
      Icon={SvgLayers}
      hue="var(--dfl-hue-violet)"
      count={count}
      primary={{ value: budgeted, caption: <Trans>Orçado</Trans> }}
      secondary={{ value: balance, caption: <Trans>Saldo</Trans> }}
      isCollapsed={isCollapsed(categoryGroup.id)}
      onToggleCollapse={() => onToggleCollapse(categoryGroup.id)}
      onEditGroup={() => onEditCategoryGroup(categoryGroup.id)}
      isHidden={isHidden}
      hasDragHandle
    />
  );
}
