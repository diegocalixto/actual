import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { Button } from '@actual-app/components/button';
import {
  SvgCheveronLeft,
  SvgCheveronRight,
} from '@actual-app/components/icons/v1';
import { Text } from '@actual-app/components/text';
import { View } from '@actual-app/components/view';
import { css } from '@emotion/css';

import { BrandMark } from '#components/appshell/BrandMark';

type MobileBudgetTopBarProps = {
  /** The month being read, already written the way the screen shows it. */
  month: string;
};

/**
 * The bar, as the proposal draws it.
 *
 * A mock: it changes no route and moves no month. The real bar would drive
 * `budget.startMonth`, which is a stored preference, so the laboratory draws
 * the control and stops there.
 *
 * The month sits under the title rather than beside it. It is the second most
 * important thing on the screen — every figure below is a figure *for* this
 * month — but putting it on the title line would make the two compete, and the
 * arrows would have to shrink to fit. Underneath, it gets the accent and the
 * arrows keep a full touch target.
 */
export function MobileBudgetTopBar({ month }: MobileBudgetTopBarProps) {
  const { t } = useTranslation();

  const arrow = css({
    width: 40,
    height: 40,
    flexShrink: 0,
    borderRadius: 999,
    color: 'var(--dfl-text-2)',
    '&[data-hovered]': { backgroundColor: 'var(--dfl-surface-raised)' },
    '&[data-pressed]': { backgroundColor: 'var(--dfl-inset)' },
  });

  return (
    <View
      style={{
        flexShrink: 0,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        height: 58,
        padding: '0 12px',
        borderBottom: '1px solid var(--dfl-line)',
      }}
    >
      <BrandMark size={28} />

      <Button variant="bare" aria-label={t('Mês anterior')} className={arrow}>
        <SvgCheveronLeft width={20} height={20} />
      </Button>

      <View style={{ flex: 1, minWidth: 0, alignItems: 'center', gap: 1 }}>
        <Text
          style={{
            fontSize: 17,
            fontWeight: 600,
            letterSpacing: -0.2,
            color: 'var(--dfl-text)',
          }}
        >
          <Trans>Orçamento</Trans>
        </Text>
        <Text
          style={{
            fontSize: 12.5,
            fontWeight: 600,
            whiteSpace: 'nowrap',
            color: 'var(--dfl-violet)',
          }}
        >
          {month}
        </Text>
      </View>

      <Button variant="bare" aria-label={t('Próximo mês')} className={arrow}>
        <SvgCheveronRight width={20} height={20} />
      </Button>
    </View>
  );
}
