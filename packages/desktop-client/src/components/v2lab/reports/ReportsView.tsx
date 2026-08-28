import React from 'react';
import type { ReactNode } from 'react';
import { Trans } from 'react-i18next';

import { SvgCalendar3, SvgFilter2 } from '@actual-app/components/icons/v2';
import { Text } from '@actual-app/components/text';
import { View } from '@actual-app/components/view';

import { LabPill } from './LabPill';
import { ReportsCategoryDonut } from './ReportsCategoryDonut';
import type { DayPoint, ExpenseCategory } from './reportsFixtures';
import { ReportsHeroChart } from './ReportsHeroChart';
import { ReportsInsights } from './ReportsInsights';
import { ReportsKpis } from './ReportsKpis';
import { ReportsMonthlyComparison } from './ReportsMonthlyComparison';
import { ReportsTopCategories } from './ReportsTopCategories';

export type { DayPoint, ExpenseCategory } from './reportsFixtures';
export type { CategoryHue } from './reportsTokens';

/**
 * The approved Reports, as one composition.
 *
 * This is the only place the screen's structure exists. The laboratory feeds it
 * fixtures and the real `/reports` feeds it the application's own queries, so
 * the two can differ in what they say and never in how they look.
 *
 * It runs no query and imports no fixture values — everything arrives as
 * `data`, and the tokens it paints with come from whichever class the caller
 * has already put on an ancestor.
 */

type Comparison = {
  average: number;
  /** `null` when the base is not positive; the chip is then omitted. */
  change: number | null;
  spark: number[];
};

export type ReportsViewData = {
  greeting: ReactNode;
  periodLabel: string;
  scopeLabel: string;
  previousPeriodLabel: string;
  kpis: {
    income: { value: number; change: number | null };
    expenses: { value: number; change: number | null };
    net: { value: number; change: number | null };
    savingsRate: { value: number; points: number | null };
  };
  series: DayPoint[];
  axisMin: number;
  axisMax: number;
  axisTicks: number[];
  xTicks: number[];
  totals: { income: number; expenses: number; net: number };
  defaultHoverIndex: number;
  /** How to write an x-axis tick. Absent ⇒ the laboratory's fixed month. */
  formatXTick?: (day: number) => string;
  categories: (ExpenseCategory & { share: number })[];
  monthly: { income: Comparison; expenses: Comparison; net: Comparison };
  monthCount: number;
  /** Absent ⇒ the panel is omitted, which is what happens without a full history. */
  insights?: {
    netChange: number;
    savingsRate: number;
    topCategory: { name: string; vsPriorAverage: number };
  };
  isLoading: boolean;
  /** Bottom-right note: the laboratory's caveat, or production's byline. */
  footnote?: ReactNode;
};

export function ReportsView({ data }: { data: ReportsViewData }) {
  const hasSeries = data.series.length > 1;
  const hasCategories = data.categories.length > 0;

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
          maxWidth: 1620,
          alignSelf: 'center',
          flexShrink: 0,
          padding: '16px 36px 14px',
          gap: 15,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: 20,
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
              <Trans>Reports</Trans>
            </Text>
            <Text style={{ fontSize: 13.5, color: 'var(--dfl-text-2)' }}>
              <Trans>
                Analyze your financial performance and discover insights to make
                better decisions.
              </Trans>
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <LabPill Icon={SvgCalendar3}>{data.periodLabel}</LabPill>
            <LabPill Icon={SvgFilter2}>{data.scopeLabel}</LabPill>
          </View>
        </View>

        <ReportsKpis
          kpis={data.kpis}
          previousPeriodLabel={data.previousPeriodLabel}
        />

        <View
          style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 16 }}
        >
          {/* Left, and dominant: how the period unfolded. */}
          <View style={{ flex: '1.62 1 0', minWidth: 0, gap: 16 }}>
            {hasSeries ? (
              <ReportsHeroChart
                series={data.series}
                axisMin={data.axisMin}
                axisMax={data.axisMax}
                axisTicks={data.axisTicks}
                xTicks={data.xTicks}
                totals={data.totals}
                defaultHoverIndex={data.defaultHoverIndex}
                formatXTick={data.formatXTick}
              />
            ) : (
              <EmptyPanel minHeight={420}>
                {data.isLoading ? (
                  <Trans>Loading the period…</Trans>
                ) : (
                  <Trans>No transactions in this period.</Trans>
                )}
              </EmptyPanel>
            )}

            {hasCategories ? (
              <ReportsTopCategories categories={data.categories} />
            ) : (
              <EmptyPanel>
                {data.isLoading ? (
                  <Trans>Loading categories…</Trans>
                ) : (
                  <Trans>No spending recorded in this period.</Trans>
                )}
              </EmptyPanel>
            )}
          </View>

          {/* Right: the same period, read other ways. */}
          <View style={{ flex: '1 1 0', minWidth: 0, gap: 16 }}>
            {hasCategories ? (
              <ReportsCategoryDonut
                categories={data.categories}
                total={data.totals.expenses}
              />
            ) : (
              <EmptyPanel>
                {data.isLoading ? (
                  <Trans>Loading categories…</Trans>
                ) : (
                  <Trans>No spending to break down.</Trans>
                )}
              </EmptyPanel>
            )}

            <ReportsMonthlyComparison
              monthly={data.monthly}
              monthCount={data.monthCount}
            />

            {/* Only when every figure behind it is real. */}
            {data.insights && (
              <ReportsInsights
                netChange={data.insights.netChange}
                savingsRate={data.insights.savingsRate}
                topCategory={data.insights.topCategory}
              />
            )}
          </View>
        </View>

        {data.footnote && (
          <Text
            style={{
              fontSize: 11,
              letterSpacing: 0.6,
              textAlign: 'right',
              opacity: 0.7,
              color: 'var(--dfl-text-3)',
            }}
          >
            {data.footnote}
          </Text>
        )}
      </View>
    </View>
  );
}

/** What a panel shows when it has nothing to show. */
function EmptyPanel({
  children,
  minHeight = 120,
}: {
  children: ReactNode;
  minHeight?: number;
}) {
  return (
    <View
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        minHeight,
        padding: '22px 24px',
        backgroundColor: 'var(--dfl-surface-raised)',
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
