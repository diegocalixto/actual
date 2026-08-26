import React from 'react';
import { Trans } from 'react-i18next';

import { Text } from '@actual-app/components/text';
import { View } from '@actual-app/components/view';

import { FinancialText } from '#components/FinancialText';

import { formatBRL } from './budgetMoney';

type BudgetRingProps = {
  income: number;
  budgeted: number;
};

const SIZE = 176;
const STROKE = 11;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * The month's income, and how much of it is already committed.
 *
 * A full ring labelled "100%" would only restate its own centre, so the ring
 * carries the one division the four figures beside it are all relative to: the
 * violet arc is what the envelopes already claim, the blue arc is what is still
 * free. Both arcs are drawn from the same two numbers the band prints.
 */
export function BudgetRing({ income, budgeted }: BudgetRingProps) {
  const plannedRatio = income > 0 ? Math.min(1, budgeted / income) : 0;
  const plannedLength = CIRCUMFERENCE * plannedRatio;

  return (
    <View
      style={{
        flex: '0 0 auto',
        width: SIZE,
        height: SIZE,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}
    >
      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        aria-hidden="true"
        style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }}
      >
        <defs>
          <filter id="dfrGlow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
        </defs>

        {/* The bloom. Drawn first and blurred, so the sharp strokes above it
            sit on light instead of being outlined by it. */}
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="var(--dfl-blue)"
          strokeWidth={STROKE}
          strokeDasharray={CIRCUMFERENCE}
          filter="url(#dfrGlow)"
          opacity={0.35}
        />

        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="var(--dfl-inset)"
          strokeWidth={STROKE}
        />
        {/* Still free — the remainder, drawn first so the committed arc caps it. */}
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="var(--dfl-blue)"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={0}
          opacity={0.9}
        />
        {/* Already planned into envelopes. */}
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="var(--dfl-violet)"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={`${plannedLength} ${CIRCUMFERENCE}`}
          strokeDashoffset={0}
        />
      </svg>

      <View style={{ alignItems: 'center', gap: 3, zIndex: 1 }}>
        <Text
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 1.3,
            textTransform: 'uppercase',
            color: 'var(--dfl-text-3)',
          }}
        >
          <Trans>Renda</Trans>
        </Text>
        <FinancialText
          style={{
            fontSize: 18,
            fontWeight: 600,
            letterSpacing: -0.4,
            color: 'var(--dfl-text)',
            whiteSpace: 'nowrap',
          }}
        >
          {formatBRL(income)}
        </FinancialText>
      </View>
    </View>
  );
}
