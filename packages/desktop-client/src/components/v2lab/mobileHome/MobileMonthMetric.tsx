import React from 'react';
import type { ReactNode } from 'react';

import {
  SvgArrowThinDown,
  SvgArrowThinUp,
} from '@actual-app/components/icons/v1';
import { Text } from '@actual-app/components/text';
import { View } from '@actual-app/components/view';

import { FinancialText } from '#components/FinancialText';

import { CURRENCY, formatAmount } from './mobileHomeMoney';

type MobileMonthMetricProps = {
  label: ReactNode;
  /** Integer minor units, always positive: the direction is `flow`. */
  amount: number;
  /** Money arriving reads green and points up; money leaving, coral and down. */
  flow: 'in' | 'out';
};

/**
 * One of the month's three figures.
 *
 * The badge restates the sign of the number beside it — in or out — and nothing
 * more. It is deliberately not a trend: this laboratory holds one month of
 * fixtures, so an arrow meaning "up on last month" would be a claim about data
 * that does not exist here.
 */
export function MobileMonthMetric({
  label,
  amount,
  flow,
}: MobileMonthMetricProps) {
  const isIn = flow === 'in';
  const tone = isIn ? 'var(--dfl-positive)' : 'var(--dfl-negative)';
  const Icon = isIn ? SvgArrowThinUp : SvgArrowThinDown;

  return (
    <View style={{ flex: '1 1 0', minWidth: 0, gap: 7, padding: '0 6px' }}>
      <Text
        style={{
          fontSize: 9.5,
          fontWeight: 600,
          letterSpacing: 0.9,
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
          color: 'var(--dfl-text-3)',
        }}
      >
        {label}
      </Text>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <FinancialText
          style={{
            // A third of the width has to hold "R$ 15.490,00" and its badge on
            // one line. At a fixed size that fits a 428pt screen and spills out
            // of the column on a 375pt one, so the figure tracks the viewport
            // and stops growing once it reaches the size the proposal draws.
            fontSize: 'clamp(11px, 3.3vw, 14px)',
            fontWeight: 700,
            letterSpacing: -0.3,
            whiteSpace: 'nowrap',
            color: tone,
          }}
        >
          {`${CURRENCY} ${formatAmount(amount)}`}
        </FinancialText>
        <View
          aria-hidden="true"
          style={{
            flexShrink: 0,
            alignItems: 'center',
            justifyContent: 'center',
            width: 14,
            height: 14,
            borderRadius: 999,
            border: `1px solid ${tone}`,
            opacity: 0.75,
          }}
        >
          <Icon width={8} height={8} style={{ color: tone }} />
        </View>
      </View>
    </View>
  );
}
