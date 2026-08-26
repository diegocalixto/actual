import {
  categories,
  months,
  previousMonth,
  series,
  totals,
} from './reportsFixtures';

/**
 * Everything the page states, computed once from the fixtures.
 *
 * This module exists so no component can restate a figure by hand: a panel
 * either reads a value from here or does not show it. Every rate, average,
 * change and insight below is a function of the daily series, the monthly
 * closes and the category list — nothing else.
 */

/** Savings rate: what share of what came in was still there at the end. */
export function savingsRate(income: number, net: number): number {
  return income > 0 ? net / income : 0;
}

function change(current: number, previous: number): number {
  return previous !== 0 ? current / previous - 1 : 0;
}

const previousNet = previousMonth.income - previousMonth.expenses;

export const kpis = {
  income: {
    value: totals.income,
    change: change(totals.income, previousMonth.income),
  },
  expenses: {
    value: totals.expenses,
    change: change(totals.expenses, previousMonth.expenses),
  },
  net: {
    value: totals.net,
    change: change(totals.net, previousNet),
  },
  savingsRate: {
    value: savingsRate(totals.income, totals.net),
    /* Points, not percent: the difference between two rates is not a ratio. */
    points:
      (savingsRate(totals.income, totals.net) -
        savingsRate(previousMonth.income, previousNet)) *
      100,
  },
};

function average(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

/**
 * The six-month averages, each with the trend across the window: the mean of
 * the last three months against the mean of the first three. A single
 * month-over-month step would call a quiet month a collapse.
 */
function comparison(pick: (month: (typeof months)[number]) => number) {
  const values = months.map(pick);
  const half = Math.floor(values.length / 2);

  return {
    average: Math.round(average(values)),
    change: change(average(values.slice(half)), average(values.slice(0, half))),
    spark: values,
  };
}

export const monthly = {
  income: comparison(month => month.income),
  expenses: comparison(month => month.expenses),
  net: comparison(month => month.income - month.expenses),
};

/** Largest first, each with its share of the month's spending. */
export const rankedCategories = [...categories]
  .sort((a, b) => b.amount - a.amount)
  .map(category => ({
    ...category,
    share: totals.expenses > 0 ? category.amount / totals.expenses : 0,
    /** Against this category's own three previous months. */
    vsPriorAverage: change(category.amount, average(category.priorMonths)),
  }));

export const topCategory = rankedCategories[0];

/**
 * The day the tooltip opens on before anyone moves the pointer — the middle of
 * the month, where all three series are clearly apart.
 */
export const defaultHoverIndex = Math.min(19, series.length - 1);
