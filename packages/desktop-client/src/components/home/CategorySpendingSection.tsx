import React from 'react';
import { Trans } from 'react-i18next';

import { Text } from '@actual-app/components/text';
import { TextOneLine } from '@actual-app/components/text-one-line';
import { theme } from '@actual-app/components/theme';
import { View } from '@actual-app/components/view';

import { HomeAmount } from './HomeAmount';
import { HomeCard } from './HomeCard';
import { HomeSection } from './HomeSection';
import { homeLabelStyle } from './homeStyles';
import type { HomeCategorySpending } from './useHomeCategorySpending';
import { useHomeCategorySpending } from './useHomeCategorySpending';
import type { HomeBudgetType } from './useHomeMonth';

type CategorySpendingSectionProps = {
  sheetName: string;
  budgetType: HomeBudgetType;
};

export function CategorySpendingSection({
  sheetName,
  budgetType,
}: CategorySpendingSectionProps) {
  const { categories, totalSpent } = useHomeCategorySpending({
    sheetName,
    budgetType,
  });

  const largestSpend =
    categories.length > 0 ? Math.abs(categories[0].amount) : 0;

  return (
    <HomeSection
      title={<Trans>Gastos por categoria</Trans>}
      action={
        categories.length > 0 ? (
          <HomeAmount
            value={totalSpent}
            style={{ ...homeLabelStyle, fontSize: 12 }}
          />
        ) : null
      }
    >
      <HomeCard style={{ padding: categories.length > 0 ? 6 : 0 }}>
        {categories.length === 0 ? (
          <View style={{ padding: 24, alignItems: 'center' }}>
            <Text style={{ ...homeLabelStyle, textAlign: 'center' }}>
              <Trans>Nenhum gasto registrado neste mês.</Trans>
            </Text>
          </View>
        ) : (
          categories.map(entry => (
            <CategoryRow
              key={entry.category.id}
              entry={entry}
              largestSpend={largestSpend}
            />
          ))
        )}
      </HomeCard>
    </HomeSection>
  );
}

type CategoryRowProps = {
  entry: HomeCategorySpending;
  largestSpend: number;
};

function CategoryRow({ entry, largestSpend }: CategoryRowProps) {
  const share = largestSpend > 0 ? Math.abs(entry.amount) / largestSpend : 0;

  return (
    <View style={{ padding: '10px 12px', gap: 8 }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <TextOneLine style={{ fontSize: 14, fontWeight: 500 }}>
          {entry.category.name}
        </TextOneLine>
        <HomeAmount
          value={entry.amount}
          style={{ fontSize: 14, fontWeight: 600, color: theme.pageText }}
        />
      </View>

      <View
        aria-hidden="true"
        style={{
          height: 5,
          borderRadius: 999,
          backgroundColor: theme.pillBackground,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            width: `${Math.max(share * 100, 4)}%`,
            height: '100%',
            borderRadius: 999,
            backgroundColor: theme.pageTextPositive,
          }}
        />
      </View>
    </View>
  );
}
