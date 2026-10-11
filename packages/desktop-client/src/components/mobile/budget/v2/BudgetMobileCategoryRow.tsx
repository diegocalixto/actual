import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { Button } from '@actual-app/components/button';
import {
  SvgArrowThickRight,
  SvgCheveronRight,
} from '@actual-app/components/icons/v1';
import {
  SvgArrowsSynchronize,
  SvgCalendar3,
} from '@actual-app/components/icons/v2';
import { Text } from '@actual-app/components/text';
import { TextOneLine } from '@actual-app/components/text-one-line';
import { View } from '@actual-app/components/view';
import type { CategoryEntity } from '@actual-app/core/types/models';
import { css } from '@emotion/css';

import { FinancialText } from '#components/FinancialText';
import { iconForCategory } from '#components/v2lab/LabStyle';
import { useCategoryScheduleGoalTemplateIndicator } from '#hooks/useCategoryScheduleGoalTemplateIndicator';
import { useLocalPref } from '#hooks/useLocalPref';
import { usePrivacyMode } from '#hooks/usePrivacyMode';
import { useSheetValue } from '#hooks/useSheetValue';
import { useSyncedPref } from '#hooks/useSyncedPref';
import { envelopeBudget, trackingBudget } from '#spreadsheet/bindings';

import { BudgetMobileAmount } from './BudgetMobileAmount';
import { hueForIndex } from './budgetMobileHues';
import { BudgetMobileIconTile } from './BudgetMobileIconTile';
import { asMagnitude, formatCurrency, usedPercent } from './budgetMobileMoney';
import { BudgetMobileProgress } from './BudgetMobileProgress';
import { toneFor } from './budgetMobileTone';
import { useCategoryBalanceMenu } from './useCategoryBalanceMenu';
import { useCategoryBudgetMenu } from './useCategoryBudgetMenu';

type BudgetMobileCategoryRowProps = {
  category: CategoryEntity;
  month: string;
  /** Position within its group, which is what chooses the row's tile colour. */
  index: number;
  /** The last row closes its group, so it draws no divider. */
  isLast: boolean;
  isHidden: boolean;
  onEditCategory: (id: CategoryEntity['id']) => void;
  onBudgetAction: (month: string, action: string, args: unknown) => void;
  onShowActivity: () => void;
};

/**
 * How full a category is, and what is left of it.
 *
 * The row answers two questions in the order a person asks them: how far into
 * this envelope am I, and how much can I still spend. The percentage and its
 * bar are the same fact drawn twice — one for reading, one for scanning a
 * column of them — and the two amounts are captioned because "Orçado" and
 * "Saldo" are not interchangeable and the screen already carries several other
 * balances.
 *
 * Everything the upstream row could do, this row still does, only from
 * different controls: the name opens the category's menu, the plan opens the
 * budget menu that edits it, the balance opens the balance menu that carries
 * it over, transfers it or covers an overspend, and the chevron opens the
 * category's transactions. Nothing here computes a financial figure — the four
 * cells are read from the budget engine and only combined into a percentage,
 * which is derived rather than stored so it can never disagree with them.
 */
