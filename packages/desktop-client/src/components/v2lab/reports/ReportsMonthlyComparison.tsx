import React from 'react';
import type { ReactNode } from 'react';
import { Trans } from 'react-i18next';

import { Text } from '@actual-app/components/text';
import { View } from '@actual-app/components/view';

import { FinancialText } from '#components/FinancialText';

import { ChangeChip } from './ChangeChip';
import { CardHeading, LabCard } from './LabCard';
import { LabPill } from './LabPill';
import { CardLink } from './ReportsCategoryDonut';
import { formatBRL, formatChange } from './reportsMoney';
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
 */
export function ReportsMonthlyComparison({
  monthly,
  monthCount,
}: ReportsMonthlyComparisonProps) {
  return (
    <LabCard>
      <View style={{ padding: '16px 20px 14px', gap: 13 }}>
        <CardHeading
          title={<Trans>Monthly comparison</Trans>}
          action={
            <LabPill>
              <Trans>Last {{ monthCount }} months</Trans>
            </LabPill>
          }
        />

        <View style={{ flexDirection: 'row', gap: 0 }}>
          <Block
            label={<Trans>Income (avg)</Trans>}
            data={monthly.income}
            color={SERIES.income}
            isGoodWhenUp
          />
          <Divider />
          <Block
            label={<Trans>Expenses (avg)</Trans>}
            data={monthly.expenses}
            color={SERIES.expenses}
            isGoodWhenUp={false}
            tintValue
          />
          <Divider />
          <Block
            label={<Trans>Net Result (avg)</Trans>}
            data={monthly.net}
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

type BlockProps = {
  label: ReactNode;
  data: Comparison;
  color: string;
  isGoodWhenUp: boolean;
  tintValue?: boolean;
};

function Block({ label, data, color, isGoodWhenUp, tintValue }: BlockProps) {
  const isUp = (data.change ?? 0) >= 0;

  return (
    <View style={{ flex: '1 1 0', minWidth: 0, gap: 9, padding: '0 14px' }}>
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
          fontSize: 16.5,
          fontWeight: 600,
          letterSpacing: -0.4,
          whiteSpace: 'nowrap',
          color: tintValue ? color : '#ffffff',
        }}
      >
        {formatBRL(data.average)}
      </FinancialText>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          minWidth: 0,
        }}
      >
        <Sparkline values={data.spark} color={color} />
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

const SW = 100;
const SH = 34;

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
      style={{ flex: '1 1 0', minWidth: 40, height: SH, display: 'block' }}
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
