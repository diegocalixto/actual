import { useMemo } from 'react';

import { send } from '@actual-app/core/platform/client/connection';
import * as monthUtils from '@actual-app/core/shared/months';
import { q } from '@actual-app/core/shared/query';
import type { DiscoverScheduleEntity } from '@actual-app/core/types/models';
import { useQuery } from '@tanstack/react-query';

import { aqlQuery } from '#queries/aqlQuery';
import { patternEvidence, recurringSummary } from '#util/recurring';
import type { PatternEntryLike, RecurringSummary } from '#util/recurring';

import { useSchedules } from './useSchedules';

const SCHEDULES_QUERY = q('schedules').select('*');
/** How far back the entries behind a detected pattern are read. */
const EVIDENCE_DAYS = 366;

type UseRecurringOptions = {
  /**
   * Also run Actual's "Find schedules" over the transactions. It reads the
   * whole file, so only the Subscriptions screen asks for it; the Início tile
   * keeps to the schedules, which are already in memory.
   */
  includeDiscovered?: boolean;
};

/**
 * The file's recurring charges: its schedules and, when asked and kept apart
 * as suggestions, the repeating patterns Actual's "Find schedules" detects in
 * the transactions. Detection is cached for the session and re-run only when
 * asked. A suggestion is offered only after the bank's own record of the
 * entries behind it has been read, so a tax, an installment plan or money
 * moved between own accounts is not offered as a subscription just for
 * repeating.
 */
export function useRecurring({
  includeDiscovered = false,
}: UseRecurringOptions = {}): RecurringSummary & {
  isLoading: boolean;
  isDiscovering: boolean;
} {
  const { schedules, isLoading: isSchedulesLoading } = useSchedules({
    query: SCHEDULES_QUERY,
  });
  const discovered = useQuery({
    queryKey: ['v2', 'schedule-discover'],
    queryFn: async (): Promise<DiscoverScheduleEntity[]> =>
      (await send('schedule/discover')) ?? [],
    staleTime: 5 * 60 * 1000,
    enabled: includeDiscovered,
  });
  const patterns = useMemo(() => discovered.data ?? [], [discovered.data]);

  // One query for the entries behind every pattern: same payees, same
  // accounts, the last year.
  const patternKey = patterns
    .map(pattern => `${pattern.payee}|${pattern.account}`)
    .sort()
    .join(',');
  const evidenceRows = useQuery({
    queryKey: ['v2', 'schedule-discover-evidence', patternKey],
    queryFn: async (): Promise<PatternEntryLike[]> => {
      const payees = [...new Set(patterns.map(pattern => pattern.payee))];
      const accounts = [...new Set(patterns.map(pattern => pattern.account))];
      const since = monthUtils.subDays(monthUtils.currentDay(), EVIDENCE_DAYS);
      const { data }: { data: PatternEntryLike[] } = await aqlQuery(
        q('transactions')
          .filter({
            payee: { $oneof: payees },
            account: { $oneof: accounts },
            date: { $gte: since },
          })
          .select([
            'payee',
            'account',
            'amount',
            'imported_payee',
            'raw_synced_data',
          ])
          .options({ splits: 'none' }),
      );
      return data;
    },
    staleTime: 5 * 60 * 1000,
    enabled: includeDiscovered && patterns.length > 0,
  });

  return useMemo(() => {
    const isDiscovering =
      includeDiscovered &&
      (discovered.isLoading || (patterns.length > 0 && evidenceRows.isLoading));
    const evidence = patternEvidence(patterns, evidenceRows.data ?? []);
    return {
      // Suggestions are offered only once their evidence has been read.
      ...recurringSummary(schedules, isDiscovering ? [] : patterns, evidence),
      isLoading: isSchedulesLoading,
      isDiscovering,
    };
  }, [
    schedules,
    patterns,
    evidenceRows.data,
    evidenceRows.isLoading,
    discovered.isLoading,
    isSchedulesLoading,
    includeDiscovered,
  ]);
}
