// oxlint-disable typescript-paths/absolute-parent-import
// oxlint-disable actual/prefer-subpath-imports
/**
 * This folder's door onto the Home's data hooks.
 *
 * The hooks are `.ts` modules in `home/v2/`, and `#components/*` only resolves
 * `.tsx`; the subpath rule's suggested replacement therefore does not exist,
 * and giving each hook its own `imports` entry would mean editing
 * `package.json`. Both rules are suppressed here, once, so every other file in
 * this folder can reach the hooks through a plain same-directory import.
 *
 * Re-exports only: no hook is defined here, so there is exactly one
 * implementation of each and nothing to keep in sync.
 */
export { useAccountBalance, useHomeAccounts } from '../v2/useHomeAccounts';
export type { HomeAccount, HomeAccountKind } from '../v2/useHomeAccounts';
export { useHomeBalances, useTotalBalance } from '../v2/useHomeBalances';
export type { HomeBalances } from '../v2/useHomeBalances';
export { useMonthTotals } from '../v2/useMonthTotals';
export type { MonthTotals } from '../v2/useMonthTotals';
