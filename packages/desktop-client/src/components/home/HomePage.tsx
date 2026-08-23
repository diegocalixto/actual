import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { useResponsive } from '@actual-app/components/hooks/useResponsive';
import { Text } from '@actual-app/components/text';
import { theme } from '@actual-app/components/theme';
import { View } from '@actual-app/components/view';

import { MOBILE_NAV_HEIGHT } from '#components/mobile/MobileNavTabs';
import { MobilePageHeader, Page } from '#components/Page';

import { AccountsSection } from './AccountsSection';
import { AvailableCard } from './AvailableCard';
import { CategorySpendingSection } from './CategorySpendingSection';
import { HomeQuickLinks } from './HomeQuickLinks';
import { homeLabelStyle, homeLayout } from './homeStyles';
import { MonthSummarySection } from './MonthSummarySection';
import { RecentTransactionsSection } from './RecentTransactionsSection';
import { useHomeMonth } from './useHomeMonth';

/**
 * Signature of this fork. A person's name, so it is never translated and never
 * an interactive element — it only marks who this build belongs to.
 */
const SIGNATURE = 'Diego Calixto';

/**
 * No script face is bundled with the app — the only webfonts it ships are Inter
 * and Redacted Script, and the latter draws blocks instead of letters. So the
 * signature leans on the script faces the operating system already installs,
 * ordered macOS first, then Windows, then the ghostscript ones on Linux, with
 * the generic `cursive` keyword as the last resort. Nothing here is downloaded.
 */
const SIGNATURE_FONT_STACK = [
  'Snell Roundhand',
  'Apple Chancery',
  'Segoe Script',
  'Brush Script MT',
  'Lucida Handwriting',
  'URW Chancery L',
  'Z003',
  'cursive',
]
  .map(family => (family === 'cursive' ? family : `'${family}'`))
  .join(', ');

function useGreeting() {
  const { t } = useTranslation();
  const hour = new Date().getHours();

  if (hour < 12) {
    return t('Good morning');
  }
  if (hour < 18) {
    return t('Good afternoon');
  }
  return t('Good evening');
}

export function HomePage() {
  const { isNarrowWidth } = useResponsive();
  const greeting = useGreeting();
  const { month, sheetName, budgetType } = useHomeMonth();

  return (
    <Page
      header={
        isNarrowWidth ? (
          <MobilePageHeader title={<Trans>Overview</Trans>} />
        ) : null
      }
      padding={0}
    >
      <View
        style={{
          width: '100%',
          maxWidth: homeLayout.maxContentWidth,
          alignSelf: 'center',
          flexShrink: 0,
          // The mobile nav bar is fixed and overlays the page, so the bottom
          // padding has to clear it. It is hidden on desktop.
          padding: `${isNarrowWidth ? 16 : 24}px ${homeLayout.gutter}px ${
            isNarrowWidth ? MOBILE_NAV_HEIGHT : 48
          }px`,
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
              <Trans>Overview</Trans>
            </Text>
          )}
        </View>

        <AvailableCard sheetName={sheetName} budgetType={budgetType} />

        <HomeQuickLinks />

        <MonthSummarySection
          month={month}
          sheetName={sheetName}
          budgetType={budgetType}
        />

        <AccountsSection />

        <CategorySpendingSection
          sheetName={sheetName}
          budgetType={budgetType}
        />

        <RecentTransactionsSection />

        <Text
          style={{
            fontFamily: SIGNATURE_FONT_STACK,
            // Script faces carry a much smaller x-height than Inter, so 12px
            // renders the strokes as a smudge. 18px is the point where the
            // cursive shape reads without competing with the cards above.
            fontSize: 18,
            fontWeight: 400,
            // Room for the ascenders and descenders a cursive face throws
            // well past its em box.
            lineHeight: 1.5,
            // pageText is the near-white tone in the dark themes and the dark
            // ink tone in the light one, so the signature keeps its contrast
            // either way. The hairlines of a script face need that headroom;
            // the opacity is what pulls it back to something discreet.
            color: theme.pageText,
            opacity: 0.75,
            textAlign: 'right',
            paddingRight: 4,
          }}
        >
          {SIGNATURE}
        </Text>
      </View>
    </Page>
  );
}
