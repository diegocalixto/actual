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
import { View } from '@actual-app/components/view';

import { FinancialText } from '#components/FinancialText';

import { ChangeChip } from './ChangeChip';
import { LabCard } from './LabCard';
import {
  formatBRL,
  formatChange,
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
};

const VIOLET = '#9b7bff';

/**
 * The period in four figures.
 *
 * Each carries its own hue on the icon alone; the values stay white so four
 * cards side by side read as one row rather than four competing signals. Every
 * number here is derived, and the comparison is against the real previous
 * month, not a remembered one.
 */
export function ReportsKpis({ kpis, previousPeriodLabel }: ReportsKpisProps) {
  return (
    <View style={{ flexDirection: 'row', gap: 16 }}>
      <Kpi
        label={<Trans>Income</Trans>}
        value={formatBRL(kpis.income.value)}
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
        label={<Trans>Expenses</Trans>}
        value={formatBRL(kpis.expenses.value)}
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
        label={<Trans>Net Result</Trans>}
        value={formatBRL(kpis.net.value)}
        Icon={SvgAdjust}
        color={SERIES.net}
        change={kpis.net.change === null ? null : formatChange(kpis.net.change)}
        isUp={(kpis.net.change ?? 0) >= 0}
        isGood={(kpis.net.change ?? 0) >= 0}
        previousPeriodLabel={previousPeriodLabel}
      />
      <Kpi
        label={<Trans>Savings Rate</Trans>}
        value={formatPercent(kpis.savingsRate.value)}
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
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  color: string;
  change: string | null;
  isUp: boolean;
  isGood: boolean;
  previousPeriodLabel: string;
};

function Kpi({
  label,
  value,
  Icon,
  color,
  change,
  isUp,
  isGood,
  previousPeriodLabel,
}: KpiProps) {
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

        <View style={{ flex: '1 1 0', minWidth: 0, gap: 6 }}>
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
              fontSize: 23,
              fontWeight: 600,
              lineHeight: 1.1,
              letterSpacing: -0.9,
              whiteSpace: 'nowrap',
              color: '#ffffff',
            }}
          >
            {value}
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
              <Trans>vs</Trans> {previousPeriodLabel}
            </Text>
          </View>
        </View>
      </View>
    </LabCard>
  );
}
