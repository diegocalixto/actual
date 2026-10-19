import React from 'react';
import { Trans } from 'react-i18next';

import { SvgCheveronRight } from '@actual-app/components/icons/v1';
import { Text } from '@actual-app/components/text';
import { TextOneLine } from '@actual-app/components/text-one-line';
import { View } from '@actual-app/components/view';

import { FinancialText } from '#components/FinancialText';
import { iconForCategory } from '#components/v2lab/LabStyle';

import { CURRENCY, formatAmount } from './mobileHomeMoney';
import { MobileIconTile } from './MobileIconTile';

type MobileSpendingPreviewProps = {
  total: number;
  category: { name: string; amount: number; share: number };
};

/**
 * Where the money went — the opening of it, not the whole thing.
 *
 * The reference lets this section begin at the fold rather than ending the page
 * on the accounts, and that is exactly what it is for: the page has more to say
 * and says so, without this round designing a spending screen it has not been
 * asked for. One category is enough to establish the pattern.
 *
 * The bar is the category's share of the month's outflow and nothing else — a
 * restatement of the percentage beside it, not a budget or a target, neither of
 * which this laboratory holds.
 */
export function MobileSpendingPreview({
  total,
  category,
}: MobileSpendingPreviewProps) {
  const Icon = iconForCategory(category.name);

  return (
    <View
      style={{
        borderRadius: 'var(--dfm-radius)',
        border: '1px solid var(--dfl-line)',
        backgroundColor: 'var(--dfl-surface)',
        boxShadow: 'var(--dfl-shadow)',
        overflow: 'hidden',
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          padding: '11px 14px',
          borderBottom: '1px solid var(--dfl-line)',
          backgroundColor: 'var(--dfl-surface-raised)',
        }}
      >
        <Text
          style={{
            fontSize: 10.5,
            fontWeight: 600,
            letterSpacing: 1.2,
            color: 'var(--dfl-text-2)',
          }}
        >
          <Trans>Gastos do mês</Trans>
        </Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <FinancialText
            style={{
              fontSize: 13.5,
              fontWeight: 700,
              whiteSpace: 'nowrap',
              color: 'var(--dfl-negative)',
            }}
          >
            {`${CURRENCY} ${formatAmount(total)}`}
          </FinancialText>
          <SvgCheveronRight
            aria-hidden="true"
            width={15}
            height={15}
            style={{ color: 'var(--dfl-text-3)' }}
          />
        </View>
      </View>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          padding: '10px 14px',
        }}
      >
        <MobileIconTile Icon={Icon} hue="var(--dfl-hue-crimson)" />

        <View style={{ flex: '0 1 auto', minWidth: 0, gap: 1 }}>
          <TextOneLine
            style={{
              fontSize: 15,
              fontWeight: 600,
              letterSpacing: -0.2,
              color: 'var(--dfl-text)',
            }}
          >
            {category.name}
          </TextOneLine>
          <FinancialText
            style={{
              fontSize: 12,
              whiteSpace: 'nowrap',
              color: 'var(--dfl-text-3)',
            }}
          >
            {`${category.share}% • ${CURRENCY} ${formatAmount(category.amount)}`}
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
              width: `${category.share}%`,
              height: '100%',
              borderRadius: 999,
              backgroundColor: 'var(--dfl-negative)',
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
    </View>
  );
}
