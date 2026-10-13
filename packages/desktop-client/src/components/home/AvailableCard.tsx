import React from 'react';
import type { ReactNode } from 'react';
import { Trans } from 'react-i18next';

import { Text } from '@actual-app/components/text';
import { theme } from '@actual-app/components/theme';
import { View } from '@actual-app/components/view';

import { useSheetValue } from '#hooks/useSheetValue';
import * as bindings from '#spreadsheet/bindings';
import { envelopeBudget } from '#spreadsheet/bindings';

import { HomeAmount } from './HomeAmount';
import { HomeCard } from './HomeCard';
import { homeAmountColor, homeLabelStyle } from './homeStyles';
import type { HomeBudgetType } from './useHomeMonth';
import { useHomeSheetCell } from './useHomeSheetCell';

type AvailableCardProps = {
  sheetName: string;
  budgetType: HomeBudgetType;
};

export function AvailableCard({ sheetName, budgetType }: AvailableCardProps) {
  const onBudgetBalance = useSheetValue<'account', 'onbudget-accounts-balance'>(
    bindings.onBudgetAccountBalance(),
  );
  const offBudgetBalance = useSheetValue<
    'account',
    'offbudget-accounts-balance'
  >(bindings.offBudgetAccountBalance());
  const totalBalance = useSheetValue<'account', 'accounts-balance'>(
    bindings.allAccountBalance(),
  );

  // Tracking budgets have no "to budget" cell, so the read is skipped there.
  const toBudget = useHomeSheetCell(
    sheetName,
    budgetType === 'envelope' ? envelopeBudget.toBudget : null,
  );

  return (
    <HomeCard style={{ padding: 0 }}>
      <View
        style={{
          padding: '24px 24px 20px',
          flexShrink: 0,
          gap: 8,
        }}
      >
        <Text style={homeLabelStyle}>
          <Trans>Available</Trans>
        </Text>

        <View
          style={{
            minHeight: 44,
            justifyContent: 'center',
            flexShrink: 0,
            paddingTop: 2,
            paddingBottom: 2,
          }}
        >
          <HomeAmount
            value={onBudgetBalance}
            style={{
              fontSize: 38,
              fontWeight: 700,
              lineHeight: 1.2,
              letterSpacing: -0.5,
              color:
                onBudgetBalance === null
                  ? theme.pageTextSubdued
                  : homeAmountColor(onBudgetBalance),
            }}
          />
        </View>

        <Text
          style={{
            ...homeLabelStyle,
            fontSize: 12,
            lineHeight: 1.4,
            marginTop: 2,
          }}
        >
          <Trans>Sum of on-budget accounts</Trans>
        </Text>
      </View>

      <View
        aria-hidden="true"
        style={{
          height: 1,
          flexShrink: 0,
          marginLeft: 24,
          marginRight: 24,
          backgroundColor: theme.tableBorder,
        }}
      />

      <View
        style={{
          padding: '20px 24px 24px',
          flexShrink: 0,
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 20,
          rowGap: 16,
        }}
      >
        {budgetType === 'envelope' && (
          <HeroStat label={<Trans>To Budget</Trans>} value={toBudget} />
        )}
        <HeroStat label={<Trans>Off budget</Trans>} value={offBudgetBalance} />
        <HeroStat label={<Trans>Total balance</Trans>} value={totalBalance} />
      </View>
    </HomeCard>
  );
}

type HeroStatProps = {
  label: ReactNode;
  value: number | null;
};

function HeroStat({ label, value }: HeroStatProps) {
  return (
    <View
      style={{
        flex: '1 1 calc(50% - 10px)',
        minWidth: 120,
        gap: 6,
        flexShrink: 0,
      }}
    >
      <Text style={{ ...homeLabelStyle, fontSize: 12, lineHeight: 1.35 }}>
        {label}
      </Text>
      <HomeAmount
        value={value}
        style={{
          fontSize: 16,
          fontWeight: 600,
          lineHeight: 1.25,
          color:
            value === null ? theme.pageTextSubdued : homeAmountColor(value),
        }}
      />
    </View>
  );
}
