import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import * as monthUtils from '@actual-app/core/shared/months';
import { q } from '@actual-app/core/shared/query';
import type { AccountEntity } from '@actual-app/core/types/models';
import { formatDistanceToNow } from 'date-fns';

import { ACCOUNT_HUE_ORDER } from '#components/v2lab/accounts/AccountsView';
import type {
  AccountsViewData,
  ViewAccount,
} from '#components/v2lab/accounts/AccountsView';
import { iconForAccount } from '#components/v2lab/LabStyle';
import { useAccountBalances } from '#hooks/useAccountBalances';
import { useLocale } from '#hooks/useLocale';
import { useNavigate } from '#hooks/useNavigate';
import { useOffBudgetAccounts } from '#hooks/useOffBudgetAccounts';
import { useOnBudgetAccounts } from '#hooks/useOnBudgetAccounts';
import { useQuery } from '#hooks/useQuery';
import { pushModal } from '#modals/modalsSlice';
import { useDispatch } from '#redux';

import { axisFor, labelIndices } from './accountsPresentation';

/** How many labels the approved chart prints along its x axis. */
const X_LABELS = 5;

type DateSum = { date: string; amount: number };

/**
 * Everything the real Accounts shows, read from the application's own sources.
 *
 * Three of them, and no more: the account list, the balance cell the published
 * sidebar already binds per account, and one aggregation of this month's
 * transactions. Every figure on screen — the hero, both group subtotals, each
 * share of the ring and each point of the curve — is derived from those, so no
 * two panels can disagree.
 *
 * `null` is carried rather than defaulted: a balance that has not arrived is
 * not zero, and a month with no close behind it has no percentage.
 */
export function useRealAccountsData(): AccountsViewData {
  const { t } = useTranslation();
  const locale = useLocale();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Both hooks already drop closed accounts, which is the semantics this
  // screen wants: it answers "where is my money", and a closed account holds
  // none of it.
  const { data: onBudgetEntities = [], isLoading: isOnBudgetLoading } =
    useOnBudgetAccounts();
  const { data: offBudgetEntities = [], isLoading: isOffBudgetLoading } =
    useOffBudgetAccounts();

  const entities = useMemo(
    () => [...onBudgetEntities, ...offBudgetEntities],
    [onBudgetEntities, offBudgetEntities],
  );

  const balances = useAccountBalances(entities.map(account => account.id));

  const month = monthUtils.currentMonth();
  const monthStart = monthUtils.firstDayOfMonth(month);
  const today = monthUtils.currentDay();

  // Everything recorded since last month closed, day by day. No upper bound:
  // a transaction dated later this month is already inside the account
  // balance, so the opening figure has to account for it too.
  const { data: dailySums, isLoading: isHistoryLoading } = useQuery<DateSum>(
    () =>
      q('transactions')
        .filter({
          date: { $gte: monthStart },
          'account.closed': false,
        })
        .groupBy(['date'])
        .select(['date', { amount: { $sum: '$amount' } }]),
    [monthStart],
  );

  const openAccount = (id: AccountEntity['id']) => {
    void navigate(`/accounts/${id}`);
  };

  const addAccount = () => {
    dispatch(pushModal({ modal: { name: 'add-account', options: {} } }));
  };

  return useMemo(() => {
    // ---- the accounts, and what they hold ---------------------------------
    // The hue comes from the position in the list, walking the approved ramp:
    // it keeps neighbouring slices of the ring distinguishable, which a hash of
    // the id does not.
    const toViewAccount = (
      account: AccountEntity,
      index: number,
    ): ViewAccount => ({
      id: account.id,
      name: account.name,
      balance: balances[account.id] ?? null,
      hue: ACCOUNT_HUE_ORDER[index % ACCOUNT_HUE_ORDER.length],
      // Chosen from the name, and only as presentation: the model carries no
      // icon, and an unrecognised name falls back to a plain account glyph.
      Icon: iconForAccount(account.name),
      onOpen: () => openAccount(account.id),
    });

    const all = entities.map(toViewAccount);
    const onBudget = all.slice(0, onBudgetEntities.length);
    const offBudget = all.slice(onBudgetEntities.length);

    // A sum is only a sum once every part has arrived; until then it is null,
    // and the hero prints a dash rather than a figure that will move.
    const sum = (accounts: ViewAccount[]): number | null => {
      let running = 0;

      for (const account of accounts) {
        if (account.balance === null) {
          return null;
        }
        running += account.balance;
      }

      return running;
    };

    const total = sum(all);
    const onBudgetTotal = sum(onBudget);
    const offBudgetTotal = sum(offBudget);

    // ---- the month, and the curve across it -------------------------------
    const rows = dailySums ?? [];
    const sinceMonthStart = rows.reduce(
      (running, row) => running + row.amount,
      0,
    );

    // The balance at the close of last month, derived from the same total the
    // hero prints: the curve therefore ends exactly where the hero says it is.
    const opening = total === null ? null : total - sinceMonthStart;

    const monthChange =
      opening === null || opening <= 0 ? null : sinceMonthStart / opening;

    const byDay = new Map<string, number>();
    for (const row of rows) {
      byDay.set(row.date, (byDay.get(row.date) ?? 0) + row.amount);
    }

    // `range` walks months; days need `dayRangeInclusive`.
    const days = monthUtils.dayRangeInclusive(monthStart, today);

    let running = opening ?? 0;
    const points = days.map(day => {
      running += byDay.get(day) ?? 0;
      return running;
    });

    const axis = axisFor(points);
    const marks = labelIndices(days.length, X_LABELS);

    const balance =
      opening === null || points.length < 2
        ? null
        : {
            points,
            axisMin: axis.min,
            axisMax: axis.max,
            axisTicks: axis.ticks,
            xLabels: marks.map(index =>
              monthUtils.format(days[index], 'd MMM', locale),
            ),
            rangeLabel: t('This month'),
          };

    // ---- chrome -----------------------------------------------------------
    // Only a sync that actually happened. A file that has never synced gets no
    // stat rather than an invented one.
    const lastSync = entities
      .map(account => account.last_sync)
      .filter((value): value is string => !!value)
      .map(value => new Date(value))
      .filter(date => !Number.isNaN(date.getTime()))
      .sort((a, b) => b.getTime() - a.getTime())[0];

    return {
      total,
      onBudgetTotal,
      offBudgetTotal,
      accountCount: all.length,
      monthChange,
      lastUpdate: lastSync
        ? formatDistanceToNow(lastSync, { addSuffix: true, locale })
        : null,
      onBudget,
      offBudget,
      balance,
      onAddAccount: addAccount,
      isLoading: isOnBudgetLoading || isOffBudgetLoading || isHistoryLoading,
    };
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- handlers are stable per render
  }, [
    entities,
    onBudgetEntities.length,
    balances,
    dailySums,
    monthStart,
    today,
    locale,
    t,
    isOnBudgetLoading,
    isOffBudgetLoading,
    isHistoryLoading,
  ]);
}
