import React, { useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';

import { View } from '@actual-app/components/view';
import { q } from '@actual-app/core/shared/query';
import type {
  CategoryEntity,
  CategoryGroupEntity,
} from '@actual-app/core/types/models';

import { MOBILE_NAV_SPACER } from '#components/mobile/MobileNavTabs';
import { PullToRefresh } from '#components/mobile/PullToRefresh';
import { SchedulesProvider } from '#hooks/useCachedSchedules';
import { useLocalPref } from '#hooks/useLocalPref';
import { useSyncedPref } from '#hooks/useSyncedPref';

import { ExpenseGroupList } from './ExpenseGroupList';
import { IncomeGroup } from './IncomeGroup';
import { budgetLayout } from './v2/BudgetMobileStyle';
import { BudgetMobileSummary } from './v2/BudgetMobileSummary';

type BudgetGroupsProps = {
  categoryGroups: CategoryGroupEntity[];
  onEditCategoryGroup: (id: CategoryGroupEntity['id']) => void;
  onEditCategory: (id: CategoryEntity['id']) => void;
  month: string;
  onBudgetAction: (month: string, action: string, args: unknown) => void;
  showHiddenCategories: boolean;
};

function BudgetGroups({
  categoryGroups,
  onEditCategoryGroup,
  onEditCategory,
  month,
  onBudgetAction,
  showHiddenCategories,
}: BudgetGroupsProps) {
  const { incomeGroup, expenseGroups } = useMemo(() => {
    const categoryGroupsToDisplay = categoryGroups.filter(
      group => !group.hidden || showHiddenCategories,
    );
    return {
      incomeGroup: categoryGroupsToDisplay.find(group => group.is_income),
      expenseGroups: categoryGroupsToDisplay.filter(group => !group.is_income),
    };
  }, [categoryGroups, showHiddenCategories]);

  const [collapsedGroupIds = [], setCollapsedGroupIdsPref] =
    useLocalPref('budget.collapsed');

  const onToggleCollapse = useCallback(
    (id: CategoryGroupEntity['id']) => {
      setCollapsedGroupIdsPref(
        collapsedGroupIds.includes(id)
          ? collapsedGroupIds.filter(collapsedId => collapsedId !== id)
          : [...collapsedGroupIds, id],
      );
    },
    [collapsedGroupIds, setCollapsedGroupIdsPref],
  );

  const isCollapsed = useCallback(
    (id: CategoryGroupEntity['id']) => {
      return collapsedGroupIds.includes(id);
    },
    [collapsedGroupIds],
  );

  return (
    <View data-testid="budget-groups">
      <ExpenseGroupList
        categoryGroups={expenseGroups}
        month={month}
        onEditCategoryGroup={onEditCategoryGroup}
        onEditCategory={onEditCategory}
        onBudgetAction={onBudgetAction}
        showHiddenCategories={showHiddenCategories}
        isCollapsed={isCollapsed}
        onToggleCollapse={onToggleCollapse}
      />

      {incomeGroup && (
        <IncomeGroup
          categoryGroup={incomeGroup}
          month={month}
          showHiddenCategories={showHiddenCategories}
          onEditCategoryGroup={onEditCategoryGroup}
          onEditCategory={onEditCategory}
          onBudgetAction={onBudgetAction}
          isCollapsed={isCollapsed}
          onToggleCollapse={onToggleCollapse}
        />
      )}
    </View>
  );
}

type BudgetTableProps = {
  categoryGroups: CategoryGroupEntity[];
  month: string;
  onShowBudgetSummary: () => void;
  onBudgetAction: (month: string, action: string, args: unknown) => void;
  onRefresh: () => Promise<void>;
  onEditCategoryGroup: (id: CategoryGroupEntity['id']) => void;
  onEditCategory: (id: CategoryEntity['id']) => void;
  /** The page's alerts, rendered at the top of the same scroll area. */
  banners: ReactNode;
};

/**
 * The Budget, on a phone.
 *
 * One scroll area holding the whole page, in the order the approved
 * composition argues for: what the budget still has to decide, then the
 * month's headline figure and its three totals, then where the plan actually
 * sits, envelope by envelope, with income closing the page.
 *
 * The alerts and the summary scroll with the list rather than sitting above it
 * in a fixed strip. That is what makes the pull-to-refresh gesture start at the
 * top of the page instead of halfway down it, and it is what gives the
 * envelopes the room the composition gives them once the reader has scrolled
 * past the summary.
 *
 * Composition only: no figure is computed here. The summary reads the month's
 * cells, each group header reads its own group cells, and each row reads its
 * category's — all of them the same cells the desktop Budget reads.
 */
export function BudgetTable({
  categoryGroups,
  month,
  onShowBudgetSummary,
  onBudgetAction,
  onRefresh,
  onEditCategoryGroup,
  onEditCategory,
  banners,
}: BudgetTableProps) {
  const [showHiddenCategories = false] = useLocalPref(
    'budget.showHiddenCategories',
  );

  const [budgetTypePref = 'envelope'] = useSyncedPref('budgetType');
  const budgetType = budgetTypePref === 'tracking' ? 'tracking' : 'envelope';

  const schedulesQuery = useMemo(() => q('schedules').select('*'), []);

  return (
    <PullToRefresh onRefresh={onRefresh}>
      <View
        data-testid="budget-table"
        style={{
          padding: `12px ${budgetLayout.gutter}px 0`,
          // The bar is fixed and overlays the page, so the bottom padding has
          // to clear it — and, on an iPhone, the home indicator under it. The
          // extra room is what the last group card's own bottom margin does not
          // cover once the bar is in front of it.
          paddingBottom: `calc(${MOBILE_NAV_SPACER} + 14px)`,
        }}
      >
        {banners}

        <BudgetMobileSummary
          month={month}
          budgetType={budgetType}
          onShowBudgetSummary={onShowBudgetSummary}
        />

        <SchedulesProvider query={schedulesQuery}>
          <BudgetGroups
            categoryGroups={categoryGroups}
            showHiddenCategories={showHiddenCategories}
            month={month}
            onEditCategoryGroup={onEditCategoryGroup}
            onEditCategory={onEditCategory}
            onBudgetAction={onBudgetAction}
          />
        </SchedulesProvider>
      </View>
    </PullToRefresh>
  );
}
