import React, { useState } from 'react';
import { Trans } from 'react-i18next';

import { SvgArrowThinDown, SvgLayers } from '@actual-app/components/icons/v1';
import { View } from '@actual-app/components/view';

import { MobileBudgetAlert } from './MobileBudgetAlert';
import { MobileBudgetCategoryRow } from './MobileBudgetCategoryRow';
import * as fixtures from './mobileBudgetFixtures';
import { MobileBudgetGroupHeader } from './MobileBudgetGroupHeader';
import { MobileBudgetHero } from './MobileBudgetHero';
import { MobileBudgetIncomeRow } from './MobileBudgetIncomeRow';
import { MobileBudgetMetrics } from './MobileBudgetMetrics';
import { usedPercent } from './mobileBudgetMoney';
import { MobileBudgetNav } from './MobileBudgetNav';
import {
  budgetLayout,
  MOBILE_BUDGET_ROOT_CLASS,
  MobileBudgetStyle,
} from './MobileBudgetStyle';
import { MobileBudgetTopBar } from './MobileBudgetTopBar';

/**
 * Tile colours for the expense list.
 *
 * Three cold hues cycled by position, not eight hues keyed to identity. The
 * reference paints every category a different colour, which turns a list of
 * eight into a colour chart and — worse on this screen — competes with amber,
 * the one colour that here means something. A short rotation keeps adjacent
 * rows distinguishable and leaves the semantic channel to the state.
 */
const TILE_HUES = [
  'var(--dfl-hue-violet)',
  'var(--dfl-hue-blue)',
  'var(--dfl-hue-cyan)',
];

/**
 * The proposed mobile Budget, as a laboratory route.
 *
 * It reads no data, changes no month and touches nothing outside this folder.
 * The real `/budget` is untouched by its existence: this is reached by URL
 * only, paints inside its own class, and every figure below is a fixture.
 *
 * The order is an argument. What is still unassigned and how far into the plan
 * the month is, then the month in three figures, then where the plan actually
 * sits — each section answering the question the one above it raises. The
 * envelopes are the screen's body, so they get the room; income closes it,
 * because on a budget screen money already received is context rather than the
 * subject.
 *
 * Every affordance the real Budget needs has a place here: a caret that folds
 * each group, a full-width target on each category for its menus and its
 * register, and month arrows in the bar. None of them acts — this round is
 * judged on the shape, and the shape has to be able to hold the behaviour that
 * comes next.
 */
export function V2LabMobileBudget() {
  const [isExpensesOpen, setExpensesOpen] = useState(true);
  const [isIncomeOpen, setIncomeOpen] = useState(true);

  const heroPercent = usedPercent(fixtures.spent, fixtures.planned);

  return (
    <View
      className={MOBILE_BUDGET_ROOT_CLASS}
      style={{
        position: 'relative',
        flex: 1,
        minHeight: 0,
        // See `reservedHeaderHeight`: covers the shell's empty header strip so
        // the design starts at the top of the screen, as the proposal draws it.
        marginTop: -budgetLayout.reservedHeaderHeight,
        backgroundColor: 'var(--dfl-canvas)',
        color: 'var(--dfl-text)',
      }}
    >
      <MobileBudgetStyle />
      <MobileBudgetTopBar month={fixtures.monthLabel} />

      <View
        style={{
          flexShrink: 0,
          padding: `12px ${budgetLayout.gutter}px`,
          // Clears the bar, which is drawn over the page rather than in it.
          paddingBottom: budgetLayout.navHeight + 28,
          gap: budgetLayout.stackGap,
        }}
      >
        <MobileBudgetAlert
          count={fixtures.uncategorizedCount}
          total={fixtures.uncategorizedTotal}
        />

        <MobileBudgetHero
          toDistribute={fixtures.toDistribute}
          usedPercent={heroPercent}
        />

        <MobileBudgetMetrics
          planned={fixtures.planned}
          spent={fixtures.spent}
          monthBalance={fixtures.monthBalance}
          income={fixtures.incomeReceived}
        />

        <View
          style={{
            borderRadius: 'var(--dfmb-radius)',
            border: '1px solid var(--dfl-line-strong)',
            backgroundColor: 'var(--dfl-surface)',
            backgroundImage:
              'linear-gradient(180deg, rgba(150, 185, 225, 0.035), rgba(150, 185, 225, 0) 46%)',
            boxShadow: 'var(--dfl-shadow), 0 1px 0 rgba(0, 0, 0, 0.5)',
            overflow: 'hidden',
          }}
        >
          <MobileBudgetGroupHeader
            label={<Trans>Despesas</Trans>}
            Icon={SvgLayers}
            hue="var(--dfl-hue-violet)"
            count={fixtures.expenseCategories.length}
            primary={{
              value: fixtures.expensesPlanned,
              caption: <Trans>Orçado</Trans>,
            }}
            secondary={{
              value: fixtures.expensesBalance,
              caption: <Trans>Saldo</Trans>,
            }}
            isExpanded={isExpensesOpen}
            onToggle={() => setExpensesOpen(open => !open)}
          />

          {isExpensesOpen &&
            fixtures.expenseCategories.map((category, index) => (
              <MobileBudgetCategoryRow
                key={category.id}
                category={category}
                hue={TILE_HUES[index % TILE_HUES.length]}
                isLast={index === fixtures.expenseCategories.length - 1}
              />
            ))}
        </View>

        <View
          style={{
            borderRadius: 'var(--dfmb-radius)',
            border: '1px solid var(--dfl-line-strong)',
            backgroundColor: 'var(--dfl-surface)',
            backgroundImage:
              'linear-gradient(180deg, rgba(150, 185, 225, 0.035), rgba(150, 185, 225, 0) 46%)',
            boxShadow: 'var(--dfl-shadow), 0 1px 0 rgba(0, 0, 0, 0.5)',
            overflow: 'hidden',
          }}
        >
          <MobileBudgetGroupHeader
            label={<Trans>Entradas</Trans>}
            Icon={SvgArrowThinDown}
            hue="var(--dfl-hue-green)"
            count={fixtures.incomeCategories.length}
            primary={{
              value: fixtures.incomeReceived,
              caption: <Trans>Total recebido</Trans>,
            }}
            isExpanded={isIncomeOpen}
            onToggle={() => setIncomeOpen(open => !open)}
          />

          {isIncomeOpen &&
            fixtures.incomeCategories.map((category, index) => (
              <MobileBudgetIncomeRow
                key={category.id}
                category={category}
                isLast={index === fixtures.incomeCategories.length - 1}
              />
            ))}
        </View>
      </View>

      <MobileBudgetNav />
    </View>
  );
}
