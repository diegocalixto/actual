import React, { useMemo } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { Button } from '@actual-app/components/button';
import { useResponsive } from '@actual-app/components/hooks/useResponsive';
import { SvgArrowThinRight } from '@actual-app/components/icons/v1';
import { Text } from '@actual-app/components/text';
import { TextOneLine } from '@actual-app/components/text-one-line';
import { View } from '@actual-app/components/view';
import * as monthUtils from '@actual-app/core/shared/months';
import type { TransactionEntity } from '@actual-app/core/types/models';
import { css } from '@emotion/css';

import {
  shellColors,
  shellLayout,
  shellRadius,
} from '#components/appshell/shellTheme';
import { HomeMobileMoney } from '#components/home/v2mobile/HomeMobileMoney';
import { getPrettyPayee } from '#components/mobile/utils';
import { useAccounts } from '#hooks/useAccounts';
import { useCategoriesById } from '#hooks/useCategories';
import { useNavigate } from '#hooks/useNavigate';
import { usePayeesById } from '#hooks/usePayees';
import { useTransactions } from '#hooks/useTransactions';
import * as queries from '#queries';

import { DashboardCard } from './DashboardCard';
import { HOME_DATE_LOCALE } from './homeLocale';
import { SectionHeading } from './SectionHeading';

const TRANSACTION_COUNT = 5;

type ActivityRow = {
  id: TransactionEntity['id'];
  accountId: TransactionEntity['account'];
  title: string;
  meta: string;
  date: string;
  amount: number;
};

/** The last few movements, as a scannable ledger. */
export function RecentActivityCard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isNarrowWidth } = useResponsive();

  // Transactions are already ordered newest-first by the AQL schema.
  const query = useMemo(
    () => queries.transactions().options({ splits: 'none' }).select('*'),
    [],
  );

  const { transactions, isLoading } = useTransactions({
    query,
    options: { pageSize: TRANSACTION_COUNT },
  });

  const { data: payeesById } = usePayeesById();
  const { data: accounts = [] } = useAccounts();
  const { data: categoriesById } = useCategoriesById();

  const rows: ActivityRow[] = transactions
    .filter(transaction => !transaction.is_child)
    .slice(0, TRANSACTION_COUNT)
    .map(transaction => {
      const payee = transaction.payee
        ? payeesById?.[transaction.payee]
        : undefined;
      const transferAccount = accounts.find(
        account => account.id === payee?.transfer_acct,
      );
      const category = transaction.category
        ? categoriesById?.list[transaction.category]
        : undefined;
      const account = accounts.find(item => item.id === transaction.account);

      return {
        id: transaction.id,
        accountId: transaction.account,
        title:
          getPrettyPayee({ t, transaction, payee, transferAccount }) ||
          t('(No payee)'),
        meta: [category?.name, account?.name].filter(Boolean).join(' · '),
        date: monthUtils.format(transaction.date, 'd MMM', HOME_DATE_LOCALE),
        amount: transaction.amount,
      };
    });

  return (
    <SectionHeading
      title={<Trans>Atividade recente</Trans>}
      action={
        rows.length > 0 ? (
          <Button
            variant="bare"
            aria-label={t('Ver todas as transações')}
            onPress={() => void navigate('/accounts')}
            className={css({
              padding: '4px 6px',
              marginRight: -6,
              borderRadius: shellRadius.chip,
              color: shellColors.accent,
              '&[data-hovered]': {
                backgroundColor: shellColors.surfaceSunken,
              },
            })}
          >
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}
            >
              <Text style={{ fontSize: 12, fontWeight: 600 }}>
                <Trans>Ver tudo</Trans>
              </Text>
              <SvgArrowThinRight width={10} height={10} />
            </View>
          </Button>
        ) : null
      }
    >
      <DashboardCard>
        {rows.length === 0 ? (
          <View style={{ padding: 26, alignItems: 'center' }}>
            <Text
              style={{
                fontSize: 13,
                textAlign: 'center',
                color: shellColors.textSecondary,
              }}
            >
              {isLoading ? (
                <Trans>Carregando transações…</Trans>
              ) : (
                <Trans>Nenhuma transação registrada ainda.</Trans>
              )}
            </Text>
          </View>
        ) : (
          rows.map((row, index) => (
            <ActivityRowButton
              key={row.id}
              row={row}
              isLast={index === rows.length - 1}
              // The transaction editor is mobile-only; on wider screens open
              // the account register instead so the row always leads somewhere.
              to={
                isNarrowWidth
                  ? `/transactions/${row.id}`
                  : `/accounts/${row.accountId}`
              }
            />
          ))
        )}
      </DashboardCard>
    </SectionHeading>
  );
}

type ActivityRowButtonProps = {
  row: ActivityRow;
  isLast: boolean;
  to: string;
};

function ActivityRowButton({ row, isLast, to }: ActivityRowButtonProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const isInflow = row.amount > 0;

  return (
    <Button
      variant="bare"
      aria-label={t('Abrir transação {{title}}', { title: row.title })}
      onPress={() => void navigate(to)}
      className={css({
        width: '100%',
        minHeight: shellLayout.touchTarget + 8,
        padding: '11px 16px',
        borderRadius: 0,
        borderBottom: isLast ? 'none' : `1px solid ${shellColors.border}`,
        '&[data-hovered]': {
          backgroundColor: shellColors.surfaceSunken,
        },
      })}
    >
      <View
        style={{
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          minWidth: 0,
        }}
      >
        <View
          style={{ flex: 1, minWidth: 0, gap: 3, alignItems: 'flex-start' }}
        >
          <TextOneLine style={{ fontSize: 14.5, fontWeight: 500 }}>
            {row.title}
          </TextOneLine>
          {row.meta !== '' && (
            <TextOneLine
              style={{ fontSize: 11.5, color: shellColors.textMuted }}
            >
              {row.meta}
            </TextOneLine>
          )}
        </View>

        <View style={{ alignItems: 'flex-end', gap: 3, flexShrink: 0 }}>
          <HomeMobileMoney
            value={row.amount}
            withCurrency
            style={{
              fontSize: 14.5,
              fontWeight: 600,
              // Inflows are the exception worth marking. Outflows are the norm
              // in a ledger, so they keep the page's own ink instead of
              // painting the whole list red.
              color: isInflow ? shellColors.positive : shellColors.textPrimary,
            }}
          />
          <Text style={{ fontSize: 11, color: shellColors.textMuted }}>
            {row.date}
          </Text>
        </View>
      </View>
    </Button>
  );
}
