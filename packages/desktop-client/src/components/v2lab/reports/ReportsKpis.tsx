import React from 'react';
import type { ComponentType, ReactNode, SVGProps } from 'react';
import { Trans } from 'react-i18next';

import {
  SvgAdjust,
  SvgArrowThinDown,
  SvgArrowThinUp,
  SvgChartPie,
} from '@actual-app/components/icons/v1';
import { Text } from '@actual-app/components/text';
import { TextOneLine } from '@actual-app/components/text-one-line';
import { View } from '@actual-app/components/view';

import { FinancialText } from '#components/FinancialText';
import { PrivacyFilter } from '#components/PrivacyFilter';
import { fittedFontSize } from '#components/v2lab/LabStyle';

import { ChangeChip } from './ChangeChip';
import { LabCard } from './LabCard';
import {
  formatChange,
  formatCurrency,
  formatPercent,
  formatPoints,
} from './reportsMoney';
import { SERIES } from './reportsTokens';

type Kpis = {
  /**
   * `change` is `null` when the previous period is zero or negative: a ratio
   * against such a base is arithmetic without meaning — "up 1184%" from a loss
   * says nothing a reader can use — so the chip is left out instead.
   */
  income: { value: number; change: number | null };
  expenses: { value: number; change: number | null };
  net: { value: number; change: number | null };
  savingsRate: { value: number; points: number | null };
};

type ReportsKpisProps = {
  kpis: Kpis;
  previousPeriodLabel: string;
  /**
   * The phone's arrangement: two tiles to a line, each with its figure on a
   * line of its own. Four across, a phone leaves a figure the width of four
   * digits.
   */
  compact?: boolean;
};

const VIOLET = '#9b7bff';

const FIGURE_SIZE = 23;
const FIGURE_TRACKING = -0.9;
/** A tile half a phone wide carries a figure a step smaller. */
const COMPACT_FIGURE_SIZE = 21;
const COMPACT_FIGURE_TRACKING = -0.6;

/**
 * The period in four figures.
 *
 * Each carries its own hue on the icon alone; the values stay white so four
 * cards side by side read as one row rather than four competing signals. Every
 * number here is derived, and the comparison is against the real previous
 * month, not a remembered one.
 *
 * The four values are one size: the design's, or the size the longest of them
 * still fits beside its icon at. A period in the millions used to run out of
 * its card.
 */
export function ReportsKpis({
  kpis,
  previousPeriodLabel,
  compact = false,
}: ReportsKpisProps) {
  const income = formatCurrency(kpis.income.value);
  const expenses = formatCurrency(kpis.expenses.value);
  const net = formatCurrency(kpis.net.value);
  const savingsRate = formatPercent(kpis.savingsRate.value);

  const valueSize = fittedFontSize({
    designSize: `${compact ? COMPACT_FIGURE_SIZE : FIGURE_SIZE}px`,
    room: '100cqi',
    floor: '13px',
    letterSpacing: compact ? COMPACT_FIGURE_TRACKING : FIGURE_TRACKING,
    figures: [income, expenses, net, savingsRate],
  });

  return (
    <View
      style={
        compact
          ? { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }
          : { flexDirection: 'row', gap: 16 }
      }
    >
      <Kpi
        compact={compact}
        label={<Trans>Income</Trans>}
        value={income}
        valueSize={valueSize}
        isAmount
        Icon={SvgArrowThinUp}
        color={SERIES.income}
        change={
          kpis.income.change === null ? null : formatChange(kpis.income.change)
        }
        isUp={(kpis.income.change ?? 0) >= 0}
        isGood={(kpis.income.change ?? 0) >= 0}
        previousPeriodLabel={previousPeriodLabel}
      />
      <Kpi
        compact={compact}
        label={<Trans>Expenses</Trans>}
        value={expenses}
        valueSize={valueSize}
        isAmount
        Icon={SvgArrowThinDown}
        color={SERIES.expenses}
        change={
          kpis.expenses.change === null
            ? null
            : formatChange(kpis.expenses.change)
        }
        isUp={(kpis.expenses.change ?? 0) >= 0}
        /* Spending more is not good news, however the arrow points. */
        isGood={(kpis.expenses.change ?? 0) < 0}
        previousPeriodLabel={previousPeriodLabel}
      />
      <Kpi
        compact={compact}
        label={<Trans>Net Result</Trans>}
        value={net}
        valueSize={valueSize}
        isAmount
        Icon={SvgAdjust}
        color={SERIES.net}
        change={kpis.net.change === null ? null : formatChange(kpis.net.change)}
        isUp={(kpis.net.change ?? 0) >= 0}
        isGood={(kpis.net.change ?? 0) >= 0}
        previousPeriodLabel={previousPeriodLabel}
      />
      <Kpi
        compact={compact}
        label={<Trans>Savings Rate</Trans>}
        value={savingsRate}
        valueSize={valueSize}
        Icon={SvgChartPie}
        color={VIOLET}
        change={
          kpis.savingsRate.points === null
            ? null
            : formatPoints(kpis.savingsRate.points)
        }
        isUp={(kpis.savingsRate.points ?? 0) >= 0}
        isGood={(kpis.savingsRate.points ?? 0) >= 0}
        previousPeriodLabel={previousPeriodLabel}
      />
    </View>
  );
}

