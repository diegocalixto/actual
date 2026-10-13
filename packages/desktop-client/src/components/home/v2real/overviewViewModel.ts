import type { ComponentType, SVGProps } from 'react';

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

export type OverviewData = {
  balances: OverviewBalances;
  monthTotals: OverviewMonthTotals | null;
  accounts: OverviewAccount[];
  categories: OverviewCategory[];
  movements: OverviewMovement[];
  isAccountsLoading: boolean;
  isMonthLoading: boolean;
  isSpendingLoading: boolean;
  isActivityLoading: boolean;
};
