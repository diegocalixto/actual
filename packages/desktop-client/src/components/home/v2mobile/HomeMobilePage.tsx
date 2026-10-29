import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { Text } from '@actual-app/components/text';
import { View } from '@actual-app/components/view';

import type { HomeBudgetType } from '#components/home/useHomeMonth';
import { useHomeSheetCell } from '#components/home/useHomeSheetCell';
import { BalanceTrendCard } from '#components/home/v2/BalanceTrendCard';
import { RecentActivityCard } from '#components/home/v2/RecentActivityCard';
import { MOBILE_NAV_SPACER } from '#components/mobile/MobileNavTabs';
import { MobilePrivacyToggle } from '#components/mobile/MobilePrivacyToggle';
import {
  mobileHeaderIconButtonStyle,
  MobilePageHeader,
  Page,
} from '#components/Page';
import { useRegionalFormatKey } from '#components/v2lab/LabStyle';
import { useOpenIndicatorTransactions } from '#reports/useOpenIndicatorTransactions';
import { envelopeBudget, trackingBudget } from '#spreadsheet/bindings';

import {
  useAccountBalances,
  useCardInsightsByAccount,
  useHomeAccounts,
  useHomeBalances,
  useMonthTotals,
  useSyncFreshness,
} from './homeData';
import { HomeMobileAccounts } from './HomeMobileAccounts';
import { HomeMobileAttention } from './HomeMobileAttention';
import { HomeMobileGreeting } from './HomeMobileGreeting';
import { HomeMobileHero } from './HomeMobileHero';
import { HomeMobileMonthSummary } from './HomeMobileMonthSummary';
import { HomeMobileSectionLabel } from './HomeMobileSectionLabel';
import { HomeMobileSpending } from './HomeMobileSpending';
import {
  chromeAccent,
  chromeCanvas,
  chromeInk,
  chromeLine,
  HOME_MOBILE_LEGACY_SCOPE_CLASS,
  HOME_MOBILE_ROOT_CLASS,
  HomeMobileStyle,
  mobileLayout,
} from './HomeMobileStyle';
import { HomeMobileSubscriptions } from './HomeMobileSubscriptions';

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
 * how much money there is, then how the month is going, then where it went,
 * and only then where the rest of it sits — because the question this screen
 * is opened for is how much was spent and on what. The accounts already have
 * a screen of their own one tab away.
 *
 * Below the approved fold the previous Home's trend and activity cards are
 * kept as they are. They are real, they work, and this round was asked to
 * promote an appearance, not to redesign the whole screen. They are mounted
 * inside `HOME_MOBILE_LEGACY_SCOPE_CLASS`, which gives them this page's dark
 * surface and section label instead of the app theme's.
 */
export function HomeMobilePage({
  month,
  sheetName,
  budgetType,
}: HomeMobilePageProps) {
  const { t } = useTranslation();
  // Redrawn whole when the file's number format or currency changes.
  const regionalFormat = useRegionalFormatKey();
  const { onBudget, offBudget, total } = useHomeBalances(sheetName, budgetType);
  const { income, spent, net, details } = useMonthTotals(month);
  const openTransactions = useOpenIndicatorTransactions();
  // Whether the month has a plan at all, from the engine's own total: the
  // "over budget" line is only drawn when there is a budget to be over.
  const totalBudgeted = useHomeSheetCell(
    sheetName,
    budgetType === 'envelope'
      ? envelopeBudget.totalBudgeted
      : trackingBudget.totalBudgetedExpense,
  );
  const hasPlan = totalBudgeted !== null && totalBudgeted !== 0;

  // What the bank's own data adds: which on-budget accounts are cards and what
  // their open bills hold, and when the bank was last read. The page composes;
  // the reading is in `accounts/bankData`.
  const { accounts } = useHomeAccounts();
  const accountEntities = accounts.map(entry => entry.account);
  const cards = useCardInsightsByAccount(accountEntities);
  const freshness = useSyncFreshness();
  const cardAccounts = accounts.filter(
    entry =>
      entry.kind === 'onBudget' &&
      cards.cardAccountIds.includes(entry.account.id),
  );
  const cardBalances = useAccountBalances(
    cardAccounts.map(entry => entry.account.id),
  );
  // The hero's headline already nets the cards out; this says by how much.
  // Stated only when the data proves a card exists and every card balance has
  // resolved, so the two figures always add up to the headline.
  const cardsDebt =
    cardAccounts.length > 0 &&
    cardAccounts.every(
      entry => typeof cardBalances[entry.account.id] === 'number',
    )
      ? cardAccounts.reduce(
          (sum, entry) => sum + (cardBalances[entry.account.id] ?? 0),
          0,
        )
      : null;

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
          // The ground is this page's own, so the ink has to be too.
          ink={chromeInk}
          rightContent={
            <MobilePrivacyToggle
              style={mobileHeaderIconButtonStyle}
              accent={chromeAccent}
            />
          }
        />
      }
      padding={0}
      style={{ backgroundColor: chromeCanvas }}
    >
      <View
        key={regionalFormat}
        className={HOME_MOBILE_ROOT_CLASS}
        style={{
          width: '100%',
          flexShrink: 0,
          padding: `14px ${mobileLayout.gutter}px`,
          // The bar is fixed and overlays the page, so the bottom padding has
          // to clear it — and, on an iPhone, the home indicator under it. The
          // extra room is the Budget's, so the three pages end the same
          // distance above the bar.
          paddingBottom: `calc(${MOBILE_NAV_SPACER} + 14px)`,
          gap: mobileLayout.stackGap,
          backgroundColor: 'var(--dfl-canvas)',
          color: 'var(--dfl-text)',
        }}
      >
        <HomeMobileStyle />

        <HomeMobileGreeting hour={new Date().getHours()} />

        <HomeMobileHero
          available={onBudget}
          cardsDebt={cardsDebt}
          lastBankRead={freshness.latestSync}
        />

        <HomeMobileAttention
          month={month}
          details={details}
          accounts={accounts}
          cards={cards}
          freshness={freshness}
          hasPlan={hasPlan}
          onOpenUncategorized={() =>
            openTransactions(
              month,
              { kind: 'uncategorizedSpending' },
              t('Uncategorized spending'),
            )
          }
          onOpenPendingInflows={() =>
            openTransactions(
              month,
              { kind: 'pendingInflows' },
              t('Inflows to review'),
            )
          }
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
          {/* Inflows to review are listed under "Precisa de atenção" above;
              the summary keeps only what explains its own figures. */}
          <HomeMobileMonthSummary
            income={income}
            spent={spent}
            net={net}
            details={details}
            hidePendingInflows
          />
        </View>

        <HomeMobileSpending
          month={month}
          onOpenEntry={entry =>
            openTransactions(
              month,
              entry.isUncategorized
                ? { kind: 'uncategorizedSpending' }
                : { kind: 'category', categoryId: entry.category.id },
              entry.isUncategorized
                ? t('Uncategorized spending')
                : entry.category.name,
            )
          }
        />

        <HomeMobileSubscriptions />

        <HomeMobileAccounts
          onBudget={onBudget}
          offBudget={offBudget}
          total={total}
          cards={cards}
        />

        {/* The previous Home's two cards paint with the app theme, which is
            white under a light appearance; this scope hands them the page's
            own dark ground and ink. */}
        <View
          className={HOME_MOBILE_LEGACY_SCOPE_CLASS}
          style={{ gap: mobileLayout.stackGap }}
        >
          <BalanceTrendCard />
          <RecentActivityCard />
        </View>

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
