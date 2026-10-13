import React from 'react';
import { Trans } from 'react-i18next';

import { Text } from '@actual-app/components/text';
import { View } from '@actual-app/components/view';

import { MOBILE_NAV_SPACER } from '#components/mobile/MobileNavTabs';
import { MobilePrivacyToggle } from '#components/mobile/MobilePrivacyToggle';
import {
  mobileHeaderIconButtonStyle,
  MobilePageHeader,
  Page,
} from '#components/Page';
import { useRegionalFormatKey } from '#components/v2lab/LabStyle';
import { EmptyPanel } from '#components/v2lab/reports/EmptyPanel';
import { ReportsCategoryDonut } from '#components/v2lab/reports/ReportsCategoryDonut';
import { ReportsHeroChart } from '#components/v2lab/reports/ReportsHeroChart';
import { ReportsKpis } from '#components/v2lab/reports/ReportsKpis';
import { ReportsMonthlyComparison } from '#components/v2lab/reports/ReportsMonthlyComparison';

import { ReportsMobileMore } from './ReportsMobileMore';
import { ReportsMobilePeriodBar } from './ReportsMobilePeriodBar';
import {
  chromeAccent,
  chromeCanvas,
  chromeInk,
  chromeLine,
  REPORTS_MOBILE_ROOT_CLASS,
  reportsMobileLayout,
  ReportsMobileStyle,
} from './ReportsMobileStyle';
import { useRealReportsData } from './useRealReportsData';
import { useReportsDetailLinks } from './useReportsDetailLinks';
import { useReportsPeriod } from './useReportsPeriod';

/** A person's name. Not copy, so never a translation key. */
const AUTHOR = 'Diego Calixto';

/**
 * The Reports, on a phone.
 *
 * The same page as the desktop's, arranged for one column. It asks the same
 * hook for the same month — the one in the address — and draws the desktop's
 * own panels, each in its narrow arrangement, so no figure here is computed
 * twice and none can differ from the one a wider window shows.
 *
 * The order is the desktop's reading order: which period, what it came to,
 * how it unfolded, where the money went, how it compares with the months
 * before, and then the way on to the detailed reports. What the desktop has
 * and this does not is the ranked list of top categories: the ring's legend
 * already ranks them with their amounts and shares, and a phone has no second
 * column to give the same list twice.
 */
export function V2MobileReports() {
  // Redrawn whole when the file's number format or currency changes.
  const regionalFormat = useRegionalFormatKey();
  const period = useReportsPeriod();
  const data = useRealReportsData(period.month);
  const detailReports = useReportsDetailLinks();

  const hasActivity = data.totals.income > 0 || data.totals.expenses > 0;
  const hasCategories = data.categories.length > 0;

  return (
    <Page
      header={
        <MobilePageHeader
          title={<Trans>Reports</Trans>}
          // The header is portalled into the shell's slot, outside this page's
          // class, so it is painted with the scope's literals rather than its
          // tokens.
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
        className={REPORTS_MOBILE_ROOT_CLASS}
        style={{
          width: '100%',
          flexShrink: 0,
          padding: `8px ${reportsMobileLayout.gutter}px`,
          // The bar is fixed and overlays the page, so the bottom padding has
          // to clear it — and, on an iPhone, the home indicator under it.
          paddingBottom: `calc(${MOBILE_NAV_SPACER} + 14px)`,
          gap: reportsMobileLayout.stackGap,
          backgroundColor: 'var(--dfl-canvas)',
          color: 'var(--dfl-text)',
        }}
      >
        <ReportsMobileStyle />

        <ReportsMobilePeriodBar
          period={period}
          rangeLabel={data.periodLabel}
          scopeLabel={data.scopeLabel}
        />

        <ReportsKpis
          compact
          kpis={data.kpis}
          previousPeriodLabel={data.previousPeriodLabel}
        />

        {hasActivity ? (
          <ReportsHeroChart
            // A new period is a new plot: the day last pointed at may not
            // exist in a shorter month.
            key={period.month}
            compact
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
          // A month with nothing in it is said in words. The desktop draws
          // its empty plot; a phone's screen of gridlines over a row of zeros
          // would read as a chart that failed to load.
          <EmptyPanel minHeight={150}>
            {data.isLoading ? (
              <Trans>Loading the period…</Trans>
            ) : (
              <Trans>No transactions in this period.</Trans>
            )}
          </EmptyPanel>
        )}

        {hasCategories ? (
          <ReportsCategoryDonut
            categories={data.categories}
            total={data.totals.expenses}
            // The legend is this screen's ranking, so it opens on the five
            // the desktop's ranked list opens on.
            limit={5}
            // The period is stated once, at the top of the screen.
            periodLabel={null}
          />
        ) : (
          // With no transaction at all, the panel above has already said so.
          hasActivity && (
            <EmptyPanel>
              <Trans>No spending recorded in this period.</Trans>
            </EmptyPanel>
          )
        )}

        <ReportsMonthlyComparison
          compact
          monthly={data.monthly}
          monthCount={data.monthCount}
        />

        <ReportsMobileMore reports={detailReports} />

        <Text
          style={{
            fontSize: 11,
            letterSpacing: 0.6,
            textAlign: 'right',
            color: 'var(--dfl-text-3)',
          }}
        >
          {AUTHOR}
        </Text>
      </View>
    </Page>
  );
}
