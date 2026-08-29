import React from 'react';
import type { ReactNode } from 'react';

import {
  SvgArrowThinDown,
  SvgArrowThinUp,
} from '@actual-app/components/icons/v1';
import { Text } from '@actual-app/components/text';
import { View } from '@actual-app/components/view';

import { HomeMobileMoney } from './HomeMobileMoney';

/**
 * How a figure's direction is decided.
 *
 * `in` and `out` are fixed by the label: income is money arriving and the
 * month's spending is money leaving, whatever sign the cell carries, so the
 * arrow and the colour state the direction and the magnitude is printed
 * unsigned — "SAÍDAS −R$ 4.210,00" would say the same thing twice.
 *
 * `signed` is for the month's net, where the sign *is* the verdict: it keeps
 * its minus so a negative month can never be mistaken for a positive one.
 */
type Flow = 'in' | 'out' | 'signed';

type HomeMobileMonthMetricProps = {
  label: ReactNode;
  /** Integer minor units as the cell publishes them, or `null` while loading. */
  value: number | null;
  flow: Flow;
};

/**
 * One of the month's three figures.
 *
 * The badge restates the direction of the number beside it and nothing more.
 * It is deliberately not a trend: this screen reads one month, so an arrow
 * meaning "up on last month" would be a claim about data it never asked for.
 */
export function HomeMobileMonthMetric({
  label,
  value,
  flow,
}: HomeMobileMonthMetricProps) {
  const isIn = flow === 'signed' ? value === null || value >= 0 : flow === 'in';
  const tone = isIn ? 'var(--dfl-positive)' : 'var(--dfl-negative)';
  const Icon = isIn ? SvgArrowThinUp : SvgArrowThinDown;
  const shown = value === null || flow === 'signed' ? value : Math.abs(value);

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
        <HomeMobileMoney
          value={shown}
          withCurrency
          style={{
            // A third of the width has to hold "R$ 15.490,00" and its badge on
            // one line. At a fixed size that fits a 428pt screen and spills out
            // of the column on a 375pt one, so the figure tracks the viewport
            // and stops growing once it reaches the approved size.
            fontSize: 'clamp(11px, 3.3vw, 14px)',
            fontWeight: 700,
            letterSpacing: -0.3,
            color: tone,
          }}
        />
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
