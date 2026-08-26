import type { ComponentType, SVGProps } from 'react';

import {
  SvgChartBar,
  SvgLibrary,
  SvgPiggyBank,
  SvgPortfolio,
  SvgWallet,
} from '@actual-app/components/icons/v1';

import type { AccountHue } from './accountsTokens';

/**
 * The single local source of truth for the Accounts laboratory.
 *
 * The disposable part is the *source*, not the shape: every field maps to
 * something Actual already stores (an account, its name, its cleared balance,
 * whether it is on budget), so replacing this module with an adapter over real
 * data changes no component signature below it.
 *
 * Nothing here is written, queried, persisted or synced. No value on screen is
 * restated by hand — the total, the two group subtotals, every share of the
 * donut and the end of the balance series are all derived from `labAccounts`,
 * so no two components can disagree.
 */

export type LabIcon = ComponentType<SVGProps<SVGSVGElement>>;

export type LabAccount = {
  id: string;
  name: string;
  /** Cleared balance, in integer minor units. */
  balance: number;
  onBudget: boolean;
  hue: AccountHue;
  Icon: LabIcon;
};

export const labAccounts: LabAccount[] = [
  {
    id: 'main-checking',
    name: 'Main Checking',
    balance: 1254321,
    onBudget: true,
    hue: 'blue',
    Icon: SvgLibrary,
  },
  {
    id: 'saving',
    name: 'Saving',
    balance: 825000,
    onBudget: true,
    hue: 'green',
    Icon: SvgPiggyBank,
  },
  {
    id: 'salary-account',
    name: 'Salary Account',
    balance: 985035,
    onBudget: true,
    hue: 'amber',
    Icon: SvgPortfolio,
  },
  {
    id: 'investments',
    name: 'Investments',
    balance: 1143012,
    onBudget: false,
    hue: 'violet',
    Icon: SvgChartBar,
  },
  {
    id: 'crypto-wallet',
    name: 'Crypto Wallet',
    balance: 348964,
    onBudget: false,
    hue: 'magenta',
    Icon: SvgWallet,
  },
];

export const onBudgetAccounts = labAccounts.filter(a => a.onBudget);
export const offBudgetAccounts = labAccounts.filter(a => !a.onBudget);

export const totalBalance = labAccounts.reduce((sum, a) => sum + a.balance, 0);

/**
 * The balance series behind the chart.
 *
 * Its last point is not written out: it is `totalBalance`, appended below, so
 * the curve is guaranteed to land exactly where the hero says it does.
 */
const balanceHistory = [
  1720000, 1745000, 1738000, 1810000, 1860000, 1842000, 1930000, 2010000,
  2005000, 2140000, 2280000, 2310000, 2295000, 2460000, 2580000, 2620000,
  2790000, 2840000, 2810000, 3020000, 3250000, 3310000, 3480000, 3620000,
  3590000, 3840000, 4010000, 4260000,
];

export const balanceSeries: number[] = [...balanceHistory, totalBalance];

/** Ticks the reference prints down the left edge. */
export const balanceAxisMax = 6000000;
export const balanceAxisTicks = [6000000, 4500000, 3000000, 1500000, 0];

/** Sparse enough that the labels never collide at this width. */
export const balanceXLabels = ['May 1', 'May 8', 'May 15', 'May 22', 'May 29'];

/**
 * Laboratory-only chrome.
 *
 * These four are fixtures of the laboratory, not features: there is no monthly
 * comparison, no account counter and no sync clock wired to anything. They
 * exist so the composition can be judged whole, and they persist nowhere.
 */
export const labChrome = {
  monthChange: '8,45%',
  accountCount: labAccounts.length,
  lastUpdate: '2 min ago',
  rangeLabel: 'This month',
};
