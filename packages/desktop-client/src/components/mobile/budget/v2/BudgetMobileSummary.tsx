import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { View } from '@actual-app/components/view';
import * as monthUtils from '@actual-app/core/shared/months';

import { useSheetValue } from '#hooks/useSheetValue';
import { envelopeBudget, trackingBudget } from '#spreadsheet/bindings';

import { BudgetMobileHero } from './BudgetMobileHero';
import { BudgetMobileMetrics } from './BudgetMobileMetrics';
import { budgetLayout } from './BudgetMobileStyle';
import { useBudgetMobileTotals } from './useBudgetMobileTotals';

type BudgetMobileSummaryProps = {
  month: string;
  budgetType: 'envelope' | 'tracking';
  /** Opens the budget summary modal — the upstream header's own action. */
  onShowBudgetSummary: () => void;
};

/**
 * The top of the Budget: the headline figure, then the month in three figures.
 *
 * The hero is split by budget type rather than by a conditional inside one
 * component, because the two types read different cells and binding an envelope
 * cell on a tracking sheet would be a subscription to a cell that does not
 * exist. Which one is mounted is the only difference; the surface, the ring and
 * the action behind them are shared.
 */
export function BudgetMobileSummary({
  month,
  budgetType,
  onShowBudgetSummary,
}: BudgetMobileSummaryProps) {
  const totals = useBudgetMobileTotals(month, budgetType);

  return (
    <View
      // The upstream table header carried this id, and the figures it exposed
      // are the figures this block exposes; keeping it means the page models
      // that look for the month's totals still find them.
      data-testid="budget-table-header"
      // Each block on this page reserves its own bottom margin rather than the
      // stack spacing them, so a month with no alerts starts at the hero.
      style={{
        gap: budgetLayout.stackGap,
        marginBottom: budgetLayout.stackGap,
      }}
    >
      {budgetType === 'tracking' ? (
        <TrackingHero
          month={month}
          usedPercent={totals.usedPercent}
          onPress={onShowBudgetSummary}
        />
      ) : (
        <EnvelopeHero
          usedPercent={totals.usedPercent}
          onPress={onShowBudgetSummary}
        />
      )}

      <BudgetMobileMetrics
        planned={totals.planned}
        spent={totals.spent}
        monthBalance={totals.monthBalance}
        income={totals.income}
      />
    </View>
  );
}

type HeroVariantProps = {
  usedPercent: number | null;
  onPress: () => void;
};

/**
 * An envelope budget's headline: what has not been given a job yet.
 *
 * A negative `to-budget` means more has been budgeted than exists, which is a
 * different sentence and not a smaller amount of the same one — so it gets its
 * own words rather than a minus sign in front of "Para distribuir".
 */
function EnvelopeHero({ usedPercent, onPress }: HeroVariantProps) {
  const { t } = useTranslation();
  const amount = useSheetValue<'envelope-budget', 'to-budget'>(
    envelopeBudget.toBudget,
  );
  const isOverbudgeted = amount !== null && amount < 0;

  return (
    <BudgetMobileHero
      label={
        isOverbudgeted ? (
          <Trans>Orçado a mais</Trans>
        ) : (
          <Trans>Para distribuir</Trans>
        )
      }
      caption={
        isOverbudgeted ? (
          <Trans>Você orçou mais do que tem disponível</Trans>
        ) : (
          <Trans>Dinheiro disponível no orçamento</Trans>
        )
      }
      amount={amount}
      usedPercent={usedPercent}
      onPress={onPress}
      ariaLabel={t('Abrir o resumo do orçamento do mês')}
    />
  );
}

/**
 * A tracking budget's headline: what the month is saving.
 *
 * A month that has not finished yet is read from the budgeted figure and said
 * to be a projection; a month that has, from what actually happened. Both are
 * the cells the upstream header already chose between, under the same rule.
 */
function TrackingHero({
  month,
  usedPercent,
  onPress,
}: HeroVariantProps & { month: string }) {
  const { t } = useTranslation();
  const isProjected = month >= monthUtils.currentMonth();
  const amount = useSheetValue<'tracking-budget', 'total-saved' | 'real-saved'>(
    isProjected ? trackingBudget.totalBudgetedSaved : trackingBudget.totalSaved,
  );
  const isOverspent = !isProjected && amount !== null && amount < 0;

  return (
    <BudgetMobileHero
      label={
        isProjected ? (
          <Trans>Economia projetada</Trans>
        ) : isOverspent ? (
          <Trans>Gasto a mais</Trans>
        ) : (
          <Trans>Economizado</Trans>
        )
      }
      caption={
        isProjected ? (
          <Trans>Com base no que está orçado para o mês</Trans>
        ) : (
          <Trans>Receitas menos despesas realizadas</Trans>
        )
      }
      amount={amount}
      usedPercent={usedPercent}
      onPress={onPress}
      ariaLabel={t('Abrir o resumo do orçamento do mês')}
    />
  );
}
