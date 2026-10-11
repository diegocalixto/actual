import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { Button } from '@actual-app/components/button';
import {
  SvgCheveronLeft,
  SvgCheveronRight,
} from '@actual-app/components/icons/v1';
import { SvgCalendar } from '@actual-app/components/icons/v2';
import { Text } from '@actual-app/components/text';
import { View } from '@actual-app/components/view';
import * as monthUtils from '@actual-app/core/shared/months';
import { css } from '@emotion/css';

import { BrandMark } from '#components/appshell/BrandMark';

import { formatMonthLabel } from './budgetMobileMoney';
import { budgetLayout, chromeCanvas, chromeLine } from './BudgetMobileStyle';

/**
 * The app opts into `viewport-fit=cover`, so on an iPhone the web content is
 * laid out under the status bar. The strip is reserved above the bar's own
 * height, exactly as `Page`'s shared mobile header does, and collapses to
 * nothing wherever the inset resolves to 0.
 */
const SAFE_AREA_TOP = 'env(safe-area-inset-top, 0px)';

type BudgetMobileTopBarProps = {
  /** `YYYY-MM`. */
  month: string;
  monthBounds: { start: string; end: string };
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onCurrentMonth: () => void;
  onOpenMonthMenu: (month: string) => void;
  onOpenPageMenu: () => void;
};

/**
 * The bar, as the approved composition draws it.
 *
 * It is portalled into the shell's persistent header slot like every other
 * mobile page's header, so the screen keeps the shared chrome contract and
 * gains no second header of its own. It is painted in this scope's own literals
 * rather than its tokens, because the slot sits outside the page's class and a
 * `var(--dfl-canvas)` would not resolve there.
 *
 * Every control the upstream header had is still here. The mark opens the
 * page's menu — add a group, show hidden categories, switch budget file. The
 * arrows move the month and stop at the budget's real bounds. The month itself
 * opens the month's menu, which is where copying last month's budget and the
 * averages live; it keeps its `data-month` attribute, which is how the tests
 * and the tour find the selected month. And the jump back to today appears only
 * when there is somewhere to jump back from, which is also when the approved
 * bar has room for it.
 *
 * The month sits under the title rather than beside it. It is the second most
 * important thing on the screen — every figure below is a figure *for* this
 * month — but putting it on the title line would make the two compete and force
 * the arrows to shrink below a usable target.
 */
export function BudgetMobileTopBar({
  month,
  monthBounds,
  onPrevMonth,
  onNextMonth,
  onCurrentMonth,
  onOpenMonthMenu,
  onOpenPageMenu,
}: BudgetMobileTopBarProps) {
  const { t } = useTranslation();

  const isPrevEnabled = month > monthBounds.start;
  const isNextEnabled = month < monthUtils.subMonths(monthBounds.end, 1);
  const isCurrentMonth = monthUtils.isCurrentMonth(month);

  const roundButton = css({
    width: 38,
    height: 40,
    flexShrink: 0,
    padding: 0,
    borderRadius: 999,
    color: 'var(--dfl-text-2)',
    '&[data-hovered]': { backgroundColor: 'rgba(150, 180, 215, 0.06)' },
    '&[data-pressed]': { backgroundColor: 'rgba(150, 180, 215, 0.12)' },
  });

  return (
    <View
      style={{
        flexShrink: 0,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
        height: `calc(${budgetLayout.topBarHeight}px + ${SAFE_AREA_TOP})`,
        paddingTop: SAFE_AREA_TOP,
        paddingLeft: 10,
        paddingRight: 10,
        backgroundColor: chromeCanvas,
        borderBottom: `1px solid ${chromeLine}`,
      }}
    >
      <Button
        variant="bare"
        onPress={onOpenPageMenu}
        aria-label={t('Menu da página de orçamento')}
        className={css({
          flexShrink: 0,
          padding: 4,
          borderRadius: 999,
          '&[data-hovered]': { backgroundColor: 'rgba(150, 180, 215, 0.06)' },
        })}
      >
        <BrandMark size={28} />
      </Button>

      <Button
        variant="bare"
        aria-label={t('Mês anterior')}
        isDisabled={!isPrevEnabled}
        onPress={onPrevMonth}
        className={roundButton}
        style={{ opacity: isPrevEnabled ? 1 : 0.4 }}
      >
        <SvgCheveronLeft width={20} height={20} />
      </Button>

      <View style={{ flex: 1, minWidth: 0, alignItems: 'center' }}>
        {/* The shared mobile header put the page's title in an `h1`; this bar
            replaces that header, so the heading has to come with it — a page
            whose title is only a styled span has no heading at all. */}
        <h1
          style={{
            margin: 0,
            padding: 0,
            fontSize: 16,
            fontWeight: 600,
            letterSpacing: -0.2,
            whiteSpace: 'nowrap',
            color: '#e9eef6',
          }}
        >
          <Trans>Orçamento</Trans>
        </h1>
        <Button
          variant="bare"
          data-month={month}
          onPress={() => onOpenMonthMenu(month)}
          aria-label={t('Ações do mês')}
          className={css({
            padding: '0 6px',
            borderRadius: 6,
            '&[data-hovered]': { backgroundColor: 'rgba(150, 180, 215, 0.06)' },
          })}
        >
          <Text
            style={{
              fontSize: 12.5,
              fontWeight: 600,
              whiteSpace: 'nowrap',
              color: '#9b7bff',
            }}
          >
            {formatMonthLabel(month)}
          </Text>
        </Button>
      </View>

      <Button
        variant="bare"
        aria-label={t('Próximo mês')}
        isDisabled={!isNextEnabled}
        onPress={onNextMonth}
        className={roundButton}
        style={{ opacity: isNextEnabled ? 1 : 0.4 }}
      >
        <SvgCheveronRight width={20} height={20} />
      </Button>

      {!isCurrentMonth && (
        <Button
          variant="bare"
          aria-label={t('Ir para o mês atual')}
          onPress={onCurrentMonth}
          className={roundButton}
        >
          <SvgCalendar width={18} height={18} />
        </Button>
      )}
    </View>
  );
}
