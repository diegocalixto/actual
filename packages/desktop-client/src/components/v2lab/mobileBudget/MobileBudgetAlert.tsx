import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { Button } from '@actual-app/components/button';
import { SvgExclamationOutline } from '@actual-app/components/icons/v1';
import { Text } from '@actual-app/components/text';
import { View } from '@actual-app/components/view';
import { css } from '@emotion/css';

import { FinancialText } from '#components/FinancialText';

import { formatCurrency } from './mobileBudgetMoney';

type MobileBudgetAlertProps = {
  count: number;
  /** Integer minor units held by the uncategorised transactions. */
  total: number;
};

/**
 * Transactions the budget cannot place yet.
 *
 * A tinted surface with a matching hairline rather than a saturated block: the
 * tone still reads instantly, but a warning stops being the brightest thing on
 * a dark screen — and this one sits directly above the figure the screen is
 * actually about, which it must not outshout.
 */
export function MobileBudgetAlert({ count, total }: MobileBudgetAlertProps) {
  const { t } = useTranslation();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 11,
        padding: '10px 12px',
        borderRadius: 'var(--dfmb-radius-sm)',
        border:
          '1px solid color-mix(in srgb, var(--dfmb-watch) 30%, transparent)',
        backgroundColor:
          'color-mix(in srgb, var(--dfmb-watch) 11%, var(--dfl-surface))',
      }}
    >
      <SvgExclamationOutline
        aria-hidden="true"
        width={19}
        height={19}
        style={{ flexShrink: 0, color: 'var(--dfmb-watch)' }}
      />

      <View style={{ flex: 1, minWidth: 0, gap: 1 }}>
        <Text
          style={{
            fontSize: 'clamp(11.5px, 3vw, 12.5px)',
            fontWeight: 600,
            letterSpacing: -0.1,
            color: 'var(--dfl-text)',
          }}
        >
          <Trans count={count}>
            Você tem {{ count }} transações sem categoria
          </Trans>
        </Text>
        <FinancialText style={{ fontSize: 11.5, color: 'var(--dfl-text-3)' }}>
          {`Total: ${formatCurrency(total)}`}
        </FinancialText>
      </View>

      <Button
        variant="bare"
        aria-label={t('Categorizar transações sem categoria')}
        className={css({
          flexShrink: 0,
          padding: '7px 12px',
          borderRadius: 999,
          border:
            '1px solid color-mix(in srgb, var(--dfl-violet) 45%, transparent)',
          color: 'var(--dfl-violet)',
          fontSize: 12.5,
          fontWeight: 600,
          '&[data-hovered]': {
            backgroundColor:
              'color-mix(in srgb, var(--dfl-violet) 12%, transparent)',
          },
        })}
      >
        <Trans>Categorizar</Trans>
      </Button>
    </View>
  );
}
