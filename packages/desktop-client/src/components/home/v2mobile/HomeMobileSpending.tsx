import React from 'react';
import type { ReactNode } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { Button } from '@actual-app/components/button';
import { SvgCheveronRight } from '@actual-app/components/icons/v1';
import { Text } from '@actual-app/components/text';
import { View } from '@actual-app/components/view';
import { css } from '@emotion/css';

import type { HomeCategorySpending } from '#components/home/useHomeCategorySpending';
import { useHomeCategorySpending } from '#components/home/useHomeCategorySpending';
import { MOBILE_TYPE } from '#components/v2lab/typeScale';
import { useNavigate } from '#hooks/useNavigate';

import { HomeMobileMoney } from './HomeMobileMoney';
import { HomeMobileSpendingRow } from './HomeMobileSpendingRow';

type HomeMobileSpendingProps = {
  /** `YYYY-MM`. */
  month: string;
  /** Opens the transactions one row is made of. */
  onOpenEntry: (entry: HomeCategorySpending) => void;
};

/**
 * Where the month's money went, as a ranked list.
 *
 * A list beats a donut here: labelled rows answer "which categories cost me the
 * most" at a glance and stay legible at 375px, where a pie's slice labels do
 * not.
 *
 * The header opens the budget, the destination the previous Home's "See in
 * budget" button had. Every row opens what it is made of: a category, its
 * transactions of the month — refunds included, transfers left out, as the
 * figure counts them — and "Sem categoria", the month's outflows still
 * waiting for one. That row is grey and says it is waiting, because it is not
 * a category but something to do.
 */
export function HomeMobileSpending({
  month,
  onOpenEntry,
}: HomeMobileSpendingProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { categories, credits, outflows, credited, totalSpent, isLoading } =
    useHomeCategorySpending({ month });

  const hasRows = categories.length > 0 || credits.length > 0;

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
          // 44pt and a point to spare, against the half point a fractional
          // offset gives away to the list below.
          minHeight: 46,
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
              fontSize: MOBILE_TYPE.label,
              fontWeight: 600,
              letterSpacing: 1,
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

      {!hasRows ? (
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
            <Button
              key={entry.category.id}
              variant="bare"
              aria-label={
                entry.isUncategorized
                  ? t('Revisar os gastos sem categoria do mês')
                  : t('Ver as transações de {{name}} no mês', {
                      name: entry.category.name,
                    })
              }
              onPress={() => onOpenEntry(entry)}
              className={css({
                // The row fills the control: a button centres what it holds,
                // which is what pushed "Sem categoria" off the others' column.
                width: '100%',
                padding: 0,
                borderRadius: 0,
                justifyContent: 'flex-start',
                textAlign: 'left',
                '&[data-pressed]': { backgroundColor: 'var(--dfl-inset)' },
              })}
            >
              <HomeMobileSpendingRow entry={entry} outflows={outflows} />
            </Button>
          ))}

          {credited > 0 && (
            <View
              style={{
                margin: '6px 14px 2px',
                paddingTop: 10,
                gap: 6,
                borderTop: '1px solid var(--dfl-line)',
              }}
            >
              <Text
                style={{
                  fontSize: MOBILE_TYPE.label,
                  fontWeight: 600,
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                  color: 'var(--dfl-text-3)',
                }}
              >
                <Trans>Refunds that lower the total</Trans>
              </Text>

              {credits.map(credit => (
                <SpendingCompositionLine
                  key={credit.id}
                  label={credit.name}
                  value={credit.amount}
                  positive
                />
              ))}

              {/* The subtraction behind the figure in the header, so the list
                  explains it instead of contradicting it. */}
              <SpendingCompositionLine
                label={<Trans>Month outflows</Trans>}
                value={-outflows}
              />
              <SpendingCompositionLine
                label={<Trans>Net spending</Trans>}
                value={totalSpent}
                emphasized
              />
            </View>
          )}
        </View>
      )}
    </View>
  );
}

type SpendingCompositionLineProps = {
  label: ReactNode;
  value: number | null;
  positive?: boolean;
  emphasized?: boolean;
};

/** One line of what the month's spending is made of. */
function SpendingCompositionLine({
  label,
  value,
  positive = false,
  emphasized = false,
}: SpendingCompositionLineProps) {
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
          fontSize: MOBILE_TYPE.note,
          fontWeight: emphasized ? 600 : 400,
          color: emphasized ? 'var(--dfl-text)' : 'var(--dfl-text-2)',
        }}
      >
        {label}
      </Text>
      <HomeMobileMoney
        value={value}
        withCurrency
        style={{
          fontSize: MOBILE_TYPE.note,
          fontWeight: emphasized ? 700 : 600,
          color: positive ? 'var(--dfl-positive)' : 'var(--dfl-text)',
        }}
      />
    </View>
  );
}
