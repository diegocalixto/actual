import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { Button } from '@actual-app/components/button';
import { SvgCheveronRight } from '@actual-app/components/icons/v1';
import { Text } from '@actual-app/components/text';
import { TextOneLine } from '@actual-app/components/text-one-line';
import { View } from '@actual-app/components/view';
import * as monthUtils from '@actual-app/core/shared/months';
import type { CategoryEntity } from '@actual-app/core/types/models';
import { css } from '@emotion/css';

import { FinancialText } from '#components/FinancialText';
import { useHomeSheetCell } from '#components/home/useHomeSheetCell';
import { iconForCategory } from '#components/v2lab/LabStyle';
import { useSheetValue } from '#hooks/useSheetValue';
import { useSyncedPref } from '#hooks/useSyncedPref';
import { envelopeBudget, trackingBudget } from '#spreadsheet/bindings';

import { BudgetMobileIconTile } from './BudgetMobileIconTile';
import { formatCurrencyOrPending } from './budgetMobileMoney';
import { useCategoryBudgetMenu } from './useCategoryBudgetMenu';

type BudgetMobileIncomeRowProps = {
  category: CategoryEntity;
  month: string;
  isLast: boolean;
  isHidden: boolean;
  onEditCategory: (id: CategoryEntity['id']) => void;
  onBudgetAction: (month: string, action: string, args: unknown) => void;
  /**
   * What the amount opens. Envelope budgets raise the income balance menu, which
   * is where an income category's carryover lives; tracking budgets go straight
   * to the register, exactly as the upstream row did.
   */
  onPressAmount: () => void;
  onShowActivity: () => void;
};

/**
 * One source of income.
 *
 * Simpler than an expense row on purpose: under an envelope budget income has
 * no plan to be measured against, so there is no percentage and no bar —
 * inventing a progress track here would imply a target the budget does not
 * hold. A tracking budget *does* budget its income, so that row gains the one
 * extra line the plan needs, and the control that edits it.
 *
 * Green is used only in this section, where a positive figure has an
 * unambiguous meaning: money that arrived.
 */
export function BudgetMobileIncomeRow({
  category,
  month,
  isLast,
  isHidden,
  onEditCategory,
  onBudgetAction,
  onPressAmount,
  onShowActivity,
}: BudgetMobileIncomeRowProps) {
  const { t } = useTranslation();
  const [budgetType = 'envelope'] = useSyncedPref('budgetType');
  const isTracking = budgetType === 'tracking';

  const received = useSheetValue<
    'envelope-budget' | 'tracking-budget',
    'sum-amount'
  >(
    isTracking
      ? trackingBudget.catSumAmount(category.id)
      : envelopeBudget.catSumAmount(category.id),
  );
  // Only a tracking budget budgets its income; an envelope budget creates no
  // `budget` cell for an income category at all. `useHomeSheetCell` takes
  // `null` for "read nothing", so under an envelope budget no subscription is
  // opened rather than one pointed at a cell that does not exist.
  const budgeted = useHomeSheetCell(
    monthUtils.sheetForMonth(month),
    isTracking ? trackingBudget.catBudgeted(category.id) : null,
  );

  const onOpenBudgetMenu = useCategoryBudgetMenu({
    category,
    month,
    onBudgetAction,
  });

  const Icon = iconForCategory(category.name);

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        padding: '10px 12px',
        borderBottom: isLast ? 'none' : '1px solid var(--dfl-line)',
        opacity: isHidden ? 0.5 : undefined,
      }}
    >
      {/* Hidden drag button, kept so the row matches its expense counterpart if
          the income list ever gains reordering. */}
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

      <BudgetMobileIconTile Icon={Icon} hue="var(--dfl-hue-green)" />

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

        {isTracking && (
          <Button
            variant="bare"
            onPress={onOpenBudgetMenu}
            aria-label={t('Editar o orçamento de {{name}}', {
              name: category.name,
            })}
            className={css({
              alignSelf: 'flex-start',
              padding: '1px 2px',
              borderRadius: 6,
              '&[data-hovered]': { backgroundColor: 'var(--dfl-inset)' },
            })}
          >
            <FinancialText
              style={{
                fontSize: 'clamp(8px, 2.2vw, 11px)',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                color: 'var(--dfmb-label)',
              }}
            >
              {t('Orçado {{planned}}', {
                planned: formatCurrencyOrPending(budgeted),
              })}
            </FinancialText>
          </Button>
        )}
      </View>

      <Button
        variant="bare"
        onPress={onPressAmount}
        aria-label={
          isTracking
            ? t('Ver as transações de {{name}}', { name: category.name })
            : t('Abrir menu de saldo de {{name}}', { name: category.name })
        }
        className={css({
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
              fontSize: 'clamp(12px, 3.3vw, 13.5px)',
              fontWeight: 700,
              whiteSpace: 'nowrap',
              color: 'var(--dfl-positive)',
            }}
          >
            {formatCurrencyOrPending(received)}
          </FinancialText>
          <Text style={{ fontSize: 9, color: 'var(--dfmb-label)' }}>
            <Trans>Recebido</Trans>
          </Text>
        </View>
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
