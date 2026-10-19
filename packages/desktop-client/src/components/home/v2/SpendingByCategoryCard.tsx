import React from 'react';
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
import type { HomeBudgetType } from '#components/home/useHomeMonth';
import { Money } from '#components/v2/Money';
import { useNavigate } from '#hooks/useNavigate';

import { DashboardCard } from './DashboardCard';
import { SectionHeading } from './SectionHeading';

type SpendingByCategoryCardProps = {
  sheetName: string;
  budgetType: HomeBudgetType;
};

/**
 * Where the month's money went, as a ranked list.
 *
 * A list beats a donut here: five labelled rows answer "which categories cost
 * me the most" at a glance and stay legible at 390px, where a pie's slice
 * labels do not.
 */
export function SpendingByCategoryCard({
  sheetName,
  budgetType,
}: SpendingByCategoryCardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { categories, totalSpent, isLoading } = useHomeCategorySpending({
    sheetName,
    budgetType,
  });

  // The percentages are shares of the month's official `total-spent` cell, not
  // of the five rows shown. That is the financially correct denominator, and it
  // is also why the visible shares need not add up to 100%: refunded categories
  // are excluded from the list but still counted in the total.
  const denominator = totalSpent !== null && totalSpent < 0 ? totalSpent : null;

  return (
    <SectionHeading
      title={<Trans>Spending this month</Trans>}
      action={
        categories.length > 0 ? (
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
        {categories.length === 0 ? (
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
                  denominator={denominator}
                />
              ))}
            </View>

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
  denominator: number | null;
};

function CategoryRow({ entry, denominator }: CategoryRowProps) {
  // Both values are negative, so the ratio comes out positive.
  const share = denominator === null ? null : entry.amount / denominator;
  const barWidth = share === null ? 0 : Math.min(Math.max(share, 0.02), 1);
  // A share above 100% is real — refunds elsewhere can shrink the month's net
  // total below a single category's outflow — but printing "118%" reads as a
  // bug, so the bar saturates and the number is left off.
  const percent =
    share !== null && share >= 0 && share <= 1 ? Math.round(share * 100) : null;

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
        <TextOneLine style={{ fontSize: 14, fontWeight: 500 }}>
          {entry.category.name}
        </TextOneLine>
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
              backgroundImage: `linear-gradient(90deg, ${shellColors.accentBold} 0%, ${shellColors.accent} 100%)`,
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
