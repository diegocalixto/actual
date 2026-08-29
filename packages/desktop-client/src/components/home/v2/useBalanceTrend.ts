import { useMemo } from 'react';

import * as monthUtils from '@actual-app/core/shared/months';

import { createSpreadsheet as netWorthSpreadsheet } from '#components/reports/spreadsheets/net-worth-spreadsheet';
import { useReport } from '#components/reports/useReport';
import { useAccounts } from '#hooks/useAccounts';
import { useFormat } from '#hooks/useFormat';
import { useSyncedPref } from '#hooks/useSyncedPref';

import { HOME_DATE_LOCALE } from './homeLocale';

/** Six points reads as a trend on a phone without turning into a chart page. */
const MONTHS_SHOWN = 6;

export type BalanceTrendPoint = {
  /** Already localised by the spreadsheet, e.g. "ago '26". */
  label: string;
  /** Integer amount as stored by Actual. */
  value: number;
};

export type BalanceTrend = {
  points: BalanceTrendPoint[];
  /** Balance at the end of the range. */
  latest: number | null;
  /** Movement across the whole range. */
  change: number | null;
  isLoading: boolean;
};

/**
 * The last few months of total balance across every account.
 *
 * Reuses the Reports net-worth spreadsheet rather than walking balances again:
 * it already knows about transfers, closed accounts and the starting balance of
 * the first interval. Only the presentation is the Home's own — nothing is
 * imported from `reports/Overview.tsx` or from any `*Card.tsx`, so the
 * dashboard stays free of the Reports layout.
 */
export function useBalanceTrend(): BalanceTrend {
  const format = useFormat();
  const { data: accounts = [] } = useAccounts();
  const [firstDayOfWeekIdx] = useSyncedPref('firstDayOfWeekIdx');

  const end = monthUtils.currentMonth();
  const start = monthUtils.subMonths(end, MONTHS_SHOWN - 1);

  const params = useMemo(
    () =>
      netWorthSpreadsheet(
        start,
        end,
        accounts,
        [],
        'and',
        HOME_DATE_LOCALE,
        'Monthly',
        firstDayOfWeekIdx || '0',
        format,
      ),
    [start, end, accounts, firstDayOfWeekIdx, format],
  );

  const data = useReport('net_worth', params);

  if (!data) {
    return { points: [], latest: null, change: null, isLoading: true };
  }

  return {
    points: data.graphData.data.map(point => ({
      label: point.x,
      value: point.y,
    })),
    latest: data.netWorth,
    change: data.totalChange,
    isLoading: false,
  };
}
