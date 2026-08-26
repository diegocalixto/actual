import type { ComponentType, SVGProps } from 'react';

import {
  SvgDotsHorizontalTriple,
  SvgHeart,
  SvgHome,
  SvgLocationFood,
  SvgTravelBus,
} from '@actual-app/components/icons/v1';
import { SvgFavoriteStar } from '@actual-app/components/icons/v2';

import type { CategoryHue } from './reportsTokens';

/**
 * The single local source of truth for the Reports laboratory.
 *
 * Only three things are written down: what came in each day, what went out each
 * day, and how the last six months closed. Everything the page shows — the four
 * KPIs, all three curves, every total, each share of the donut, the averages,
 * the comparisons and the insights — is derived from those, so no two panels
 * can disagree and no figure can drift when another changes.
 *
 * Nothing here is written, queried, persisted or synced.
 */

export type ReportsIcon = ComponentType<SVGProps<SVGSVGElement>>;

/** May 2026, day by day, in integer minor units. */
const incomeDaily = [
  87016, 95544, 91453, 73124, 1171285, 119875, 121902, 133558, 137951, 439380,
  86773, 133271, 91866, 558424, 79334, 132156, 113589, 393880, 141144, 109986,
  124237, 513200, 89392, 133307, 107093, 467746, 128473, 138336, 584661, 133406,
  122638,
];

const expensesDaily = [
  72451, 60825, 233996, 108175, 543920, 70863, 62457, 85460, 67512, 256309,
  114967, 109935, 197988, 64215, 80660, 118583, 313308, 57488, 61102, 225944,
  99941, 122034, 74770, 269925, 57646, 67705, 110270, 256009, 62904, 119835,
  83803,
];

export type DayPoint = {
  /** 1-based day of the month. */
  day: number;
  label: string;
  /** Running totals for the period, so every point answers "so far this month". */
  income: number;
  expenses: number;
  /** Always `income - expenses` at this point. Never stored separately. */
  net: number;
};

export const series: DayPoint[] = (() => {
  let income = 0;
  let expenses = 0;

  return incomeDaily.map((value, index) => {
    income += value;
    expenses += expensesDaily[index];

    return {
      day: index + 1,
      label: `May ${index + 1}, 2026`,
      income,
      expenses,
      net: income - expenses,
    };
  });
})();

const last = series[series.length - 1];

export const totals = {
  income: last.income,
  expenses: last.expenses,
  net: last.net,
};

/** Ticks the reference prints down the left edge. */
export const axisMax = 8000000;
export const axisMin = -2000000;
export const axisTicks = [8000000, 6000000, 4000000, 2000000, 0, -2000000];
export const xTicks = [1, 6, 11, 16, 21, 26, 31];

/**
 * How the last six months closed. The final entry is this month, so the KPIs
 * and the curve above cannot disagree with the comparison below.
 */
export type MonthPoint = {
  label: string;
  short: string;
  income: number;
  expenses: number;
};

export const months: MonthPoint[] = [
  { label: 'December 2025', short: 'Dec', income: 5520000, expenses: 3690000 },
  { label: 'January 2026', short: 'Jan', income: 5840000, expenses: 3810000 },
  { label: 'February 2026', short: 'Feb', income: 5790000, expenses: 4020000 },
  { label: 'March 2026', short: 'Mar', income: 6010000, expenses: 3780000 },
  { label: 'April 2026', short: 'Apr', income: 6098000, expenses: 4007000 },
  {
    label: 'May 2026',
    short: 'May',
    income: totals.income,
    expenses: totals.expenses,
  },
];

export const previousMonth = months[months.length - 2];

export type ExpenseCategory = {
  id: string;
  name: string;
  amount: number;
  hue: CategoryHue;
  Icon: ReportsIcon;
  /** Same category over the three months before this one, for the insight. */
  priorMonths: number[];
};

/**
 * Categories sum to `totals.expenses` by construction — the assertion below
 * keeps that true if anyone edits a number.
 */
export const categories: ExpenseCategory[] = [
  {
    id: 'housing',
    name: 'Housing',
    amount: 1425000,
    hue: 'blue',
    Icon: SvgHome,
    priorMonths: [1190000, 1210000, 1290000],
  },
  {
    id: 'food',
    name: 'Food',
    amount: 845000,
    hue: 'green',
    Icon: SvgLocationFood,
    priorMonths: [810000, 792000, 838000],
  },
  {
    id: 'transport',
    name: 'Transport',
    amount: 623000,
    hue: 'amber',
    Icon: SvgTravelBus,
    priorMonths: [598000, 640000, 611000],
  },
  {
    id: 'health',
    name: 'Health',
    amount: 412000,
    hue: 'coral',
    Icon: SvgHeart,
    priorMonths: [388000, 402000, 431000],
  },
  {
    id: 'leisure',
    name: 'Leisure',
    amount: 386000,
    hue: 'rose',
    Icon: SvgFavoriteStar,
    priorMonths: [352000, 419000, 364000],
  },
  {
    id: 'other',
    name: 'Other',
    amount: 540000,
    hue: 'violet',
    Icon: SvgDotsHorizontalTriple,
    priorMonths: [498000, 523000, 512000],
  },
];

export const categoriesTotal = categories.reduce(
  (sum, category) => sum + category.amount,
  0,
);

export const periodLabel = 'May 1 – May 31, 2026';
export const previousPeriodLabel = 'Apr 1 – Apr 30';
export const scopeLabel = 'All accounts';
