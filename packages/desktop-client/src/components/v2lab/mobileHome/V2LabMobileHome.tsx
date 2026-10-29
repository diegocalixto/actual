import React from 'react';
import { Trans } from 'react-i18next';

import { Text } from '@actual-app/components/text';
import { View } from '@actual-app/components/view';

import { MobileAccounts } from './MobileAccounts';
import { MobileBottomNav } from './MobileBottomNav';
import { MobileGreeting } from './MobileGreeting';
import * as fixtures from './mobileHomeFixtures';
import { MobileHomeHero } from './MobileHomeHero';
import {
  MOBILE_HOME_ROOT_CLASS,
  MobileHomeStyle,
  mobileLayout,
} from './MobileHomeStyle';
import { MobileMonthSummary } from './MobileMonthSummary';
import { MobileSectionLabel } from './MobileSectionLabel';
import { MobileSpendingPreview } from './MobileSpendingPreview';
import { MobileTopBar } from './MobileTopBar';

/**
 * The proposed mobile Home, as a laboratory route.
 *
 * It reads no data, changes no route and touches nothing outside this folder.
 * The real `/home` — mobile and desktop alike — is untouched by its existence:
 * this is reached by URL only, paints inside its own class, and every figure
 * below is a fixture.
 *
 * The order is an argument. How much money there is, then how the month is
 * going, then where the money sits, then where it went — each section answering
 * the question the one above it raises. Nothing is a card for its own sake.
 */
export function V2LabMobileHome() {
  return (
    <View
      className={MOBILE_HOME_ROOT_CLASS}
      style={{
        position: 'relative',
        flex: 1,
        minHeight: 0,
        // See `reservedHeaderHeight`: covers the shell's empty header strip so
        // the design starts at the top of the screen, as the proposal draws it.
        marginTop: -mobileLayout.reservedHeaderHeight,
        backgroundColor: 'var(--dfl-canvas)',
        color: 'var(--dfl-text)',
      }}
    >
      <MobileHomeStyle />
      <MobileTopBar />

      <View
        style={{
          flexShrink: 0,
          padding: `14px ${mobileLayout.gutter}px`,
          // Clears the bar, which is drawn over the page rather than in it.
          paddingBottom: mobileLayout.navHeight + 28,
          gap: mobileLayout.stackGap,
        }}
      >
        <MobileGreeting />

        <MobileHomeHero
          available={fixtures.available}
          toDistribute={fixtures.toDistribute}
        />

        <View style={{ gap: 10 }}>
          <MobileSectionLabel
            label={<Trans>Este mês</Trans>}
            trailing={
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: 1,
                  whiteSpace: 'nowrap',
                  color: 'var(--dfl-text-3)',
                }}
              >
                {fixtures.monthLabel}
              </Text>
            }
          />
          <MobileMonthSummary
            income={fixtures.income}
            outflow={fixtures.outflow}
            net={fixtures.monthNet}
          />
        </View>

        <MobileAccounts
          total={fixtures.accountsTotal}
          groups={fixtures.accountGroups}
        />

        <MobileSpendingPreview
          total={fixtures.spendingTotal}
          category={fixtures.topSpendingCategory}
        />
      </View>

      <MobileBottomNav />
    </View>
  );
}
