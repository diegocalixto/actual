import React from 'react';
import type { ReactNode } from 'react';
import { Trans } from 'react-i18next';

import { Text } from '@actual-app/components/text';
import { View } from '@actual-app/components/view';
import { css } from '@emotion/css';

import { FinancialText } from '#components/FinancialText';
import { PrivacyFilter } from '#components/PrivacyFilter';
import { fittedFontSize } from '#components/v2lab/LabStyle';

import { CardLink } from './CardLink';
import { ChangeChip } from './ChangeChip';
import { CardHeading, LabCard } from './LabCard';
import { LabPill } from './LabPill';
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
  /**
   * Opens the report this card is a summary of. Absent ⇒ there is none to
   * open, and the card closes without a link.
   */
  onOpenFullComparison?: () => void;
  /**
   * The months the window cannot vouch for whole — the first, when the data
   * starts after its first day; the current one, still running — in a
   * sentence. Absent ⇒ every month in the window is complete.
   */
  note?: string;
  /**
   * The phone's arrangement: the three readings one under the other, each on
   * a line of its own. Side by side, a third of a phone is narrower than the
   * words "Net Result (avg)".
   */
  compact?: boolean;
};

/**
 * The recent months, compressed into three readings.
 *
 * The window is at most six months and never reaches before the file's first
 * transaction: a month before the history is not a month nothing happened in.
 * The trend is the mean of the later half against the mean of the earlier
 * half, not a single month-over-month step: one quiet month would otherwise
 * read as a collapse. Each sparkline is the same closes the average is taken
 * from, so the shape and the number cannot disagree.
 *
 * The three averages are one size: the design's, or the size the longest of
 * them still fits its third of the card at. In a 1280px window that third is
 * under 100px, and a six-digit average ran into the block beside it.
 */
export function ReportsMonthlyComparison({
  monthly,
  monthCount,
  onOpenFullComparison,
  note,
  compact = false,
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
      {/* The phone's scope restates the padding, so its cards share one edge. */}
      <View
        style={{ padding: 'var(--dfr-card-padding, 16px 20px 14px)', gap: 13 }}
      >
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

        <View style={{ flexDirection: compact ? 'column' : 'row', gap: 0 }}>
          <Block
            label={<Trans>Classified receipts (avg)</Trans>}
            data={monthly.income}
            valueSize={valueSize}
            color={SERIES.income}
            isGoodWhenUp
            compact={compact}
          />
          <Divider />
          <Block
            label={<Trans>Spending (avg)</Trans>}
            data={monthly.expenses}
            valueSize={valueSize}
            color={SERIES.expenses}
            isGoodWhenUp={false}
            tintValue
            compact={compact}
          />
          <Divider />
          <Block
            label={<Trans>Result (avg)</Trans>}
            data={monthly.net}
            valueSize={valueSize}
            color={SERIES.net}
            isGoodWhenUp
            compact={compact}
          />
        </View>

        {note && (
          <Text
            style={{
              fontSize: 11.5,
              lineHeight: 1.4,
              color: 'var(--dfl-text-3)',
            }}
          >
            {note}
          </Text>
        )}

        {onOpenFullComparison && (
          <CardLink onPress={onOpenFullComparison}>
            <Trans>View full comparison</Trans>
          </CardLink>
        )}
      </View>
    </LabCard>
  );
}

/** One pixel across whichever way the blocks run: a rule between columns, or between lines. */
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
  compact: boolean;
};

function Block({
  label,
  data,
  valueSize,
  color,
  isGoodWhenUp,
  tintValue,
  compact,
}: BlockProps) {
  const isUp = (data.change ?? 0) >= 0;

  if (compact) {
    return (
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          padding: '11px 0',
        }}
      >
        {/* The same share of every line, so the three trends start on one
            edge; and the width the average is fitted to. */}
        <View
          style={{
            flex: '0 0 45%',
            minWidth: 0,
            gap: 4,
            containerType: 'inline-size',
          }}
        >
          {/* The rows are stacked, so a label that needs a second line makes
              its own row taller and nothing else moves. Held on one line it
              was cut instead, and a cut label hides which receipts the average
              is of. */}
          <Text
            style={{
              fontSize: 11.5,
              lineHeight: 1.3,
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
        </View>

        <Sparkline values={data.spark} color={color} />

        {/* Kept as wide as the longest change, so the trends also end on one
            edge whether or not a line has a change to print. */}
        <View style={{ flex: `0 0 ${CHANGE_ROOM}px`, alignItems: 'flex-end' }}>
          {data.change !== null && (
            <ChangeChip
              label={formatChange(data.change)}
              isUp={isUp}
              isGood={isUp === isGoodWhenUp}
            />
          )}
        </View>
      </View>
    );
  }

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
      {/* Two lines reserved in all three columns, whether a label needs them
          or not: that keeps the three averages on one baseline while the
          longest label wraps instead of being cut. "Receitas classificadas
          (média)" does not fit a third of the panel on one line, and cutting
          it would hide which receipts the average is of. */}
      <Text
        style={{
          fontSize: 11.5,
          lineHeight: 1.3,
          minHeight: '2.6em',
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

/**
 * The window's closes, drawn small and scaled to their own range so the shape
 * is visible.
 *
 * A window of one month has no shape: dividing the width by `length - 1` would
 * be a division by zero, which is how this drew `M NaN 30` on a file whose
 * records start this month. One observation is a point, so it is drawn as one;
 * none is drawn as nothing.
 */
function Sparkline({ values, color }: { values: number[]; color: string }) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const yOf = (value: number) => SH - 4 - ((value - min) / span) * (SH - 10);

  if (values.length === 0) {
    return null;
  }

  if (values.length === 1) {
    return (
      <svg
        viewBox={`0 0 ${SW} ${SH}`}
        preserveAspectRatio="none"
        aria-hidden="true"
        className={SPARKLINE_BOX}
      >
        <circle cx={SW / 2} cy={yOf(values[0])} r="2" fill={color} />
      </svg>
    );
  }

  const points = values.map((value, index) => ({
    x: (index / (values.length - 1)) * SW,
    y: yOf(value),
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
