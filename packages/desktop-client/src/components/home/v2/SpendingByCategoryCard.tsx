import React from 'react';
import type { ReactNode } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { Button } from '@actual-app/components/button';
import { SvgArrowThinRight } from '@actual-app/components/icons/v1';
import { Text } from '@actual-app/components/text';
import { TextOneLine } from '@actual-app/components/text-one-line';
import { View } from '@actual-app/components/view';
import { css } from '@emotion/css';

import {
  shellColors,
  shellEyebrowStyle,
  shellRadius,
} from '#components/appshell/shellTheme';
import type { HomeCategorySpending } from '#components/home/useHomeCategorySpending';
import { useHomeCategorySpending } from '#components/home/useHomeCategorySpending';
import { Money } from '#components/v2/Money';
import { useNavigate } from '#hooks/useNavigate';

import { DashboardCard } from './DashboardCard';
import { SectionHeading } from './SectionHeading';

type SpendingByCategoryCardProps = {
  /** `YYYY-MM`. */
  month: string;
};

/**
 * Where the month's money went, as a ranked list.
 *
 * A list beats a donut here: five labelled rows answer "which categories cost
 * me the most" at a glance and stay legible at 390px, where a pie's slice
 * labels do not. Outflows without a category are one of the rows, named "Sem
 * categoria": counted, visible, and one click from the list that needs them.
 */
export function SpendingByCategoryCard({ month }: SpendingByCategoryCardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { categories, credits, outflows, credited, totalSpent, isLoading } =
    useHomeCategorySpending({ month });

  // Every bar is a share of the month's outflows, never of its net total: a
  // category refunded elsewhere can cost more than the month ended up
  // spending, and a share taken on that net would claim more than the whole.
  // The refunds making up the difference are listed under the rows with the
  // subtraction spelled out, so what the list says adds up to the figure in
  // the header.
  const hasRows = categories.length > 0 || credits.length > 0;

  return (
    <SectionHeading
      title={<Trans>Spending this month</Trans>}
      action={
        hasRows ? (
          <Money
            value={totalSpent}
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: shellColors.textPrimary,
            }}
          />
        ) : null
      }
    >
      <DashboardCard>
        {!hasRows ? (
          <View style={{ padding: 26, alignItems: 'center' }}>
            <Text
              style={{
                fontSize: 13,
                textAlign: 'center',
                color: shellColors.textSecondary,
              }}
            >
              {isLoading ? (
                <Trans>Loading spending…</Trans>
              ) : (
                <Trans>No spending recorded this month.</Trans>
              )}
            </Text>
          </View>
        ) : (
          <>
            <View style={{ padding: '14px 16px 6px', gap: 14 }}>
              {categories.map(entry => (
                <CategoryRow
                  key={entry.category.id}
                  entry={entry}
                  outflows={outflows}
                  onReview={
                    entry.isUncategorized
                      ? () => void navigate('/accounts/uncategorized')
                      : undefined
                  }
                />
              ))}
            </View>

            {credited > 0 && (
              <View
                style={{
                  margin: '2px 16px 0',
                  paddingTop: 10,
                  gap: 6,
                  borderTop: `1px solid ${shellColors.border}`,
                }}
              >
                <Text style={shellEyebrowStyle}>
                  <Trans>Refunds that lower the total</Trans>
                </Text>

                {credits.map(credit => (
                  <View
                    key={credit.id}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'baseline',
                      justifyContent: 'space-between',
                      gap: 12,
                    }}
                  >
                    <TextOneLine style={{ fontSize: 13 }}>
                      {credit.name}
                    </TextOneLine>
                    <Money
                      value={credit.amount}
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: shellColors.positive,
                      }}
                    />
                  </View>
                ))}

                {/* The composition of the figure above, so the list explains
                    it instead of contradicting it. */}
                <View style={{ gap: 2, paddingTop: 4 }}>
                  <CompositionLine
                    label={<Trans>Month outflows</Trans>}
                    value={-outflows}
                  />
                  <CompositionLine
                    label={<Trans>Refunds</Trans>}
                    value={credited}
                  />
                  <CompositionLine
                    label={<Trans>Net spending</Trans>}
                    value={totalSpent}
                    emphasized
                  />
                </View>
              </View>
            )}

            <Button
              variant="bare"
              aria-label={t('See spending in the budget')}
              onPress={() => void navigate('/budget')}
              className={css({
                width: '100%',
                padding: '11px 16px',
                borderRadius: 0,
                borderTop: `1px solid ${shellColors.border}`,
                color: shellColors.accent,
                '&[data-hovered]': {
                  backgroundColor: shellColors.surfaceSunken,
                },
              })}
            >
              <View
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
              >
                <Text style={{ fontSize: 12.5, fontWeight: 600 }}>
                  <Trans>See in budget</Trans>
                </Text>
                <SvgArrowThinRight width={11} height={11} />
              </View>
            </Button>
          </>
        )}
      </DashboardCard>
    </SectionHeading>
  );
}

