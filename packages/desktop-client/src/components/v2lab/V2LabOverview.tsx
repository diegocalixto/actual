import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import {
  labAccounts,
  labBalances,
  labCategories,
  labMonthTotals,
  labMovements,
} from './overviewFixtures';
import { OverviewView } from './OverviewView';
import type { OverviewViewData } from './OverviewView';

/**
 * Visual laboratory for the Overview, desktop only.
 *
 * Nothing but a data source now: the composition lives in `OverviewView`, which
 * `/home` renders too, so the approved design has exactly one implementation.
 * What is disposable here is `overviewFixtures` — swapping it for an adapter
 * over real cells is what the real route already does.
 */
export function V2LabOverview() {
  const { t } = useTranslation();

  const data: OverviewViewData = {
    greeting: <Trans>Good afternoon</Trans>,
    available: labBalances.available,
    toBudget: labBalances.toBudget,
    monthTotals: labMonthTotals,
    accounts: labAccounts,
    categories: labCategories,
    movements: labMovements,
    isAccountsLoading: false,
    isMonthLoading: false,
    isSpendingLoading: false,
    isActivityLoading: false,
    footnote: t('Visual laboratory — demonstration data'),
  };

  return <OverviewView data={data} />;
}
