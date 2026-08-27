import React from 'react';
import type { ReactNode } from 'react';
import { Trans } from 'react-i18next';

import {
  SvgArrowThinDown,
  SvgArrowThinUp,
} from '@actual-app/components/icons/v1';
import { Text } from '@actual-app/components/text';
import { View } from '@actual-app/components/view';

import { FinancialText } from '#components/FinancialText';

import { formatBRL, formatPercent } from './accountsMoney';

type AccountsHeroProps = {
  /** `null` while the balances load; the figure is never guessed at. */
  total: number | null;
  accountCount: number;
  /** Ratio against the close of last month. `null` ⇒ the chip is omitted. */
  monthChange: number | null;
  /** `null` ⇒ the stat is omitted rather than inventing a sync time. */
  lastUpdate: string | null;
};

/**
 * The dominant element of the page.
 *
 * Its surface is a deep navy-to-charcoal ramp carrying one cold blue reflection
 * that enters high on the right and sweeps down across the plate. The
 * reflection is built in four layers — an ambient bloom, a wide blurred band, a
 * tighter blurred band, and a thin bright core — because a single stroke reads
 * as a line drawn *on* the card, and this has to read as light *in* it.
 */
export function AccountsHero({
  total,
  accountCount,
  monthChange,
  lastUpdate,
}: AccountsHeroProps) {
  return (
    <View
      style={{
        position: 'relative',
        borderRadius: 'var(--dfl-radius)',
        border: '1px solid var(--dfl-hero-line)',
        boxShadow:
          'var(--dfl-shadow-hero), inset 0 1px 0 rgba(150, 195, 255, 0.18)',
        backgroundImage:
          'linear-gradient(112deg, #080d18 0%, #0a1424 46%, #0c1e3a 78%, #0a1830 100%)',
        overflow: 'hidden',
      }}
    >
      <HeroLight />

      <View
        style={{
          position: 'relative',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 32,
          padding: '30px 36px',
          minHeight: 188,
        }}
      >
        <View style={{ gap: 12, minWidth: 0 }}>
          <Text
            style={{
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: 1.4,
              textTransform: 'uppercase',
              color: 'var(--dfl-text-2)',
            }}
          >
            <Trans>Total balance</Trans>
          </Text>

          <FinancialText
            style={{
              fontSize: 46,
              fontWeight: 700,
              lineHeight: 1.04,
              letterSpacing: -1.6,
              color: '#ffffff',
              whiteSpace: 'nowrap',
              textShadow: '0 2px 26px rgba(120, 175, 245, 0.3)',
            }}
          >
            {total === null ? '—' : formatBRL(total)}
          </FinancialText>

          {/* Omitted outright when it cannot be computed: a month with no
              close to compare against has no percentage, and printing one
              would be inventing the comparison. */}
          {monthChange !== null && (
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}
            >
              <ChangeChip ratio={monthChange} />
              <Text style={{ fontSize: 13, color: 'var(--dfl-text-2)' }}>
                <Trans>vs last month</Trans>
              </Text>
            </View>
          )}
        </View>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-start',
            flexShrink: 0,
            gap: 54,
          }}
        >
          <Stat label={<Trans>Accounts</Trans>} value={String(accountCount)} />
          {lastUpdate !== null && (
            <Stat label={<Trans>Last update</Trans>} value={lastUpdate} />
          )}
        </View>
      </View>
    </View>
  );
}

/**
 * The month-over-month chip.
 *
 * The reference only ever drew the rising case; real balances fall too, so the
 * arrow and the hue follow the sign instead of being fixed to green.
 */
function ChangeChip({ ratio }: { ratio: number }) {
  const isUp = ratio >= 0;
  const Arrow = isUp ? SvgArrowThinUp : SvgArrowThinDown;
  const color = isUp ? 'var(--dfl-positive)' : 'var(--dfl-negative)';
  // The rgb of `--dfl-positive` / `--dfl-negative`, written out because these
  // two need an alpha the tokens do not carry.
  const tint = isUp ? '58, 208, 127' : '248, 122, 109';

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        padding: '4px 10px 4px 7px',
        borderRadius: 999,
        backgroundColor: `rgba(${tint}, 0.13)`,
        border: `1px solid rgba(${tint}, 0.28)`,
      }}
    >
      <Arrow aria-hidden="true" width={12} height={12} style={{ color }} />
      <Text
        style={{
          fontSize: 12.5,
          fontWeight: 600,
          color,
          whiteSpace: 'nowrap',
        }}
      >
        {formatPercent(Math.abs(ratio))}
      </Text>
    </View>
  );
}

function Stat({ label, value }: { label: ReactNode; value: string }) {
  return (
    <View style={{ gap: 9 }}>
      <Text
        style={{
          fontSize: 11.5,
          fontWeight: 600,
          letterSpacing: 1.2,
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
          color: 'var(--dfl-text-3)',
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          fontSize: 19,
          fontWeight: 600,
          letterSpacing: -0.3,
          whiteSpace: 'nowrap',
          color: '#ffffff',
        }}
      >
        {value}
      </Text>
    </View>
  );
}

const ARC = 'M 560 -110 C 830 -10, 985 90, 1090 300';

/** The reflection: ambient bloom, two blurred bands, one bright core. */
function HeroLight() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 1200 180"
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
        <linearGradient id="dfaArc" x1="0.2" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#8cc4ff" stopOpacity="0" />
          <stop offset="22%" stopColor="#8cc4ff" stopOpacity="0.85" />
          <stop offset="46%" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="74%" stopColor="#4d9bf5" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#2b6fd0" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="dfaGlow" cx="0.79" cy="0.04" r="0.68">
          <stop offset="0%" stopColor="#3f8ce8" stopOpacity="0.52" />
          <stop offset="48%" stopColor="#1d5fd0" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#1d5fd0" stopOpacity="0" />
        </radialGradient>
        <filter id="dfaWide" x="-30%" y="-200%" width="160%" height="500%">
          <feGaussianBlur stdDeviation="22" />
        </filter>
        <filter id="dfaTight" x="-30%" y="-200%" width="160%" height="500%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>

      {/* Where the light enters the plate. */}
      <rect x="0" y="0" width="1200" height="180" fill="url(#dfaGlow)" />

      <path
        d={ARC}
        fill="none"
        stroke="url(#dfaArc)"
        strokeWidth="34"
        strokeLinecap="round"
        filter="url(#dfaWide)"
        opacity="0.55"
      />
      <path
        d={ARC}
        fill="none"
        stroke="url(#dfaArc)"
        strokeWidth="9"
        strokeLinecap="round"
        filter="url(#dfaTight)"
        opacity="0.9"
      />
      <path
        d={ARC}
        fill="none"
        stroke="url(#dfaArc)"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
