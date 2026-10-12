import React from 'react';
import type { ReactNode } from 'react';

import { Text } from '@actual-app/components/text';
import { View } from '@actual-app/components/view';

import { FinancialText } from '#components/FinancialText';
import type { EntityIcon } from '#components/v2lab/LabStyle';

import { BudgetMobileAmount } from './BudgetMobileAmount';
import { BudgetMobileProgress } from './BudgetMobileProgress';

/** The tracking the three figures are set with, which their fit accounts for. */
export const METRIC_FIGURE_TRACKING = -0.3;

type BudgetMobileMetricProps = {
  label: ReactNode;
  /** Integer minor units, or `null` while the cell is still resolving. */
  value: number | null;
  /**
   * The size the figure is set at, decided by the row: the three tiles share
   * one, fitted to the longest of their figures.
   */
  figureSize: string;
  Icon: EntityIcon;
  tone: string;
  /** How full this figure is relative to its own reference, 0–100. */
  percent: number | null;
};

/**
 * One of the month's three figures.
 *
 * Label, amount, and a short bar underneath tying the card to the same visual
 * grammar the categories use further down. The bar is the card's own share of
 * the month's income, so the three read as one family measured against one
 * thing, not as three unrelated widgets that happen to sit in a row.
 */
export function BudgetMobileMetric({
  label,
  value,
  figureSize,
  Icon,
  tone,
  percent,
}: BudgetMobileMetricProps) {
  return (
    <View
      style={{
        flex: '1 1 0',
        minWidth: 0,
        gap: 7,
        padding: '11px 8px 10px',
        // The tile's own width is what its figure is fitted to.
        containerType: 'inline-size',
        borderRadius: 'var(--dfmb-radius-sm)',
        border: '1px solid var(--dfl-line-strong)',
        backgroundColor: 'var(--dfl-surface)',
        backgroundImage: 'var(--dfmb-panel-sheen)',
        boxShadow: 'var(--dfl-shadow), 0 1px 0 rgba(0, 0, 0, 0.5)',
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
        <Icon
          aria-hidden="true"
          width={13}
          height={13}
          style={{ flexShrink: 0, color: tone }}
        />
        <Text
          style={{
            // "SALDO DO MÊS" is the longest of the three and must survive a
            // 375pt screen without being cut: it shrinks with the viewport and
            // stops at the size the proposal draws.
            fontSize: 'clamp(8px, 2.3vw, 9.5px)',
            fontWeight: 600,
            letterSpacing: 0.4,
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            color: 'var(--dfmb-label)',
          }}
        >
          {label}
        </Text>
      </View>

      <FinancialText
        style={{
          fontSize: figureSize,
          fontWeight: 700,
          letterSpacing: METRIC_FIGURE_TRACKING,
          whiteSpace: 'nowrap',
          color: 'var(--dfl-text)',
        }}
      >
        <BudgetMobileAmount value={value} />
      </FinancialText>

      <BudgetMobileProgress percent={percent} tone={tone} height={3} />
    </View>
  );
}
