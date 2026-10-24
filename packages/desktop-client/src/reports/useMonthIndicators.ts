import { useMemo } from 'react';

import type {
  IndicatorCategories,
  IndicatorQueryRow,
  IndicatorTotals,
  MonthWindow,
  SpendingComposition,
} from '@actual-app/core/shared/month-indicators';
import {
  comparisonWindow,
  computeTotals,
  earliestIndicatorDateQuery,
  indicatorCategories,
  indicatorNotesQuery,
  monthIndicatorRowsQuery,
  notesLookup,
  spendingComposition,
  toIndicatorRows,
  totalsByKey,
  windowIndicatorRowsQuery,
} from '@actual-app/core/shared/month-indicators';
import * as monthUtils from '@actual-app/core/shared/months';

import { useCategories } from '#hooks/useCategories';
import { useQuery } from '#hooks/useQuery';

/**
 * The screens' side of `@actual-app/core/shared/month-indicators`: it runs that
 * module's queries and hands their rows to that module's arithmetic. The rules
 * themselves live there, with the file as the only source of what counts — the
 * notes that mark extraordinary inflows included.
 */

type NoteRow = { id: string; note: string | null };

function useIndicatorCategories(): {
  categories: IndicatorCategories;
  isLoading: boolean;
} {
  const { data: views, isPlaceholderData } = useCategories();
  const list = useMemo(() => views?.list ?? [], [views]);
  const grouped = useMemo(() => views?.grouped ?? [], [views]);

  // The marks are notes, so a note edited anywhere reclassifies the month on
  // its own: this is a live query like the rows'.
  const { data: notes, isLoading: loadingNotes } = useQuery<NoteRow>(
    () => indicatorNotesQuery(),
    [],
  );

  const categories = useMemo(
    () => indicatorCategories(list, grouped, notesLookup(notes)),
    [list, grouped, notes],
  );

  return { categories, isLoading: isPlaceholderData || loadingNotes };
}

export type MonthIndicators = {
  /** The month under the shared rules; `null` until every query has answered. */
  totals: IndicatorTotals | null;
  /** The same totals per day, for a running curve. */
  byDay: Map<string, IndicatorTotals>;
  /** Where the spending went and what came back, "Sem categoria" included. */
  composition: SpendingComposition;
  categories: IndicatorCategories;
  isLoading: boolean;
};

/**
 * One month of the budget's accounts, added up under the shared rules. The
 * Home's summary, the Home's spending list and the Reports' tiles, curve and
 * categories all read this, so they print one month.
 *
 * Nothing is derived until every query has answered. Outflows and inflows
 * arrive separately, and a composition built on half of them would show gross
 * spending with none of its refunds netted — a wrong figure, not a partial one.
 */
export function useMonthIndicators(month: string): MonthIndicators {
  const { data: outflows, isLoading: loadingOutflows } =
    useQuery<IndicatorQueryRow>(
      () => monthIndicatorRowsQuery(month, 'outflow'),
      [month],
    );
  const { data: inflows, isLoading: loadingInflows } =
    useQuery<IndicatorQueryRow>(
      () => monthIndicatorRowsQuery(month, 'inflow'),
      [month],
    );
  const { categories, isLoading: loadingCategories } = useIndicatorCategories();

  const isLoading = loadingOutflows || loadingInflows || loadingCategories;

  return useMemo(() => {
    const rows = isLoading ? [] : toIndicatorRows(outflows, inflows);

    return {
      totals: isLoading ? null : computeTotals(rows, categories),
      byDay: totalsByKey(rows, categories),
      composition: spendingComposition(rows, categories),
      categories,
      isLoading,
    };
  }, [outflows, inflows, categories, isLoading]);
}

export type MonthlyIndicatorWindow = {
  window: MonthWindow;
  /** One set of totals per month in the window; a month with nothing is absent. */
  byMonth: Map<string, IndicatorTotals>;
  isLoading: boolean;
};

/**
 * The months up to `month`, for the comparison panel: at most `maxMonths` of
 * them, and never one before the file's oldest transaction, which is the only
 * honest start for an average.
 */
export function useMonthlyIndicatorWindow(
  month: string,
  maxMonths: number,
): MonthlyIndicatorWindow {
  const { data: earliest, isLoading: loadingEarliest } = useQuery<{
    date: string;
  }>(() => earliestIndicatorDateQuery(), []);
  const earliestDate = earliest?.[0]?.date ?? null;

  const window = useMemo(
    () =>
      comparisonWindow(month, maxMonths, earliestDate, monthUtils.currentDay()),
    [month, maxMonths, earliestDate],
  );
  const windowStart = window.months[0];

  const { data: outflows, isLoading: loadingOutflows } =
    useQuery<IndicatorQueryRow>(
      () => windowIndicatorRowsQuery(windowStart, month, 'outflow'),
      [windowStart, month],
    );
  const { data: inflows, isLoading: loadingInflows } =
    useQuery<IndicatorQueryRow>(
      () => windowIndicatorRowsQuery(windowStart, month, 'inflow'),
      [windowStart, month],
    );
  const { categories, isLoading: loadingCategories } = useIndicatorCategories();

  const isLoading =
    loadingEarliest || loadingOutflows || loadingInflows || loadingCategories;

  return useMemo(() => {
    const rows = isLoading ? [] : toIndicatorRows(outflows, inflows);

    return { window, byMonth: totalsByKey(rows, categories), isLoading };
  }, [window, outflows, inflows, categories, isLoading]);
}
