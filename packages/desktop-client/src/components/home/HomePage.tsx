import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { useResponsive } from '@actual-app/components/hooks/useResponsive';
import { Text } from '@actual-app/components/text';
import { theme } from '@actual-app/components/theme';
import { View } from '@actual-app/components/view';

import { MobilePageHeader, Page } from '#components/Page';

import { AccountsSection } from './AccountsSection';
import { AvailableCard } from './AvailableCard';
import { CategorySpendingSection } from './CategorySpendingSection';
import { HomeQuickLinks } from './HomeQuickLinks';
import { homeLabelStyle, homeLayout } from './homeStyles';
import { MonthSummarySection } from './MonthSummarySection';
import { RecentTransactionsSection } from './RecentTransactionsSection';
import { useHomeMonth } from './useHomeMonth';

function useGreeting() {
  const { t } = useTranslation();
  const hour = new Date().getHours();

  if (hour < 12) {
    return t('Bom dia');
  }
  if (hour < 18) {
    return t('Boa tarde');
  }
  return t('Boa noite');
}

export function HomePage() {
  const { isNarrowWidth } = useResponsive();
  const greeting = useGreeting();
  const { month, sheetName, budgetType } = useHomeMonth();

  return (
    <Page
      header={
        isNarrowWidth ? (
          <MobilePageHeader title={<Trans>Visão geral</Trans>} />
        ) : null
      }
      padding={0}
    >
      <View
        style={{
          width: '100%',
          maxWidth: homeLayout.maxContentWidth,
          alignSelf: 'center',
          padding: `${isNarrowWidth ? 16 : 24}px ${homeLayout.gutter}px 48px`,
          gap: homeLayout.sectionGap,
        }}
      >
        <View style={{ gap: 2, paddingLeft: 4 }}>
          <Text style={homeLabelStyle}>{greeting}</Text>
          {!isNarrowWidth && (
            <Text
              style={{
                fontSize: 28,
                fontWeight: 700,
                letterSpacing: -0.4,
                color: theme.pageText,
              }}
            >
              <Trans>Visão geral</Trans>
            </Text>
          )}
        </View>

        <AvailableCard sheetName={sheetName} budgetType={budgetType} />

        <HomeQuickLinks />

        <MonthSummarySection month={month} sheetName={sheetName} />

        <AccountsSection />

        <CategorySpendingSection
          sheetName={sheetName}
          budgetType={budgetType}
        />

        <RecentTransactionsSection />
      </View>
    </Page>
  );
}
