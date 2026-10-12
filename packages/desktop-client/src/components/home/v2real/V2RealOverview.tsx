import React from 'react';

import { viewStyles } from '@actual-app/components/view';
import { css, cx } from '@emotion/css';

import { OverviewView } from '#components/v2lab/OverviewView';

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
  const {
    balances,
    monthTotals,
    accounts,
    categories,
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
          toBudget: balances.toBudget,
          monthTotals,
          accounts,
          categories,
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
