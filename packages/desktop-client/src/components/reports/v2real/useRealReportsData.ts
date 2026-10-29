import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  comparison,
  emptyTotals,
  reportsKpis,
  spendingShare,
} from '@actual-app/core/shared/month-indicators';
import type {
  IndicatorTotals,
  MonthWindow,
} from '@actual-app/core/shared/month-indicators';
import * as monthUtils from '@actual-app/core/shared/months';
import { ptBR } from 'date-fns/locale';
import type { TFunction } from 'i18next';

import { iconForCategory } from '#components/v2lab/LabStyle';
import type {
  DayPoint,
  ExpenseCategory,
  ReportsViewData,
} from '#components/v2lab/reports/ReportsView';
import {
  useMonthIndicators,
  useMonthlyIndicatorWindow,
} from '#reports/useMonthIndicators';

import { hueForId } from './reportsPresentation';

/** How many months the comparison panel looks back over at most, this one included. */
const MONTH_WINDOW = 6;

/**
 * Everything the real Reports shows, read through the rules in
 * `@actual-app/core/shared/month-indicators` — the same rules the Home's "Este mês" reads, so
 * the two screens print one month.
 *
 * What those rules decide, in short: transfers between the file's own
 * accounts and starting balances are neither income nor spending; a refund
 * into an expense category lowers that spending instead of counting as
 * income, and a category refunded more than it was spent lowers the total; an
 * outflow without a category is spending, shown as "Sem categoria"; an inflow
 * without a category is listed for review and counted nowhere; and an income
 * category — or group — whose note carries the #extraordinária tag is kept
 * apart from the classified receipts the tiles are about.
 *
 * The comparison looks back at most six months and never past the file's
 * oldest transaction: a month before the history is not a month with no
 * movement. The months it cannot vouch for whole are named as partial.
 *
 * Dates are formatted in pt-BR because this screen's own copy is Portuguese.
 *
 * `month` is the period, as `YYYY-MM`. The desktop and the phone both call
 * this with the month in the address, which is why their figures cannot
 * differ.
 */
export function useRealReportsData(
  month: string = monthUtils.currentMonth(),
): ReportsViewData {
  const { t } = useTranslation();

  const monthStart = monthUtils.firstDayOfMonth(month);
  const monthEnd = monthUtils.lastDayOfMonth(month);

  const period = useMonthIndicators(month);
  const history = useMonthlyIndicatorWindow(month, MONTH_WINDOW);

  const isLoading = period.isLoading || history.isLoading;

  const view = useMemo(() => {
    const totals = period.totals ?? emptyTotals();

    // ---- the curve: a running total per day, so every point answers
    //      "so far this period", exactly as the approved chart reads ----------
    const days = monthUtils.dayRangeInclusive(monthStart, monthEnd);
    let income = 0;
    let expenses = 0;
    const series: DayPoint[] = days.map((day, index) => {
      const dayTotals = period.byDay.get(day);
      income += dayTotals?.classifiedIncome ?? 0;
      expenses += dayTotals?.spending ?? 0;

      return {
        day: index + 1,
        label: monthUtils.format(day, "d 'de' MMMM 'de' yyyy", ptBR),
        income,
        expenses,
        net: income - expenses,
      };
    });

    const axis = axisFor(
      totals.classifiedIncome,
      totals.spending,
      Math.min(0, ...series.map(point => point.net)),
    );

    // ---- monthly window --------------------------------------------------------
    const monthKeys = history.window.months;
    const totalsFor = (key: string): IndicatorTotals =>
      history.byMonth.get(key) ?? emptyTotals();
    const monthlyIncome = monthKeys.map(key => totalsFor(key).classifiedIncome);
    const monthlyExpenses = monthKeys.map(key => totalsFor(key).spending);
    const monthlyNet = monthKeys.map(key => totalsFor(key).classifiedResult);

    const previousMonth = monthUtils.subMonths(month, 1);
    const previousTotals = history.byMonth.get(previousMonth) ?? null;

    const kpis = reportsKpis(totals, previousTotals);

    // ---- categories ------------------------------------------------------------
    // The donut and the list show the outflow side, and every share is taken
    // on that side's total. A category refunded more than it was spent has no
    // slice to draw — a negative one does not exist — so it is not in the list
    // and the strip above declares it instead, which is why the list can add
    // up to more than the "Gastos" tile without either being wrong.
    const ranked = period.composition.entries
      .map(entry => {
        const name = entry.isUncategorized
          ? t('Sem categoria')
          : (entry.name ?? t('Sem categoria'));
        return {
          id: entry.id,
          name,
          amount: entry.amount,
          hue: hueForId(entry.id),
          Icon: iconForCategory(name),
          priorMonths: [],
        } satisfies ExpenseCategory;
      })
      .map(category => ({
        ...category,
        share: spendingShare(category.amount, period.composition),
      }));

    const periodLabel = `${monthUtils.format(monthStart, 'd MMM', ptBR)} – ${monthUtils.format(monthEnd, "d MMM 'de' yyyy", ptBR)}`;

    return {
      greeting: greeting(t),
      periodLabel,
      scopeLabel: t('Contas no orçamento'),
      // After "vs.", so in the lower case Portuguese gives a month's name.
      previousPeriodLabel: monthUtils.format(previousMonth, 'MMMM', ptBR),
      kpis,
      series,
      axisMin: axis.min,
      axisMax: axis.max,
      axisTicks: axis.ticks,
      xTicks: xTicksFor(days.length),
      // The axis names the month it is actually showing.
      formatXTick: (day: number) =>
        monthUtils.format(days[day - 1] ?? monthStart, 'd MMM', ptBR),
      totals: {
        income: totals.classifiedIncome,
        expenses: totals.spending,
        net: totals.classifiedResult,
      },
      breakdown: {
        extraordinaryIncome: totals.extraordinaryIncome,
        resultWithExtraordinary: totals.resultWithExtraordinary,
        pendingInflows: totals.pendingInflows,
        uncategorizedSpending: totals.uncategorizedSpending,
        refunds: totals.refunds,
        outflows: period.composition.outflows,
        credited: period.composition.credited,
      },
      defaultHoverIndex: Math.max(0, series.length - 1),
      categories: ranked,
      monthly: {
        income: comparison(monthlyIncome),
        expenses: comparison(monthlyExpenses),
        net: comparison(monthlyNet),
      },
      monthCount: monthKeys.length,
      monthlyNote: partialNote(history.window, t),
      // Deliberately absent: the panel's three statements need a per-category
      // history this page does not query, and writing them without it would be
      // claiming an analysis the product has not done.
      insights: undefined,
      isLoading,
    };
  }, [period, history, monthStart, monthEnd, month, isLoading, t]);

  // While another period's queries are out, the rows in hand are still the
  // previous period's, and they do not come back together. Drawn as they
  // arrive, the page would spend a moment as a month that never was: the new
  // period's days over the old one's categories, with zeros between. So the
  // last period that arrived whole stays on screen, whole, until the next one
  // has. This is the pattern React documents for keeping a value from an
  // earlier render; nothing here is computed differently.
  const [settled, setSettled] = useState<ReportsViewData | null>(null);
  if (!isLoading && settled !== view) {
    setSettled(view);
  }

  return isLoading && settled ? settled : view;
}

