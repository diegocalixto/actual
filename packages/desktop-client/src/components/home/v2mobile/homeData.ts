/**
 * This folder's door onto the Home's data hooks, so every file here can reach
 * them through a plain same-directory import.
 *
 * Re-exports only: no hook is defined here, so there is exactly one
 * implementation of each and nothing to keep in sync.
 */
export {
  useAccountBalance,
  useHomeAccounts,
} from '#components/home/v2/useHomeAccounts';
export type {
  HomeAccount,
  HomeAccountKind,
} from '#components/home/v2/useHomeAccounts';
export { useAccountBalances } from '#hooks/useAccountBalances';
export { useCardInsightsByAccount, useSyncFreshness } from '#hooks/useBankData';
export type { CardInsightsByAccount } from '#hooks/useBankData';
export {
  useHomeBalances,
  useTotalBalance,
} from '#components/home/v2/useHomeBalances';
export type { HomeBalances } from '#components/home/v2/useHomeBalances';
export { useMonthTotals } from '#components/home/v2/useMonthTotals';
export type { MonthTotals } from '#components/home/v2/useMonthTotals';
