import { useMemo } from 'react';
import { Trans } from 'react-i18next';

import { SvgArrowThinDown } from '@actual-app/components/icons/v1';
import * as monthUtils from '@actual-app/core/shared/months';
import type { CategoryGroupEntity } from '@actual-app/core/types/models';

import { useHomeSheetCell } from '#components/home/useHomeSheetCell';
import { useSheetValue } from '#hooks/useSheetValue';
import { useSyncedPref } from '#hooks/useSyncedPref';
import { envelopeBudget, trackingBudget } from '#spreadsheet/bindings';

import { IncomeCategoryList } from './IncomeCategoryList';
import { BudgetMobileGroupCard } from './v2/BudgetMobileGroupCard';
import { BudgetMobileGroupHeader } from './v2/BudgetMobileGroupHeader';

type IncomeGroupProps = {
  categoryGroup: CategoryGroupEntity;
  month: string;
  showHiddenCategories: boolean;
  onEditCategoryGroup: (id: CategoryGroupEntity['id']) => void;
  onEditCategory: (id: string) => void;
  onBudgetAction: (month: string, action: string, args: unknown) => void;
  isCollapsed: (id: CategoryGroupEntity['id']) => boolean;
  onToggleCollapse: (id: CategoryGroupEntity['id']) => void;
};

/**
 * Where the month's money came from.
 *
 * It closes the page rather than opening it: on a budget screen money already
 * received is the context the plan is read against, not the subject. Green is
 * used here and nowhere else on this screen, because a positive figure in this
 * section has one unambiguous meaning.
 *
 * A tracking budget budgets its income as well as receiving it, so the header
 * carries the plan alongside the total; an envelope budget has no such cell and
 * the header shows one figure rather than an invented second one.
 */
export function IncomeGroup({
  categoryGroup,
  month,
  showHiddenCategories,
  onEditCategoryGroup,
  onEditCategory,
  onBudgetAction,
  isCollapsed,
  onToggleCollapse,
}: IncomeGroupProps) {
  const [budgetType = 'envelope'] = useSyncedPref('budgetType');
  const isTracking = budgetType === 'tracking';

  const categories = useMemo(
    () =>
      isCollapsed(categoryGroup.id)
        ? []
        : (categoryGroup.categories?.filter(
            category => !category.hidden || showHiddenCategories,
          ) ?? []),
    [
      categoryGroup.categories,
      categoryGroup.id,
      isCollapsed,
      showHiddenCategories,
    ],
  );

  const received = useSheetValue<
    'envelope-budget' | 'tracking-budget',
    'group-sum-amount'
  >(
    isTracking
      ? trackingBudget.groupSumAmount(categoryGroup.id)
      : envelopeBudget.groupSumAmount(categoryGroup.id),
  );

  // An envelope budget creates no `group-budget` cell for the income group, so
  // the read has to be skippable rather than merely ignored. `useHomeSheetCell`
  // is the app's existing "read one cell from a named sheet, or none" hook —
  // the mobile Home already reads its month totals through it — and passing
  // `null` here means no subscription is opened at all under an envelope
  // budget, instead of binding a cell that does not exist.
  const budgeted = useHomeSheetCell(
    monthUtils.sheetForMonth(month),
    isTracking ? trackingBudget.groupBudgeted(categoryGroup.id) : null,
  );

  const count =
    categoryGroup.categories?.filter(
      category => !category.hidden || showHiddenCategories,
    ).length ?? 0;

  return (
    <BudgetMobileGroupCard>
      <BudgetMobileGroupHeader
        name={categoryGroup.name}
        Icon={SvgArrowThinDown}
        hue="var(--dfl-hue-green)"
        count={count}
        primary={{ value: received, caption: <Trans>Total recebido</Trans> }}
        secondary={
          isTracking
            ? { value: budgeted, caption: <Trans>Orçado</Trans> }
            : undefined
        }
        isCollapsed={isCollapsed(categoryGroup.id)}
        onToggleCollapse={() => onToggleCollapse(categoryGroup.id)}
        onEditGroup={() => onEditCategoryGroup(categoryGroup.id)}
        isHidden={!!categoryGroup.hidden}
        hasDragHandle={false}
      />

      <IncomeCategoryList
        categories={categories}
        month={month}
        onEditCategory={onEditCategory}
        onBudgetAction={onBudgetAction}
      />
    </BudgetMobileGroupCard>
  );
}
