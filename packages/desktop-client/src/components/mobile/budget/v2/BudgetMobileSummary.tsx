import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { Text } from '@actual-app/components/text';
import { View } from '@actual-app/components/view';
import * as monthUtils from '@actual-app/core/shared/months';

import { useSheetValue } from '#hooks/useSheetValue';
import { useMonthIndicators } from '#reports/useMonthIndicators';
import { envelopeBudget, trackingBudget } from '#spreadsheet/bindings';

import { BudgetMobileHero } from './BudgetMobileHero';
import { BudgetMobileMetrics } from './BudgetMobileMetrics';
import { formatCurrency } from './budgetMobileMoney';
import { budgetLayout } from './BudgetMobileStyle';
import { useBudgetMobileTotals } from './useBudgetMobileTotals';
import type { BudgetMobileTotals } from './useBudgetMobileTotals';

type BudgetMobileSummaryProps = {
  month: string;
  budgetType: 'envelope' | 'tracking';
  /** Opens the budget summary modal — the upstream header's own action. */
  onShowBudgetSummary: () => void;
};

const NOTE_STYLE = {
  fontSize: 11.5,
  lineHeight: 1.45,
  color: 'var(--dfl-text-3)',
} as const;

/**
 * The top of the Budget: the headline figure, then the month in three figures.
 *
 * The summary is split by budget type rather than by a conditional inside one
 * component, because the two types read different cells and binding an
 * envelope cell on a tracking sheet would be a subscription to a cell that does
 * not exist. Which one is mounted is the only difference; the surface, the ring
 * and the action behind them are shared.
 */
export function BudgetMobileSummary({
  month,
  budgetType,
  onShowBudgetSummary,
}: BudgetMobileSummaryProps) {
  const totals = useBudgetMobileTotals(month, budgetType);
  // The figures above are the engine's own month. This says so, and names the
  // one thing they cannot see — the month's spending with no category — in the
  // same words the desktop's Budget uses, so the two layouts make the same
  // statement about the same figures.
  const { totals: monthTotals } = useMonthIndicators(month);
  const uncategorized = monthTotals?.uncategorizedSpending ?? 0;
  const uncategorizedAmount = formatCurrency(uncategorized);

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
        <>
          <TrackingHero
            month={month}
            usedPercent={totals.usedPercent}
            onPress={onShowBudgetSummary}
          />
          <BudgetMobileMetrics
            planned={totals.planned}
            spent={totals.spent}
            monthBalance={totals.monthBalance}
            income={totals.income}
          />
        </>
      ) : (
        <EnvelopeSummary totals={totals} onPress={onShowBudgetSummary} />
      )}

      {/* The figures are the envelope engine's only under an envelope budget;
          a tracking budget reads other cells, and the sentence would be false
          there. */}
      {budgetType === 'envelope' && monthTotals !== null && (
        <Text style={NOTE_STYLE}>
          {uncategorized > 0 ? (
            <Trans>
              Envelope figures: income here includes starting balances and
              extraordinary inflows, and spending only what has a category.
              Uncategorized spending this month, not in these figures:{' '}
              {{ uncategorizedAmount }}.
            </Trans>
          ) : (
            <Trans>
              Envelope figures: income here includes starting balances and
              extraordinary inflows, and spending only what has a category.
              Nothing is uncategorized this month.
            </Trans>
          )}
        </Text>
      )}

      {budgetType === 'envelope' && (
        // The one figure on this screen that is not about this month alone,
        // and the one most read as a balance: the line says what it is.
        <Text style={NOTE_STYLE}>
          <Trans>
            A planejar is the income not yet given an envelope, added up month
            after month. It is not a bank balance and not money to spare: the
            spending of this month is only taken out of it next month, and
            entries without a category do not count until they are classified.
          </Trans>
        </Text>
      )}
    </View>
  );
}

type EnvelopeSummaryProps = {
  totals: BudgetMobileTotals;
  onPress: () => void;
};

/**
 * An envelope budget's top: the month's categorized spending as the headline,
 * and the plan's figures as tiles, "A planejar" last.
 *
 * The "to budget" cell used to be the headline here. It is the income not yet
 * given an envelope, added up over the months — a planning figure — and set as
 * the biggest number on the screen, over a caption about envelopes, it was
 * read as the money in the accounts, which it exceeds by everything this month
 * has spent and everything still without a category. So the headline is now
 * what the month has actually spent, which is the question this screen is
 * opened for, and the planning figure sits in a tile with its own name and a
 * note under the row that says what it is.
 *
 * The surface is still the control that opens the month's summary, where the
 * engine itself lays out what "A planejar" is made of.
 */
function EnvelopeSummary({ totals, onPress }: EnvelopeSummaryProps) {
  const { t } = useTranslation();
  const toBudget = useSheetValue<'envelope-budget', 'to-budget'>(
    envelopeBudget.toBudget,
  );

  return (
    <>
      <BudgetMobileHero
        label={<Trans>Gasto categorizado</Trans>}
        caption={<Trans>Só o gasto do mês que já tem categoria</Trans>}
        amount={totals.spent}
        usedPercent={totals.usedPercent}
        onPress={onPress}
        ariaLabel={t('Abrir o resumo do orçamento do mês')}
      />
      <BudgetMobileMetrics
        planned={totals.planned}
        monthBalance={totals.monthBalance}
        income={totals.income}
        toBudget={toBudget}
      />
    </>
  );
}

type TrackingHeroProps = {
  month: string;
  usedPercent: number | null;
  onPress: () => void;
};

/**
 * A tracking budget's headline: what the month is saving.
 *
 * A month that has not finished yet is read from the budgeted figure and said
 * to be a projection; a month that has, from what actually happened. Both are
 * the cells the upstream header already chose between, under the same rule.
 */
function TrackingHero({ month, usedPercent, onPress }: TrackingHeroProps) {
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
