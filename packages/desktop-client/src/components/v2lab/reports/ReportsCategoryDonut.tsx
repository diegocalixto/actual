import React from 'react';
import type { ReactNode } from 'react';
import { Trans } from 'react-i18next';

import { SvgCheveronRight } from '@actual-app/components/icons/v1';
import { Text } from '@actual-app/components/text';
import { TextOneLine } from '@actual-app/components/text-one-line';
import { View } from '@actual-app/components/view';

import { FinancialText } from '#components/FinancialText';

import { CardHeading, LabCard } from './LabCard';
import { LabPill } from './LabPill';
import type { ExpenseCategory } from './reportsFixtures';
import { formatCompact, formatPercent, formatPlain } from './reportsMoney';
import { CATEGORY_HUE } from './reportsTokens';

type ReportsCategoryDonutProps = {
  categories: (ExpenseCategory & { share: number })[];
  total: number;
};

const SIZE = 150;
const STROKE = 30;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * Where the month's spending went, as one shape.
 *
 * The ring and its legend are one block, not two: the donut sits tight against
 * the rows so the eye crosses from a slice to its figure without travelling.
 * Slices meet edge to edge — the hues alone separate them — and every share is
 * computed from the amounts, which sum to the expenses total by construction.
 */
export function ReportsCategoryDonut({
  categories,
  total,
}: ReportsCategoryDonutProps) {
  let offset = 0;

  return (
    <LabCard>
      <View style={{ padding: '16px 20px 14px', gap: 13 }}>
        <CardHeading
          title={<Trans>Expenses by category</Trans>}
          action={
            <LabPill>
              <Trans>This month</Trans>
            </LabPill>
          }
        />

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
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
                  id="dfrDonut"
                  x="-25%"
                  y="-25%"
                  width="150%"
                  height="150%"
                >
                  <feGaussianBlur stdDeviation="6" />
                </filter>
              </defs>

              {categories.map(category => {
                const length = (category.amount / total) * CIRCUMFERENCE;
                const rotation = -offset;
                offset += length;
                const color = CATEGORY_HUE[category.hue];

                return (
                  <g key={category.id}>
                    <circle
                      cx={SIZE / 2}
                      cy={SIZE / 2}
                      r={RADIUS}
                      fill="none"
                      stroke={color}
                      strokeWidth={STROKE}
                      strokeDasharray={`${length} ${CIRCUMFERENCE}`}
                      strokeDashoffset={rotation}
                      filter="url(#dfrDonut)"
                      opacity={0.45}
                    />
                    <circle
                      cx={SIZE / 2}
                      cy={SIZE / 2}
                      r={RADIUS}
                      fill="none"
                      stroke={color}
                      strokeWidth={STROKE}
                      strokeDasharray={`${length} ${CIRCUMFERENCE}`}
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
                zIndex: 1,
                backgroundColor: '#070b12',
                boxShadow: 'inset 0 0 20px -6px rgba(90, 166, 255, 0.45)',
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--dfl-text-3)',
                }}
              >
                R$
              </Text>
              <FinancialText
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  letterSpacing: -0.4,
                  whiteSpace: 'nowrap',
                  color: '#ffffff',
                }}
              >
                {formatCompact(total)}
              </FinancialText>
              <Text
                style={{
                  fontSize: 10.5,
                  letterSpacing: 0.4,
                  color: 'var(--dfl-text-3)',
                }}
              >
                <Trans>Total</Trans>
              </Text>
            </View>
          </View>

          <View style={{ flex: '1 1 0', minWidth: 0, gap: 2 }}>
            {categories.map(category => (
              <View
                key={category.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 9,
                  height: 25,
                }}
              >
                <View
                  aria-hidden="true"
                  style={{
                    width: 8,
                    height: 8,
                    flexShrink: 0,
                    borderRadius: 999,
                    backgroundColor: CATEGORY_HUE[category.hue],
                    boxShadow: `0 0 8px -1px ${CATEGORY_HUE[category.hue]}`,
                  }}
                />
                <TextOneLine
                  style={{
                    flex: '1 1 0',
                    minWidth: 0,
                    fontSize: 13,
                    color: 'var(--dfl-text)',
                  }}
                >
                  {category.name}
                </TextOneLine>
                <Text
                  style={{
                    fontSize: 11.5,
                    color: 'var(--dfl-text-3)',
                  }}
                >
                  R$
                </Text>
                <FinancialText
                  style={{
                    flex: '0 0 76px',
                    fontSize: 12.5,
                    fontWeight: 600,
                    textAlign: 'right',
                    whiteSpace: 'nowrap',
                    color: 'var(--dfl-text)',
                  }}
                >
                  {formatPlain(category.amount)}
                </FinancialText>
                <Text
                  style={{
                    flex: '0 0 44px',
                    fontSize: 12,
                    textAlign: 'right',
                    whiteSpace: 'nowrap',
                    color: 'var(--dfl-text-3)',
                  }}
                >
                  {formatPercent(category.share)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <CardLink>
          <Trans>View all categories</Trans>
        </CardLink>
      </View>
    </LabCard>
  );
}

/** The trailing link every side panel closes with. */
export function CardLink({ children }: { children: ReactNode }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingTop: 12,
        borderTop: '1px solid var(--dfl-line)',
      }}
    >
      <Text
        style={{
          fontSize: 12.5,
          fontWeight: 600,
          whiteSpace: 'nowrap',
          color: 'var(--dfl-blue)',
        }}
      >
        {children}
      </Text>
      <SvgCheveronRight
        aria-hidden="true"
        width={14}
        height={14}
        style={{ color: 'var(--dfl-blue)' }}
      />
    </View>
  );
}
