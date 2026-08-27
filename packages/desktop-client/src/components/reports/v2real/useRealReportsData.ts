import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import * as monthUtils from '@actual-app/core/shared/months';
import { q } from '@actual-app/core/shared/query';
import type { CategoryEntity } from '@actual-app/core/types/models';
import { ptBR } from 'date-fns/locale';

import { iconForCategory } from '#components/v2lab/LabStyle';
import type {
  DayPoint,
  ExpenseCategory,
  ReportsViewData,
} from '#components/v2lab/reports/ReportsView';
import { useCategories } from '#hooks/useCategories';
import { useQuery } from '#hooks/useQuery';

import { hueForId } from './reportsPresentation';

/** How many months the comparison panel looks back over, this one included. */
const MONTH_WINDOW = 6;

type DateSum = { date: string; amount: number };
type CategorySum = { category: string | null; amount: number };

/**
 * Everything the real Reports shows, read from the application's own queries.
 *
 * Nothing is invented and nothing is recomputed twice: five aggregations run in
 * the engine — daily income, daily expenses, spending by category, and the same
 * two totals grouped by month — and every figure on screen is derived from
 * those. The filters are the ones Actual's own cash-flow report uses
 * (`account.offbudget: false`, `payee.transfer_acct: null`), so a transfer
 * between your accounts never counts as income or as spending.
 *
 * Dates are formatted in pt-BR because this screen's own copy is Portuguese.
 */
