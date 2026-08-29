import type { AccountEntity } from '@actual-app/core/types/models';

import { useOffBudgetAccounts } from '#hooks/useOffBudgetAccounts';
import { useOnBudgetAccounts } from '#hooks/useOnBudgetAccounts';
import { useSheetValue } from '#hooks/useSheetValue';
import * as bindings from '#spreadsheet/bindings';

/**
 * How an account is presented on the dashboard.
 *
 * On-budget vs off-budget is the **only** classification Actual's data model
 * actually carries. There is no account type: `accounts.type` and
 * `accounts.subtype` exist as vestigial columns in `init.sql`, but no code path
 * in the app ever writes them, they are absent from the AQL schema, and
 * `AccountEntity` does not expose them. Credit cards therefore cannot be told
 * apart from checking accounts without guessing at names, which would be wrong
 * as often as it was right.
 *
 * This union is the seam for that: when a real classification lands, it gains
 * a `'credit'` member and only the tile's icon and caption branch on it — the
 * grid, the balances and the layout stay as they are.
 */
export type HomeAccountKind = 'onBudget' | 'offBudget';

export type HomeAccount = {
  account: AccountEntity;
  kind: HomeAccountKind;
  /**
   * Bank name and masked number, present only for accounts linked through a
   * bank-sync provider. Never synthesised.
   */
  detail: string | null;
};

type UseHomeAccountsResult = {
  accounts: HomeAccount[];
  isLoading: boolean;
};

/** The dashboard's account list, on-budget first. Read-only. */
export function useHomeAccounts(): UseHomeAccountsResult {
  // Both queries carry `placeholderData`, so they report success immediately
  // and `isLoading` is never true; `isPlaceholderData` is the real signal.
  const { data: onBudgetAccounts = [], isPlaceholderData: isOnBudgetPending } =
    useOnBudgetAccounts();
  const {
    data: offBudgetAccounts = [],
    isPlaceholderData: isOffBudgetPending,
  } = useOffBudgetAccounts();

  const accounts: HomeAccount[] = [
    ...onBudgetAccounts.map(account => toHomeAccount(account, 'onBudget')),
    ...offBudgetAccounts.map(account => toHomeAccount(account, 'offBudget')),
  ];

  return { accounts, isLoading: isOnBudgetPending || isOffBudgetPending };
}

function toHomeAccount(
  account: AccountEntity,
  kind: HomeAccountKind,
): HomeAccount {
  const parts = [
    account.bankName,
    account.mask ? `•••• ${account.mask}` : null,
  ].filter(Boolean);

  return {
    account,
    kind,
    detail: parts.length > 0 ? parts.join(' · ') : null,
  };
}

/**
 * One account's balance cell. Lives here so the account tile never has to
 * import `#spreadsheet/bindings` itself.
 */
export function useAccountBalance(accountId: AccountEntity['id']) {
  return useSheetValue<'account', 'balance'>(
    bindings.accountBalance(accountId),
  );
}
