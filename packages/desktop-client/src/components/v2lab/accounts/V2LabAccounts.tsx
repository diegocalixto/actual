import React from 'react';
import type { ComponentType, ReactNode, SVGProps } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import {
  SvgAdd,
  SvgDotsHorizontalTriple,
  SvgRefresh,
} from '@actual-app/components/icons/v1';
import { SvgInformationCircle } from '@actual-app/components/icons/v2';
import { Text } from '@actual-app/components/text';
import { View } from '@actual-app/components/view';

import { AccountDistribution } from './AccountDistribution';
import { AccountGroup } from './AccountGroup';
import {
  balanceAxisMax,
  balanceAxisTicks,
  balanceSeries,
  balanceXLabels,
  labAccounts,
  labChrome,
  offBudgetAccounts,
  onBudgetAccounts,
  totalBalance,
} from './accountsFixtures';
import { AccountsHero } from './AccountsHero';
import { ACCOUNT_HUE } from './accountsTokens';
import { BalanceOverTime } from './BalanceOverTime';
import { LabSidebar } from './LabSidebar';

/**
 * Visual laboratory for Accounts, desktop only.
 *
 * Renders inside the real App Shell at `/v2-lab/accounts`, so the page can be
 * judged against the rail and header already approved. The real `/accounts`
 * route is untouched and this one is absent from every navigation.
 *
 * `accountsFixtures` is the single local source: the hero total, both group
 * subtotals, every share of the donut and the last point of the curve are all
 * derived from the same five balances, so no two components can disagree.
 * Nothing is written, queried, persisted or synced.
 */
export function V2LabAccounts() {
  const { t } = useTranslation();

  return (
    <View
      style={{
        flex: 1,
        flexDirection: 'row',
        minHeight: 0,
        backgroundColor: 'var(--dfl-canvas)',
        color: 'var(--dfl-text)',
      }}
    >
      <LabSidebar />

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

            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}
            >
              <AddAccountButton />
              <View
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
                <SvgDotsHorizontalTriple
                  aria-hidden="true"
                  width={16}
                  height={16}
                />
              </View>
            </View>
          </View>

          <AccountsHero
            total={totalBalance}
            accountCount={labChrome.accountCount}
            monthChange={labChrome.monthChange}
            lastUpdate={labChrome.lastUpdate}
          />

          <View
            style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 22 }}
          >
            {/* Left: every account, grouped the way the budget sees them. */}
            <View style={{ flex: '1 1 0', minWidth: 0, gap: 18 }}>
              <AccountGroup
                label={<Trans>On budget</Trans>}
                markerColor={ACCOUNT_HUE.blue}
                accounts={onBudgetAccounts}
              />
              <AccountGroup
                label={<Trans>Off budget</Trans>}
                markerColor={ACCOUNT_HUE.violet}
                accounts={offBudgetAccounts}
              />
              <AddAccountPanel />
            </View>

            {/* Right: the same money, read two other ways. */}
            <View style={{ flex: '1.06 1 0', minWidth: 0, gap: 18 }}>
              <BalanceOverTime
                series={balanceSeries}
                axisMax={balanceAxisMax}
                axisTicks={balanceAxisTicks}
                xLabels={balanceXLabels}
                rangeLabel={labChrome.rangeLabel}
              />
              <AccountDistribution
                accounts={labAccounts}
                total={totalBalance}
              />
            </View>
          </View>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
              paddingTop: 2,
            }}
          >
            <Footnote Icon={SvgInformationCircle}>
              <Trans>All accounts are secure and encrypted</Trans>
            </Footnote>
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}
            >
              <Footnote Icon={SvgRefresh}>
                <Trans>Auto-sync is on</Trans>
              </Footnote>
              <Text
                style={{
                  fontSize: 11,
                  letterSpacing: 0.6,
                  opacity: 0.7,
                  color: 'var(--dfl-text-3)',
                }}
              >
                {t('Visual laboratory — demonstration data')}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

function AddAccountButton() {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: '10px 18px 10px 15px',
        borderRadius: 'var(--dfl-radius-sm)',
        color: '#ffffff',
        backgroundImage: 'linear-gradient(180deg, #3f86e8 0%, #2a63c4 100%)',
        border: '1px solid rgba(150, 200, 255, 0.4)',
        boxShadow:
          'inset 0 1px 0 rgba(255, 255, 255, 0.3), 0 8px 22px -10px rgba(63, 134, 232, 0.95)',
      }}
    >
      <SvgAdd aria-hidden="true" width={13} height={13} />
      <Text
        style={{
          fontSize: 13.5,
          fontWeight: 600,
          whiteSpace: 'nowrap',
          color: '#ffffff',
        }}
      >
        <Trans>Add account</Trans>
      </Text>
    </View>
  );
}

/**
 * The foot of the list.
 *
 * A dashed outline rather than a filled button: it closes the column without
 * competing with the accounts above it, and it is honest about being empty —
 * this round wires no persistence behind it.
 */
function AddAccountPanel() {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: '17px 0',
        borderRadius: 'var(--dfl-radius)',
        color: 'var(--dfl-blue)',
        backgroundColor: 'rgba(90, 166, 255, 0.04)',
        border: '1px dashed rgba(122, 168, 224, 0.34)',
      }}
    >
      <SvgAdd aria-hidden="true" width={13} height={13} />
      <Text
        style={{
          fontSize: 13.5,
          fontWeight: 600,
          whiteSpace: 'nowrap',
          color: 'var(--dfl-blue)',
        }}
      >
        <Trans>Add account</Trans>
      </Text>
    </View>
  );
}

type FootnoteProps = {
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  children: ReactNode;
};

function Footnote({ Icon, children }: FootnoteProps) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
      <Icon
        aria-hidden="true"
        width={13}
        height={13}
        style={{ color: 'var(--dfl-text-3)' }}
      />
      <Text
        style={{
          fontSize: 12,
          whiteSpace: 'nowrap',
          color: 'var(--dfl-text-3)',
        }}
      >
        {children}
      </Text>
    </View>
  );
}