export function BudgetMobileCategoryRow({
  category,
  month,
  index,
  isLast,
  isHidden,
  onEditCategory,
  onBudgetAction,
  onShowActivity,
}: BudgetMobileCategoryRowProps) {
  const { t } = useTranslation();
  const isPrivacyEnabled = usePrivacyMode();
  const [budgetType = 'envelope'] = useSyncedPref('budgetType');
  const isTracking = budgetType === 'tracking';
  // Which of the row's two plan figures the expression prints. The upstream
  // table showed one of Budgeted and Spent at a time on a narrow screen and
  // swapped them from a column header; the preference is the same one, and the
  // page menu is where it is now switched. Default — and so the approved row —
  // is the plan.
  const [showSpentColumn = false] = useLocalPref('mobile.showSpentColumn');

  const budgeted = useSheetValue<
    'envelope-budget' | 'tracking-budget',
    'budget'
  >(
    isTracking
      ? trackingBudget.catBudgeted(category.id)
      : envelopeBudget.catBudgeted(category.id),
  );
  const spent = useSheetValue<
    'envelope-budget' | 'tracking-budget',
    'sum-amount'
  >(
    isTracking
      ? trackingBudget.catSumAmount(category.id)
      : envelopeBudget.catSumAmount(category.id),
  );
  const balance = useSheetValue<
    'envelope-budget' | 'tracking-budget',
    'leftover'
  >(
    isTracking
      ? trackingBudget.catBalance(category.id)
      : envelopeBudget.catBalance(category.id),
  );
  const carryover = useSheetValue<
    'envelope-budget' | 'tracking-budget',
    'carryover'
  >(
    isTracking
      ? trackingBudget.catCarryover(category.id)
      : envelopeBudget.catCarryover(category.id),
  );

  const onOpenBudgetMenu = useCategoryBudgetMenu({
    category,
    month,
    onBudgetAction,
  });
  const onOpenBalanceMenu = useCategoryBalanceMenu({
    category,
    month,
    onBudgetAction,
  });

  const { schedule, scheduleStatus, isScheduleRecurring } =
    useCategoryScheduleGoalTemplateIndicator({ category, month });

  const spentMagnitude = spent === null ? null : asMagnitude(spent);
  const percent = usedPercent(spentMagnitude, budgeted);
  const tone = toneFor(balance, percent);
  const Icon = iconForCategory(category.name);

  // The upstream row could show the spent amount in a column of its own, behind
  // a Budgeted/Spent toggle. This composition shows the plan and the balance at
  // once and spends the remaining width on the name, so the amount itself lives
  // in the plan control's accessible name — the figure is still one press from
  // the register, and it is no longer hidden behind a toggle.
  // The row's second line, in the approved shape. Only which of the two amounts
  // it names changes with the preference — the share, the bar, the balance and
  // the tone are the same facts either way. The amount is a figure of its own
  // inside the phrase, so privacy mode can hide it and leave the share readable.
  const detailValue = showSpentColumn ? spentMagnitude : budgeted;
  const detail =
    percent === null ? (
      showSpentColumn ? (
        <Trans>
          Gasto <BudgetMobileAmount value={detailValue} ownsControl />
        </Trans>
      ) : (
        <Trans>
          Orçado <BudgetMobileAmount value={detailValue} ownsControl />
        </Trans>
      )
    ) : showSpentColumn ? (
      <Trans>
        {{ percent }}% usado · Gasto{' '}
        <BudgetMobileAmount value={detailValue} ownsControl />
      </Trans>
    ) : (
      <Trans>
        {{ percent }}% usado · Orçado{' '}
        <BudgetMobileAmount value={detailValue} ownsControl />
      </Trans>
    );

  // With privacy mode on the name stops short of the amounts: a label is read
  // aloud, and it is the one place a hidden figure would still be spelled out.
  const planLabel =
    isPrivacyEnabled || spentMagnitude === null || budgeted === null
      ? t('Editar o orçamento de {{name}}', { name: category.name })
      : t(
          'Editar o orçamento de {{name}}. Gasto {{spent}} de {{planned}} orçado.',
          {
            name: category.name,
            spent: formatCurrency(spentMagnitude),
            planned: formatCurrency(budgeted),
          },
        );

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: '9px 12px',
        borderBottom: isLast ? 'none' : '1px solid var(--dfl-line)',
        opacity: isHidden ? 0.5 : undefined,
      }}
    >
      {/* Hidden drag button — the handle react-aria's drag hooks look for. */}
      <Button
        slot="drag"
        // Kept exactly as the upstream rows had it: react-aria's drag hooks
        // look for this handle, and its pointer behaviour is what shipped.
        style={{
          opacity: 0,
          width: 1,
          height: 1,
          position: 'absolute',
          overflow: 'hidden',
        }}
      />

      <BudgetMobileIconTile
        Icon={Icon}
        hue={hueForIndex(index)}
        badge={
          schedule &&
          scheduleStatus && (
            <View
              style={{
                color:
                  scheduleStatus === 'missed'
                    ? 'var(--dfl-negative)'
                    : scheduleStatus === 'due'
                      ? 'var(--dfmb-watch)'
                      : 'var(--dfl-blue)',
              }}
            >
              {isScheduleRecurring ? (
                <SvgArrowsSynchronize width={11} height={11} />
              ) : (
                <SvgCalendar3 width={10} height={10} />
              )}
            </View>
          )
        }
      />

      <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
        <Button
          variant="bare"
          onPress={() => onEditCategory(category.id)}
          aria-label={t('Abrir menu da categoria {{name}}', {
            name: category.name,
          })}
          className={css({
            width: '100%',
            justifyContent: 'flex-start',
            padding: '1px 2px',
            borderRadius: 6,
            '&[data-hovered]': { backgroundColor: 'var(--dfl-inset)' },
          })}
        >
          <TextOneLine
            data-testid="category-name"
            style={{
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: -0.2,
              textAlign: 'left',
              color: 'var(--dfl-text)',
            }}
          >
            {category.name}
          </TextOneLine>
        </Button>

        <Button
          variant="bare"
          onPress={onOpenBudgetMenu}
          aria-label={planLabel}
          className={css({
            width: '100%',
            padding: '2px 2px',
            borderRadius: 6,
            '&[data-hovered]': { backgroundColor: 'var(--dfl-inset)' },
          })}
        >
          <View
            style={{
              width: '100%',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <View style={{ flex: 1, minWidth: 20 }}>
              <BudgetMobileProgress percent={percent} tone={tone} />
            </View>
            {/* The plan rides with the percentage instead of holding a column
                of its own. Three money columns in a 404px row left the name and
                the bar fighting for what was left; as a phrase, the share and
                the plan fit in the space one of them took.

                Both halves are named. "79% de R$ 180,00" is arithmetically
                right but leaves the reader to infer what the amount is — and on
                a row that already carries a second amount labelled "Saldo", an
                unlabelled one is a number to be guessed at. */}
            <FinancialText
              style={{
                flexShrink: 0,
                fontSize: 'clamp(8px, 2.2vw, 11px)',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                color: tone,
              }}
            >
              {detail}
            </FinancialText>
          </View>
        </Button>
      </View>

      <Button
        variant="bare"
        onPress={onOpenBalanceMenu}
        aria-label={t('Abrir menu de saldo de {{name}}', {
          name: category.name,
        })}
        className={css({
          position: 'relative',
          flexShrink: 0,
          minHeight: 40,
          padding: '2px 4px',
          borderRadius: 8,
          '&[data-hovered]': { backgroundColor: 'var(--dfl-inset)' },
        })}
      >
        <View style={{ alignItems: 'flex-end' }}>
          <FinancialText
            style={{
              fontSize: 'clamp(12px, 3.4vw, 13.5px)',
              fontWeight: 700,
              whiteSpace: 'nowrap',
              color: tone,
            }}
          >
            <BudgetMobileAmount value={balance} ownsControl />
          </FinancialText>
          <Text style={{ fontSize: 9, color: 'var(--dfmb-label)' }}>
            <Trans>Saldo</Trans>
          </Text>
        </View>
        {/* The balance rolls over into next month. The upstream row drew this
            same arrow against its balance cell; the menu behind this control is
            what turns it on and off, so the state has to stay visible. */}
        {Boolean(carryover) && (
          <View
            style={{
              position: 'absolute',
              right: -2,
              top: 0,
              borderRadius: '50%',
              color: tone,
            }}
          >
            <SvgArrowThickRight width={10} height={10} />
          </View>
        )}
      </Button>

      <Button
        variant="bare"
        onPress={onShowActivity}
        aria-label={t('Ver as transações de {{name}}', {
          name: category.name,
        })}
        className={css({
          flexShrink: 0,
          minHeight: 40,
          padding: '2px 1px',
          borderRadius: 999,
          color: 'var(--dfl-text-3)',
          '&[data-hovered]': { backgroundColor: 'var(--dfl-inset)' },
        })}
      >
        <SvgCheveronRight width={15} height={15} />
      </Button>
    </View>
  );
}
