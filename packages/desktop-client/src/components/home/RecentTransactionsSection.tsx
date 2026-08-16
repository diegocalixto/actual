import React, { useMemo } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { Button } from '@actual-app/components/button';
import { useResponsive } from '@actual-app/components/hooks/useResponsive';
import { Text } from '@actual-app/components/text';
import { TextOneLine } from '@actual-app/components/text-one-line';
import { theme } from '@actual-app/components/theme';
import { View } from '@actual-app/components/view';
import * as monthUtils from '@actual-app/core/shared/months';
import type { TransactionEntity } from '@actual-app/core/types/models';

import { getPrettyPayee } from '#components/mobile/utils';
import { useAccounts } from '#hooks/useAccounts';
import { useCategoriesById } from '#hooks/useCategories';
import { useLocale } from '#hooks/useLocale';
import { useNavigate } from '#hooks/useNavigate';
import { usePayeesById } from '#hooks/usePayees';
import { useTransactions } from '#hooks/useTransactions';
import * as queries from '#queries';

import { HomeAmount } from './HomeAmount';
import { HomeCard } from './HomeCard';
import { HomeSection } from './HomeSection';
import { homeAmountColor, homeLabelStyle, homeLayout } from './homeStyles';

const TRANSACTION_COUNT = 6;

export function RecentTransactionsSection() {
  // Transactions are already ordered newest-first by the AQL schema.
  const query = useMemo(
    () => queries.transactions().options({ splits: 'none' }).select('*'),
    [],
  );

  const { transactions, isLoading } = useTransactions({
    query,
    options: { pageSize: TRANSACTION_COUNT },
  });

  const recentTransactions = transactions
    .filter(transaction => !transaction.is_child)
    .slice(0, TRANSACTION_COUNT);

  return (
    <HomeSection title={<Trans>Movimentações recentes</Trans>}>
      <HomeCard>
        {recentTransactions.length === 0 ? (
          <View style={{ padding: 24, alignItems: 'center' }}>
            <Text style={{ ...homeLabelStyle, textAlign: 'center' }}>
              {isLoading ? (
                <Trans>Carregando movimentações…</Trans>
              ) : (
                <Trans>Nenhuma movimentação registrada ainda.</Trans>
              )}
            </Text>
          </View>
        ) : (
          recentTransactions.map((transaction, index) => (
            <TransactionRow
              key={transaction.id}
              transaction={transaction}
              isLast={index === recentTransactions.length - 1}
            />
          ))
        )}
      </HomeCard>
    </HomeSection>
  );
}

type TransactionRowProps = {
  transaction: TransactionEntity;
  isLast: boolean;
};

function TransactionRow({ transaction, isLast }: TransactionRowProps) {
  const { t } = useTranslation();
  const locale = useLocale();
  const navigate = useNavigate();
  const { isNarrowWidth } = useResponsive();

  const { data: payeesById } = usePayeesById();
  const { data: accounts = [] } = useAccounts();
  const { data: categoriesById } = useCategoriesById();

  const payee = transaction.payee ? payeesById?.[transaction.payee] : undefined;
  const transferAccount = accounts.find(
    account => account.id === payee?.transfer_acct,
  );

  const title =
    getPrettyPayee({ t, transaction, payee, transferAccount }) ||
    t('(Sem beneficiário)');

  const category = transaction.category
    ? categoriesById?.list[transaction.category]
    : undefined;

  const details = [
    monthUtils.format(transaction.date, 'd MMM', locale),
    category?.name,
  ].filter(Boolean);

  // The transaction editor is mobile-only; on wider screens open the account
  // register instead so the row always leads somewhere useful.
  const onPress = () =>
    void navigate(
      isNarrowWidth
        ? `/transactions/${transaction.id}`
        : `/accounts/${transaction.account}`,
    );

  return (
    <Button
      variant="bare"
      aria-label={t('Abrir movimentação {{title}}', { title })}
      onPress={onPress}
      style={{
        width: '100%',
        minHeight: homeLayout.touchTarget + 8,
        padding: '12px 16px',
        borderRadius: 0,
        borderBottom: isLast ? 'none' : `1px solid ${theme.tableBorder}`,
      }}
    >
      <View
        style={{
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <View style={{ flex: 1, gap: 2, alignItems: 'flex-start' }}>
          <TextOneLine style={{ fontSize: 15, fontWeight: 500 }}>
            {title}
          </TextOneLine>
          <TextOneLine style={{ ...homeLabelStyle, fontSize: 12 }}>
            {details.join(' · ')}
          </TextOneLine>
        </View>

        <HomeAmount
          value={transaction.amount}
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: homeAmountColor(transaction.amount),
          }}
        />
      </View>
    </Button>
  );
}
