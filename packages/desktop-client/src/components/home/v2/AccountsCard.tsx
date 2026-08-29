import React from 'react';
import type { ReactNode } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { Button } from '@actual-app/components/button';
import { useResponsive } from '@actual-app/components/hooks/useResponsive';
import { SvgPiggyBank, SvgWallet } from '@actual-app/components/icons/v1';
import { Text } from '@actual-app/components/text';
import { TextOneLine } from '@actual-app/components/text-one-line';
import { View } from '@actual-app/components/view';
import { css } from '@emotion/css';

import {
  amountColor,
  shellColors,
  shellEyebrowStyle,
  shellLayout,
  shellRadius,
} from '#components/appshell/shellTheme';
import { Money } from '#components/v2/Money';
import { useNavigate } from '#hooks/useNavigate';

import { DashboardCard } from './DashboardCard';
import { SectionHeading } from './SectionHeading';
import type { HomeAccount } from './useHomeAccounts';
import { useAccountBalance, useHomeAccounts } from './useHomeAccounts';
import { useTotalBalance } from './useHomeBalances';

/**
 * Every account as its own tile, on a grid that reflows from one column on a
 * phone to as many as fit on a desktop. The count is never assumed: zero, one
 * and a dozen accounts all produce a sensible shape.
 */
export function AccountsCard() {
  const { accounts, isLoading } = useHomeAccounts();
  const totalBalance = useTotalBalance();

  const onBudget = accounts.filter(entry => entry.kind === 'onBudget');
  const offBudget = accounts.filter(entry => entry.kind === 'offBudget');

  // Naming the two groups is only worth a row of type when there are actually
  // two of them. A budget whose accounts are all on-budget — the common case —
  // would just get the same caption repeated down the column.
  const isSplit = offBudget.length > 0;

  return (
    <SectionHeading
      title={<Trans>Accounts</Trans>}
      action={
        accounts.length > 0 ? (
          <View
            style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}
          >
            <Text style={shellEyebrowStyle}>
              <Trans>Total</Trans>
            </Text>
            <Money
              value={totalBalance}
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: shellColors.textPrimary,
              }}
            />
          </View>
        ) : null
      }
    >
      {accounts.length === 0 ? (
        <DashboardCard>
          <View style={{ padding: 26, alignItems: 'center', gap: 6 }}>
            {isLoading ? (
              <Text style={{ fontSize: 13, color: shellColors.textSecondary }}>
                <Trans>Loading accounts…</Trans>
              </Text>
            ) : (
              <>
                <Text style={{ fontSize: 15, fontWeight: 600 }}>
                  <Trans>No accounts yet</Trans>
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    textAlign: 'center',
                    color: shellColors.textSecondary,
                  }}
                >
                  <Trans>Add an account to start tracking your money.</Trans>
                </Text>
              </>
            )}
          </View>
        </DashboardCard>
      ) : (
        <View style={{ gap: 14 }}>
          {onBudget.length > 0 && (
            <AccountGroup
              label={isSplit ? <Trans>On budget</Trans> : null}
              accounts={onBudget}
            />
          )}
          {offBudget.length > 0 && (
            <AccountGroup
              label={isSplit ? <Trans>Off budget</Trans> : null}
              accounts={offBudget}
            />
          )}
        </View>
      )}
    </SectionHeading>
  );
}

type AccountGroupProps = {
  label: ReactNode;
  accounts: HomeAccount[];
};

function AccountGroup({ label, accounts }: AccountGroupProps) {
  const { isNarrowWidth } = useResponsive();

  return (
    <View style={{ gap: 8 }}>
      {label !== null && (
        <Text
          style={{
            ...shellEyebrowStyle,
            fontSize: 10.5,
            paddingLeft: 2,
            color: shellColors.textMuted,
          }}
        >
          {label}
        </Text>
      )}
      <View
        style={{
          display: 'grid',
          gridTemplateColumns: isNarrowWidth
            ? '1fr'
            : 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: 10,
        }}
      >
        {accounts.map(homeAccount => (
          <AccountTile key={homeAccount.account.id} homeAccount={homeAccount} />
        ))}
      </View>
    </View>
  );
}

function AccountTile({ homeAccount }: { homeAccount: HomeAccount }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { account, kind, detail } = homeAccount;
  const balance = useAccountBalance(account.id);

  const isOffBudget = kind === 'offBudget';
  const Icon = isOffBudget ? SvgPiggyBank : SvgWallet;

  return (
    <Button
      variant="bare"
      aria-label={t('View transactions for {{name}}', { name: account.name })}
      onPress={() => void navigate(`/accounts/${account.id}`)}
      className={css({
        width: '100%',
        minHeight: shellLayout.touchTarget + 8,
        padding: '11px 14px',
        borderRadius: shellRadius.tile,
        border: `1px solid ${shellColors.border}`,
        backgroundColor: shellColors.surface,
        transition: 'background-color .15s ease, border-color .15s ease',
        '&[data-hovered]': {
          backgroundColor: shellColors.surfaceHover,
          borderColor: shellColors.borderStrong,
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
          aria-hidden="true"
          style={{
            width: 32,
            height: 32,
            flexShrink: 0,
            borderRadius: shellRadius.chip,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: shellColors.surfaceSunken,
            color: isOffBudget ? shellColors.textSecondary : shellColors.accent,
          }}
        >
          <Icon width={16} height={16} />
        </View>

        <View
          style={{ flex: 1, minWidth: 0, gap: 3, alignItems: 'flex-start' }}
        >
          <TextOneLine style={{ fontSize: 14.5, fontWeight: 600 }}>
            {account.name}
          </TextOneLine>
          {/* Only ever real data: the bank name and masked number exist when
              the account was linked through a sync provider, and nothing is
              shown when they do not. On-budget vs off-budget is carried by the
              group heading and the icon rather than repeated on every tile. */}
          {detail !== null && (
            <TextOneLine
              style={{
                fontSize: 11.5,
                fontWeight: 500,
                color: shellColors.textMuted,
              }}
            >
              {detail}
            </TextOneLine>
          )}
        </View>

        <Money
          value={balance}
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: amountColor(balance),
          }}
        />
      </View>
    </Button>
  );
}
