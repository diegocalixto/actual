import React from 'react';
import type { ReactNode } from 'react';
import { Trans } from 'react-i18next';

import { Text } from '@actual-app/components/text';
import { theme } from '@actual-app/components/theme';
import { View } from '@actual-app/components/view';
import * as monthUtils from '@actual-app/core/shared/months';

import { useLocale } from '#hooks/useLocale';
import { envelopeBudget, trackingBudget } from '#spreadsheet/bindings';

import { HomeAmount } from './HomeAmount';
import { HomeCard } from './HomeCard';
import { HomeSection } from './HomeSection';
import { homeAmountColor, homeLabelStyle } from './homeStyles';
import type { HomeBudgetType } from './useHomeMonth';
import { useHomeSheetCell } from './useHomeSheetCell';

type MonthSummarySectionProps = {
  month: string;
  sheetName: string;
  budgetType: HomeBudgetType;
};

/**
 * Mirrors the `real-saved` cell that tracking budgets publish. Envelope budgets
 * define no net income-minus-spending cell, so the same formula is applied here
 * rather than inventing a different one.
 */
function netOf(income: number | null, spent: number | null) {
  if (income === null || spent === null) {
    return null;
  }
  return income + spent;
}

export function MonthSummarySection({
  month,
  sheetName,
  budgetType,
}: MonthSummarySectionProps) {
  const locale = useLocale();
  const isTracking = budgetType === 'tracking';

  const totalIncome = useHomeSheetCell(
    sheetName,
    isTracking ? trackingBudget.totalIncome : envelopeBudget.totalIncome,
  );
  const totalSpent = useHomeSheetCell(
    sheetName,
    isTracking ? trackingBudget.totalSpent : envelopeBudget.totalSpent,
  );

  // Only tracking budgets expose the net as its own cell, so the read is
  // skipped for envelope budgets.
  const trackingSaved = useHomeSheetCell(
    sheetName,
    isTracking ? trackingBudget.totalSaved : null,
  );

  const result = isTracking ? trackingSaved : netOf(totalIncome, totalSpent);

  return (
    <HomeSection
      title={<Trans>This month</Trans>}
      action={
        <Text style={{ ...homeLabelStyle, fontSize: 12 }}>
          {monthUtils.format(month, "MMMM ''yy", locale)}
        </Text>
      }
    >
      <HomeCard
        style={{
          padding: 18,
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <SummaryTile label={<Trans>Money in</Trans>} value={totalIncome} />
        <SummaryTile label={<Trans>Money out</Trans>} value={totalSpent} />
        <SummaryTile
          label={<Trans>Monthly net</Trans>}
          value={result}
          emphasize
        />
      </HomeCard>
    </HomeSection>
  );
}

type SummaryTileProps = {
  label: ReactNode;
  value: number | null;
  emphasize?: boolean;
};

function SummaryTile({ label, value, emphasize = false }: SummaryTileProps) {
  return (
    <View style={{ flex: '1 1 30%', minWidth: 104, gap: 5 }}>
      <Text style={{ ...homeLabelStyle, fontSize: 12 }}>{label}</Text>
      <HomeAmount
        value={value}
        style={{
          fontSize: emphasize ? 19 : 17,
          fontWeight: emphasize ? 700 : 600,
          color:
            value === null ? theme.pageTextSubdued : homeAmountColor(value),
        }}
      />
    </View>
  );
}
