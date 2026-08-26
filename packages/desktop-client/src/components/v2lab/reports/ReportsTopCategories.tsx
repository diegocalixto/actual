import React from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { Trans } from 'react-i18next';

import { Text } from '@actual-app/components/text';
import { TextOneLine } from '@actual-app/components/text-one-line';
import { View } from '@actual-app/components/view';

import { FinancialText } from '#components/FinancialText';

import { CardHeading, LabCard } from './LabCard';
import { CardLink } from './ReportsCategoryDonut';
import type { ExpenseCategory } from './reportsFixtures';
import { formatBRL, formatPercent } from './reportsMoney';
import { CATEGORY_HUE } from './reportsTokens';

type RankedCategory = ExpenseCategory & { share: number };

type ReportsTopCategoriesProps = {
  categories: RankedCategory[];
  limit?: number;
};

/**
 * Where the money went, ranked.
 *
 * The bar length is the category's amount as a fraction of the largest one —
 * real magnitude, normalised so the biggest fills the track. Nothing here is a
 * decorative length: two bars can be compared by eye and the comparison holds.
 */
export function ReportsTopCategories({
  categories,
  limit = 5,
}: ReportsTopCategoriesProps) {
  const shown = categories.slice(0, limit);
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
          {shown.map(category => (
            <Row
              key={category.id}
              category={category}
              ratio={category.amount / largest}
            />
          ))}
        </View>

        <CardLink>
          <Trans>View all spending</Trans>
        </CardLink>
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

function Row({ category, ratio }: { category: RankedCategory; ratio: number }) {
  const color = CATEGORY_HUE[category.hue];
  const { Icon } = category;

  return (
    <View
      style={{
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
        {formatBRL(category.amount)}
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
    </View>
  );
}
