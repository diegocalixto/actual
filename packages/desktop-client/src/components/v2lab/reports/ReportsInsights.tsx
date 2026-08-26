import React from 'react';
import type { ComponentType, ReactNode, SVGProps } from 'react';
import { Trans } from 'react-i18next';

import { SvgArrowThinUp, SvgChartPie } from '@actual-app/components/icons/v1';
import { SvgAlertTriangle } from '@actual-app/components/icons/v2';
import { Text } from '@actual-app/components/text';
import { View } from '@actual-app/components/view';

import { CardHeading, LabCard } from './LabCard';
import { CardLink } from './ReportsCategoryDonut';
import { formatChange, formatPercent } from './reportsMoney';
import { SERIES } from './reportsTokens';

type ReportsInsightsProps = {
  netChange: number;
  savingsRate: number;
  topCategory: { name: string; vsPriorAverage: number };
};

const VIOLET = '#9b7bff';
const AMBER = '#f0a63c';

/**
 * Three facts, not three opinions.
 *
 * Each line is a comparison this page already computed — the result against
 * last month, the largest category against its own three-month average, the
 * savings rate of the period. Nothing predicts, recommends or scores: the
 * laboratory has no model behind it, and writing as though it did would be
 * claiming a capability the product does not have.
 */
export function ReportsInsights({
  netChange,
  savingsRate,
  topCategory,
}: ReportsInsightsProps) {
  const netUp = netChange >= 0;
  const categoryUp = topCategory.vsPriorAverage >= 0;

  return (
    <LabCard>
      <View style={{ padding: '16px 20px 14px', gap: 12 }}>
        <CardHeading title={<Trans>Insights</Trans>} />

        <View style={{ gap: 12 }}>
          <Insight
            Icon={SvgArrowThinUp}
            color={netUp ? SERIES.income : SERIES.expenses}
            headline={
              <Trans>
                Net result {{ netChangeLabel: formatChange(netChange) }} against
                the previous month.
              </Trans>
            }
            detail={
              netUp ? (
                <Trans>More stayed in than in April.</Trans>
              ) : (
                <Trans>Less stayed in than in April.</Trans>
              )
            }
          />

          <Insight
            Icon={SvgAlertTriangle}
            color={categoryUp ? AMBER : SERIES.income}
            headline={
              <Trans>
                {{ categoryName: topCategory.name }} is{' '}
                {{
                  categoryChangeLabel: formatChange(topCategory.vsPriorAverage),
                }}{' '}
                against its own three-month average.
              </Trans>
            }
            detail={<Trans>Largest category of the period.</Trans>}
          />

          <Insight
            Icon={SvgChartPie}
            color={VIOLET}
            headline={
              <Trans>
                Savings rate for the period is{' '}
                {{ savingsRateLabel: formatPercent(savingsRate) }}.
              </Trans>
            }
            detail={<Trans>Net result over income.</Trans>}
          />
        </View>

        <CardLink>
          <Trans>View all insights</Trans>
        </CardLink>
      </View>
    </LabCard>
  );
}

type InsightProps = {
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  color: string;
  headline: ReactNode;
  detail: ReactNode;
};

function Insight({ Icon, color, headline, detail }: InsightProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 13,
      }}
    >
      <View
        aria-hidden="true"
        style={{
          width: 34,
          height: 34,
          flexShrink: 0,
          borderRadius: 10,
          alignItems: 'center',
          justifyContent: 'center',
          color,
          backgroundImage: `radial-gradient(circle at 32% 26%, color-mix(in srgb, ${color} 34%, #0a0f18) 0%, color-mix(in srgb, ${color} 12%, #070b12) 100%)`,
          border: `1px solid color-mix(in srgb, ${color} 32%, transparent)`,
          boxShadow: `0 5px 16px -8px color-mix(in srgb, ${color} 80%, transparent)`,
        }}
      >
        <Icon width={15} height={15} />
      </View>

      <View style={{ flex: '1 1 0', minWidth: 0, gap: 3, paddingTop: 1 }}>
        <Text
          style={{
            fontSize: 13,
            lineHeight: 1.45,
            color: 'var(--dfl-text)',
          }}
        >
          {headline}
        </Text>
        <Text
          style={{
            fontSize: 12,
            lineHeight: 1.4,
            color: 'var(--dfl-text-3)',
          }}
        >
          {detail}
        </Text>
      </View>
    </View>
  );
}
