import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import {
  defaultHoverIndex,
  kpis,
  monthly,
  rankedCategories,
  topCategory,
} from './reportsDerived';
import {
  axisMax,
  axisMin,
  axisTicks,
  months,
  periodLabel,
  previousPeriodLabel,
  scopeLabel,
  series,
  totals,
  xTicks,
} from './reportsFixtures';
import { ReportsView } from './ReportsView';
import type { ReportsViewData } from './ReportsView';

/**
 * Visual laboratory for Reports, desktop only.
 *
 * Nothing but a data source now: the composition lives in `ReportsView`, which
 * the real `/reports` renders too, so the approved design has exactly one
 * implementation. What is disposable here is `reportsFixtures`.
 */
export function V2LabReports() {
  const { t } = useTranslation();

  const data: ReportsViewData = {
    greeting: <Trans>Good afternoon</Trans>,
    periodLabel,
    scopeLabel,
    previousPeriodLabel,
    kpis,
    series,
    axisMin,
    axisMax,
    axisTicks,
    xTicks,
    totals,
    defaultHoverIndex,
    categories: rankedCategories,
    monthly,
    monthCount: months.length,
    insights: {
      netChange: kpis.net.change,
      savingsRate: kpis.savingsRate.value,
      topCategory,
    },
    isLoading: false,
    footnote: t('Visual laboratory — demonstration data'),
  };

  return <ReportsView data={data} />;
}
