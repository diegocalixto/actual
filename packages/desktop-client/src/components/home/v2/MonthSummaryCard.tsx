import React from 'react';
import type { ReactNode } from 'react';
import { Trans } from 'react-i18next';

import { useResponsive } from '@actual-app/components/hooks/useResponsive';
import { View } from '@actual-app/components/view';

import { shellColors } from '#components/appshell/shellTheme';
import type { HomeBudgetType } from '#components/home/useHomeMonth';

import { DashboardCard } from './DashboardCard';
import { MetricTile } from './MetricTile';
import { useMonthTotals } from './useMonthTotals';

type MonthSummaryCardProps = {
  sheetName: string;
  budgetType: HomeBudgetType;
};

/** Money in, money out, and the verdict for the month. */
export function MonthSummaryCard({
  sheetName,
  budgetType,
}: MonthSummaryCardProps) {
  const { isNarrowWidth } = useResponsive();
  const { income, spent, net } = useMonthTotals(sheetName, budgetType);

  return (
    <DashboardCard>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'stretch',
          padding: isNarrowWidth ? '16px 4px' : '20px 6px',
        }}
      >
        <Cell>
          <MetricTile label={<Trans>Money in</Trans>} value={income} />
        </Cell>
        <Divider />
        <Cell>
          <MetricTile label={<Trans>Money out</Trans>} value={spent} />
        </Cell>
        <Divider />
        <Cell>
          <MetricTile
            label={<Trans>Monthly net</Trans>}
            value={net}
            emphasized
          />
        </Cell>
      </View>
    </DashboardCard>
  );
}

function Cell({ children }: { children: ReactNode }) {
  // `flexBasis: 0` lets the three cells share the row evenly however long the
  // formatted amounts turn out to be, instead of the widest one winning.
  // `flex-end` keeps the three amounts on one baseline even when a longer
  // label wraps to two lines in some language at some width — the numbers are
  // what the eye compares, so they are the thing that must stay aligned.
  return (
    <View
      style={{
        flex: '1 1 0',
        minWidth: 0,
        padding: '0 10px',
        justifyContent: 'flex-end',
      }}
    >
      {children}
    </View>
  );
}

function Divider() {
  return (
    <View
      aria-hidden="true"
      style={{
        width: 1,
        flexShrink: 0,
        alignSelf: 'stretch',
        backgroundColor: shellColors.border,
      }}
    />
  );
}
