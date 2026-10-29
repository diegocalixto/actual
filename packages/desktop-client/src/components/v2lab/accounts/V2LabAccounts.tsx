import React from 'react';
import type { ComponentType, ReactNode, SVGProps } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import {
  SvgDotsHorizontalTriple,
  SvgRefresh,
} from '@actual-app/components/icons/v1';
import { SvgInformationCircle } from '@actual-app/components/icons/v2';
import { Text } from '@actual-app/components/text';
import { View } from '@actual-app/components/view';

import {
  balanceAxisMax,
  balanceAxisTicks,
  balanceSeries,
  balanceXLabels,
  labChrome,
  offBudgetAccounts,
  onBudgetAccounts,
  totalBalance,
} from './accountsFixtures';
import { AccountsView } from './AccountsView';
import type { AccountsViewData } from './AccountsView';
import { LabSidebar } from './LabSidebar';

/**
 * Visual laboratory for Accounts, desktop only.
 *
 * Nothing but a data source now: the composition lives in `AccountsView`, which
 * the real `/accounts` renders too, so the approved design has exactly one
 * implementation. What is disposable here is `accountsFixtures`.
 *
 * The wide sidebar stays a fixture of this route. The published shell puts
 * navigation in a rail, and Overview, Budget and Reports are all approved
 * against that rail — widening it here would redesign them by accident.
 */
export function V2LabAccounts() {
  const { t } = useTranslation();

  const onBudgetTotal = onBudgetAccounts.reduce((sum, a) => sum + a.balance, 0);
  const offBudgetTotal = offBudgetAccounts.reduce(
    (sum, a) => sum + a.balance,
    0,
  );

  const data: AccountsViewData = {
    total: totalBalance,
    onBudgetTotal,
    offBudgetTotal,
    accountCount: labChrome.accountCount,
    monthChange: labChrome.monthChange,
    lastUpdate: labChrome.lastUpdate,
    onBudget: onBudgetAccounts,
    offBudget: offBudgetAccounts,
    balance: {
      points: balanceSeries,
      axisMin: 0,
      axisMax: balanceAxisMax,
      axisTicks: balanceAxisTicks,
      xLabels: balanceXLabels,
      rangeLabel: labChrome.rangeLabel,
      rangeChevron: true,
    },
    // Mocked on purpose: both controls are drawn so the composition can be
    // judged whole, and neither opens anything on this route.
    onAddAccount: 'mock',
    headerAction: {
      Icon: SvgDotsHorizontalTriple,
      label: t('More'),
      onPress: 'mock',
    },
    isLoading: false,
    footerLeft: (
      <Footnote Icon={SvgInformationCircle}>
        <Trans>All accounts are secure and encrypted</Trans>
      </Footnote>
    ),
    footerRight: (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
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
    ),
  };

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
      <AccountsView data={data} />
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
