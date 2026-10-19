import React from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@actual-app/components/button';
import {
  SvgCheveronLeft,
  SvgCheveronRight,
} from '@actual-app/components/icons/v1';
import { Text } from '@actual-app/components/text';
import { View } from '@actual-app/components/view';
import { css } from '@emotion/css';

import { ReportsPeriodMenu } from '#components/v2lab/reports/ReportsPeriodMenu';
import type { ReportsPeriodControl } from '#components/v2lab/reports/ReportsView';

import { reportsMobileLayout } from './ReportsMobileStyle';

type ReportsMobilePeriodBarProps = {
  period: ReportsPeriodControl;
  /** "1 ago – 31 ago de 2026": the days the month on screen runs across. */
  rangeLabel: string;
  /** Which accounts every figure below counts. */
  scopeLabel: string;
};

/**
 * The period, on a phone: the month everything below is a figure *for*.
 *
 * The same three controls as the Budget's bar, so stepping through months is
 * one gesture learned once — an arrow each way, and the month itself, which
 * opens the list of months to jump to. Each is a full touch target; an arrow
 * with nowhere to go stays in place, dimmed, so the month does not shift under
 * a thumb when the first or the current month is reached.
 *
 * Under them, in the page's quietest type, what the figures are counted over:
 * the days, and the accounts.
 */
export function ReportsMobilePeriodBar({
  period,
  rangeLabel,
  scopeLabel,
}: ReportsMobilePeriodBarProps) {
  const { t } = useTranslation();

  const arrow = css({
    width: reportsMobileLayout.touchTarget,
    height: reportsMobileLayout.touchTarget,
    flexShrink: 0,
    padding: 0,
    borderRadius: 999,
    color: 'var(--dfl-text)',
    '&[data-hovered]': { backgroundColor: 'var(--dfl-inset)' },
    '&[data-pressed]': { backgroundColor: 'var(--dfl-inset)' },
  });

  return (
    <View style={{ gap: 2 }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 4,
          // The arrows' boxes reach the gutter, their glyphs sit on it.
          margin: '0 -8px',
        }}
      >
        <Button
          variant="bare"
          aria-label={t('Mês anterior')}
          isDisabled={!period.canGoPrevious}
          onPress={period.onPrevious}
          className={arrow}
          style={{ opacity: period.canGoPrevious ? 1 : 0.4 }}
        >
          <SvgCheveronLeft width={20} height={20} />
        </Button>

        <ReportsPeriodMenu period={period} isForTouch />

        <Button
          variant="bare"
          aria-label={t('Próximo mês')}
          isDisabled={!period.canGoNext}
          onPress={period.onNext}
          className={arrow}
          style={{ opacity: period.canGoNext ? 1 : 0.4 }}
        >
          <SvgCheveronRight width={20} height={20} />
        </Button>
      </View>

      <Text
        style={{
          fontSize: 12,
          textAlign: 'center',
          color: 'var(--dfl-text-3)',
        }}
      >
        {rangeLabel} · {scopeLabel}
      </Text>
    </View>
  );
}
