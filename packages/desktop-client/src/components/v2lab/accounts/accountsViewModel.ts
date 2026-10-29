import type { ComponentType, ReactNode, SVGProps } from 'react';

import type { AccountHue } from './accountsTokens';

/**
 * What the approved Accounts composition needs in order to draw itself.
 *
 * Two callers fill this in: `/v2-lab/accounts` from fixtures, and the real
 * `/accounts` from the application's own accounts, balances and transactions.
 * Nothing below describes *where* a number came from, only what it means — that
 * is what lets one composition serve both without the design forking.
 *
 * `null` is used deliberately and never collapsed into `0`: a balance that has
 * not arrived yet and a balance that is genuinely zero are different things to
 * draw, and a change that cannot be computed is not a change of nothing.
 */

export type EntityIcon = ComponentType<SVGProps<SVGSVGElement>>;

/**
 * What a control does.
 *
 * A function wires it; `'mock'` draws it inert, which only the laboratory is
 * allowed to do; absent omits it altogether. Spelling the third case out is
 * what keeps a dead button from reaching production by accident — production
 * would have to ask for one in writing.
 */
export type Action = (() => void) | 'mock';

export type ViewAccount = {
  id: string;
  name: string;
  /** Cleared balance in integer minor units. `null` while the cell loads. */
  balance: number | null;
  hue: AccountHue;
  Icon: EntityIcon;
  /** Opens the account's register. Absent ⇒ the row is not a destination. */
  onOpen?: () => void;
};

export type BalanceSeries = {
  /** One running balance per day of the window, oldest first. */
  points: number[];
  axisMin: number;
  axisMax: number;
  axisTicks: number[];
  xLabels: string[];
  rangeLabel: string;
  /** Draws the dropdown affordance. Only the laboratory mocks that control. */
  rangeChevron?: boolean;
};

export type AccountsViewData = {
  /** Sum of every account shown. `null` while balances load. */
  total: number | null;
  onBudgetTotal: number | null;
  offBudgetTotal: number | null;
  accountCount: number;
  /** Ratio against the close of last month. `null` ⇒ the chip is omitted. */
  monthChange: number | null;
  /** `null` ⇒ the stat is omitted rather than inventing a sync time. */
  lastUpdate: string | null;
  onBudget: ViewAccount[];
  offBudget: ViewAccount[];
  /** `null` ⇒ the panel says it has no history instead of drawing one. */
  balance: BalanceSeries | null;
  /** Absent ⇒ both add-account affordances are omitted. */
  onAddAccount?: Action;
  /**
   * The round control beside "Add account". Absent ⇒ omitted rather than left
   * dead. The reference reserved this slot for a menu; production spends it on
   * the one destination this page took away.
   */
  headerAction?: {
    Icon: EntityIcon;
    /** Accessible name — the control is icon-only. */
    label: string;
    onPress: Action;
  };
  isLoading: boolean;
  /** Bottom-left slot: the laboratory's note, or a real link. */
  footerLeft?: ReactNode;
  /** Bottom-right slot. Absent in production, where it claimed too much. */
  footerRight?: ReactNode;
};
