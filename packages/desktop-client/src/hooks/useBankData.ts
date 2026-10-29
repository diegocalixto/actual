import { useEffect, useEffectEvent, useMemo } from 'react';

import { listen } from '@actual-app/core/platform/client/connection';
import * as monthUtils from '@actual-app/core/shared/months';
import { q } from '@actual-app/core/shared/query';
import type { AccountEntity } from '@actual-app/core/types/models';
import type { ServerEvents } from '@actual-app/core/types/server-events';
import { useQuery } from '@tanstack/react-query';

import { cardInsights, syncFreshness } from '#accounts/bankData';
import type { CardInsights, SyncFreshness } from '#accounts/bankData';
import { useAccounts } from '#hooks/useAccounts';
import { aqlQuery } from '#queries/aqlQuery';

/**
 * How many days of entries a card's open bill can span: a cycle, the pending
 * purchases that will land on it and the next installments already filed.
 */
const CARD_WINDOW_DAYS = 60;

/**
 * When the bank was last read, for every open linked account. Read-only; the
 * figures come from the account rows the sync already writes.
 */
export function useSyncFreshness(): SyncFreshness & { isLoading: boolean } {
  const { data: accounts = [], isLoading } = useAccounts();
  return useMemo(
    () => ({ ...syncFreshness(accounts), isLoading }),
    [accounts, isLoading],
  );
}

type SyncedRow = {
  id: string;
  account: AccountEntity['id'];
  amount: number;
  cleared: boolean;
  raw_synced_data: string | null;
};

export type CardInsightsByAccount = {
  byAccount: Record<AccountEntity['id'], CardInsights>;
  /** Accounts whose provider entries carry card data. */
  cardAccountIds: AccountEntity['id'][];
  isLoading: boolean;
};

/**
 * What the provider's own entries say about each linked account: whether it is
 * a card, what its open bill holds, what is still unconfirmed. One query for
 * the recent entries of every linked account, re-read when a sync lands.
 */
export function useCardInsightsByAccount(
  accounts: readonly AccountEntity[],
): CardInsightsByAccount {
  const linkedIds = useMemo(
    () =>
      accounts
        .filter(account => !account.closed && account.account_sync_source)
        .map(account => account.id)
        .sort(),
    [accounts],
  );
  const since = monthUtils.subDays(monthUtils.currentDay(), CARD_WINDOW_DAYS);

  const result = useQuery({
    queryKey: ['v2', 'card-insights', linkedIds.join(','), since],
    queryFn: async (): Promise<SyncedRow[]> => {
      if (linkedIds.length === 0) return [];
      const { data }: { data: SyncedRow[] } = await aqlQuery(
        q('transactions')
          .filter({ account: { $oneof: linkedIds }, date: { $gte: since } })
          .select(['id', 'account', 'amount', 'cleared', 'raw_synced_data'])
          .options({ splits: 'none' }),
      );
      return data;
    },
  });

  const onSyncEvent = useEffectEvent((event: ServerEvents['sync-event']) => {
    if (event.type === 'applied' && event.tables.includes('transactions')) {
      void result.refetch();
    }
  });
  useEffect(() => listen('sync-event', onSyncEvent), []);

  const today = monthUtils.currentDay();
  return useMemo(() => {
    const rows = result.data ?? [];
    const byAccount: Record<string, CardInsights> = {};
    for (const id of linkedIds) {
      byAccount[id] = cardInsights(
        rows.filter(row => row.account === id),
        today,
      );
    }
    return {
      byAccount,
      cardAccountIds: linkedIds.filter(id => byAccount[id].isCard),
      isLoading: result.isLoading,
    };
  }, [result.data, result.isLoading, linkedIds, today]);
}
