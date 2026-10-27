import React from 'react';
import { useTranslation } from 'react-i18next';

import { viewStyles } from '@actual-app/components/view';
import { css, cx } from '@emotion/css';

import { useRegionalFormatKey } from '#components/v2lab/LabStyle';
import { OverviewView } from '#components/v2lab/OverviewView';
import { useOpenIndicatorTransactions } from '#reports/useOpenIndicatorTransactions';

import { Greeting } from './Greeting';
import { OVERVIEW_ROOT_CLASS, OverviewStyle } from './OverviewStyle';
import { useRealOverviewData } from './useRealOverviewData';

/** A person's name. Not copy, so never a translation key. */
const AUTHOR = 'Diego Calixto';

/**
 * The real Overview.
 *
 * It contributes no layout of its own: `OverviewView` is the approved
 * composition, shared byte-for-byte with `/v2-lab/overview`, and this file only
 * supplies real data and the token scope. Anything that looks different between
 * the two routes is a difference in the data, never in the design.
 */
export function V2RealOverview() {
  // Redrawn whole when the file's number format or currency changes.
  const regionalFormat = useRegionalFormatKey();
  const { t } = useTranslation();
  const openTransactions = useOpenIndicatorTransactions();
  const {
    month,
    balances,
    monthTotals,
    monthDetails,
    accounts,
    categories,
    spendingComposition,
    movements,
    isAccountsLoading,
    isMonthLoading,
    isSpendingLoading,
    isActivityLoading,
  } = useRealOverviewData();

  return (
    // The page's landmark. The upstream pages get theirs from `Page`; these
    // are drawn outside it, and without one a screen reader has no way to jump
    // past the navigation to the content.
    <main
      key={regionalFormat}
      className={cx(
        viewStyles,
        OVERVIEW_ROOT_CLASS,
        css({ flex: 1, minHeight: 0 }),
      )}
    >
      <OverviewStyle />
      <OverviewView
        data={{
          greeting: <Greeting />,
          available: balances.available,
          cardsDebt: balances.cardsDebt,
          monthTotals,
          monthDetails,
          accounts,
          categories,
          spendingComposition,
          // Every row opens what it is made of, under the indicators' rules:
          // a category's transactions of the month, or the month's outflows
          // still without a category.
          onOpenCategory: category =>
            openTransactions(
              month,
              category.isUncategorized
                ? { kind: 'uncategorizedSpending' }
                : { kind: 'category', categoryId: category.id },
              category.isUncategorized
                ? t('Uncategorized spending')
                : category.name,
            ),
          onOpenPendingInflows: () =>
            openTransactions(
              month,
              { kind: 'pendingInflows' },
              t('Inflows to review'),
            ),
          movements,
          isAccountsLoading,
          isMonthLoading,
          isSpendingLoading,
          isActivityLoading,
          // Authorship, in the slot the approved composition already ends with:
          // small, muted, right-aligned, in the normal flow of the page.
          footnote: AUTHOR,
        }}
      />
    </main>
  );
}
