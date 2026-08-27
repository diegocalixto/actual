import React from 'react';
import type { ComponentType, ReactNode, SVGProps } from 'react';
import { Trans } from 'react-i18next';

import { Text } from '@actual-app/components/text';
import { View } from '@actual-app/components/view';

import { LabAccounts, LabAccountsTotal } from './LabAccounts';
import { LabHero } from './LabHero';
import { LabMonthSummary } from './LabMonthSummary';
import { LabSection } from './LabPanel';
import { LabRecentActivity } from './LabRecentActivity';
import { LabSpending } from './LabSpending';
import type { LabHue } from './LabTile';

/**
 * The approved Overview, as one composition.
 *
 * This is the only place the screen's structure exists. The laboratory route
 * and the real `/home` both render it — the laboratory feeds it fixtures, the
 * application feeds it its own cells and queries — so the two can differ in
 * what they say and never in how they look. Keeping a second, similar tree for
 * production is what makes designs drift apart, and this file exists to make
 * that impossible.
 *
 * It reads no data of its own and imports no fixtures: everything arrives as
 * `data`, and the tokens it paints with come from whichever class the caller
 * has already put on an ancestor.
 */

export type OverviewIcon = ComponentType<SVGProps<SVGSVGElement>>;

export type OverviewAccountItem = {
  id: string;
  name: string;
  /** Real secondary context only — never invented card metadata. */
  detail: string;
  balance: number;
  Icon: OverviewIcon;
  hue: LabHue;
};

export type OverviewCategoryItem = {
  id: string;
  name: string;
  Icon: OverviewIcon;
  hue: LabHue;
  amount: number;
};

export type OverviewMovementItem = {
  id: string;
  name: string;
  /** Short, already-localised date. */
  when: string;
  Icon: OverviewIcon;
  hue: LabHue;
  amount: number;
};

export type OverviewMonthTotals = {
  income: number;
  spent: number;
  net: number;
  /** Already-localised month label. */
  label: string;
};

export type OverviewViewData = {
  greeting: ReactNode;
  /** `null` while the cell has not resolved — never coerce it to zero. */
  available: number | null;
  /** `null` when the budget type has no such cell, or while loading. */
  toBudget: number | null;
  monthTotals: OverviewMonthTotals | null;
  accounts: OverviewAccountItem[];
  categories: OverviewCategoryItem[];
  movements: OverviewMovementItem[];
  isAccountsLoading: boolean;
  isMonthLoading: boolean;
  isSpendingLoading: boolean;
  isActivityLoading: boolean;
  /** Bottom-right note: the laboratory's caveat, or production's byline. */
  footnote?: ReactNode;
};

