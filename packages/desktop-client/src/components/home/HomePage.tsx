import React from 'react';
import type { ReactNode } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { useResponsive } from '@actual-app/components/hooks/useResponsive';
import { Text } from '@actual-app/components/text';
import { View } from '@actual-app/components/view';
import * as monthUtils from '@actual-app/core/shared/months';

import {
  shellColors,
  shellEyebrowStyle,
  shellLayout,
} from '#components/appshell/shellTheme';
import { Page } from '#components/Page';
import { useLocale } from '#hooks/useLocale';

import { useHomeMonth } from './useHomeMonth';
import { AccountsCard } from './v2/AccountsCard';
import { AvailableHeroCard } from './v2/AvailableHeroCard';
import { BalanceTrendCard } from './v2/BalanceTrendCard';
import { MonthSummaryCard } from './v2/MonthSummaryCard';
import { RecentActivityCard } from './v2/RecentActivityCard';
import { SectionHeading } from './v2/SectionHeading';
import { SpendingByCategoryCard } from './v2/SpendingByCategoryCard';
import { HomeMobilePage } from './v2mobile/HomeMobilePage';

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

/**
 * The V2 dashboard.
 *
 * Composition only: every figure below arrives from a hook in this folder or
 * from an adapter under `v2/`, and no component rendered here performs a
 * financial calculation. The order answers, in sequence, how much money there
 * is, how the month is going, what can be done next, where the money sits,
 * where it went, where it is heading, and what happened last.
 */
export function HomePage() {
  const { isNarrowWidth } = useResponsive();
  const locale = useLocale();
  const greeting = useGreeting();
  const { month, sheetName, budgetType } = useHomeMonth();

  // The phone gets its own composition, promoted from the approved V2 mobile
  // design. It reads the same hooks this file does, so the two screens can
  // never disagree about a figure; only the arrangement differs.
  if (isNarrowWidth) {
    return (
      <HomeMobilePage
        month={month}
        sheetName={sheetName}
        budgetType={budgetType}
      />
    );
  }

  const monthLabel = (
    <Text style={{ ...shellEyebrowStyle, letterSpacing: 0.4 }}>
      {monthUtils.format(month, "MMMM ''yy", locale)}
    </Text>
  );

  const hero = (
    <AvailableHeroCard sheetName={sheetName} budgetType={budgetType} />
  );
  const monthSummary = (
    <SectionHeading title={<Trans>This month</Trans>} action={monthLabel}>
      <MonthSummaryCard sheetName={sheetName} budgetType={budgetType} />
    </SectionHeading>
  );
  const accounts = <AccountsCard />;
  const spending = (
    <SpendingByCategoryCard sheetName={sheetName} budgetType={budgetType} />
  );
  const trend = <BalanceTrendCard />;
  const recent = <RecentActivityCard />;

  return (
    <Page header={null} padding={0}>
      <View
        style={{
          width: '100%',
          maxWidth: shellLayout.maxContentWidth,
          alignSelf: 'center',
          flexShrink: 0,
          padding: `20px ${shellLayout.desktopGutter}px`,
          paddingBottom: 44,
          gap: shellLayout.desktopStackGap,
        }}
      >
        {/* The rail already names this screen, so the page opens on the
            greeting and gets to the money sooner. */}
        <View style={{ gap: 3, paddingLeft: 2 }}>
          <Text style={shellEyebrowStyle}>{greeting}</Text>
          <Text
            style={{
              fontSize: 21,
              fontWeight: 700,
              letterSpacing: -0.3,
              color: shellColors.textPrimary,
            }}
          >
            <Trans>Overview</Trans>
          </Text>
        </View>

        {/* Two independent columns rather than a shared grid: each column
            stacks at its own rhythm, so a tall card never opens a hole beside
            a short one. The split is weighted so both sides end at roughly the
            same depth with a typical budget. */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-start',
            gap: shellLayout.desktopStackGap,
          }}
        >
          <Column flex={1.25}>
            {hero}
            {accounts}
            {trend}
          </Column>
          <Column flex={1}>
            {monthSummary}
            {spending}
            {recent}
          </Column>
        </View>

        <Text
          style={{
            fontFamily: SIGNATURE_FONT_STACK,
            // Script faces carry a much smaller x-height than Inter, so 12px
            // renders the strokes as a smudge. 16px is the point where the
            // cursive shape reads without competing with the cards above; the
            // V1 signature sat at 18px and read as a heading of its own.
            fontSize: 16,
            fontWeight: 400,
            // Room for the ascenders and descenders a cursive face throws
            // well past its em box.
            lineHeight: 1.5,
            color: shellColors.textSecondary,
            opacity: 0.7,
            textAlign: 'right',
            paddingRight: 2,
          }}
        >
          {SIGNATURE}
        </Text>
      </View>
    </Page>
  );
}

function Column({ flex, children }: { flex: number; children: ReactNode }) {
  return (
    <View
      style={{
        flex: `${flex} 1 0`,
        minWidth: 0,
        gap: shellLayout.desktopStackGap,
      }}
    >
      {children}
    </View>
  );
}
