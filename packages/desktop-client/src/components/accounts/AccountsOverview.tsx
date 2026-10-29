import React, { useState } from 'react';
import type { ReactNode } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { Button } from '@actual-app/components/button';
import { useResponsive } from '@actual-app/components/hooks/useResponsive';
import {
  SvgAdd,
  SvgArrowThinRight,
  SvgPiggyBank,
  SvgWallet,
} from '@actual-app/components/icons/v1';
import { Text } from '@actual-app/components/text';
import { TextOneLine } from '@actual-app/components/text-one-line';
import { View } from '@actual-app/components/view';
import type { AccountEntity } from '@actual-app/core/types/models';
import { css } from '@emotion/css';

import {
  amountColor,
  shellColors,
  shellRadius,
} from '#components/appshell/shellTheme';
import { IconChip } from '#components/v2/IconChip';
import { Metric } from '#components/v2/Metric';
import { Money } from '#components/v2/Money';
import { PageBody } from '#components/v2/PageBody';
import { PageIntro } from '#components/v2/PageIntro';
import { SectionTitle } from '#components/v2/SectionTitle';
import { Surface } from '#components/v2/Surface';
import { useClosedAccounts } from '#hooks/useClosedAccounts';
import { useNavigate } from '#hooks/useNavigate';
import { useOffBudgetAccounts } from '#hooks/useOffBudgetAccounts';
import { useOnBudgetAccounts } from '#hooks/useOnBudgetAccounts';
import { useSheetValue } from '#hooks/useSheetValue';
import { pushModal } from '#modals/modalsSlice';
import { useDispatch } from '#redux';
import * as bindings from '#spreadsheet/bindings';

/**
 * The desktop Accounts screen.
 *
 * Upstream, `/accounts` was the combined transaction register: a spreadsheet of
 * every transaction in the file, with the list of accounts living in the
 * sidebar. The V2 rail replaced that sidebar, so this page answers the question
 * the sidebar used to — where is my money — and the registers stay one click
 * away, per account or per group. The combined register itself is still there,
 * at `/accounts/all`.
 */
export function AccountsOverview() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isNarrowWidth } = useResponsive();

  const { data: onBudget = [] } = useOnBudgetAccounts();
  const { data: offBudget = [] } = useOffBudgetAccounts();
  const { data: closed = [] } = useClosedAccounts();
  const [showClosed, setShowClosed] = useState(false);

  const totalBalance = useSheetValue<'account', 'accounts-balance'>(
    bindings.allAccountBalance(),
  );
  const onBudgetBalance = useSheetValue<'account', 'onbudget-accounts-balance'>(
    bindings.onBudgetAccountBalance(),
  );
  const offBudgetBalance = useSheetValue<
    'account',
    'offbudget-accounts-balance'
  >(bindings.offBudgetAccountBalance());

  const openCount = onBudget.length + offBudget.length;

  return (
    <View style={{ flex: 1, overflowY: 'auto' }}>
      <PageBody>
        <PageIntro
          title={<Trans>Accounts</Trans>}
          subtitle={
            openCount > 0
              ? t('{{count}} open accounts', { count: openCount })
              : undefined
          }
          actions={
            <Button
              variant="normal"
              onPress={() =>
                dispatch(
                  pushModal({ modal: { name: 'add-account', options: {} } }),
                )
              }
            >
              <View
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
              >
                <SvgAdd width={11} height={11} />
                <Trans>Add account</Trans>
              </View>
            </Button>
          }
        />

        {openCount === 0 ? (
          <Surface>
            <View style={{ padding: 34, alignItems: 'center', gap: 6 }}>
              <Text style={{ fontSize: 16, fontWeight: 600 }}>
                <Trans>No accounts yet</Trans>
              </Text>
              <Text
                style={{
                  fontSize: 13.5,
                  textAlign: 'center',
                  color: shellColors.textMuted,
                }}
              >
                <Trans>Add an account to start tracking your money.</Trans>
              </Text>
            </View>
          </Surface>
        ) : (
          <>
            {/* A band on the canvas rather than another card: the totals are
                context for the groups below, not a panel of their own. */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'stretch',
                flexWrap: 'wrap',
                gap: isNarrowWidth ? 18 : 40,
                paddingBottom: 4,
              }}
            >
              <Metric
                label={<Trans>Total balance</Trans>}
                value={totalBalance}
                size="lead"
                tone="plain"
              />
              <Metric
                label={<Trans>On budget</Trans>}
                value={onBudgetBalance}
              />
              <Metric
                label={<Trans>Off budget</Trans>}
                value={offBudgetBalance}
              />
            </View>

            {onBudget.length > 0 && (
              <AccountGroup
                title={<Trans>On budget</Trans>}
                accounts={onBudget}
                registerPath="/accounts/budgeted"
              />
            )}

            {offBudget.length > 0 && (
              <AccountGroup
                title={<Trans>Off budget</Trans>}
                accounts={offBudget}
                registerPath="/accounts/offbudget"
              />
            )}

            {closed.length > 0 && (
              <View style={{ gap: 10 }}>
                <Button
                  variant="bare"
                  aria-expanded={showClosed}
                  onPress={() => setShowClosed(open => !open)}
                  className={css({
                    alignSelf: 'flex-start',
                    padding: '4px 2px',
                    color: shellColors.textMuted,
                    '&[data-hovered]': { color: shellColors.textPrimary },
                  })}
                >
                  <Text style={{ fontSize: 13.5, fontWeight: 600 }}>
                    {t('Closed accounts ({{count}})', {
                      count: closed.length,
                    })}
                  </Text>
                </Button>
                {showClosed && <AccountList accounts={closed} isClosed />}
              </View>
            )}

            <Button
              variant="bare"
              aria-label={t('See all transactions')}
              onPress={() => void navigate('/accounts/all')}
              className={css({
                alignSelf: 'flex-start',
                padding: '6px 2px',
                color: shellColors.accent,
                '&[data-hovered]': { textDecoration: 'underline' },
              })}
            >
              <View
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
              >
                <Text style={{ fontSize: 13.5, fontWeight: 600 }}>
                  <Trans>See all transactions</Trans>
                </Text>
                <SvgArrowThinRight width={11} height={11} />
              </View>
            </Button>
          </>
        )}
      </PageBody>
    </View>
  );
}