type KpiProps = {
  label: ReactNode;
  value: string;
  /** The size the row's four values share, fitted to the longest of them. */
  valueSize: string;
  /** An amount goes behind privacy mode; a rate stays readable. */
  isAmount?: boolean;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  color: string;
  change: string | null;
  isUp: boolean;
  isGood: boolean;
  previousPeriodLabel: string;
  compact: boolean;
};

function Kpi({
  compact,
  label,
  value,
  valueSize,
  isAmount = false,
  Icon,
  color,
  change,
  isUp,
  isGood,
  previousPeriodLabel,
}: KpiProps) {
  if (compact) {
    return (
      <LabCard style={{ minWidth: 0, borderRadius: 16 }}>
        <View
          style={{
            gap: 7,
            padding: '12px 14px 13px',
            // The tile's width is what the value is fitted to.
            containerType: 'inline-size',
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 6,
            }}
          >
            {/* Sentence case, as the phone's other tiles are: in capitals
                "Savings Rate" does not fit beside its own icon. */}
            <TextOneLine
              style={{
                minWidth: 0,
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--dfl-text-2)',
              }}
            >
              {label}
            </TextOneLine>
            <View
              aria-hidden="true"
              style={{
                width: 26,
                height: 26,
                flexShrink: 0,
                borderRadius: 999,
                alignItems: 'center',
                justifyContent: 'center',
                color,
                backgroundImage: `radial-gradient(circle at 34% 26%, color-mix(in srgb, ${color} 32%, #0a0f18) 0%, color-mix(in srgb, ${color} 12%, #070b12) 62%, color-mix(in srgb, ${color} 5%, #05070c) 100%)`,
                border: `1px solid color-mix(in srgb, ${color} 34%, transparent)`,
              }}
            >
              <Icon width={12} height={12} />
            </View>
          </View>

          <FinancialText
            style={{
              fontSize: [`${COMPACT_FIGURE_SIZE}px`, valueSize],
              fontWeight: 600,
              lineHeight: 1.15,
              letterSpacing: COMPACT_FIGURE_TRACKING,
              whiteSpace: 'nowrap',
              color: '#ffffff',
            }}
          >
            {isAmount ? <PrivacyFilter>{value}</PrivacyFilter> : value}
          </FinancialText>

          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              alignItems: 'center',
              columnGap: 6,
              rowGap: 2,
              minWidth: 0,
            }}
          >
            {change !== null && (
              <ChangeChip label={change} isUp={isUp} isGood={isGood} />
            )}
            <Text
              style={{
                fontSize: 11.5,
                whiteSpace: 'nowrap',
                color: 'var(--dfl-text-3)',
              }}
            >
              <Trans>vs {{ previousPeriodLabel }}</Trans>
            </Text>
          </View>
        </View>
      </LabCard>
    );
  }

  return (
    <LabCard style={{ flex: '1 1 0', minWidth: 0 }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 16,
          padding: '15px 18px',
        }}
      >
        <View
          aria-hidden="true"
          style={{
            width: 46,
            height: 46,
            flexShrink: 0,
            borderRadius: 999,
            alignItems: 'center',
            justifyContent: 'center',
            color,
            backgroundImage: `radial-gradient(circle at 34% 26%, color-mix(in srgb, ${color} 32%, #0a0f18) 0%, color-mix(in srgb, ${color} 12%, #070b12) 62%, color-mix(in srgb, ${color} 5%, #05070c) 100%)`,
            border: `1px solid color-mix(in srgb, ${color} 34%, transparent)`,
            boxShadow: `inset 0 1px 0 color-mix(in srgb, ${color} 30%, transparent), 0 6px 20px -10px color-mix(in srgb, ${color} 80%, transparent)`,
          }}
        >
          <Icon width={20} height={20} />
        </View>

        <View
          style={{
            flex: '1 1 0',
            minWidth: 0,
            gap: 6,
            // The column's width is what the value is fitted to.
            containerType: 'inline-size',
          }}
        >
          <Text
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: 1.2,
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
              color: 'var(--dfl-text-3)',
            }}
          >
            {label}
          </Text>

          <FinancialText
            style={{
              fontSize: [`${FIGURE_SIZE}px`, valueSize],
              fontWeight: 600,
              lineHeight: 1.1,
              letterSpacing: FIGURE_TRACKING,
              whiteSpace: 'nowrap',
              color: '#ffffff',
            }}
          >
            {isAmount ? <PrivacyFilter>{value}</PrivacyFilter> : value}
          </FinancialText>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 7,
              minWidth: 0,
            }}
          >
            {change !== null && (
              <ChangeChip label={change} isUp={isUp} isGood={isGood} />
            )}
            <Text
              style={{
                fontSize: 12,
                whiteSpace: 'nowrap',
                color: 'var(--dfl-text-3)',
              }}
            >
              <Trans>vs {{ previousPeriodLabel }}</Trans>
            </Text>
          </View>
        </View>
      </View>
    </LabCard>
  );
}
