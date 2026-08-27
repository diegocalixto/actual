import React from 'react';
import { Trans } from 'react-i18next';

import { Text } from '@actual-app/components/text';
import { TextOneLine } from '@actual-app/components/text-one-line';
import { View } from '@actual-app/components/view';

import { FinancialText } from '#components/FinancialText';
import { LabPanel } from '#components/v2lab/LabPanel';

import { formatPlain, formatShare } from './accountsMoney';
import { ACCOUNT_HUE, ACCOUNT_HUE_LITERAL } from './accountsTokens';
import type { ViewAccount } from './accountsViewModel';

type AccountDistributionProps = {
  accounts: ViewAccount[];
  /** `null` while the balances load. */
  total: number | null;
};

const SIZE = 190;
const STROKE = 34;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
/** The reference's slices meet edge to edge; the hues alone separate them. */
const GAP = 0;

/**
 * Where the money sits, as one shape.
 *
 * Each slice takes its hue from the same account whose tile and connector carry
 * it on the left, so the ring can be read against the list without a legend —
 * the legend is there for the exact figures, not to decode the colours. Every
 * share is computed from the balances, never written down.
 */
export function AccountDistribution({
  accounts,
  total,
}: AccountDistributionProps) {
  // The ring answers "how is the money split", so it is drawn over the weight
  // of each account, not its sign. An overdrawn account still occupies a share
  // of the picture; what it must not do is subtract arc from its neighbours and
  // leave the ring short. The legend keeps the signed figure.
  const weights = accounts.map(account => Math.abs(account.balance ?? 0));
  const weightTotal = weights.reduce((sum, weight) => sum + weight, 0);
  const isDrawable = weightTotal > 0;

  let offset = 0;

  return (
    <LabPanel style={{ backgroundColor: 'var(--dfl-surface-raised)' }}>
      <View style={{ padding: '18px 22px 18px', gap: 16 }}>
        <Text
          style={{
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: 1.3,
            textTransform: 'uppercase',
            color: 'var(--dfl-text)',
          }}
        >
          <Trans>Account distribution</Trans>
        </Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 26 }}>
          <View
            style={{
              flex: '0 0 auto',
              width: SIZE,
              height: SIZE,
              position: 'relative',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg
              width={SIZE}
              height={SIZE}
              viewBox={`0 0 ${SIZE} ${SIZE}`}
              aria-hidden="true"
              style={{
                position: 'absolute',
                inset: 0,
                transform: 'rotate(-90deg)',
              }}
            >
              <defs>
                <filter
                  id="dfaDonutGlow"
                  x="-25%"
                  y="-25%"
                  width="150%"
                  height="150%"
                >
                  <feGaussianBlur stdDeviation="7" />
                </filter>
              </defs>

              {/* Nothing to split yet: one neutral track, so the panel reads as
                  a ring waiting for figures rather than a broken chart. */}
              {!isDrawable && (
                <circle
                  cx={SIZE / 2}
                  cy={SIZE / 2}
                  r={RADIUS}
                  fill="none"
                  stroke="var(--dfl-line-strong)"
                  strokeWidth={STROKE}
                />
              )}

              {isDrawable &&
                accounts.map((account, index) => {
                  const length = (weights[index] / weightTotal) * CIRCUMFERENCE;
                  const dash = `${Math.max(0, length - GAP)} ${CIRCUMFERENCE}`;
                  const rotation = -offset;
                  offset += length;

                  return (
                    <g key={account.id}>
                      <circle
                        cx={SIZE / 2}
                        cy={SIZE / 2}
                        r={RADIUS}
                        fill="none"
                        stroke={ACCOUNT_HUE_LITERAL[account.hue]}
                        strokeWidth={STROKE}
                        strokeDasharray={dash}
                        strokeDashoffset={rotation}
                        filter="url(#dfaDonutGlow)"
                        opacity={0.45}
                      />
                      <circle
                        cx={SIZE / 2}
                        cy={SIZE / 2}
                        r={RADIUS}
                        fill="none"
                        stroke={ACCOUNT_HUE_LITERAL[account.hue]}
                        strokeWidth={STROKE}
                        strokeDasharray={dash}
                        strokeDashoffset={rotation}
                      />
                    </g>
                  );
                })}
            </svg>

            <View
              style={{
                width: SIZE - STROKE * 2 - 6,
                height: SIZE - STROKE * 2 - 6,
                borderRadius: 999,
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1,
                zIndex: 1,
                backgroundColor: '#070b12',
                boxShadow: 'inset 0 0 22px -6px rgba(90, 166, 255, 0.5)',
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--dfl-text-3)',
                }}
              >
                R$
              </Text>
              <FinancialText
                style={{
                  fontSize: 17,
                  fontWeight: 600,
                  letterSpacing: -0.4,
                  color: '#ffffff',
                  whiteSpace: 'nowrap',
                }}
              >
                {total === null ? '—' : formatPlain(total).split(',')[0]}
              </FinancialText>
            </View>
          </View>

          <View style={{ flex: '1 1 0', minWidth: 0, maxWidth: 460, gap: 3 }}>
            {accounts.map((account, index) => (
              <View
                key={account.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 11,
                  height: 33,
                }}
              >
                <View
                  aria-hidden="true"
                  style={{
                    width: 9,
                    height: 9,
                    flexShrink: 0,
                    borderRadius: 999,
                    backgroundColor: ACCOUNT_HUE[account.hue],
                    boxShadow: `0 0 9px -1px ${ACCOUNT_HUE[account.hue]}`,
                  }}
                />
                <TextOneLine
                  style={{
                    flex: '1 1 0',
                    minWidth: 0,
                    fontSize: 13.5,
                    color: 'var(--dfl-text)',
                  }}
                >
                  {account.name}
                </TextOneLine>
                {/* Prefix greyed, figure white — the reference's own split,
                    and it keeps the numbers themselves in one clean column. */}
                <Text
                  style={{
                    flex: '0 0 auto',
                    fontSize: 12.5,
                    fontWeight: 500,
                    color: 'var(--dfl-text-3)',
                  }}
                >
                  R$
                </Text>
                <FinancialText
                  style={{
                    flex: '0 0 84px',
                    fontSize: 13.5,
                    fontWeight: 600,
                    textAlign: 'right',
                    whiteSpace: 'nowrap',
                    color: '#ffffff',
                  }}
                >
                  {account.balance === null
                    ? '—'
                    : formatPlain(account.balance)}
                </FinancialText>
                <Text
                  style={{
                    flex: '0 0 44px',
                    fontSize: 12.5,
                    textAlign: 'right',
                    whiteSpace: 'nowrap',
                    color: 'var(--dfl-text-3)',
                  }}
                >
                  {isDrawable ? formatShare(weights[index] / weightTotal) : '—'}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </LabPanel>
  );
}
