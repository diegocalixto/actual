import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { Button } from '@actual-app/components/button';
import { SvgCheveronRight } from '@actual-app/components/icons/v1';
import { Text } from '@actual-app/components/text';
import { View } from '@actual-app/components/view';
import { css } from '@emotion/css';

import { useHomeCategorySpending } from '#components/home/useHomeCategorySpending';
import type { HomeBudgetType } from '#components/home/useHomeMonth';
import { useNavigate } from '#hooks/useNavigate';

import { HomeMobileMoney } from './HomeMobileMoney';
import { HomeMobileSpendingRow } from './HomeMobileSpendingRow';

type HomeMobileSpendingProps = {
  sheetName: string;
  budgetType: HomeBudgetType;
};

/**
 * Where the month's money went, as a ranked list.
 *
 * A list beats a donut here: labelled rows answer "which categories cost me the
 * most" at a glance and stay legible at 375px, where a pie's slice labels do
 * not.
 *
 * The header is the section's one action, and it is the same destination the
 * previous Home's "See in budget" button had — folded into the header so the
 * chevron the approved composition draws there means something instead of
 * sitting on the panel as decoration.
 */
export function HomeMobileSpending({
  sheetName,
  budgetType,
}: HomeMobileSpendingProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { categories, totalSpent, isLoading } = useHomeCategorySpending({
    sheetName,
    budgetType,
  });

  const denominator = totalSpent !== null && totalSpent < 0 ? totalSpent : null;

  return (
    <View
      style={{
        borderRadius: 'var(--dfm-radius)',
        border: '1px solid var(--dfl-line-strong)',
        backgroundColor: 'var(--dfl-surface)',
        backgroundImage:
          'linear-gradient(180deg, rgba(150, 185, 225, 0.035), rgba(150, 185, 225, 0) 46%)',
        boxShadow: 'var(--dfl-shadow), 0 1px 0 rgba(0, 0, 0, 0.5)',
        overflow: 'hidden',
      }}
    >
      <Button
        variant="bare"
        aria-label={t('Ver os gastos no orçamento')}
        onPress={() => void navigate('/budget')}
        className={css({
          width: '100%',
          padding: '11px 14px',
          borderRadius: 0,
          borderBottom: '1px solid var(--dfl-line)',
          backgroundColor: 'var(--dfl-surface-raised)',
          backgroundImage:
            'linear-gradient(180deg, rgba(150, 185, 225, 0.055), rgba(150, 185, 225, 0.006))',
          '&[data-pressed]': { backgroundColor: 'var(--dfl-inset)' },
        })}
      >
        <View
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            minWidth: 0,
          }}
        >
          <Text
            style={{
              fontSize: 10.5,
              fontWeight: 600,
              letterSpacing: 1.2,
              textTransform: 'uppercase',
              color: 'var(--dfl-text-2)',
            }}
          >
            <Trans>Gastos do mês</Trans>
          </Text>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            {/* The outflow is printed unsigned: the label says these are the
                month's spending, and the coral says the rest. */}
            <HomeMobileMoney
              value={totalSpent === null ? null : Math.abs(totalSpent)}
              withCurrency
              style={{
                fontSize: 13.5,
                fontWeight: 700,
                color: 'var(--dfl-negative)',
              }}
            />
            <SvgCheveronRight
              aria-hidden="true"
              width={15}
              height={15}
              style={{ color: 'var(--dfl-text-3)' }}
            />
          </View>
        </View>
      </Button>

      {categories.length === 0 ? (
        <View style={{ alignItems: 'center', padding: '18px 14px' }}>
          <Text
            style={{
              fontSize: 13,
              textAlign: 'center',
              color: 'var(--dfl-text-2)',
            }}
          >
            {isLoading ? (
              <Trans>Carregando gastos…</Trans>
            ) : (
              <Trans>Nenhum gasto registrado neste mês.</Trans>
            )}
          </Text>
        </View>
      ) : (
        <View style={{ paddingTop: 2, paddingBottom: 4 }}>
          {categories.map(entry => (
            <HomeMobileSpendingRow
              key={entry.category.id}
              entry={entry}
              denominator={denominator}
            />
          ))}
        </View>
      )}
    </View>
  );
}
