/**
 * The laboratory's own data.
 *
 * Every figure is a fixture: fixed, local, and deliberately disconnected from
 * the budget file. This round is judged on appearance, and a screen that read
 * live cells would change between two screenshots taken minutes apart.
 *
 * Amounts are integer minor units, as Actual stores money. The set is
 * internally consistent — the eight categories sum to the group's planned,
 * spent and balance figures, and the month's balance is income minus spending —
 * so the composition can be read for plausibility as well as for looks.
 *
 * Nothing here is invented to fill a layout. The income group holds the one
 * category the dataset actually has; a second row with a zero beside it would
 * be the design asking the data for company it does not have.
 */

export type BudgetCategoryFixture = {
  id: string;
  name: string;
  /** What was planned for the month. */
  planned: number;
  /** What has left, as a positive magnitude — the label carries the direction. */
  spent: number;
  /** Planned minus spent. Negative would mean the category is overspent. */
  balance: number;
};

export type IncomeCategoryFixture = {
  id: string;
  name: string;
  received: number;
};

/** The month this screen is reading. */
export const monthLabel = 'Agosto 2026';

/** The alert above the hero. */
export const uncategorizedCount = 3;
export const uncategorizedTotal = 2080356;

/** The hero. */
export const toDistribute = 420000;

/** The month, as three figures. */
export const planned = 985000;
export const spent = 421000;
export const monthBalance = 1128000;

/** The expense group's own totals. */
export const expensesPlanned = 985000;
export const expensesBalance = 564000;

export const expenseCategories: BudgetCategoryFixture[] = [
  {
    id: 'outros',
    name: 'Outros',
    planned: 502000,
    spent: 39300,
    balance: 462700,
  },
  {
    id: 'educacao',
    name: 'Educação',
    planned: 100000,
    spent: 43000,
    balance: 57000,
  },
  {
    id: 'vestuario',
    name: 'Vestuário',
    planned: 18000,
    spent: 14200,
    balance: 3800,
  },
  {
    id: 'farmacia',
    name: 'Farmácia',
    planned: 20000,
    spent: 18500,
    balance: 1500,
  },
  {
    id: 'assinaturas',
    name: 'Assinaturas',
    planned: 35000,
    spent: 31000,
    balance: 4000,
  },
  {
    id: 'transporte',
    name: 'Transporte',
    planned: 70000,
    spent: 62000,
    balance: 8000,
  },
  {
    id: 'delivery',
    name: 'Delivery',
    planned: 90000,
    spent: 89000,
    balance: 1000,
  },
  {
    id: 'mercado',
    name: 'Mercado',
    planned: 150000,
    spent: 124000,
    balance: 26000,
  },
];

/** The income group's total, and the one category behind it. */
export const incomeReceived = 1549000;

export const incomeCategories: IncomeCategoryFixture[] = [
  { id: 'salario', name: 'Salário', received: 1549000 },
];
