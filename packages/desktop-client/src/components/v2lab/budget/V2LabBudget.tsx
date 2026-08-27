import React from 'react';
import { useTranslation } from 'react-i18next';

import {
  labEnvelopes,
  labIncome,
  labMovements,
  labTips,
  labToDistribute,
} from './budgetFixtures';
import { BudgetView } from './BudgetView';
import type { BudgetViewData } from './BudgetView';

/**
 * Visual laboratory for the Budget, desktop only.
 *
 * Nothing but a data source now: the composition lives in `BudgetView`, which
 * the real `/budget` renders too, so the approved design has exactly one
 * implementation. What is disposable here is `budgetFixtures`.
 */
export function V2LabBudget() {
  const { t } = useTranslation();

  const data: BudgetViewData = {
    income: labIncome,
    toDistribute: labToDistribute,
    // A laboratory has no hidden categories, so the visible rows already are
    // the whole month and the view falls back to summing them.
    totalBudgeted: null,
    totalSpent: null,
    // Drawn, and deliberately inert: there are no real categories to act on.
    envelopeActions: 'mock',
    envelopes: labEnvelopes,
    tips: labTips,
    movements: labMovements,
    monthLabel: 'Agosto de 2026',
    isEnvelopesLoading: false,
    isActivityLoading: false,
    footnote: t('Laboratório visual — dados de demonstração'),
  };

  return <BudgetView data={data} />;
}