/**
 * The months the comparison cannot vouch for whole, said in one sentence, or
 * `undefined` when every month in the window is complete.
 */
function partialNote(window: MonthWindow, t: TFunction): string | undefined {
  const parts: string[] = [];
  for (const key of window.months) {
    const reasons = window.partial[key] ?? [];
    if (reasons.length === 0) {
      continue;
    }

    const month = monthUtils.format(key, 'MMM', ptBR);
    // Not "only from the 14th": the first transaction recorded says nothing
    // about what was never written down before it, so a month where the
    // records begin is called uncertain rather than dated. The file's first
    // month can also be the current one, and then it is both things at once.
    if (reasons.includes('start') && reasons.includes('inProgress')) {
      parts.push(
        t('{{month}} may be incomplete and is still in progress', { month }),
      );
    } else if (reasons.includes('start')) {
      parts.push(t('{{month}} may be incomplete', { month }));
    } else {
      parts.push(t('{{month}} still in progress', { month }));
    }
  }
  if (parts.length === 0) {
    return undefined;
  }
  return t('Partial months: {{parts}}.', { parts: parts.join('; ') });
}

/**
 * The scale of a period nothing has happened in yet. Any ceiling is arbitrary
 * there; R$ 100 gives the empty plot four gridlines with distinct labels
 * instead of five that all read zero.
 */
const EMPTY_AXIS_CEILING = 10000;

/** A round ceiling above the tallest series, so the curve never touches the top. */
function axisCeiling(income: number, expenses: number): number {
  if (income <= 0 && expenses <= 0) {
    return EMPTY_AXIS_CEILING;
  }
  const peak = Math.max(income, expenses, 1);
  const magnitude = 10 ** Math.floor(Math.log10(peak));
  return Math.ceil((peak * 1.15) / magnitude) * magnitude;
}

/**
 * The plot's scale: a gridline every quarter of the ceiling, from the ceiling
 * down to zero — and on below it, in the same step, as far as the net result
 * goes.
 *
 * The net line is below zero whenever more has left than has come in, which is
 * every day before the month's income lands. A scale that stopped at zero cut
 * that part of the line off and left its sample dots on top of the labels and
 * totals under the plot. It reaches only as far as the line's lowest point,
 * rounded out to the next gridline.
 */
function axisFor(income: number, expenses: number, lowestNet: number) {
  const max = axisCeiling(income, expenses);
  const step = max / 4;
  const min = lowestNet < 0 ? -Math.ceil(-lowestNet / step) * step : 0;

  const ticks: number[] = [];
  for (let tick = max; tick >= min; tick -= step) {
    ticks.push(tick);
  }

  return { min, max, ticks };
}

/** Five or six labels, whatever divides the month most evenly. */
function xTicksFor(dayCount: number): number[] {
  if (dayCount <= 1) {
    return [1];
  }

  const step = Math.max(1, Math.round((dayCount - 1) / 5));
  const ticks: number[] = [];

  for (let day = 1; day <= dayCount; day += step) {
    ticks.push(day);
  }

  if (ticks[ticks.length - 1] !== dayCount) {
    ticks.push(dayCount);
  }

  return ticks;
}

function greeting(t: (key: string) => string): string {
  const hour = new Date().getHours();

  if (hour < 12) {
    return t('Bom dia');
  }
  if (hour < 18) {
    return t('Boa tarde');
  }
  return t('Boa noite');
}
