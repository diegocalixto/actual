import React from 'react';

import { View } from '@actual-app/components/view';

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
    <View className={OVERVIEW_ROOT_CLASS} style={{ flex: 1, minHeight: 0 }}>
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
    </View>
  );
}
