import React, { useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
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

import { CardLink } from './CardLink';
import { CardHeading, LabCard } from './LabCard';
import type { ExpenseCategory } from './reportsFixtures';
import { formatCurrency, formatPercent } from './reportsMoney';
import { CATEGORY_HUE } from './reportsTokens';

type RankedCategory = ExpenseCategory & { share: number };

type ReportsTopCategoriesProps = {
  categories: RankedCategory[];
  limit?: number;
  /** What a row opens: its transactions. Absent ⇒ plain rows (laboratory). */
  onOpenCategory?: (category: ExpenseCategory) => void;
};

/**
 * Where the money went, ranked.
 *
 * The bar length is the category's amount as a fraction of the largest one —
 * real magnitude, normalised so the biggest fills the track. Nothing here is a
 * decorative length: two bars can be compared by eye and the comparison holds.
 *
 * It opens on the largest few and its link brings in the rest, in place: the
 * whole ranking is already here, so there is nowhere else to send the reader.
 * With nothing more to list there is no link.
 */
export function ReportsTopCategories({
  categories,
  limit = 5,
  onOpenCategory,
}: ReportsTopCategoriesProps) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const hasMore = categories.length > limit;
  const shown = isExpanded ? categories : categories.slice(0, limit);
  const largest = shown[0]?.amount ?? 1;

  return (
    <LabCard>
      <View style={{ padding: '16px 22px 14px', gap: 12 }}>
        <CardHeading
          title={<Trans>Top categories</Trans>}
          subtitle={<Trans>Where your money went</Trans>}
        />

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 16,
            paddingBottom: 7,
            borderBottom: '1px solid var(--dfl-line)',
          }}
        >
          <ColumnLabel style={{ flex: '1 1 0' }}>
            <Trans>Category</Trans>
          </ColumnLabel>
          <ColumnLabel style={{ flex: '0 0 118px', textAlign: 'right' }}>
            <Trans>Amount</Trans>
          </ColumnLabel>
          <ColumnLabel style={{ flex: '0 0 74px', textAlign: 'right' }}>
            <Trans>% of total</Trans>
          </ColumnLabel>
        </View>

        <View style={{ gap: 2 }}>
          {shown.map(category =>
            onOpenCategory ? (
              <Button
                key={category.id}
                variant="bare"
                aria-label={
                  category.id === UNCATEGORIZED_ID
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
                })}
              >
                <Row
                  category={category}
                  ratio={category.amount / largest}
                  opens
                />
              </Button>
            ) : (
              <Row
                key={category.id}
                category={category}
                ratio={category.amount / largest}
              />
            ),
          )}
        </View>

        {hasMore && (
          <CardLink
            isExpanded={isExpanded}
            onPress={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <Trans>Show fewer</Trans>
            ) : (
              <Trans>View all spending</Trans>
            )}
          </CardLink>
        )}
      </View>
    </LabCard>
  );
}

function ColumnLabel({
  children,
  style,
}: {
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <Text
      style={{
        fontSize: 10.5,
        fontWeight: 600,
        letterSpacing: 1.1,
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
        color: 'var(--dfl-text-3)',
        ...style,
      }}
    >
      {children}
    </Text>
  );
}

function Row({
  category,
  ratio,
  opens = false,
}: {
  category: RankedCategory;
  ratio: number;
  /** Ends in a chevron: the row opens its transactions. */
  opens?: boolean;
}) {
  const color = CATEGORY_HUE[category.hue];
  const { Icon } = category;

  return (
    <View
      style={{
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        height: 36,
      }}
    >
      <View
        style={{
          flex: '1 1 0',
          minWidth: 0,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <View
          aria-hidden="true"
          style={{
            width: 30,
            height: 30,
            flexShrink: 0,
            borderRadius: 9,
            alignItems: 'center',
            justifyContent: 'center',
            color,
            backgroundImage: `linear-gradient(150deg, color-mix(in srgb, ${color} 26%, #0a0f18) 0%, color-mix(in srgb, ${color} 9%, #06080e) 100%)`,
            border: `1px solid color-mix(in srgb, ${color} 28%, transparent)`,
          }}
        >
          <Icon width={14} height={14} />
        </View>

        <TextOneLine
          style={{
            flex: '0 0 96px',
            fontSize: 13.5,
            fontWeight: 500,
            textAlign: 'left',
            color: 'var(--dfl-text)',
          }}
        >
          {category.name}
        </TextOneLine>

        {/* Real magnitude, normalised to the largest category. */}
        <View
          style={{
            flex: '1 1 0',
            minWidth: 40,
            height: 4,
            borderRadius: 999,
            backgroundColor: 'rgba(140, 172, 210, 0.07)',
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              width: `${Math.max(2, ratio * 100)}%`,
              height: '100%',
              borderRadius: 999,
              backgroundImage: `linear-gradient(90deg, color-mix(in srgb, ${color} 45%, transparent) 0%, ${color} 100%)`,
              boxShadow: `0 0 10px -2px color-mix(in srgb, ${color} 75%, transparent)`,
            }}
          />
        </View>
      </View>

      <FinancialText
        style={{
          flex: '0 0 118px',
          fontSize: 13.5,
          fontWeight: 600,
          textAlign: 'right',
          whiteSpace: 'nowrap',
          color: 'var(--dfl-text)',
        }}
      >
        <PrivacyFilter>{formatCurrency(category.amount)}</PrivacyFilter>
      </FinancialText>

      <Text
        style={{
          flex: '0 0 74px',
          fontSize: 13,
          textAlign: 'right',
          whiteSpace: 'nowrap',
          color: 'var(--dfl-text-3)',
        }}
      >
        {formatPercent(category.share)}
      </Text>
      {opens && (
        <SvgCheveronRight
          aria-hidden="true"
          width={13}
          height={13}
          style={{ flexShrink: 0, color: 'var(--dfl-text-3)' }}
        />
      )}
    </View>
  );
}
