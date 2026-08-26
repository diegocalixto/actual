import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { SvgCalendar3, SvgFilter2 } from '@actual-app/components/icons/v2';
import { Text } from '@actual-app/components/text';
import { View } from '@actual-app/components/view';

import { LabPill } from './LabPill';
import { ReportsCategoryDonut } from './ReportsCategoryDonut';
import {
  defaultHoverIndex,
  kpis,
  monthly,
  rankedCategories,
  topCategory,
} from './reportsDerived';
import {
  axisMax,
  axisMin,
  axisTicks,
  months,
  periodLabel,
  previousPeriodLabel,
  scopeLabel,
  series,
  totals,
  xTicks,
} from './reportsFixtures';
import { ReportsHeroChart } from './ReportsHeroChart';
import { ReportsInsights } from './ReportsInsights';
import { ReportsKpis } from './ReportsKpis';
import { ReportsMonthlyComparison } from './ReportsMonthlyComparison';
import { ReportsTopCategories } from './ReportsTopCategories';

/**
 * Visual laboratory for Reports, desktop only.
 *
 * Renders inside the approved shell at `/v2-lab/reports`, so the page can be
 * judged against the rail and header already published. The real `/reports`
 * route is untouched and this one is absent from every navigation.
 *
 * `reportsFixtures` writes down three things — daily income, daily expenses and
 * six monthly closes — and `reportsDerived` turns them into everything on
 * screen. No component restates a figure, so the KPIs, the curve, the totals
 * under it, the donut, the averages and the insights cannot drift apart.
 * Nothing is written, queried, persisted or synced.
 */
export function V2LabReports() {
  const { t } = useTranslation();

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
              <Trans>Good afternoon</Trans>
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
            <LabPill Icon={SvgCalendar3}>{periodLabel}</LabPill>
            <LabPill Icon={SvgFilter2}>{scopeLabel}</LabPill>
          </View>
        </View>

        <ReportsKpis kpis={kpis} previousPeriodLabel={previousPeriodLabel} />

        <View
          style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 16 }}
        >
          {/* Left, and dominant: how the period unfolded. */}
          <View style={{ flex: '1.62 1 0', minWidth: 0, gap: 16 }}>
            <ReportsHeroChart
              series={series}
              axisMin={axisMin}
              axisMax={axisMax}
              axisTicks={axisTicks}
              xTicks={xTicks}
              totals={totals}
              defaultHoverIndex={defaultHoverIndex}
            />
            <ReportsTopCategories categories={rankedCategories} />
          </View>

          {/* Right: the same period, read three other ways. */}
          <View style={{ flex: '1 1 0', minWidth: 0, gap: 16 }}>
            <ReportsCategoryDonut
              categories={rankedCategories}
              total={totals.expenses}
            />
            <ReportsMonthlyComparison
              monthly={monthly}
              monthCount={months.length}
            />
            <ReportsInsights
              netChange={kpis.net.change}
              savingsRate={kpis.savingsRate.value}
              topCategory={topCategory}
            />
          </View>
        </View>

        <Text
          style={{
            fontSize: 11,
            letterSpacing: 0.6,
            textAlign: 'right',
            opacity: 0.7,
            color: 'var(--dfl-text-3)',
          }}
        >
          {t('Visual laboratory — demonstration data')}
        </Text>
      </View>
    </View>
  );
}
