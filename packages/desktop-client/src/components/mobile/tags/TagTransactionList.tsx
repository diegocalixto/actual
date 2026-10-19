import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { styles } from '@actual-app/components/styles';
import { theme } from '@actual-app/components/theme';
import { View } from '@actual-app/components/view';
import type { Query } from '@actual-app/core/shared/query';
import type { TagEntity } from '@actual-app/core/types/models';

import { Search } from '#components/common/Search';
import { TransactionList } from '#components/mobile/transactions/TransactionList';
import { useDateFormat } from '#hooks/useDateFormat';
import { DisplayPayeeProvider } from '#hooks/useDisplayPayee';
import { useNavigate } from '#hooks/useNavigate';
import { SelectedProvider, useSelected } from '#hooks/useSelected';
import { useTransactions } from '#hooks/useTransactions';
import { useTransactionsSearch } from '#hooks/useTransactionsSearch';
import * as queries from '#queries';

type TagTransactionListProps = {
  tag: TagEntity;
  /** The server's AQL for the tag's "has tags" condition. */
  filters: unknown[];
};

/**
 * Every account's transactions that carry `tag`, with the phone's search,
 * list and selection — the pieces the "All accounts" page is built from,
 * minus the balance, which a tag does not have.
 */
export function TagTransactionList({ tag, filters }: TagTransactionListProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dateFormat = useDateFormat() || 'MM/dd/yyyy';
  const [searchText, setSearchText] = useState('');

  // Split lines are matched one by one, as the phone's search matches them:
  // a tag written on one line of a split lists that line.
  const baseTransactionsQuery = () =>
    queries
      .transactions()
      .filter({ $and: filters })
      .options({ splits: 'all' })
      .select('*');

  const [transactionsQuery, setTransactionsQuery] = useState<Query>(
    baseTransactionsQuery,
  );
  const {
    transactions,
    isPending: isTransactionsLoading,
    isFetchingNextPage: isLoadingMoreTransactions,
    fetchNextPage: fetchMoreTransactions,
  } = useTransactions({ query: transactionsQuery });

  const { search: onSearch } = useTransactionsSearch({
    updateQuery: setTransactionsQuery,
    resetQuery: () => setTransactionsQuery(baseTransactionsQuery()),
    dateFormat,
  });

  const selectedInst = useSelected('transactions', [...transactions], []);

  return (
    <DisplayPayeeProvider transactions={transactions}>
      <SelectedProvider instance={selectedInst}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            flexShrink: 0,
            backgroundColor: theme.mobilePageBackground,
            padding: 10,
            width: '100%',
          }}
        >
          <Search
            value={searchText}
            onChange={text => {
              setSearchText(text);
              onSearch(text);
            }}
            placeholder={t('Search #{{tag}}', { tag: tag.tag })}
            width="100%"
            height={styles.mobileMinHeight}
            style={{
              backgroundColor: theme.tableBackground,
              borderColor: theme.formInputBorder,
            }}
          />
        </View>
        <TransactionList
          isLoading={isTransactionsLoading}
          transactions={transactions}
          isLoadingMore={isLoadingMoreTransactions}
          onLoadMore={fetchMoreTransactions}
          onOpenTransaction={transaction =>
            void navigate(`/transactions/${transaction.id}`)
          }
          showMakeTransfer
        />
      </SelectedProvider>
    </DisplayPayeeProvider>
  );
}