export function OverviewView({ data }: { data: OverviewViewData }) {
  return (
    <View
      style={{
        flex: 1,
        overflowY: 'auto',
        backgroundColor: 'var(--dfl-canvas)',
        color: 'var(--dfl-text)',
      }}
    >
      <View
        style={{
          width: '100%',
          maxWidth: 1560,
          alignSelf: 'center',
          flexShrink: 0,
          padding: '26px 40px 56px',
          gap: 26,
        }}
      >
        <View style={{ gap: 4, paddingLeft: 2 }}>
          <Text
            style={{
              fontSize: 11.5,
              fontWeight: 600,
              letterSpacing: 1.2,
              textTransform: 'uppercase',
              color: 'var(--dfl-text-3)',
            }}
          >
            {data.greeting}
          </Text>
          <Text
            style={{
              fontSize: 30,
              fontWeight: 700,
              letterSpacing: -0.8,
              color: 'var(--dfl-text)',
            }}
          >
            <Trans>Overview</Trans>
          </Text>
        </View>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-start',
            gap: 26,
          }}
        >
          {/* Left: the money you have. */}
          <View style={{ flex: '1.05 1 0', minWidth: 0, gap: 26 }}>
            {/* A cell that has not answered is not zero, so the hero waits for
                a real number instead of drawing a false one. */}
            {data.available === null ? (
              <HeroPending />
            ) : (
              <LabHero available={data.available} toBudget={data.toBudget} />
            )}

            <LabSection
              label={<Trans>Accounts</Trans>}
              action={
                data.accounts.length > 0 && (
                  <LabAccountsTotal accounts={data.accounts} />
                )
              }
            >
              {data.accounts.length === 0 ? (
                <EmptyPanel>
                  {data.isAccountsLoading ? (
                    <Trans>Loading accounts…</Trans>
                  ) : (
                    <Trans>No accounts yet.</Trans>
                  )}
                </EmptyPanel>
              ) : (
                <LabAccounts accounts={data.accounts} />
              )}
            </LabSection>
          </View>

          {/* Right: what the month did with it. */}
          <View style={{ flex: '1 1 0', minWidth: 0, gap: 26 }}>
            <LabSection
              label={<Trans>This month</Trans>}
              action={
                <Text
                  style={{
                    fontSize: 11.5,
                    fontWeight: 600,
                    letterSpacing: 1.1,
                    textTransform: 'uppercase',
                    color: 'var(--dfl-text-3)',
                  }}
                >
                  {data.monthTotals?.label ?? ''}
                </Text>
              }
            >
              {data.monthTotals === null ? (
                <EmptyPanel>
                  {data.isMonthLoading ? (
                    <Trans>Loading this month…</Trans>
                  ) : (
                    <Trans>Nothing recorded this month.</Trans>
                  )}
                </EmptyPanel>
              ) : (
                <LabMonthSummary totals={data.monthTotals} />
              )}
            </LabSection>

            <LabSection label={<Trans>Spending this month</Trans>}>
              {data.categories.length === 0 ? (
                <EmptyPanel>
                  {data.isSpendingLoading ? (
                    <Trans>Loading spending…</Trans>
                  ) : (
                    <Trans>No spending recorded this month.</Trans>
                  )}
                </EmptyPanel>
              ) : (
                <LabSpending categories={data.categories} />
              )}
            </LabSection>

            <LabSection label={<Trans>Recent activity</Trans>}>
              {data.movements.length === 0 ? (
                <EmptyPanel>
                  {data.isActivityLoading ? (
                    <Trans>Loading transactions…</Trans>
                  ) : (
                    <Trans>No transactions recorded yet.</Trans>
                  )}
                </EmptyPanel>
              ) : (
                <LabRecentActivity movements={data.movements} />
              )}
            </LabSection>
          </View>
        </View>

        {data.footnote && (
          <Text
            style={{
              fontSize: 11,
              letterSpacing: 0.6,
              color: 'var(--dfl-text-3)',
              textAlign: 'right',
              opacity: 0.7,
            }}
          >
            {data.footnote}
          </Text>
        )}
      </View>
    </View>
  );
}

/**
 * The hero before its cell answers.
 *
 * Same plate, same ramp, same height as the hero it stands in for — only the
 * figure is missing, and an em dash says so. A zero here would be a claim about
 * the balance; this is a claim about the loading state, which is all that is
 * actually known.
 */
function HeroPending() {
  return (
    <View
      style={{
        borderRadius: 'var(--dfl-radius)',
        border: '1px solid var(--dfl-hero-line)',
        boxShadow: 'var(--dfl-shadow-hero)',
        backgroundImage:
          'linear-gradient(118deg, var(--dfl-hero-from) 0%, var(--dfl-hero-to) 62%, #0d1a2e 100%)',
        minHeight: 188,
        justifyContent: 'center',
        padding: '30px 32px 26px',
        gap: 10,
      }}
    >
      <Text
        style={{
          fontSize: 11.5,
          fontWeight: 600,
          letterSpacing: 1.2,
          textTransform: 'uppercase',
          color: 'var(--dfl-text-2)',
        }}
      >
        <Trans>Available balance</Trans>
      </Text>
      <Text
        style={{
          fontSize: 54,
          fontWeight: 700,
          lineHeight: 1.05,
          letterSpacing: -1.6,
          color: 'var(--dfl-text-3)',
        }}
      >
        —
      </Text>
      <Text style={{ fontSize: 13.5, color: 'var(--dfl-text-2)' }}>
        <Trans>Sum of on-budget accounts</Trans>
      </Text>
    </View>
  );
}

/**
 * What a panel shows when it has nothing to show.
 *
 * The same surface, hairline and radius as a filled panel, so a quiet month
 * keeps the page's rhythm — it just says less. No placeholder rows, because a
 * fake row is a claim that data exists.
 */
function EmptyPanel({ children }: { children: ReactNode }) {
  return (
    <View
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 88,
        padding: '22px 24px',
        backgroundColor: 'var(--dfl-surface)',
        border: '1px solid var(--dfl-line)',
        borderRadius: 'var(--dfl-radius)',
        boxShadow: 'var(--dfl-shadow)',
      }}
    >
      <Text style={{ fontSize: 13, color: 'var(--dfl-text-3)' }}>
        {children}
      </Text>
    </View>
  );
}