type AccountGroupProps = {
  title: ReactNode;
  accounts: AccountEntity[];
  registerPath: string;
};

function AccountGroup({ title, accounts, registerPath }: AccountGroupProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <View style={{ gap: 10 }}>
      <SectionTitle
        action={
          <Button
            variant="bare"
            aria-label={t('Open the register for this group')}
            onPress={() => void navigate(registerPath)}
            className={css({
              padding: '3px 6px',
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
              <Text style={{ fontSize: 12.5, fontWeight: 600 }}>
                <Trans>Transactions</Trans>
              </Text>
              <SvgArrowThinRight width={10} height={10} />
            </View>
          </Button>
        }
      >
        {title}
      </SectionTitle>
      <AccountList accounts={accounts} />
    </View>
  );
}

/**
 * One panel holding the whole group, with hairlines between rows — rather than
 * one card per account, which at ten accounts becomes a wall of boxes.
 */
function AccountList({
  accounts,
  isClosed = false,
}: {
  accounts: AccountEntity[];
  isClosed?: boolean;
}) {
  return (
    <Surface>
      {accounts.map((account, index) => (
        <AccountRow
          key={account.id}
          account={account}
          isLast={index === accounts.length - 1}
          isClosed={isClosed}
        />
      ))}
    </Surface>
  );
}

function AccountRow({
  account,
  isLast,
  isClosed,
}: {
  account: AccountEntity;
  isLast: boolean;
  isClosed: boolean;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const balance = useSheetValue<'account', 'balance'>(
    bindings.accountBalance(account.id),
  );

  // Only ever real data: the bank name and masked number exist when the
  // account was linked through a sync provider, and nothing is shown when they
  // do not. Actual carries no account type, so nothing here claims to know
  // whether an account is a card.
  const detail = [
    account.bankName,
    account.mask ? `•••• ${account.mask}` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Button
      variant="bare"
      aria-label={t('View transactions for {{name}}', { name: account.name })}
      onPress={() => void navigate(`/accounts/${account.id}`)}
      className={css({
        width: '100%',
        minHeight: 62,
        padding: '12px 16px',
        borderRadius: 0,
        borderBottom: isLast ? 'none' : `1px solid ${shellColors.border}`,
        opacity: isClosed ? 0.6 : 1,
        '&[data-hovered]': { backgroundColor: shellColors.surfaceHover },
      })}
    >
      <View
        style={{
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 13,
          minWidth: 0,
        }}
      >
        <IconChip
          Icon={account.offbudget ? SvgPiggyBank : SvgWallet}
          tone={account.offbudget ? 'muted' : 'accent'}
        />

        <View
          style={{ flex: 1, minWidth: 0, gap: 3, alignItems: 'flex-start' }}
        >
          <TextOneLine style={{ fontSize: 15, fontWeight: 600 }}>
            {account.name}
          </TextOneLine>
          {detail !== '' && (
            <TextOneLine style={{ fontSize: 12, color: shellColors.textMuted }}>
              {detail}
            </TextOneLine>
          )}
        </View>

        <Money
          value={balance}
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: amountColor(balance),
          }}
        />
      </View>
    </Button>
  );
}
