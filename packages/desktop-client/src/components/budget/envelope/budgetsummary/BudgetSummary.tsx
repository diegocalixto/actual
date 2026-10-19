import React, { memo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@actual-app/components/button';
import { SvgDotsHorizontalTriple } from '@actual-app/components/icons/v1';
import {
  SvgArrowButtonDown1,
  SvgArrowButtonUp1,
} from '@actual-app/components/icons/v2';
import { Popover } from '@actual-app/components/popover';
import { Text } from '@actual-app/components/text';
import { View } from '@actual-app/components/view';
import * as monthUtils from '@actual-app/core/shared/months';

import { shellColors, shellRadius } from '#components/appshell/shellTheme';
import { useEnvelopeBudget } from '#components/budget/envelope/EnvelopeBudgetContext';
import { NotesButton } from '#components/NotesButton';
import { useLocale } from '#hooks/useLocale';
import { SheetNameProvider } from '#hooks/useSheetName';
import { useUndo } from '#hooks/useUndo';

import { BudgetMonthMenu } from './BudgetMonthMenu';
import { ToBudget } from './ToBudget';
import { TotalsList } from './TotalsList';

type BudgetSummaryProps = {
  month: string;
};
export const BudgetSummary = memo(({ month }: BudgetSummaryProps) => {
  const locale = useLocale();
  const {
    currentMonth,
    summaryCollapsed: collapsed,
    onBudgetAction,
    onToggleSummaryCollapse,
  } = useEnvelopeBudget();

  const [menuOpen, setMenuOpen] = useState(false);
  const triggerRef = useRef(null);
  const { showUndoNotification } = useUndo();

  function onMenuOpen() {
    setMenuOpen(true);
  }

  function onMenuClose() {
    setMenuOpen(false);
  }

  const prevMonthName = monthUtils.format(
    monthUtils.prevMonth(month),
    'MMM',
    locale,
  );

  const ExpandOrCollapseIcon = collapsed
    ? SvgArrowButtonDown1
    : SvgArrowButtonUp1;

  const displayMonth = monthUtils.format(month, "MMMM ''yy", locale);
  const { t } = useTranslation();

  return (
    <View
      data-testid="budget-summary"
      data-month={month}
      style={{
        // A panel, not a boxed card: it sits a few levels above the canvas and
        // is separated by a hairline and its radius, the way the product
        // reference treats every surface.
        backgroundColor: shellColors.surface,
        border: `1px solid ${
          month === currentMonth ? shellColors.borderStrong : shellColors.border
        }`,
        borderRadius: shellRadius.card,
        marginTop: 4,
        marginBottom: 8,
        flex: 1,
        cursor: 'default',
        overflow: 'hidden',
        '& .hover-visible': {
          opacity: 0,
          transition: 'opacity .25s',
        },
        '&:hover .hover-visible': {
          opacity: 1,
        },
      }}
    >
      <SheetNameProvider name={monthUtils.sheetForMonth(month)}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            padding: '12px 14px 0',
          }}
        >
          <Text
            style={{
              fontSize: 15,
              fontWeight: month === currentMonth ? 700 : 600,
              letterSpacing: -0.2,
              color:
                month === currentMonth
                  ? shellColors.textPrimary
                  : shellColors.textSecondary,
            }}
          >
            {monthUtils.format(month, "MMMM ''yy", locale)}
          </Text>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
            <Button
              variant="bare"
              aria-label={
                collapsed
                  ? t('Expand month summary')
                  : t('Collapse month summary')
              }
              className="hover-visible"
              onPress={onToggleSummaryCollapse}
            >
              <ExpandOrCollapseIcon
                width={13}
                height={13}
                style={{ color: shellColors.textMuted, margin: 1 }}
              />
            </Button>
            <NotesButton
              id={`budget-${month}`}
              width={15}
              height={15}
              tooltipPosition="bottom right"
              defaultColor={shellColors.textMuted}
            />
            <Button
              ref={triggerRef}
              variant="bare"
              aria-label={t('Menu')}
              onPress={onMenuOpen}
            >
              <SvgDotsHorizontalTriple
                width={15}
                height={15}
                style={{ color: shellColors.textMuted }}
              />
            </Button>

            <Popover
              triggerRef={triggerRef}
              isOpen={menuOpen}
              onOpenChange={onMenuClose}
            >
              <BudgetMonthMenu
                onCopyLastMonthBudget={() => {
                  onBudgetAction(month, 'copy-last');
                  onMenuClose();
                  showUndoNotification({
                    message: t(
                      "{{displayMonth}} budgets have all been set to last month's budgeted amounts.",
                      { displayMonth },
                    ),
                  });
                }}
                onSetBudgetsToZero={() => {
                  onBudgetAction(month, 'set-zero');
                  onMenuClose();
                  showUndoNotification({
                    message: t(
                      '{{displayMonth}} budgets have all been set to zero.',
                      { displayMonth },
                    ),
                  });
                }}
                onSetMonthsAverage={numberOfMonths => {
                  onBudgetAction(month, `set-${numberOfMonths}-avg`);
                  onMenuClose();
                  showUndoNotification({
                    message:
                      numberOfMonths === 12
                        ? t(
                            `${displayMonth} budgets have all been set to yearly average.`,
                          )
                        : t(
                            `${displayMonth} budgets have all been set to ${numberOfMonths} month average.`,
                          ),
                  });
                }}
                onCheckTemplates={() => {
                  onBudgetAction(month, 'check-templates');
                  onMenuClose();
                }}
                onApplyBudgetTemplates={() => {
                  onBudgetAction(month, 'apply-goal-template');
                  onMenuClose();
                  showUndoNotification({
                    message: t(
                      '{{displayMonth}} budget templates have been applied.',
                      { displayMonth },
                    ),
                  });
                }}
                onOverwriteWithBudgetTemplates={() => {
                  onBudgetAction(month, 'overwrite-goal-template');
                  onMenuClose();
                  showUndoNotification({
                    message: t(
                      '{{displayMonth}} budget templates have been overwritten.',
                      { displayMonth },
                    ),
                  });
                }}
                onEndOfMonthCleanup={() => {
                  onBudgetAction(month, 'cleanup-goal-template');
                  onMenuClose();
                  showUndoNotification({
                    message: t(
                      '{{displayMonth}} end-of-month cleanup templates have been applied.',
                      { displayMonth },
                    ),
                  });
                }}
              />
            </Popover>
          </View>
        </View>

        {/* The month's headline figure leads; the supporting totals sit beside
            it instead of underneath, so the panel reads as a summary band
            rather than as a stack of table rows. */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'stretch',
            gap: 14,
            padding: collapsed ? '10px 14px 14px' : '10px 14px 16px',
          }}
        >
          <View
            style={{ flex: '1 1 0', minWidth: 0, justifyContent: 'center' }}
          >
            <ToBudget
              prevMonthName={prevMonthName}
              month={month}
              onBudgetAction={onBudgetAction}
              isCollapsed={collapsed}
            />
          </View>

          {!collapsed && (
            <>
              <View
                aria-hidden="true"
                style={{
                  width: 1,
                  alignSelf: 'stretch',
                  flexShrink: 0,
                  backgroundColor: shellColors.border,
                }}
              />
              <TotalsList
                prevMonthName={prevMonthName}
                style={{ flex: '1 1 0', minWidth: 0, gap: 3 }}
              />
            </>
          )}
        </View>
      </SheetNameProvider>
    </View>
  );
});

BudgetSummary.displayName = 'EnvelopeBudgetSummary';
