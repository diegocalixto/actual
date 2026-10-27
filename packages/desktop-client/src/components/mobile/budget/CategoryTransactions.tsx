import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { indicatorTransactionsFilter } from '@actual-app/core/shared/month-indicator-transactions';
import { q } from '@actual-app/core/shared/query';
import { isPreviewId } from '@actual-app/core/shared/transactions';
import type {
  CategoryEntity,
  TransactionEntity,
} from '@actual-app/core/types/models';

import { TransactionListWithBalances } from '#components/mobile/transactions/TransactionListWithBalances';
import { SchedulesProvider } from '#hooks/useCachedSchedules';
import { useCategoryPreviewTransactions } from '#hooks/useCategoryPreviewTransactions';
import { useDateFormat } from '#hooks/useDateFormat';
import { useNavigate } from '#hooks/useNavigate';
import { useTransactions } from '#hooks/useTransactions';
import { useTransactionsSearch } from '#hooks/useTransactionsSearch';
import * as bindings from '#spreadsheet/bindings';

type CategoryTransactionsProps = {
  category: CategoryEntity;
  month: string;
  /**
   * Opened from a figure of Início or Relatórios: list what the figure counts
   * — the budget's accounts, no transfers, no starting balance — total those
   * rows, and leave scheduled previews out, since no figure includes them.
   */
  indicatorScope?: boolean;
};

export function CategoryTransactions({
  category,
  month,
  indicatorScope = false,
}: CategoryTransactionsProps) {
  const schedulesQuery = useMemo(() => q('schedules').select('*'), []);

  return (
    <SchedulesProvider query={schedulesQuery}>
      <TransactionListWithPreviews
        category={category}
        month={month}
        indicatorScope={indicatorScope}
      />
    </SchedulesProvider>
  );
}

type TransactionListWithPreviewsProps = {
  category: CategoryEntity;
  month: string;
  indicatorScope: boolean;
};

function TransactionListWithPreviews({
  category,
  month,
  indicatorScope,
}: TransactionListWithPreviewsProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const baseTransactionsQuery = useCallback(
    () =>
      q('transactions')
        .options({ splits: 'inline' })
        .filter(
          indicatorScope
            ? indicatorTransactionsFilter(month, {
                kind: 'category',
                categoryId: category.id,
              })
            : getCategoryMonthFilter(category, month),
        )
        .select('*'),
    [category, month, indicatorScope],
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

  const { isSearching, search: onSearch } = useTransactionsSearch({
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

  const balance = indicatorScope
    ? bindings.indicatorCategoryBalance(category.id, month)
    : bindings.categoryBalance(category.id, month);
  const balanceCleared = bindings.categoryBalanceCleared(category.id, month);
  const balanceUncleared = bindings.categoryBalanceUncleared(
    category.id,
    month,
  );

  const { previewTransactions, isLoading: isPreviewTransactionsLoading } =
    useCategoryPreviewTransactions({
      categoryId: category.id,
      month,
    });

  const transactionsToDisplay =
    !isSearching && !indicatorScope
      ? previewTransactions.concat(transactions)
      : transactions;

  return (
    <TransactionListWithBalances
      isLoading={
        isSearching || indicatorScope
          ? isTransactionsLoading
          : isTransactionsLoading || isPreviewTransactionsLoading
      }
      transactions={transactionsToDisplay}
      balance={balance}
      // The cleared/uncleared split is the category's, not the figure's.
      balanceCleared={indicatorScope ? undefined : balanceCleared}
      balanceUncleared={indicatorScope ? undefined : balanceUncleared}
      searchPlaceholder={t('Search {{categoryName}}', {
        categoryName: category.name,
      })}
      onSearch={onSearch}
      isLoadingMore={isLoadingMoreTransactions}
      onLoadMore={fetchMoreTransactions}
      onOpenTransaction={onOpenTransaction}
    />
  );
}

function getCategoryMonthFilter(category: CategoryEntity, month: string) {
  return {
    category: category.id,
    date: { $transform: '$month', $eq: month },
  };
}
