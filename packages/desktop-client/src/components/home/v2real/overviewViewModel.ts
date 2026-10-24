import type { ComponentType, SVGProps } from 'react';

import type { IndicatorTotals } from '@actual-app/core/shared/month-indicators';

import type { OverviewHue } from './overviewPresentation';

/**
 * What the approved presentation components need, stated here rather than
 * imported from the laboratory's fixtures.
 *
 * These are structurally the same shapes the lab declares, and TypeScript is
 * structural, so the components accept them unchanged. Declaring them locally
 * means the production route has no import — not even a type-only one — that
 * points at a fixtures module.
 */

export type OverviewIcon = ComponentType<SVGProps<SVGSVGElement>>;

export type OverviewBalances = {
  /** Sum of on-budget account balances. `null` while the cell is unresolved. */
  available: number | null;
  /** Envelope budgets only; `null` when the budget type has no such cell. */
  toBudget: number | null;
};

export type OverviewMonthTotals = {
  income: number;
  spent: number;
  net: number;
  /** Already-localised month label. */
  label: string;
};

export type OverviewAccount = {
  id: string;
  name: string;
  /** Real secondary context only — never invented card metadata. */
  detail: string;
  balance: number;
  Icon: OverviewIcon;
  hue: OverviewHue;
};

export type OverviewCategory = {
  id: string;
  name: string;
  Icon: OverviewIcon;
  hue: OverviewHue;
  amount: number;
  /** The month's outflows with no category, which open the list that needs one. */
  isUncategorized?: boolean;
};

export type OverviewMovement = {
  id: string;
  name: string;
  /** Short, already-localised date. */
  when: string;
  Icon: OverviewIcon;
  /** Shared with the matching spending category, so the two panels agree. */
  hue: OverviewHue;
  amount: number;
};

export type OverviewSpendingComposition = {
  /**
   * Categories the month ends up owing nothing to: refunded more than they
   * were spent. They lower the total instead of adding to it, so the panel has
   * to show them for its rows to add up to the figure in the summary.
   */
  credits: Array<{ id: string; name: string; amount: number }>;
  /** Sum of the listed outflows, positive. */
  outflows: number;
  /** `outflows - credited`, with Actual's sign: the month's spending. */
  net: number;
};

export type OverviewData = {
  balances: OverviewBalances;
  monthTotals: OverviewMonthTotals | null;
  /**
   * What the three month figures leave out — extraordinary inflows, inflows
   * awaiting a category, the uncategorized share of the spending — or `null`
   * while the month loads.
   */
  monthDetails: IndicatorTotals | null;
  accounts: OverviewAccount[];
  categories: OverviewCategory[];
  /** `null` while the month loads, and absent of credits when nothing came back. */
  spendingComposition: OverviewSpendingComposition | null;
  movements: OverviewMovement[];
  isAccountsLoading: boolean;
  isMonthLoading: boolean;
  isSpendingLoading: boolean;
  isActivityLoading: boolean;
};
