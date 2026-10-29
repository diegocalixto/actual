/**
 * The laboratory's own data.
 *
 * Every figure is a fixture: fixed, local, and deliberately disconnected from
 * the budget file. This round is judged on appearance, and a screen that reads
 * live cells would change between two screenshots taken minutes apart.
 *
 * Amounts are integer minor units, as Actual stores money. The set is
 * internally consistent — the group subtotals are the sums of their rows, and
 * the two subtotals are the total — so the composition can be read for
 * plausibility as well as for looks.
 */

export type MobileAccountFixture = {
  id: string;
  name: string;
  /** The line under the name. A kind, never an account number. */
  kind: string;
  balance: number;
};

export type MobileAccountGroupFixture = {
  id: string;
  /** Already upper-cased for display in the reference's own voice. */
  label: string;
  subtotal: number;
  /** Colours the group's dot: on-budget money is spendable, off-budget is not. */
  tone: 'positive' | 'negative';
  accounts: MobileAccountFixture[];
};

export const monthLabel = 'AGOSTO • 2026';

/** The hero. */
export const available = 3064356;
export const toDistribute = 420000;

/** The month, as three figures. */
export const income = 1549000;
export const outflow = 421000;
export const monthNet = 1128000;

export const accountsTotal = 4556332;

export const accountGroups: MobileAccountGroupFixture[] = [
  {
    id: 'on-budget',
    label: 'NO ORÇAMENTO',
    subtotal: 3064356,
    tone: 'positive',
    accounts: [
      {
        id: 'principal',
        name: 'Conta Principal',
        kind: 'Conta corrente',
        balance: 1254321,
      },
      { id: 'poupanca', name: 'Poupança', kind: 'Poupança', balance: 825000 },
      {
        id: 'salario',
        name: 'Conta Salário',
        kind: 'Conta corrente',
        balance: 985035,
      },
    ],
  },
  {
    id: 'off-budget',
    label: 'FORA DO ORÇAMENTO',
    subtotal: 1491976,
    tone: 'negative',
    accounts: [
      {
        id: 'investimentos',
        name: 'Investimentos',
        kind: 'Investimento',
        balance: 1143012,
      },
      {
        id: 'carteira',
        name: 'Carteira Digital',
        kind: 'Carteira',
        balance: 348964,
      },
    ],
  },
];

export const spendingTotal = 421000;

/**
 * One category, not the whole section.
 *
 * The reference lets the next section begin at the fold rather than ending the
 * page on the accounts, and that is all this is for: enough to show the Home
 * continues, without building a spending screen this round has not designed.
 */
export const topSpendingCategory = {
  name: 'Alimentação',
  amount: 151500,
  /** Its share of `spendingTotal`, rounded — 151500 / 421000 = 35.98%. */
  share: 36,
};
