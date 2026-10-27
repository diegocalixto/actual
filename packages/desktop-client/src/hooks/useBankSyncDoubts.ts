import { useEffect, useEffectEvent, useMemo } from 'react';

import { listen } from '@actual-app/core/platform/client/connection';
import { BANK_SYNC_DOUBT_TAG } from '@actual-app/core/shared/bank-sync';
import { q } from '@actual-app/core/shared/query';
import type { AccountEntity } from '@actual-app/core/types/models';
import type { ServerEvents } from '@actual-app/core/types/server-events';
import { useQuery } from '@tanstack/react-query';

import { aqlQuery } from '#queries/aqlQuery';

type DoubtRow = {
  id: string;
  account: AccountEntity['id'];
  amount: number;
};

export type BankSyncDoubts = {
  /** Entries the sync marked for review, by account: how many, how much. */
  byAccount: Record<AccountEntity['id'], { count: number; total: number }>;
  isLoading: boolean;
};

/**
 * Entries a bank sync added next to a look-alike it could not tell them
 * apart from — same amount, a few days apart, another provider id — and
 * marked in the note for the user to settle. Read from that mark, re-read
 * when a sync lands; cleared by the user removing the mark or the entry.
 */
export function useBankSyncDoubts(): BankSyncDoubts {
  const result = useQuery({
    queryKey: ['v2', 'bank-sync-doubts'],
    queryFn: async (): Promise<DoubtRow[]> => {
      const { data }: { data: DoubtRow[] } = await aqlQuery(
        q('transactions')
          .filter({ notes: { $like: `%${BANK_SYNC_DOUBT_TAG}%` } })
          .select(['id', 'account', 'amount'])
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

  return useMemo(() => {
    const byAccount: BankSyncDoubts['byAccount'] = {};
    for (const row of result.data ?? []) {
      const entry = byAccount[row.account] ?? { count: 0, total: 0 };
      entry.count += 1;
      entry.total += row.amount;
      byAccount[row.account] = entry;
    }
    return { byAccount, isLoading: result.isLoading };
  }, [result.data, result.isLoading]);
}
