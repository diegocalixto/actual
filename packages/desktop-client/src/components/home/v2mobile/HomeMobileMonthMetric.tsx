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

/** The badge beside the figure, and the space between the two. */
const BADGE_SIZE = 14;
const BADGE_GAP = 4;

/** What the figure's line has left once the badge has taken its share. */
export const MONTH_FIGURE_ROOM = `100cqi - ${BADGE_SIZE + BADGE_GAP}px`;
/** The tracking the three figures are set with, which their fit accounts for. */
export const MONTH_FIGURE_TRACKING = -0.3;

/**
 * The amount a metric prints: the magnitude where the label already gives the
 * direction, the signed figure where the sign is the verdict.
 */
export function shownAmount(value: number | null, flow: Flow) {
  return value === null || flow === 'signed' ? value : Math.abs(value);
}

type HomeMobileMonthMetricProps = {
  label: ReactNode;
  /** Integer minor units as the cell publishes them, or `null` while loading. */
  value: number | null;
  flow: Flow;
  /**
   * The size the figure is set at, decided by the card: the three share one,
   * fitted to the longest of them.
   */
  figureSize: string;
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
  figureSize,
}: HomeMobileMonthMetricProps) {
  const isIn = flow === 'signed' ? value === null || value >= 0 : flow === 'in';
  const tone = isIn ? 'var(--dfl-positive)' : 'var(--dfl-negative)';
  const Icon = isIn ? SvgArrowThinUp : SvgArrowThinDown;
  const shown = shownAmount(value, flow);

  return (
    <View
      style={{
        flex: '1 1 0',
        minWidth: 0,
        gap: 7,
        padding: '0 6px',
        // The column's own width is what its figure is fitted to.
        containerType: 'inline-size',
      }}
    >
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

      <View
        style={{ flexDirection: 'row', alignItems: 'center', gap: BADGE_GAP }}
      >
        <HomeMobileMoney
          value={shown}
          withCurrency
          style={{
            fontSize: figureSize,
            fontWeight: 700,
            letterSpacing: MONTH_FIGURE_TRACKING,
            color: tone,
          }}
        />
        <View
          aria-hidden="true"
          style={{
            flexShrink: 0,
            alignItems: 'center',
            justifyContent: 'center',
            width: BADGE_SIZE,
            height: BADGE_SIZE,
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
