import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { indicatorTransactionsFilter } from '@actual-app/core/shared/month-indicator-transactions';
import type { IndicatorSlice } from '@actual-app/core/shared/month-indicator-transactions';
import { q } from '@actual-app/core/shared/query';
import { isPreviewId } from '@actual-app/core/shared/transactions';
import type { TransactionEntity } from '@actual-app/core/types/models';

import { TransactionListWithBalances } from '#components/mobile/transactions/TransactionListWithBalances';
import { SchedulesProvider } from '#hooks/useCachedSchedules';
import { useDateFormat } from '#hooks/useDateFormat';
import { useNavigate } from '#hooks/useNavigate';
import { useTransactions } from '#hooks/useTransactions';
import { useTransactionsSearch } from '#hooks/useTransactionsSearch';
import { uncategorizedTransactions } from '#queries';
import * as bindings from '#spreadsheet/bindings';

type UncategorizedTransactionsProps = {
  /**
   * Opened from a figure of Início or Relatórios: one month's outflows (the
   * "Sem categoria" row) or inflows (the "entradas a revisar") without a
   * category, under the indicators' rules. Absent ⇒ every transaction still
   * waiting for a category, as the budget lists them.
   */
  indicatorSlice?: {
    month: string;
    slice: Exclude<IndicatorSlice, { kind: 'category' }>;
  };
};

export function UncategorizedTransactions({
  indicatorSlice,
}: UncategorizedTransactionsProps = {}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const month = indicatorSlice?.month;
  const sliceKind = indicatorSlice?.slice.kind;
  const baseTransactionsQuery = useCallback(
    () =>
      (month && sliceKind
        ? q('transactions').filter(
            indicatorTransactionsFilter(month, { kind: sliceKind }),
          )
        : uncategorizedTransactions()
      )
        .options({ splits: 'inline' })
        .select('*'),
    [month, sliceKind],
  );

  const [transactionsQuery, setTransactionsQuery] = useState(
    baseTransactionsQuery(),
  );
  const {
    transactions,
    isPending: isTransactionsLoading,
    isFetchingNextPage: isLoadingMoreTransactions,
    fetchNextPage: fetchMoreTransactions,
  } = useTransactions({
    query: transactionsQuery,
  });

  const dateFormat = useDateFormat() || 'MM/dd/yyyy';

  const { search: onSearch } = useTransactionsSearch({
    updateQuery: setTransactionsQuery,
    resetQuery: () => setTransactionsQuery(baseTransactionsQuery()),
    dateFormat,
  });

  const onOpenTransaction = useCallback(
    (transaction: TransactionEntity) => {
      // details of how the native app used to handle preview transactions here can be found at commit 05e58279
      if (!isPreviewId(transaction.id)) {
        void navigate(`/transactions/${transaction.id}`);
      }
    },
    [navigate],
  );

  const balance =
    month && sliceKind
      ? bindings.indicatorUncategorizedBalance(month, { kind: sliceKind })
      : bindings.uncategorizedBalance();

  return (
    <SchedulesProvider>
      <TransactionListWithBalances
        isLoading={isTransactionsLoading}
        transactions={transactions}
        balance={balance}
        searchPlaceholder={t('Search uncategorized transactions')}
        onSearch={onSearch}
        isLoadingMore={isLoadingMoreTransactions}
        onLoadMore={fetchMoreTransactions}
        onOpenTransaction={onOpenTransaction}
        showMakeTransfer
      />
    </SchedulesProvider>
  );
}
