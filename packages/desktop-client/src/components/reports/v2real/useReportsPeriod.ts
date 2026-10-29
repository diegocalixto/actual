import { useSearchParams } from 'react-router';

import * as monthUtils from '@actual-app/core/shared/months';
import { q } from '@actual-app/core/shared/query';
import { ptBR } from 'date-fns/locale';

import type { ReportsPeriodControl } from '#components/v2lab/reports/ReportsView';
import { useQuery } from '#hooks/useQuery';

import {
  canStepBack,
  canStepForward,
  periodMenuMonths,
  resolveReportsMonth,
} from './reportsPeriod';

/** The address's name for the month on screen: `/reports?month=2026-08`. */
const MONTH_PARAM = 'month';

/**
 * The month the Reports are showing, and the ways to change it.
 *
 * The month lives in the address, not in a component. That is what lets the
 * desktop and the phone be two arrangements of one page: either can be handed
 * the other's link, a window dragged across the breakpoint keeps its period,
 * and a reload comes back to the month that was on screen. Asked for nothing,
 * the page shows the current month and the address stays `/reports`.
 *
 * The periods end at the current month and begin at the first transaction the
 * Reports count — the same filter the figures use, so the arrows never lead to
 * a month the page could only draw empty.
 */
export function useReportsPeriod(): ReportsPeriodControl {
  const [searchParams, setSearchParams] = useSearchParams();

  const { data: firstRows } = useQuery<{ date: string }>(
    () =>
      q('transactions')
        .filter({
          'account.offbudget': false,
          'payee.transfer_acct': null,
        })
        .orderBy({ date: 'asc' })
        .limit(1)
        .select(['date']),
    [],
  );

  const firstDate = firstRows?.[0]?.date;
  const bounds = {
    earliest: firstDate ? monthUtils.monthFromDate(firstDate) : null,
    latest: monthUtils.currentMonth(),
  };
  const month = resolveReportsMonth(searchParams.get(MONTH_PARAM), bounds);

  function show(next: string) {
    setSearchParams(
      previous => {
        const params = new URLSearchParams(previous);
        if (next === bounds.latest) {
          params.delete(MONTH_PARAM);
        } else {
          params.set(MONTH_PARAM, next);
        }
        return params;
      },
      // Stepping through months is looking around one page, not visiting
      // several: Back leaves the Reports instead of replaying every month.
      { replace: true },
    );
  }

  return {
    month,
    isCurrentMonth: month === bounds.latest,
    // Formatted in pt-BR, as every date on this page is.
    monthLabel: formatMonth(month),
    options: periodMenuMonths(month, bounds).map(option => ({
      month: option,
      label: formatMonth(option),
      isCurrentMonth: option === bounds.latest,
    })),
    canGoPrevious: canStepBack(month, bounds),
    canGoNext: canStepForward(month, bounds),
    onPrevious: () => show(monthUtils.prevMonth(month)),
    onNext: () => show(monthUtils.nextMonth(month)),
    onSelect: show,
  };
}

/** "agosto de 2026". */
function formatMonth(month: string): string {
  return monthUtils.format(month, "MMMM 'de' yyyy", ptBR);
}