export function useRealReportsData(): ReportsViewData {
  const { t } = useTranslation();

  const month = monthUtils.currentMonth();
  const monthStart = monthUtils.firstDayOfMonth(month);
  const monthEnd = monthUtils.lastDayOfMonth(month);
  const windowStart = monthUtils.subMonths(month, MONTH_WINDOW - 1);

  // ---- the period, day by day ------------------------------------------------
  // Written out per query rather than through a helper: `useQuery` memoises on
  // the dependency list the caller gives it, and a helper closed over these
  // dates would just be a second name for the same thing.
  const { data: incomeDays, isLoading: loadingIncome } = useQuery<DateSum>(
    () =>
      q('transactions')
        .filter({
          $and: [{ date: { $gte: monthStart } }, { date: { $lte: monthEnd } }],
          'account.offbudget': false,
          'payee.transfer_acct': null,
          amount: { $gt: 0 },
        })
        .groupBy(['date'])
        .select(['date', { amount: { $sum: '$amount' } }]),
    [monthStart, monthEnd],
  );

  const { data: expenseDays, isLoading: loadingExpenses } = useQuery<DateSum>(
    () =>
      q('transactions')
        .filter({
          $and: [{ date: { $gte: monthStart } }, { date: { $lte: monthEnd } }],
          'account.offbudget': false,
          'payee.transfer_acct': null,
          amount: { $lt: 0 },
        })
        .groupBy(['date'])
        .select(['date', { amount: { $sum: '$amount' } }]),
    [monthStart, monthEnd],
  );

  // ---- spending by category, this period -------------------------------------
  const { data: categorySums, isLoading: loadingCategories } =
    useQuery<CategorySum>(
      () =>
        q('transactions')
          .filter({
            $and: [
              { date: { $gte: monthStart } },
              { date: { $lte: monthEnd } },
            ],
            'account.offbudget': false,
            'payee.transfer_acct': null,
            amount: { $lt: 0 },
          })
          .groupBy(['category'])
          .select(['category', { amount: { $sum: '$amount' } }]),
      [monthStart, monthEnd],
    );

  // ---- the last months, for the comparison -----------------------------------
  const { data: incomeMonths, isLoading: loadingIncomeMonths } =
    useQuery<DateSum>(
      () =>
        q('transactions')
          .filter({
            $and: [
              { date: { $transform: '$month', $gte: windowStart } },
              { date: { $transform: '$month', $lte: month } },
            ],
            'account.offbudget': false,
            'payee.transfer_acct': null,
            amount: { $gt: 0 },
          })
          .groupBy([{ $month: '$date' }])
          .select([
            { date: { $month: '$date' } },
            { amount: { $sum: '$amount' } },
          ]),
      [windowStart, month],
    );

  const { data: expenseMonths, isLoading: loadingExpenseMonths } =
    useQuery<DateSum>(
      () =>
        q('transactions')
          .filter({
            $and: [
              { date: { $transform: '$month', $gte: windowStart } },
              { date: { $transform: '$month', $lte: month } },
            ],
            'account.offbudget': false,
            'payee.transfer_acct': null,
            amount: { $lt: 0 },
          })
          .groupBy([{ $month: '$date' }])
          .select([
            { date: { $month: '$date' } },
            { amount: { $sum: '$amount' } },
          ]),
      [windowStart, month],
    );

  // Read with the element type stated rather than through a destructuring
  // default: `= { list: [] }` types the fallback as `never[]`, which made this
  // `CategoryEntity[] | never[]`, and `.map` over a union of array types hands
  // the callback an `any` — that is where the category names lost their type on
  // the way to the panel below. Memoised so an unresolved query does not yield
  // a fresh array on every render.
  const { data: categoryViews } = useCategories();
  const categories: CategoryEntity[] = useMemo(
    () => categoryViews?.list ?? [],
    [categoryViews],
  );

  const isLoading =
    loadingIncome ||
    loadingExpenses ||
    loadingCategories ||
    loadingIncomeMonths ||
    loadingExpenseMonths;

  return useMemo(() => {
    // ---- the curve: a running total per day, so every point answers
    //      "so far this period", exactly as the approved chart reads ----------
    // `range` walks months; days need `dayRangeInclusive`.
    const days = monthUtils.dayRangeInclusive(monthStart, monthEnd);
    const incomeByDay = sumByKey(incomeDays);
    const expenseByDay = sumByKey(expenseDays);

    let income = 0;
    let expenses = 0;
    const series: DayPoint[] = days.map((day, index) => {
      income += incomeByDay[day] ?? 0;
      // Outflows arrive negative; the chart plots them as an amount spent.
      expenses += -(expenseByDay[day] ?? 0);

      return {
        day: index + 1,
        label: monthUtils.format(day, "d 'de' MMMM 'de' yyyy", ptBR),
        income,
        expenses,
        net: income - expenses,
      };
    });

    const totals = {
      income,
      expenses,
      net: income - expenses,
    };

    // ---- monthly window --------------------------------------------------------
    const monthKeys = Array.from({ length: MONTH_WINDOW }, (_, index) =>
      monthUtils.addMonths(windowStart, index),
    );
    const incomeByMonth = sumByKey(incomeMonths);
    const expenseByMonth = sumByKey(expenseMonths);
    const monthlyIncome = monthKeys.map(key => incomeByMonth[key] ?? 0);
    const monthlyExpenses = monthKeys.map(key => -(expenseByMonth[key] ?? 0));
    const monthlyNet = monthlyIncome.map(
      (value, index) => value - monthlyExpenses[index],
    );

    const previousIndex = monthKeys.length - 2;
    const previousIncome = monthlyIncome[previousIndex] ?? 0;
    const previousExpenses = monthlyExpenses[previousIndex] ?? 0;
    const previousNet = previousIncome - previousExpenses;

    const kpis = {
      income: {
        value: totals.income,
        change: change(totals.income, previousIncome),
      },
      expenses: {
        value: totals.expenses,
        change: change(totals.expenses, previousExpenses),
      },
      net: { value: totals.net, change: change(totals.net, previousNet) },
      savingsRate: {
        value: rate(totals.income, totals.net),
        points:
          (rate(totals.income, totals.net) -
            rate(previousIncome, previousNet)) *
          100,
      },
    };

    // ---- categories ------------------------------------------------------------
    // The type arguments are what make the pair a tuple: without them the
    // literal infers as an array and `Map` has no matching overload.
    const namesById = new Map<CategoryEntity['id'], CategoryEntity['name']>(
      categories.map(c => [c.id, c.name]),
    );
    const ranked = (categorySums ?? [])
      .map(row => {
        const id = row.category ?? 'uncategorised';
        const name = row.category
          ? (namesById.get(row.category) ?? t('Sem categoria'))
          : t('Sem categoria');

        return {
          id,
          name,
          amount: -row.amount,
          hue: hueForId(id),
          Icon: iconForCategory(name),
          priorMonths: [],
        } satisfies ExpenseCategory;
      })
      .filter(category => category.amount > 0)
      .sort((a, b) => b.amount - a.amount)
      .map(category => ({
        ...category,
        share: totals.expenses > 0 ? category.amount / totals.expenses : 0,
      }));

    const periodLabel = `${monthUtils.format(monthStart, 'd MMM', ptBR)} – ${monthUtils.format(monthEnd, "d MMM 'de' yyyy", ptBR)}`;

    return {
      greeting: greeting(t),
      periodLabel,
      scopeLabel: t('Contas no orçamento'),
      previousPeriodLabel: capitalise(
        monthUtils.format(monthKeys[previousIndex] ?? month, 'MMMM', ptBR),
      ),
      kpis,
      series,
      axisMin: 0,
      axisMax: axisCeiling(totals.income, totals.expenses),
      axisTicks: axisTicks(axisCeiling(totals.income, totals.expenses)),
      xTicks: xTicksFor(days.length),
      // The axis names the month it is actually showing.
      formatXTick: (day: number) =>
        monthUtils.format(days[day - 1] ?? monthStart, 'd MMM', ptBR),
      totals,
      defaultHoverIndex: Math.max(0, series.length - 1),
      categories: ranked,
      monthly: {
        income: comparison(monthlyIncome),
        expenses: comparison(monthlyExpenses),
        net: comparison(monthlyNet),
      },
      monthCount: MONTH_WINDOW,
      // Deliberately absent: the panel's three statements need a per-category
      // history this page does not query, and writing them without it would be
      // claiming an analysis the product has not done.
      insights: undefined,
      isLoading,
    };
  }, [
    incomeDays,
    expenseDays,
    categorySums,
    incomeMonths,
    expenseMonths,
    categories,
    monthStart,
    monthEnd,
    windowStart,
    month,
    isLoading,
    t,
  ]);
}

