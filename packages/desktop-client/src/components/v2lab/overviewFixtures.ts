import type { ComponentType, SVGProps } from 'react';

import {
  SvgApparel,
  SvgChartBar,
  SvgHeart,
  SvgLibrary,
  SvgLocationFood,
  SvgMoneyBag,
  SvgPiggyBank,
  SvgPortfolio,
  SvgShield,
  SvgShoppingCart,
  SvgTravelBus,
  SvgWallet,
} from '@actual-app/components/icons/v1';
import { SvgCalendar3 } from '@actual-app/components/icons/v2';

import type { LabHue } from './LabTile';

/**
 * Demonstration data for the visual laboratory.
 *
 * This module is the disposable part of the laboratory — the presentation
 * components are not. Amounts are integer minor units in BRL, matching how
 * Actual stores money, so replacing this file with an adapter over real data
 * requires no change to any component below.
 *
 * Nothing here is written to the database, to preferences or to sync.
 */

export type LabIcon = ComponentType<SVGProps<SVGSVGElement>>;

export type LabBalances = {
  /** Sum of on-budget account balances. */
  available: number;
  /** Envelope budgets only; `null` when the budget type has no such cell. */
  toBudget: number | null;
};

export type LabMonthTotals = {
  income: number;
  spent: number;
  net: number;
  /** Already-localised month label, e.g. "agosto '26". */
  label: string;
};

export type LabAccount = {
  id: string;
  name: string;
  /** Real secondary context only — never invented card metadata. */
  detail: string;
  balance: number;
  Icon: LabIcon;
  hue: LabHue;
};

export type LabCategory = {
  id: string;
  name: string;
  Icon: LabIcon;
  hue: LabHue;
  amount: number;
};

export type LabMovement = {
  id: string;
  name: string;
  /** Short, already-localised date, e.g. "Hoje" or "24 ago". */
  when: string;
  Icon: LabIcon;
  /** Shared with the matching spending category, so the two panels agree. */
  hue: LabHue;
  amount: number;
};

export const labBalances: LabBalances = {
  available: 1487250,
  toBudget: 234000,
};

export const labMonthTotals: LabMonthTotals = {
  income: 985000,
  spent: -421000,
  net: 564000,
  label: "agosto '26",
};

export const labAccounts: LabAccount[] = [
  {
    id: 'acc-1',
    name: 'Conta corrente',
    detail: 'No orçamento',
    balance: 845000,
    Icon: SvgLibrary,
    hue: 'blue',
  },
  {
    id: 'acc-2',
    name: 'Poupança',
    detail: 'No orçamento',
    balance: 642250,
    Icon: SvgPiggyBank,
    hue: 'teal',
  },
  {
    id: 'acc-3',
    name: 'Carteira digital',
    detail: 'No orçamento',
    balance: 128400,
    Icon: SvgWallet,
    hue: 'violet',
  },
  {
    id: 'acc-4',
    name: 'Conta salário',
    detail: 'No orçamento',
    balance: 312080,
    Icon: SvgPortfolio,
    hue: 'amber',
  },
  {
    id: 'acc-5',
    name: 'Reserva de emergência',
    detail: 'Fora do orçamento',
    balance: 1230000,
    Icon: SvgShield,
    hue: 'crimson',
  },
  {
    id: 'acc-6',
    name: 'Investimentos',
    detail: 'Fora do orçamento',
    balance: 2874500,
    Icon: SvgChartBar,
    hue: 'cyan',
  },
];

export const labCategories: LabCategory[] = [
  {
    id: 'cat-1',
    name: 'Mercado',
    Icon: SvgShoppingCart,
    hue: 'green',
    amount: -124000,
  },
  {
    id: 'cat-2',
    name: 'Delivery',
    Icon: SvgLocationFood,
    hue: 'amber',
    amount: -89000,
  },
  {
    id: 'cat-3',
    name: 'Transporte',
    Icon: SvgTravelBus,
    hue: 'blue',
    amount: -62000,
  },
  {
    id: 'cat-4',
    name: 'Assinaturas',
    Icon: SvgCalendar3,
    hue: 'violet',
    amount: -31000,
  },
  {
    id: 'cat-5',
    name: 'Farmácia',
    Icon: SvgHeart,
    hue: 'rose',
    amount: -18500,
  },
  {
    id: 'cat-6',
    name: 'Vestuário',
    Icon: SvgApparel,
    hue: 'cyan',
    amount: -14200,
  },
];

export const labMovements: LabMovement[] = [
  {
    id: 'mov-1',
    name: 'Salário',
    when: 'Hoje',
    Icon: SvgMoneyBag,
    hue: 'green',
    amount: 985000,
  },
  {
    id: 'mov-2',
    name: 'Mercado Zona Sul',
    when: 'Hoje',
    Icon: SvgShoppingCart,
    hue: 'green',
    amount: -21430,
  },
  {
    id: 'mov-3',
    name: 'Transporte urbano',
    when: 'Ontem',
    Icon: SvgTravelBus,
    hue: 'blue',
    amount: -4850,
  },
  {
    id: 'mov-4',
    name: 'Delivery',
    when: '24 ago',
    Icon: SvgLocationFood,
    hue: 'amber',
    amount: -12790,
  },
  {
    id: 'mov-5',
    name: 'Farmácia',
    when: '23 ago',
    Icon: SvgHeart,
    hue: 'rose',
    amount: -8640,
  },
];
