import React from 'react';
import { Trans } from 'react-i18next';

import { useResponsive } from '@actual-app/components/hooks/useResponsive';
import {
  SvgArrowThinDown,
  SvgArrowThinUp,
} from '@actual-app/components/icons/v1';
import { Text } from '@actual-app/components/text';
import { View } from '@actual-app/components/view';

import {
  shellColors,
  shellEyebrowStyle,
  shellRadius,
} from '#components/appshell/shellTheme';
import { HomeMobileMoney } from '#components/home/v2mobile/HomeMobileMoney';
import { hasPlottableValues } from '#components/reports/graphs/util/hasPlottableValues';

import { DashboardCard } from './DashboardCard';
import { SectionHeading } from './SectionHeading';
import { TrendSparkline } from './TrendSparkline';
import { useBalanceTrend } from './useBalanceTrend';

/**
 * Answers one question — "is my balance improving or getting worse?" — and is
 * skipped entirely when it cannot. A flat all-zero series would draw a rule
 * along the bottom of the card that reads as a stray border rather than as
 * data, so `hasPlottableValues` gates the chart the same way the Reports cards
 * gate theirs.
 */
export function BalanceTrendCard() {
  const { isNarrowWidth } = useResponsive();
  const { points, latest, change, isLoading } = useBalanceTrend();

  const isPlottable =
    points.length > 1 && hasPlottableValues(points.map(point => point.value));

  if (isLoading) {
    return (
      <SectionHeading title={<Trans>Evolução do saldo</Trans>}>
        <DashboardCard>
          <View style={{ padding: 26, alignItems: 'center' }}>
            <Text style={{ fontSize: 13, color: shellColors.textSecondary }}>
              <Trans>Carregando evolução…</Trans>
            </Text>
          </View>
        </DashboardCard>
      </SectionHeading>
    );
  }

  if (!isPlottable) {
    return null;
  }

  const firstLabel = points[0].label;
  const lastLabel = points[points.length - 1].label;

  return (
    <SectionHeading
      title={<Trans>Evolução do saldo</Trans>}
      action={<ChangeBadge change={change} />}
    >
      <DashboardCard>
        <View style={{ padding: '16px 16px 12px', gap: 12 }}>
          <HomeMobileMoney
            value={latest}
            withCurrency
            style={{
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: -0.4,
              color: shellColors.textPrimary,
            }}
          />

          <TrendSparkline points={points} height={isNarrowWidth ? 104 : 118} />

          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <Text style={{ ...shellEyebrowStyle, letterSpacing: 0.4 }}>
              {firstLabel}
            </Text>
            <Text style={{ ...shellEyebrowStyle, letterSpacing: 0.4 }}>
              {lastLabel}
            </Text>
          </View>
        </View>
      </DashboardCard>
    </SectionHeading>
  );
}

function ChangeBadge({ change }: { change: number | null }) {
  if (change === null || change === 0) {
    return null;
  }

  const isUp = change > 0;
  const Icon = isUp ? SvgArrowThinUp : SvgArrowThinDown;
  const color = isUp ? shellColors.positive : shellColors.negative;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        padding: '3px 9px',
        borderRadius: shellRadius.pill,
        backgroundColor: shellColors.surfaceSunken,
        color,
      }}
    >
      <Icon width={10} height={10} style={{ flexShrink: 0 }} />
      {/* The arrow beside it already carries the direction, so the figure is
          printed as a magnitude — the same way the month's three totals are. */}
      <HomeMobileMoney
        value={Math.abs(change)}
        withCurrency
        style={{ fontSize: 12, fontWeight: 600, color }}
      />
    </View>
  );
}
