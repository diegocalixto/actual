import React from 'react';
import type { ReactNode } from 'react';
import { Trans } from 'react-i18next';

import { Text } from '@actual-app/components/text';
import { View } from '@actual-app/components/view';
import { css } from '@emotion/css';

import { FinancialText } from '#components/FinancialText';
import { PrivacyFilter } from '#components/PrivacyFilter';
import { fittedFontSize } from '#components/v2lab/LabStyle';

import { ChangeChip } from './ChangeChip';
import { CardHeading, LabCard } from './LabCard';
import { LabPill } from './LabPill';
import { CardLink } from './ReportsCategoryDonut';
import { formatChange, formatCurrency } from './reportsMoney';
import { SERIES } from './reportsTokens';

type Comparison = {
  average: number;
  /**
   * `null` when the earlier half of the window is zero or negative: a ratio
   * against such a base is arithmetic without meaning, and printing "+0,0%"
   * there would claim nothing changed when in fact nothing is comparable. The
   * KPIs above already read it this way; this keeps one rule on one screen.
   */
  change: number | null;
  spark: number[];
};

type ReportsMonthlyComparisonProps = {
  monthly: { income: Comparison; expenses: Comparison; net: Comparison };
  monthCount: number;
};

/**
 * The six-month view, compressed into three readings.
 *
 * The trend is the mean of the last three months against the mean of the first
 * three, not a single month-over-month step: one quiet month would otherwise
 * read as a collapse. Each sparkline is the same six closes the average is
 * taken from, so the shape and the number cannot disagree.
 *
 * The three averages are one size: the design's, or the size the longest of
 * them still fits its third of the card at. In a 1280px window that third is
 * under 100px, and a six-digit average ran into the block beside it.
 */
export function ReportsMonthlyComparison({
  monthly,
  monthCount,
}: ReportsMonthlyComparisonProps) {
  const valueSize = fittedFontSize({
    designSize: `${VALUE_SIZE}px`,
    room: '100cqi',
    floor: '11px',
    letterSpacing: VALUE_TRACKING,
    figures: [monthly.income, monthly.expenses, monthly.net].map(comparison =>
      formatCurrency(comparison.average),
    ),
  });

  return (
    <LabCard>
      <View style={{ padding: '16px 20px 14px', gap: 13 }}>
        <CardHeading
          title={<Trans>Monthly comparison</Trans>}
          action={
            <LabPill>
              <Trans count={monthCount}>
                Last {{ count: monthCount }} months
              </Trans>
            </LabPill>
          }
        />

        <View style={{ flexDirection: 'row', gap: 0 }}>
          <Block
            label={<Trans>Income (avg)</Trans>}
            data={monthly.income}
            valueSize={valueSize}
            color={SERIES.income}
            isGoodWhenUp
          />
          <Divider />
          <Block
            label={<Trans>Expenses (avg)</Trans>}
            data={monthly.expenses}
            valueSize={valueSize}
            color={SERIES.expenses}
            isGoodWhenUp={false}
            tintValue
          />
          <Divider />
          <Block
            label={<Trans>Net Result (avg)</Trans>}
            data={monthly.net}
            valueSize={valueSize}
            color={SERIES.net}
            isGoodWhenUp
          />
        </View>

        <CardLink>
          <Trans>View full comparison</Trans>
        </CardLink>
      </View>
    </LabCard>
  );
}

function Divider() {
  return (
    <View
      aria-hidden="true"
      style={{
        flex: '0 0 1px',
        alignSelf: 'stretch',
        backgroundColor: 'var(--dfl-line)',
      }}
    />
  );
}

const VALUE_SIZE = 16.5;
const VALUE_TRACKING = -0.4;

type BlockProps = {
  label: ReactNode;
  data: Comparison;
  /** The size the three averages share, fitted to the longest of them. */
  valueSize: string;
  color: string;
  isGoodWhenUp: boolean;
  tintValue?: boolean;
};

function Block({
  label,
  data,
  valueSize,
  color,
  isGoodWhenUp,
  tintValue,
}: BlockProps) {
  const isUp = (data.change ?? 0) >= 0;

  return (
    <View
      style={{
        flex: '1 1 0',
        minWidth: 0,
        gap: 9,
        padding: '0 14px',
        // Its own width is what decides how the last line below is laid out,
        // and what the average above it is fitted to.
        containerType: 'inline-size',
      }}
    >
      <Text
        style={{
          fontSize: 11.5,
          whiteSpace: 'nowrap',
          color: 'var(--dfl-text-3)',
        }}
      >
        {label}
      </Text>

      <FinancialText
        style={{
          fontSize: [`${VALUE_SIZE}px`, valueSize],
          fontWeight: 600,
          letterSpacing: VALUE_TRACKING,
          whiteSpace: 'nowrap',
          color: tintValue ? color : '#ffffff',
        }}
      >
        <PrivacyFilter>{formatCurrency(data.average)}</PrivacyFilter>
      </FinancialText>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: TREND_GAP,
          minWidth: 0,
          [STACKED]: { flexDirection: 'column', alignItems: 'stretch', gap: 7 },
        }}
      >
        <Sparkline values={data.spark} color={color} />
        {data.change !== null && (
          // Never narrower than what it prints: the trend line is the part
          // that gives way.
          <View
            style={{
              flex: '0 0 auto',
              [STACKED]: { alignSelf: 'flex-start' },
            }}
          >
            <ChangeChip
              label={formatChange(data.change)}
              isUp={isUp}
              isGood={isUp === isGoodWhenUp}
            />
          </View>
        )}
      </View>
    </View>
  );
}

const SW = 100;
const SH = 34;

/** Between a trend line and the change printed beside it. */
const TREND_GAP = 10;
/** Narrowest the trend line is still a shape rather than a tick. */
const TREND_MIN_WIDTH = 18;
/**
 * What the change needs at the longest it is expected to run: the arrow and a
 * signed four-digit percentage. "+8888,8%" measures 80px at this type size.
 */
const CHANGE_ROOM = 82;
/**
 * A block too narrow for the trend line and the change to share a line.
 *
 * In a 1280px window each block has under 100px. Kept side by side there, the
 * chip is squeezed until its arrow collapses and the percentage runs out of
 * it, towards the next column. Below the width both fit in, the change takes
 * its own line under the trend instead. The rule reads the block's width, not
 * its content, so the three blocks always switch together and stay aligned.
 */
const STACKED = `@container (max-width: ${
  TREND_MIN_WIDTH + TREND_GAP + CHANGE_ROOM - 1
}px)`;

const SPARKLINE_BOX = css({
  flex: '1 1 0',
  minWidth: TREND_MIN_WIDTH,
  height: SH,
  display: 'block',
  [STACKED]: { flex: 'none', width: '100%' },
});

/** Six closes, drawn small. Scaled to its own range so the shape is visible. */
function Sparkline({ values, color }: { values: number[]; color: string }) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;

  const points = values.map((value, index) => ({
    x: (index / (values.length - 1)) * SW,
    y: SH - 4 - ((value - min) / span) * (SH - 10),
  }));

  const line = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');

  return (
    <svg
      viewBox={`0 0 ${SW} ${SH}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      className={SPARKLINE_BOX}
    >
      <defs>
        <linearGradient
          id={`dfrSpark-${color.replace('#', '')}`}
          x1="0"
          y1="0"
          x2="0"
          y2="1"
        >
          <stop offset="0%" stopColor={color} stopOpacity="0.34" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>

      <path
        d={`${line} L ${SW} ${SH} L 0 ${SH} Z`}
        fill={`url(#dfrSpark-${color.replace('#', '')})`}
      />
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
