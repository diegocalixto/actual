import React from 'react';
import { Trans } from 'react-i18next';

import { Text } from '@actual-app/components/text';
import { TextOneLine } from '@actual-app/components/text-one-line';
import { View } from '@actual-app/components/view';

import { FinancialText } from '#components/FinancialText';
import { PrivacyFilter } from '#components/PrivacyFilter';
import { LabPanel } from '#components/v2lab/LabPanel';

import { formatPlain, formatShare } from './accountsMoney';
import { ACCOUNT_HUE, ACCOUNT_HUE_LITERAL } from './accountsTokens';
import type { ViewAccount } from './accountsViewModel';

type AccountDistributionProps = {
  accounts: ViewAccount[];
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
export function AccountDistribution({ accounts }: AccountDistributionProps) {
  // A share is a share *of something*, and the something here is the money the
  // file holds. A debt is not part of that whole, and taking its magnitude as a
  // weight — which is what this did — makes every other share a fraction of a
  // number the panel never prints: against one mortgage, an account holding
  // R$ 190 of a R$ 43.108 total came out as "0,0%", and the mortgage itself
  // came out as "46,8%" of a distribution it is not inside.
  //
  // So the ring divides the positive balances, an overdrawn account is listed
  // with its real figure and no share at all, and the caption says so whenever
  // one is present. Nothing here changes for a file where every account holds
  // something, which is what the approved reference shows.
  const weights = accounts.map(account => Math.max(account.balance ?? 0, 0));
  const weightTotal = weights.reduce((sum, weight) => sum + weight, 0);

  const hasLiability = accounts.some(
    account => account.balance !== null && account.balance < 0,
  );

  // A sum is only a sum once every part has arrived. A balance still in flight
  // weighs nothing, so drawing the ring early would hand its whole arc to
  // whichever accounts happened to resolve first — one of them briefly reading
  // 100% — and then jump. Until every cell is in, the ring is a plain track and
  // every share is a dash, which is what the rest of this screen does with a
  // figure it does not yet know.
  const isPending = accounts.some(account => account.balance === null);
  const isDrawable = weightTotal > 0 && !isPending;

  // The figure in the middle is the whole the ring divides, not the file's net
  // worth: a centre reading R$ 43.108 inside a ring that splits R$ 355.663
  // silently invites every share to be read against the wrong number. Where no
  // account is overdrawn the two are the same figure, so this is the panel's
  // own total on any file the reference describes — and the hero above still
  // prints the net total, in much larger type, a few pixels away.

  let offset = 0;

  return (
    <LabPanel style={{ backgroundColor: 'var(--dfl-surface-raised)' }}>
      <View style={{ padding: '18px 22px 18px', gap: 16 }}>
        <View style={{ gap: 5 }}>
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
          {hasLiability && (
            <Text style={{ fontSize: 11.5, color: 'var(--dfl-text-3)' }}>
              <Trans>
                The ring, its total and its shares cover positive balances only.
              </Trans>
            </Text>
          )}
        </View>

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
                {isPending ? (
                  '—'
                ) : (
                  <PrivacyFilter>
                    {formatPlain(weightTotal).split(',')[0]}
                  </PrivacyFilter>
                )}
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
                    color:
                      account.balance !== null && account.balance < 0
                        ? 'var(--dfl-negative)'
                        : '#ffffff',
                  }}
                >
                  {account.balance === null ? (
                    '—'
                  ) : (
                    <PrivacyFilter>
                      {formatPlain(account.balance)}
                    </PrivacyFilter>
                  )}
                </FinancialText>
                {/* An account with no slice gets no percentage. A dash says
                    "outside this split"; a "0,0%" would say "you have almost
                    nothing there", which is the opposite of a large debt. */}
                <Text
                  style={{
                    flex: '0 0 44px',
                    fontSize: 12.5,
                    textAlign: 'right',
                    whiteSpace: 'nowrap',
                    color: 'var(--dfl-text-3)',
                  }}
                >
                  {isDrawable && account.balance !== null && account.balance > 0
                    ? formatShare(weights[index] / weightTotal)
                    : '—'}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </LabPanel>
  );
}
