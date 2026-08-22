import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { Button } from '@actual-app/components/button';
import { SvgPiggyBank, SvgWallet } from '@actual-app/components/icons/v1';
import { Text } from '@actual-app/components/text';
import { TextOneLine } from '@actual-app/components/text-one-line';
import { theme } from '@actual-app/components/theme';
import { View } from '@actual-app/components/view';
import type { AccountEntity } from '@actual-app/core/types/models';

import { useNavigate } from '#hooks/useNavigate';
import { useOffBudgetAccounts } from '#hooks/useOffBudgetAccounts';
import { useOnBudgetAccounts } from '#hooks/useOnBudgetAccounts';
import { useSheetValue } from '#hooks/useSheetValue';
import * as bindings from '#spreadsheet/bindings';

import { HomeAmount } from './HomeAmount';
import { HomeCard } from './HomeCard';
import { HomeSection } from './HomeSection';
import { homeAmountColor, homeLabelStyle, homeLayout } from './homeStyles';

export function AccountsSection() {
  // Both queries carry `placeholderData`, so they report success immediately
  // and `isLoading` is never true; `isPlaceholderData` is the real signal.
  const { data: onBudgetAccounts = [], isPlaceholderData: isOnBudgetPending } =
    useOnBudgetAccounts();
  const {
    data: offBudgetAccounts = [],
    isPlaceholderData: isOffBudgetPending,
  } = useOffBudgetAccounts();

  const isLoading = isOnBudgetPending || isOffBudgetPending;

  const accounts = [
    ...onBudgetAccounts.map(account => ({ account, isOffBudget: false })),
    ...offBudgetAccounts.map(account => ({ account, isOffBudget: true })),
  ];

  return (
    <HomeSection title={<Trans>Accounts</Trans>}>
      <HomeCard>
        {accounts.length === 0 ? (
          <View style={{ padding: 24, alignItems: 'center', gap: 6 }}>
            {isLoading ? (
              <Text style={{ ...homeLabelStyle, textAlign: 'center' }}>
                <Trans>Loading accounts…</Trans>
              </Text>
            ) : (
              <>
                <Text style={{ fontSize: 15, fontWeight: 600 }}>
                  <Trans>No accounts yet</Trans>
                </Text>
                <Text style={{ ...homeLabelStyle, textAlign: 'center' }}>
                  <Trans>Add an account to start tracking your money.</Trans>
                </Text>
              </>
            )}
          </View>
        ) : (
          accounts.map(({ account, isOffBudget }, index) => (
            <AccountRow
              key={account.id}
              account={account}
              isOffBudget={isOffBudget}
              isLast={index === accounts.length - 1}
            />
          ))
        )}
      </HomeCard>
    </HomeSection>
  );
}

type AccountRowProps = {
  account: AccountEntity;
  isOffBudget: boolean;
  isLast: boolean;
};

function AccountRow({ account, isOffBudget, isLast }: AccountRowProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const balance = useSheetValue<'account', 'balance'>(
    bindings.accountBalance(account.id),
  );

  const Icon = isOffBudget ? SvgPiggyBank : SvgWallet;

  // Actual has no account-type field, so the only reliable distinction is
  // on-budget vs off-budget. Bank name and masked number are shown when the
  // account was linked to a bank.
  const details = [
    account.bankName,
    account.mask ? `•••• ${account.mask}` : null,
  ].filter(Boolean);

  const subtitle =
    details.length > 0
      ? details.join(' · ')
      : isOffBudget
        ? t('Off budget')
        : t('On budget');

  return (
    <Button
      variant="bare"
      aria-label={t('View transactions for {{name}}', { name: account.name })}
      onPress={() => void navigate(`/accounts/${account.id}`)}
      style={{
        width: '100%',
        minHeight: homeLayout.touchTarget + 16,
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
        <View
          style={{
            width: 36,
            height: 36,
            flexShrink: 0,
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: theme.pillBackground,
            color: theme.pillText,
          }}
        >
          <Icon width={17} height={17} />
        </View>

        <View style={{ flex: 1, gap: 2, alignItems: 'flex-start' }}>
          <TextOneLine style={{ fontSize: 15, fontWeight: 600 }}>
            {account.name}
          </TextOneLine>
          <TextOneLine style={{ ...homeLabelStyle, fontSize: 12 }}>
            {subtitle}
          </TextOneLine>
        </View>

        <HomeAmount
          value={balance}
          style={{
            fontSize: 15,
            fontWeight: 600,
            color:
              balance === null
                ? theme.pageTextSubdued
                : homeAmountColor(balance),
          }}
        />
      </View>
    </Button>
  );
}
