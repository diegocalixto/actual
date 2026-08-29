import React from 'react';

import { View } from '@actual-app/components/view';
import { Area, AreaChart, ResponsiveContainer, Tooltip, YAxis } from 'recharts';

import { shellColors, shellRadius } from '#components/appshell/shellTheme';
import { HomeMobileMoney } from '#components/home/v2mobile/HomeMobileMoney';
import { useRechartsAnimation } from '#components/reports/chart-theme';

import type { BalanceTrendPoint } from './useBalanceTrend';

/** Unique enough to not collide with the gradient ids the Reports graphs use. */
const GRADIENT_ID = 'homeV2TrendFill';

type TrendSparklineProps = {
  points: BalanceTrendPoint[];
  height: number;
};

/**
 * A thin wrapper over recharts: no axes, no grid, no legend — just the shape of
 * the series and a tooltip for the exact figure. Everything a dashboard card
 * needs and nothing a full report would add.
 */
export function TrendSparkline({ points, height }: TrendSparklineProps) {
  const animation = useRechartsAnimation();

  return (
    <View style={{ height, width: '100%' }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={points}
          margin={{ top: 4, right: 2, bottom: 0, left: 2 }}
        >
          <defs>
            <linearGradient id={GRADIENT_ID} x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor={shellColors.accentBold}
                stopOpacity={0.42}
              />
              <stop
                offset="100%"
                stopColor={shellColors.accentBold}
                stopOpacity={0}
              />
            </linearGradient>
          </defs>

          {/* Hidden, but it still owns the scale: the padded domain keeps the
              line off the top and bottom edges of such a short chart. */}
          <YAxis
            hide
            domain={[
              (min: number) => min - Math.abs(min) * 0.08 - 1,
              (max: number) => max + Math.abs(max) * 0.08 + 1,
            ]}
          />

          <Tooltip
            content={<TrendTooltip />}
            cursor={{ stroke: shellColors.borderStrong, strokeWidth: 1 }}
            isAnimationActive={false}
          />

          <Area
            type="monotone"
            dataKey="value"
            stroke={shellColors.accent}
            strokeWidth={2}
            fill={`url(#${GRADIENT_ID})`}
            activeDot={{
              r: 4,
              fill: shellColors.accent,
              stroke: 'none',
            }}
            dot={false}
            {...animation}
          />
        </AreaChart>
      </ResponsiveContainer>
    </View>
  );
}

type TrendTooltipProps = {
  active?: boolean;
  payload?: Array<{ payload: BalanceTrendPoint }>;
};

function TrendTooltip({ active, payload }: TrendTooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const point = payload[0].payload;

  return (
    <View
      style={{
        padding: '7px 10px',
        gap: 2,
        borderRadius: shellRadius.chip,
        border: `1px solid ${shellColors.borderStrong}`,
        backgroundColor: shellColors.surfaceElevated,
        boxShadow: '0 6px 18px -8px rgba(0, 0, 0, 0.8)',
      }}
    >
      <span style={{ fontSize: 11, color: shellColors.textSecondary }}>
        {point.label}
      </span>
      <HomeMobileMoney
        value={point.value}
        withCurrency
        style={{ fontSize: 13, fontWeight: 600 }}
      />
    </View>
  );
}
