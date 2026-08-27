import type { ComponentType, SVGProps } from 'react';

import {
  SvgApparel,
  SvgDotsHorizontalTriple,
  SvgEducation,
  SvgHeart,
  SvgLocationFood,
  SvgRefresh,
  SvgSearch,
  SvgShield,
  SvgShoppingCart,
  SvgTravelBus,
} from '@actual-app/components/icons/v1';

import type { BudgetHue } from './budgetTokens';

export type BudgetIcon = ComponentType<SVGProps<SVGSVGElement>>;

/**
 * Disposable data for the Budget laboratory.
 *
 * The disposable part is the *source*, not the shape: every field below maps to
 * something Actual already stores (a category, its budgeted amount, the sum of
 * its transactions), so swapping this module for a real adapter later changes
 * no component signature. Nothing here is written, queried or persisted.
 *
 * The numbers are internally coherent by construction, and every derived
 * figure on screen is computed from them rather than restated by hand.
 */

export type LabEnvelope = {
  id: string;
  name: string;
  Icon: BudgetIcon;
  hue: BudgetHue;
  /** Planned for the month, in minor units. */
  budgeted: number;
  /** Already spent this month, in minor units. */
  spent: number;
  /**
   * What is left in the envelope, as the budget engine computes it.
   *
   * Given rather than derived: the engine's `leftover` is
   * `budgeted + spent + (carryover ? prevLeftover : max(0, prevLeftover))`, so
   * a balance rolled over from last month is part of it. `budgeted - spent`
   * sees none of that and reads zero on a month where the envelope was never
   * touched but still holds money.
   */
  available: number;
};

const ENVELOPES: Omit<LabEnvelope, 'available'>[] = [
  {
    id: 'mercado',
    name: 'Mercado',
    Icon: SvgShoppingCart,
    hue: 'green',
    budgeted: 150000,
    spent: 124000,
  },
  {
    id: 'delivery',
    name: 'Delivery',
    Icon: SvgLocationFood,
    hue: 'amber',
    budgeted: 90000,
    spent: 89000,
  },
  {
    id: 'transporte',
    name: 'Transporte',
    Icon: SvgTravelBus,
    hue: 'blue',
    budgeted: 70000,
    spent: 62000,
  },
  {
    id: 'assinaturas',
    name: 'Assinaturas',
    Icon: SvgRefresh,
    hue: 'violet',
    budgeted: 35000,
    spent: 31000,
  },
  {
    id: 'farmacia',
    name: 'Farmácia',
    Icon: SvgHeart,
    hue: 'rose',
    budgeted: 20000,
    spent: 18500,
  },
  {
    id: 'vestuario',
    name: 'Vestuário',
    Icon: SvgApparel,
    hue: 'cyan',
    budgeted: 18000,
    spent: 14200,
  },
  {
    id: 'educacao',
    name: 'Educação',
    Icon: SvgEducation,
    hue: 'yellow',
    budgeted: 100000,
    spent: 43000,
  },
  {
    id: 'outros',
    name: 'Outros',
    Icon: SvgDotsHorizontalTriple,
    hue: 'neutral',
    budgeted: 502000,
    spent: 39300,
  },
];

/**
 * Income for the month. The only figure the envelope list cannot produce on its
 * own, and the one the whole band is measured against.
 */
/**
 * A laboratory has no previous month, so here the engine's rule collapses to
 * `budgeted - spent`. Derived, never written down, so the rows and the band
 * cannot disagree.
 */
export const labEnvelopes: LabEnvelope[] = ENVELOPES.map(envelope => ({
  ...envelope,
  available: envelope.budgeted - envelope.spent,
}));

export const labIncome = 1549000;

/**
 * What the laboratory shows as still free to assign.
 *
 * Derived from the fixtures above rather than written down, so the band and the
 * envelope list below it can never disagree. The real route does not compute
 * this — it reads the engine's own `to-budget` cell, which also folds in the
 * previous month's balance and overspending. A laboratory with no history has
 * neither, so here the two agree by construction.
 */
export const labToDistribute =
  labIncome -
  labEnvelopes.reduce((sum, envelope) => sum + envelope.budgeted, 0);

export type LabTip = {
  id: string;
  title: string;
  body: string;
  Icon: BudgetIcon;
  hue: BudgetHue;
};

/**
 * Static guidance. Deliberately not derived from the numbers above: these are
 * habits worth keeping, not observations about this month, so nothing here can
 * be mistaken for an automatic recommendation.
 */
export const labTips: LabTip[] = [
  {
    id: 'variaveis',
    title: 'Revise os variáveis',
    body: 'Gastos como delivery e transporte mudam rápido ao longo do mês.',
    Icon: SvgSearch,
    hue: 'blue',
  },
  {
    id: 'sobras',
    title: 'Proteja o que sobrar',
    body: 'Sobras de envelopes podem reforçar sua reserva em vez de sumirem.',
    Icon: SvgShield,
    hue: 'green',
  },
  {
    id: 'recorrencias',
    title: 'Cheque recorrências',
    body: 'Assinaturas e pequenos débitos merecem revisão frequente.',
    Icon: SvgRefresh,
    hue: 'amber',
  },
];

export type LabMovement = {
  id: string;
  name: string;
  envelope: string;
  /** Already-localised short label, as in the approved Overview. */
  date: string;
  amount: number;
  Icon: BudgetIcon;
  hue: BudgetHue;
};

export const labMovements: LabMovement[] = [
  {
    id: 'm1',
    name: 'Supermercado',
    envelope: 'Mercado',
    date: 'Hoje',
    amount: -18740,
    Icon: SvgShoppingCart,
    hue: 'green',
  },
  {
    id: 'm2',
    name: 'Almoço',
    envelope: 'Delivery',
    date: 'Hoje',
    amount: -4890,
    Icon: SvgLocationFood,
    hue: 'amber',
  },
  {
    id: 'm3',
    name: 'Recarga do cartão',
    envelope: 'Transporte',
    date: 'Ontem',
    amount: -6000,
    Icon: SvgTravelBus,
    hue: 'blue',
  },
  {
    id: 'm4',
    name: 'Plano de streaming',
    envelope: 'Assinaturas',
    date: '23 ago',
    amount: -3990,
    Icon: SvgRefresh,
    hue: 'violet',
  },
  {
    id: 'm5',
    name: 'Farmácia do bairro',
    envelope: 'Farmácia',
    date: '22 ago',
    amount: -9250,
    Icon: SvgHeart,
    hue: 'rose',
  },
];
