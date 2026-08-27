import React from 'react';
import { Trans } from 'react-i18next';

import { Button } from '@actual-app/components/button';
import { Text } from '@actual-app/components/text';
import { View } from '@actual-app/components/view';

import { AccountDistribution } from './AccountDistribution';
import { AccountGroup } from './AccountGroup';
import { AccountsHero } from './AccountsHero';
import { ACCOUNT_HUE } from './accountsTokens';
import type { AccountsViewData } from './accountsViewModel';
import { AddAccountButton } from './AddAccountButton';
import { AddAccountPanel } from './AddAccountPanel';
import { BalanceOverTime } from './BalanceOverTime';

export type {
  AccountsViewData,
  BalanceSeries,
  EntityIcon,
  ViewAccount,
} from './accountsViewModel';
export type { AccountHue } from './accountsTokens';
// Re-exported so the real route can reach it: `accountsTokens` is a `.ts`
// module and the `#components/*` subpath only resolves `.tsx`.
export { ACCOUNT_HUE_ORDER } from './accountsTokens';

/**
 * The approved Accounts, as one composition.
 *
 * This is the only place the screen's structure exists. `/v2-lab/accounts`
 * feeds it fixtures and the real `/accounts` feeds it the application's own
 * accounts and balances, so the two routes can differ in what they say and
 * never in how they look.
 *
 * It runs no query and imports no fixture value — everything arrives as
 * `data`, and the tokens it paints with come from whichever class the caller
 * has already put on an ancestor. It also contributes no navigation: the
 * laboratory wraps it in its own wide sidebar, and the real route sits inside
 * the published shell.
 */
export function AccountsView({ data }: { data: AccountsViewData }) {
  const accounts = [...data.onBudget, ...data.offBudget];
  const hasFooter = data.footerLeft != null || data.footerRight != null;

  // A mocked control is drawn and does nothing; a real one is drawn and works;
  // an absent one is not drawn at all.
  const addAccount =
    typeof data.onAddAccount === 'function' ? data.onAddAccount : undefined;
  const headerAction = data.headerAction;
  const headerPress =
    typeof headerAction?.onPress === 'function'
      ? headerAction.onPress
      : undefined;

  return (
    <View style={{ flex: 1, minWidth: 0, overflowY: 'auto' }}>
      <View
        style={{
          width: '100%',
          flexShrink: 0,
          padding: '26px 40px 24px',
          gap: 20,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 20,
          }}
        >
          <Text
            style={{
              fontSize: 30,
              fontWeight: 700,
              letterSpacing: -0.8,
              paddingLeft: 2,
              color: 'var(--dfl-text)',
            }}
          >
            <Trans>Accounts</Trans>
          </Text>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            {data.onAddAccount && <AddAccountButton onPress={addAccount} />}
            {headerAction && (
              <Button
                variant="bare"
                onPress={headerPress}
                aria-label={headerAction.label}
                style={{
                  width: 38,
                  height: 38,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 999,
                  color: 'var(--dfl-text-2)',
                  backgroundColor: 'var(--dfl-surface-raised)',
                  border: '1px solid var(--dfl-line-strong)',
                }}
              >
                <headerAction.Icon aria-hidden="true" width={16} height={16} />
              </Button>
            )}
          </View>
        </View>

        <AccountsHero
          total={data.total}
          accountCount={data.accountCount}
          monthChange={data.monthChange}
          lastUpdate={data.lastUpdate}
        />

        <View
          style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 22 }}
        >
          {/* Left: every account, grouped the way the budget sees them. */}
          <View style={{ flex: '1 1 0', minWidth: 0, gap: 18 }}>
            <AccountGroup
              label={<Trans>On budget</Trans>}
              markerColor={ACCOUNT_HUE.blue}
              accounts={data.onBudget}
              subtotal={data.onBudgetTotal}
            />
            <AccountGroup
              label={<Trans>Off budget</Trans>}
              markerColor={ACCOUNT_HUE.violet}
              accounts={data.offBudget}
              subtotal={data.offBudgetTotal}
            />
            {data.onAddAccount && <AddAccountPanel onPress={addAccount} />}
          </View>

          {/* Right: the same money, read two other ways. */}
          <View style={{ flex: '1.06 1 0', minWidth: 0, gap: 18 }}>
            <BalanceOverTime series={data.balance} />
            <AccountDistribution accounts={accounts} total={data.total} />
          </View>
        </View>

        {hasFooter && (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
              paddingTop: 2,
            }}
          >
            <View>{data.footerLeft}</View>
            <View>{data.footerRight}</View>
          </View>
        )}
      </View>
    </View>
  );
}
