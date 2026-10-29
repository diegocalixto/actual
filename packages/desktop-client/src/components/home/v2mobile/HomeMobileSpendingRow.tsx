import React from 'react';
import { Trans } from 'react-i18next';

import { SvgCheveronRight, SvgTag } from '@actual-app/components/icons/v1';
import { Text } from '@actual-app/components/text';
import { TextOneLine } from '@actual-app/components/text-one-line';
import { View } from '@actual-app/components/view';

import { FinancialText } from '#components/FinancialText';
import type { HomeCategorySpending } from '#components/home/useHomeCategorySpending';
import { PrivacyFilter } from '#components/PrivacyFilter';
import { categoryHueVar } from '#components/v2lab/categoryHue';
import { iconForCategory } from '#components/v2lab/LabStyle';
import { MOBILE_TYPE } from '#components/v2lab/typeScale';

import { HomeMobileIconTile } from './HomeMobileIconTile';
import { currencySymbol, formatAmount } from './mobileMoneyFormat';

type HomeMobileSpendingRowProps = {
  entry: HomeCategorySpending;
  /**
   * The month's outflows, positive: the base this row is a share of. Taken on
   * the month's net total instead, a category refunded elsewhere would claim
   * more than the whole month; the refunds are reported under the list.
   */
  outflows: number;
};

/**
 * One category's share of the month.
 *
 * The bar restates the percentage beside it and nothing else — it is not a
 * budget or a target, neither of which this row reads. Tile and bar carry the
 * category's own colour, the one it has on every screen. The chevron says the
 * row opens the transactions it adds up.
 *
 * "Sem categoria" is grey, the colour of no category, and says in words that
 * it is waiting for review — colour alone would not tell anyone that.
 */
export function HomeMobileSpendingRow({
  entry,
  outflows,
}: HomeMobileSpendingRowProps) {
  const Icon = entry.isUncategorized
    ? SvgTag
    : iconForCategory(entry.category.name);
  const hue = categoryHueVar(entry.category.id);

  // The row's amount carries Actual's sign; the base does not.
  const share = outflows > 0 ? Math.abs(entry.amount) / outflows : 0;
  // A floor so a very small share still draws something. No ceiling: on this
  // base a share cannot pass 1, so there is nothing to saturate away.
  const barWidth = share === 0 ? 0 : Math.max(share, 0.02);
  const percent = outflows > 0 ? Math.round(share * 100) : null;

  const amount = `${currencySymbol()} ${formatAmount(Math.abs(entry.amount))}`;

  return (
    <View
      style={{
        // The width of the control around it: a button sizes what it holds to
        // its content, which shortened the bar and, before every row was a
        // control, pushed "Sem categoria" off the others' column.
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: '10px 14px',
      }}
    >
      <HomeMobileIconTile Icon={Icon} hue={hue} />

      <View style={{ flex: '0 1 auto', minWidth: 0, gap: 1 }}>
        <TextOneLine
          style={{
            fontSize: MOBILE_TYPE.row,
            fontWeight: 600,
            letterSpacing: -0.2,
            textAlign: 'left',
            color: 'var(--dfl-text)',
          }}
        >
          {entry.category.name}
        </TextOneLine>
        <FinancialText
          style={{
            fontSize: MOBILE_TYPE.label,
            whiteSpace: 'nowrap',
            textAlign: 'left',
            color: 'var(--dfl-text-3)',
          }}
        >
          {/* The share stays readable under privacy mode; only the amount
              goes behind it, as on every other figure of this page. */}
          {percent !== null && `${percent}% • `}
          <PrivacyFilter>{amount}</PrivacyFilter>
          {entry.isUncategorized && (
            <Text style={{ color: 'var(--dfl-hue-amber)' }}>
              {' • '}
              <Trans>a revisar</Trans>
            </Text>
          )}
        </FinancialText>
      </View>

      <View
        aria-hidden="true"
        style={{
          flex: 1,
          minWidth: 40,
          height: 5,
          borderRadius: 999,
          backgroundColor: 'var(--dfl-inset)',
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            width: `${barWidth * 100}%`,
            height: '100%',
            borderRadius: 999,
            backgroundColor: hue,
          }}
        />
      </View>

      <SvgCheveronRight
        aria-hidden="true"
        width={15}
        height={15}
        style={{ flexShrink: 0, color: 'var(--dfl-text-3)' }}
      />
    </View>
  );
}
