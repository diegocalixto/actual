import React from 'react';
import { Trans } from 'react-i18next';

import { Text } from '@actual-app/components/text';
import { View } from '@actual-app/components/view';

import type { HomeBudgetType } from '#components/home/useHomeMonth';
import { BalanceTrendCard } from '#components/home/v2/BalanceTrendCard';
import { RecentActivityCard } from '#components/home/v2/RecentActivityCard';
import { MOBILE_NAV_SPACER } from '#components/mobile/MobileNavTabs';
import { MobilePageHeader, Page } from '#components/Page';

import { useHomeBalances, useMonthTotals } from './homeData';
import { HomeMobileAccounts } from './HomeMobileAccounts';
import { HomeMobileGreeting } from './HomeMobileGreeting';
import { HomeMobileHero } from './HomeMobileHero';
import { HomeMobileMonthSummary } from './HomeMobileMonthSummary';
import { HomeMobileSectionLabel } from './HomeMobileSectionLabel';
import { HomeMobileSpending } from './HomeMobileSpending';
import {
  chromeCanvas,
  chromeLine,
  HOME_MOBILE_ROOT_CLASS,
  HomeMobileStyle,
  mobileLayout,
} from './HomeMobileStyle';

/** Signature of this fork. A person's name, so it is never translated. */
const SIGNATURE = 'Diego Calixto';

/**
 * The script faces the operating system already installs — no webfont is
 * downloaded for this, and the app bundles none that would do. macOS first,
 * then Windows, then the ghostscript ones on Linux, with the generic keyword
 * last. Kept identical to the signature the previous Home drew.
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

type HomeMobilePageProps = {
  /** `YYYY-MM`, resolved once by the page above so nothing here re-derives it. */
  month: string;
  sheetName: string;
  budgetType: HomeBudgetType;
};

/**
 * The Home, on a phone.
 *
 * Composition only: every figure arrives from a hook under `home/`, and nothing
 * rendered here performs a financial calculation. The order is an argument —
 * how much money there is, then how the month is going, then where the money
 * sits, then where it went — each section answering the question the one above
 * it raises.
 *
 * Below the approved fold the previous Home's trend and activity cards are
 * kept as they are. They are real, they work, and this round was asked to
 * promote an appearance, not to redesign the whole screen; leaving them intact
 * costs a visible change of surface treatment halfway down and loses no
 * function, which is the right way round.
 */
export function HomeMobilePage({
  month,
  sheetName,
  budgetType,
}: HomeMobilePageProps) {
  const { onBudget, offBudget, total, toBudget } = useHomeBalances(
    sheetName,
    budgetType,
  );
  const { income, spent, net } = useMonthTotals(sheetName, budgetType);

  return (
    <Page
      header={
        <MobilePageHeader
          title={<Trans>Início</Trans>}
          // The header is portalled into the shell's slot, outside this page's
          // class, so it is painted with the scope's literals rather than its
          // tokens. Without this it keeps the shell's lighter grey and draws a
          // band across the top of the design.
          style={{
            backgroundColor: chromeCanvas,
            borderBottom: `1px solid ${chromeLine}`,
          }}
        />
      }
      padding={0}
      style={{ backgroundColor: chromeCanvas }}
    >
      <View
        className={HOME_MOBILE_ROOT_CLASS}
        style={{
          width: '100%',
          flexShrink: 0,
          padding: `14px ${mobileLayout.gutter}px`,
          // The bar is fixed and overlays the page, so the bottom padding has
          // to clear it — and, on an iPhone, the home indicator under it.
          paddingBottom: MOBILE_NAV_SPACER,
          gap: mobileLayout.stackGap,
          backgroundColor: 'var(--dfl-canvas)',
          color: 'var(--dfl-text)',
        }}
      >
        <HomeMobileStyle />

        <HomeMobileGreeting hour={new Date().getHours()} />

        <HomeMobileHero
          available={onBudget}
          toBudget={toBudget}
          budgetType={budgetType}
        />

        <View style={{ gap: 10 }}>
          <HomeMobileSectionLabel
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
                {formatMonthLabel(month)}
              </Text>
            }
          />
          <HomeMobileMonthSummary income={income} spent={spent} net={net} />
        </View>

        <HomeMobileAccounts
          onBudget={onBudget}
          offBudget={offBudget}
          total={total}
        />

        <HomeMobileSpending sheetName={sheetName} budgetType={budgetType} />

        <BalanceTrendCard />
        <RecentActivityCard />

        <Text
          style={{
            fontFamily: SIGNATURE_FONT_STACK,
            // Script faces carry a much smaller x-height than Inter, so 12px
            // renders the strokes as a smudge. 16px is where the cursive shape
            // reads without competing with the cards above it.
            fontSize: 16,
            fontWeight: 400,
            // Room for the ascenders and descenders a cursive face throws well
            // past its em box.
            lineHeight: 1.5,
            color: 'var(--dfl-text-3)',
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

/**
 * "AGOSTO • 2026", from the month the page is actually showing.
 *
 * Formatted in pt-BR to match the rest of this screen's presentation, and
 * derived from the real month every time — nothing about the date is written
 * down here.
 */
function formatMonthLabel(month: string): string {
  const [year, monthNumber] = month.split('-');
  const name = new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(
    new Date(Number(year), Number(monthNumber) - 1, 1),
  );
  return `${name.toLocaleUpperCase('pt-BR')} • ${year}`;
}
