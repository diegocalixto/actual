import React, { useState } from 'react';
import type { ReactNode } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { Button } from '@actual-app/components/button';
import { SvgCheveronRight } from '@actual-app/components/icons/v1';
import { Text } from '@actual-app/components/text';
import { TextOneLine } from '@actual-app/components/text-one-line';
import { View } from '@actual-app/components/view';
import { UNCATEGORIZED_ID } from '@actual-app/core/shared/month-indicators';
import { css } from '@emotion/css';

import { FinancialText } from '#components/FinancialText';
import { PrivacyFilter } from '#components/PrivacyFilter';
import { currencySymbol } from '#components/v2lab/LabStyle';

import { CardLink } from './CardLink';
import { CardHeading, LabCard } from './LabCard';
import { LabPill } from './LabPill';
import type { ExpenseCategory } from './reportsFixtures';
import { formatCompact, formatPercent, formatPlain } from './reportsMoney';
import { CATEGORY_HUE } from './reportsTokens';

type ReportsCategoryDonutProps = {
  categories: (ExpenseCategory & { share: number })[];
  total: number;
  /** How many categories the legend opens on. The ring always draws them all. */
  limit?: number;
  /**
   * What the pill beside the title says the ring covers. Absent ⇒ the current
   * month. `null` ⇒ no pill, for a page that states its period somewhere else.
   */
  periodLabel?: ReactNode;
  /** The phone's arrangement: legend rows a finger's height. */
  compact?: boolean;
  /**
   * What a legend row opens: the transactions it adds up. Absent ⇒ the rows
   * are plain text, which is what the laboratory wants.
   */
  onOpenCategory?: (category: ExpenseCategory) => void;
};

/** Canvas left between two slices, so two of one hue still read as two. */
const SLICE_GAP = 2.5;

const SIZE = 150;
const STROKE = 30;
/** Below this the legend's name column is too narrow to read a name in. */
const LEGEND_MIN_WIDTH = 250;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * Where the month's spending went, as one shape.
 *
 * The ring and its legend are one block, not two: the donut sits tight against
 * the rows so the eye crosses from a slice to its figure without travelling.
 * A sliver of canvas separates the slices: a category keeps its colour on
 * every screen, the palette has few, and two neighbours can share one. Every
 * share is computed from the amounts, which sum to the expenses total by
 * construction. Each legend row opens its category's transactions.
 *
 * The legend opens on the largest few, as the approved card does, and its link
 * brings in the rest in place. With nothing more to list there is no link.
 */
export function ReportsCategoryDonut({
  categories,
  total,
  limit = 6,
  periodLabel,
  compact = false,
  onOpenCategory,
}: ReportsCategoryDonutProps) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const hasMore = categories.length > limit;
  const listed = isExpanded ? categories : categories.slice(0, limit);
  let offset = 0;

  return (
    <LabCard>
      {/* The phone's scope restates the padding, so its cards share one edge. */}
      <View
        style={{ padding: 'var(--dfr-card-padding, 16px 20px 14px)', gap: 13 }}
      >
        <CardHeading
          title={<Trans>Expenses by category</Trans>}
          action={
            periodLabel === null ? undefined : (
              <LabPill>{periodLabel ?? <Trans>This month</Trans>}</LabPill>
            )
          }
        />

        {/* Ring and legend sit side by side wherever the legend keeps room
            for a category's name. In a narrower card the rigid columns — the
            amount and the share — were all that was left, and "Mortgage" read
            "Mo…"; there the legend takes its own line under the ring. */}
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 18,
          }}
        >
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
                const drawn =
                  categories.length > 1
                    ? Math.max(0, length - SLICE_GAP)
                    : length;

                return (
                  <g key={category.id}>
                    <circle
                      cx={SIZE / 2}
                      cy={SIZE / 2}
                      r={RADIUS}
                      fill="none"
                      stroke={color}
                      strokeWidth={STROKE}
                      strokeDasharray={`${drawn} ${CIRCUMFERENCE}`}
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
                      strokeDasharray={`${drawn} ${CIRCUMFERENCE}`}
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
                {currencySymbol()}
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
                <PrivacyFilter>{formatCompact(total)}</PrivacyFilter>
              </FinancialText>
              <Text
                style={{
                  fontSize: 11,
                  letterSpacing: 0.4,
                  color: 'var(--dfl-text-3)',
                }}
              >
                <Trans>Total</Trans>
              </Text>
            </View>
          </View>

          <View
            style={{ flex: `1 1 ${LEGEND_MIN_WIDTH}px`, minWidth: 0, gap: 2 }}
          >
            {listed.map(category => {
              const isUncategorized = category.id === UNCATEGORIZED_ID;
              const row = (
                <View
                  key={category.id}
                  style={{
                    width: '100%',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 9,
                    minHeight: compact ? 44 : 30,
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
                  <View style={{ flex: '1 1 0', minWidth: 0 }}>
                    <TextOneLine
                      style={{
                        fontSize: compact ? 14 : 13,
                        textAlign: 'left',
                        color: 'var(--dfl-text)',
                      }}
                    >
                      {category.name}
                    </TextOneLine>
                    {/* Not a category but something to do, said in words on a
                        line of its own so the name keeps its room. */}
                    {isUncategorized && (
                      <Text
                        style={{
                          fontSize: 11,
                          textAlign: 'left',
                          color: 'var(--dfl-hue-amber)',
                        }}
                      >
                        <Trans>to review</Trans>
                      </Text>
                    )}
                  </View>
                  <Text
                    style={{
                      fontSize: 11.5,
                      color: 'var(--dfl-text-3)',
                    }}
                  >
                    {currencySymbol()}
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
                    <PrivacyFilter>
                      {formatPlain(category.amount)}
                    </PrivacyFilter>
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
                  {onOpenCategory && (
                    <SvgCheveronRight
                      aria-hidden="true"
                      width={13}
                      height={13}
                      style={{ flexShrink: 0, color: 'var(--dfl-text-3)' }}
                    />
                  )}
                </View>
              );

              return onOpenCategory ? (
                <Button
                  key={category.id}
                  variant="bare"
                  aria-label={
                    isUncategorized
                      ? t('Review the spending without a category this month')
                      : t('See the transactions of {{name}} this month', {
                          name: category.name,
                        })
                  }
                  onPress={() => onOpenCategory(category)}
                  className={css({
                    width: '100%',
                    padding: '0 6px',
                    margin: '0 -6px',
                    borderRadius: 8,
                    justifyContent: 'flex-start',
                    '&[data-hovered]': { backgroundColor: 'var(--dfl-inset)' },
                    '&[data-pressed]': { backgroundColor: 'var(--dfl-inset)' },
                  })}
                >
                  {row}
                </Button>
              ) : (
                row
              );
            })}
          </View>
        </View>

        {hasMore && (
          <CardLink
            isExpanded={isExpanded}
            onPress={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <Trans>Show fewer</Trans>
            ) : (
              <Trans>View all categories</Trans>
            )}
          </CardLink>
        )}
      </View>
    </LabCard>
  );
}