type CategoryRowProps = {
  entry: HomeCategorySpending;
  /** The month's outflows, positive: the base this row's bar is a share of. */
  outflows: number;
  /** Set on the uncategorized row: opens the transactions that need a category. */
  onReview?: () => void;
};

function CategoryRow({ entry, outflows, onReview }: CategoryRowProps) {
  const { t } = useTranslation();
  // The row's amount carries Actual's sign; the base does not.
  const share = outflows > 0 ? Math.abs(entry.amount) / outflows : 0;
  // A floor so a very small share still draws something. No ceiling: on this
  // base a share cannot pass 1, so there is nothing to saturate away.
  const barWidth = share === 0 ? 0 : Math.max(share, 0.02);
  // Taken on the outflows, the figure is a share of something a reader can
  // see, so it is always printable.
  const percent = outflows > 0 ? Math.round(share * 100) : null;

  return (
    <View style={{ gap: 7 }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        {onReview ? (
          <Button
            variant="bare"
            aria-label={t('Review the transactions without a category')}
            onPress={onReview}
            className={css({
              padding: 0,
              minWidth: 0,
              color: shellColors.accent,
              fontSize: 14,
              fontWeight: 500,
            })}
          >
            <TextOneLine style={{ fontSize: 14, fontWeight: 500 }}>
              {entry.category.name}
            </TextOneLine>
          </Button>
        ) : (
          <TextOneLine style={{ fontSize: 14, fontWeight: 500 }}>
            {entry.category.name}
          </TextOneLine>
        )}
        <Money
          value={entry.amount}
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: shellColors.textPrimary,
          }}
        />
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View
          aria-hidden="true"
          style={{
            flex: 1,
            height: 6,
            borderRadius: shellRadius.pill,
            backgroundColor: shellColors.surfaceSunken,
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              width: `${barWidth * 100}%`,
              height: '100%',
              borderRadius: shellRadius.pill,
              backgroundImage: entry.isUncategorized
                ? `linear-gradient(90deg, ${shellColors.textSecondary} 0%, ${shellColors.textSecondary} 100%)`
                : `linear-gradient(90deg, ${shellColors.accentBold} 0%, ${shellColors.accent} 100%)`,
            }}
          />
        </View>
        {percent !== null && (
          <Text
            style={{
              ...shellEyebrowStyle,
              letterSpacing: 0,
              minWidth: 30,
              textAlign: 'right',
            }}
          >
            {percent}%
          </Text>
        )}
      </View>
    </View>
  );
}

type CompositionLineProps = {
  label: ReactNode;
  value: number | null;
  emphasized?: boolean;
};

/**
 * One line of the subtraction that produces the month's spending: the
 * outflows, what came back, and what is left. Shown only when something came
 * back, because that is the only time the rows above do not simply add up.
 */
function CompositionLine({
  label,
  value,
  emphasized = false,
}: CompositionLineProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        gap: 12,
      }}
    >
      <Text
        style={{
          fontSize: 12,
          fontWeight: emphasized ? 600 : 400,
          color: emphasized
            ? shellColors.textPrimary
            : shellColors.textSecondary,
        }}
      >
        {label}
      </Text>
      <Money
        value={value}
        style={{
          fontSize: 12,
          fontWeight: emphasized ? 700 : 600,
          color: emphasized
            ? shellColors.textPrimary
            : shellColors.textSecondary,
        }}
      />
    </View>
  );
}
