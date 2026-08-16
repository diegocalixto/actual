import React from 'react';
import type { ReactNode } from 'react';
import { Trans } from 'react-i18next';

import { Text } from '@actual-app/components/text';
import { theme } from '@actual-app/components/theme';
import { View } from '@actual-app/components/view';
import * as monthUtils from '@actual-app/core/shared/months';

import { useLocale } from '#hooks/useLocale';

import { HomeAmount } from './HomeAmount';
import { HomeCard } from './HomeCard';
import { HomeSection } from './HomeSection';
import { homeAmountColor, homeLabelStyle } from './homeStyles';
import { useHomeSheetCell } from './useHomeSheetCell';

type MonthSummarySectionProps = {
  month: string;
  sheetName: string;
};

export function MonthSummarySection({
  month,
  sheetName,
}: MonthSummarySectionProps) {
  const locale = useLocale();

  // `total-income` and `total-spent` exist under the same names for both the
  // envelope and tracking budgets, so no branching is needed here.
  const totalIncome = useHomeSheetCell(sheetName, 'total-income');
  const totalSpent = useHomeSheetCell(sheetName, 'total-spent');

  // Outflows are stored negative, so the period result is a plain sum.
  const result =
    totalIncome === null || totalSpent === null
      ? null
      : totalIncome + totalSpent;

  return (
    <HomeSection
      title={<Trans>Este mês</Trans>}
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
        <SummaryTile label={<Trans>Entradas</Trans>} value={totalIncome} />
        <SummaryTile label={<Trans>Saídas</Trans>} value={totalSpent} />
        <SummaryTile
          label={<Trans>Resultado</Trans>}
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