function sumByKey(rows: ReadonlyArray<DateSum> | null): Record<string, number> {
  const out: Record<string, number> = {};

  for (const row of rows ?? []) {
    out[row.date] = (out[row.date] ?? 0) + row.amount;
  }

  return out;
}

/**
 * A ratio against a non-positive base is arithmetic without meaning — "up
 * 1184% from a loss" tells a reader nothing — so those come back `null` and the
 * chip is simply left out.
 */
function change(current: number, previous: number): number | null {
  return previous > 0 ? current / previous - 1 : null;
}

function rate(income: number, net: number): number {
  return income > 0 ? net / income : 0;
}

/**
 * The window's averages, with the trend across it: the mean of the second half
 * against the mean of the first. A single month-over-month step would call a
 * quiet month a collapse.
 */
function comparison(values: number[]) {
  const half = Math.floor(values.length / 2);
  const mean = (list: number[]) =>
    list.length === 0 ? 0 : list.reduce((sum, v) => sum + v, 0) / list.length;

  return {
    average: Math.round(mean(values)),
    change: change(mean(values.slice(half)), mean(values.slice(0, half))),
    spark: values,
  };
}

/** A round ceiling above the tallest series, so the curve never touches the top. */
function axisCeiling(income: number, expenses: number): number {
  const peak = Math.max(income, expenses, 1);
  const magnitude = 10 ** Math.floor(Math.log10(peak));
  return Math.ceil((peak * 1.15) / magnitude) * magnitude;
}

function axisTicks(max: number): number[] {
  return [max, (max * 3) / 4, max / 2, max / 4, 0];
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

function capitalise(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
