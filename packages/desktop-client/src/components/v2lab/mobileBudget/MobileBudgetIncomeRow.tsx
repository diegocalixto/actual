import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { Button } from '@actual-app/components/button';
import { SvgCheveronRight } from '@actual-app/components/icons/v1';
import { Text } from '@actual-app/components/text';
import { TextOneLine } from '@actual-app/components/text-one-line';
import { View } from '@actual-app/components/view';
import { css } from '@emotion/css';

import { FinancialText } from '#components/FinancialText';
import { iconForCategory } from '#components/v2lab/LabStyle';

import type { IncomeCategoryFixture } from './mobileBudgetFixtures';
import { MobileBudgetIconTile } from './MobileBudgetIconTile';
import { formatCurrency } from './mobileBudgetMoney';

type MobileBudgetIncomeRowProps = {
  category: IncomeCategoryFixture;
  isLast: boolean;
};

/**
 * One source of income.
 *
 * Simpler than an expense row on purpose: income has no plan to be measured
 * against, so there is no percentage, no bar and no second amount — inventing
 * a progress track here would imply a target the budget does not hold.
 *
 * Green is used only in this section, where a positive figure has an
 * unambiguous meaning: money that arrived.
 */
export function MobileBudgetIncomeRow({
  category,
  isLast,
}: MobileBudgetIncomeRowProps) {
  const { t } = useTranslation();
  const Icon = iconForCategory(category.name);

  return (
    <Button
      variant="bare"
      aria-label={t('Abrir {{name}}', { name: category.name })}
      className={css({
        width: '100%',
        padding: '10px 12px',
        borderRadius: 0,
        borderBottom: isLast ? 'none' : '1px solid var(--dfl-line)',
        '&[data-hovered]': { backgroundColor: 'var(--dfl-surface-raised)' },
        '&[data-pressed]': { backgroundColor: 'var(--dfl-inset)' },
      })}
    >
      <View
        style={{
          flex: 1,
          minWidth: 0,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <MobileBudgetIconTile Icon={Icon} hue="var(--dfl-hue-green)" />

        <View style={{ flex: 1, minWidth: 0, alignItems: 'flex-start' }}>
          <TextOneLine
            style={{
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: -0.2,
              color: 'var(--dfl-text)',
            }}
          >
            {category.name}
          </TextOneLine>
        </View>

        <View style={{ flexShrink: 0, alignItems: 'flex-end', gap: 0 }}>
          <FinancialText
            style={{
              fontSize: 'clamp(12px, 3.3vw, 13.5px)',
              fontWeight: 700,
              whiteSpace: 'nowrap',
              color: 'var(--dfl-positive)',
            }}
          >
            {formatCurrency(category.received)}
          </FinancialText>
          <Text style={{ fontSize: 9, color: 'var(--dfl-text-3)' }}>
            <Trans>Recebido</Trans>
          </Text>
        </View>

        <SvgCheveronRight
          aria-hidden="true"
          width={15}
          height={15}
          style={{ flexShrink: 0, color: 'var(--dfl-text-3)' }}
        />
      </View>
    </Button>
  );
}
