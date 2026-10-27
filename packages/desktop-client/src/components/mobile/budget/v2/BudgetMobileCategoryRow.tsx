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
import { MOBILE_TYPE } from '#components/v2lab/typeScale';
import { useCategoryScheduleGoalTemplateIndicator } from '#hooks/useCategoryScheduleGoalTemplateIndicator';
import { useLocalPref } from '#hooks/useLocalPref';
import { usePrivacyMode } from '#hooks/usePrivacyMode';
import { useSheetValue } from '#hooks/useSheetValue';
import { useSyncedPref } from '#hooks/useSyncedPref';
import { envelopeBudget, trackingBudget } from '#spreadsheet/bindings';

import { BudgetMobileAmount } from './BudgetMobileAmount';
import { hueForCategoryRow } from './budgetMobileHues';
import { BudgetMobileIconTile } from './BudgetMobileIconTile';
import { asMagnitude, formatCurrency, usedPercent } from './budgetMobileMoney';
import { BudgetMobileProgress } from './BudgetMobileProgress';
import { toneFor } from './budgetMobileTone';
import { useCategoryBalanceMenu } from './useCategoryBalanceMenu';
import { useCategoryBudgetMenu } from './useCategoryBudgetMenu';

/**
 * Each of the row's controls gets a finger's 44pt and a point to spare: the
 * rows start on fractional offsets, and an exact 44 lost its last half point to
 * the neighbouring band when the layout rounded.
 */
const TARGET = 46;
/** The row's horizontal padding, which the controls on its edges reach across. */
const ROW_PADDING_X = 12;
const ROW_GAP = 8;
/** What a control answers a press with. Touch has no hover to do it. */
const PRESSED = 'rgba(150, 180, 215, 0.1)';

type BudgetMobileCategoryRowProps = {
  category: CategoryEntity;
  month: string;
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
 *
 * Four controls share one row, divided between them with nothing left over —
 * the name has its upper band, the plan its lower band, the balance and the
 * chevron the full height — and each of them is at least 44pt on both sides.
 * The bands used to be 30 and 27pt, which put the name's menu and the plan's
 * editor under one fingertip; the row is taller instead, and the name still
 * sits right over its bar, so the two still read as one. A press tints the
 * control that took it, which is the only way a phone can say which of the
 * four that was.
 */
export function BudgetMobileCategoryRow({
  category,
  month,
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
        gap: ROW_GAP,
        padding: `0 ${ROW_PADDING_X}px`,
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
        hue={hueForCategoryRow(category.id)}
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

      <View style={{ flex: 1, minWidth: 0 }}>
        <Button
          variant="bare"
          onPress={() => onEditCategory(category.id)}
          aria-label={t('Abrir menu da categoria {{name}}', {
            name: category.name,
          })}
          className={css({
            width: '100%',
            minHeight: TARGET,
            justifyContent: 'flex-start',
            // The name rests on the band's floor, over its bar.
            alignItems: 'flex-end',
            padding: '0 2px 4px',
            borderRadius: 6,
            '&[data-hovered]': { backgroundColor: 'var(--dfl-inset)' },
            '&[data-pressed]': { backgroundColor: PRESSED },
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
            minHeight: TARGET,
            // The bar hangs from the band's ceiling, under its name.
            alignItems: 'flex-start',
            padding: '4px 2px 0',
            borderRadius: 6,
            '&[data-hovered]': { backgroundColor: 'var(--dfl-inset)' },
            '&[data-pressed]': { backgroundColor: PRESSED },
          })}
        >
          {/* The bar and the phrase share a line while both fit. When the
              amounts are long they do not, and the phrase used to be cut by
              the control's edge — "Orçado R$ 1.2" for a plan of R$ 1.234.567,89.
              It now takes the next line whole, and the bar keeps its own. */}
          <View
            style={{
              width: '100%',
              flexDirection: 'row',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'flex-end',
              columnGap: 5,
              rowGap: 3,
            }}
          >
            <View style={{ flex: '1 1 20px', minWidth: 20 }}>
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
                flex: '0 1 auto',
                minWidth: 0,
                maxWidth: '100%',
                fontSize: MOBILE_TYPE.caption,
                fontWeight: 600,
                textAlign: 'right',
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
          // The row's full height.
          minHeight: 2 * TARGET,
          padding: '0 4px',
          borderRadius: 8,
          '&[data-hovered]': { backgroundColor: 'var(--dfl-inset)' },
          '&[data-pressed]': { backgroundColor: PRESSED },
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
          <Text
            style={{
              fontSize: MOBILE_TYPE.caption,
              color: 'var(--dfmb-label)',
            }}
          >
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
              top: 'calc(50% - 16px)',
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
          // Above the amount beside it, whose padding this target overlaps.
          position: 'relative',
          flexShrink: 0,
          // The row's full height, and every point of width between the
          // balance's ink and the card's edge: the gap, and the padding on
          // either side of it — 45pt in all.
          minHeight: 2 * TARGET,
          padding: `0 ${ROW_PADDING_X + 1}px 0 ${ROW_GAP + 9}px`,
          margin: `0 -${ROW_PADDING_X}px 0 -${ROW_GAP + 8}px`,
          borderRadius: 0,
          color: 'var(--dfl-text-3)',
          '&[data-hovered]': { backgroundColor: 'var(--dfl-inset)' },
          '&[data-pressed]': { backgroundColor: PRESSED },
        })}
      >
        <SvgCheveronRight width={15} height={15} />
      </Button>
    </View>
  );
}
