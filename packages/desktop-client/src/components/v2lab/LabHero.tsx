import React from 'react';
import { Trans } from 'react-i18next';

import { Text } from '@actual-app/components/text';
import { View } from '@actual-app/components/view';

import { FinancialText } from '#components/FinancialText';

import { formatMoney } from './labMoney';

type LabHeroProps = {
  /** Integer minor units, as Actual stores money. */
  available: number;
  /** Envelope budgets only; `null` hides the strip entirely. */
  toBudget: number | null;
};

/**
 * The dominant element of the Overview.
 *
 * Its surface is a shallow navy-to-charcoal ramp with one cold blue reflection
 * sweeping in from the top-right — light on machined metal, not a blue card.
 * The arc is drawn as a stroked path with a blurred twin underneath for the
 * halo, so it reads as a highlight with depth rather than as a neon line.
 */
export function LabHero({ available, toBudget }: LabHeroProps) {
  return (
    <View
      style={{
        position: 'relative',
        borderRadius: 'var(--dfl-radius)',
        border: '1px solid var(--dfl-hero-line)',
        boxShadow: 'var(--dfl-shadow-hero)',
        backgroundImage:
          'linear-gradient(118deg, var(--dfl-hero-from) 0%, var(--dfl-hero-to) 62%, #0d1a2e 100%)',
        overflow: 'hidden',
      }}
    >
      <HeroLight />

      <View
        style={{
          position: 'relative',
          padding: '30px 32px 26px',
          gap: 10,
          minHeight: 188,
          justifyContent: 'center',
        }}
      >
        <Text
          style={{
            fontSize: 11.5,
            fontWeight: 600,
            letterSpacing: 1.2,
            textTransform: 'uppercase',
            color: 'var(--dfl-text-2)',
          }}
        >
          <Trans>Available balance</Trans>
        </Text>

        <FinancialText
          style={{
            fontSize: 54,
            fontWeight: 700,
            lineHeight: 1.05,
            letterSpacing: -1.6,
            color: '#ffffff',
            whiteSpace: 'nowrap',
          }}
        >
          {formatMoney(available)}
        </FinancialText>

        <Text style={{ fontSize: 13.5, color: 'var(--dfl-text-2)' }}>
          <Trans>Sum of on-budget accounts</Trans>
        </Text>
      </View>

      {toBudget !== null && (
        <View
          style={{
            position: 'relative',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            padding: '15px 32px',
            borderTop: '1px solid var(--dfl-hero-line)',
            backgroundColor: 'rgba(4, 8, 16, 0.42)',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            {/* White, per the approved reference — the dot, the label and the
                value all stay out of the violet accent. */}
            <View
              aria-hidden="true"
              style={{
                width: 6,
                height: 6,
                flexShrink: 0,
                borderRadius: 999,
                backgroundColor: '#ffffff',
              }}
            />
            <Text
              style={{
                fontSize: 11.5,
                fontWeight: 600,
                letterSpacing: 1.1,
                textTransform: 'uppercase',
                color: '#ffffff',
              }}
            >
              <Trans>To Budget</Trans>
            </Text>
          </View>

          <FinancialText
            style={{
              fontSize: 19,
              fontWeight: 600,
              letterSpacing: -0.2,
              color: '#ffffff',
              whiteSpace: 'nowrap',
            }}
          >
            {formatMoney(toBudget)}
          </FinancialText>
        </View>
      )}
    </View>
  );
}

/**
 * The reflection. Absolutely positioned, non-scaling on the vertical axis so
 * the curve keeps its shape as the card widens.
 */
function HeroLight() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 800 260"
      preserveAspectRatio="none"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
      }}
    >
      <defs>
        <linearGradient id="dflArc" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--dfl-blue)" stopOpacity="0" />
          <stop offset="38%" stopColor="var(--dfl-blue)" stopOpacity="0.95" />
          <stop offset="72%" stopColor="var(--dfl-blue)" stopOpacity="0.55" />
          <stop offset="100%" stopColor="var(--dfl-blue)" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="dflGlow" cx="0.78" cy="0.06" r="0.62">
          <stop
            offset="0%"
            stopColor="var(--dfl-blue-deep)"
            stopOpacity="0.5"
          />
          <stop
            offset="55%"
            stopColor="var(--dfl-blue-deep)"
            stopOpacity="0.12"
          />
          <stop
            offset="100%"
            stopColor="var(--dfl-blue-deep)"
            stopOpacity="0"
          />
        </radialGradient>
        <filter id="dflBlur" x="-30%" y="-60%" width="160%" height="260%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
      </defs>

      {/* Ambient bloom where the light enters the surface. */}
      <rect x="0" y="0" width="800" height="260" fill="url(#dflGlow)" />

      {/* Halo, then the highlight itself. */}
      <path
        d="M 292 -34 C 470 44, 618 116, 812 268"
        fill="none"
        stroke="url(#dflArc)"
        strokeWidth="5"
        strokeLinecap="round"
        filter="url(#dflBlur)"
        opacity="0.5"
      />
      <path
        d="M 292 -34 C 470 44, 618 116, 812 268"
        fill="none"
        stroke="url(#dflArc)"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}
