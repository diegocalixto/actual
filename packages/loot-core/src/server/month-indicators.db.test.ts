import { v4 as uuidv4 } from 'uuid';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type {
  IndicatorCategories,
  IndicatorQueryRow,
  IndicatorTotals,
  SpendingComposition,
} from '#shared/month-indicators';
import {
  comparisonWindow,
  computeTotals,
  earliestIndicatorDateQuery,
  indicatorCategories,
  indicatorNotesQuery,
  monthIndicatorRowsQuery,
  notesLookup,
  spendingComposition,
  toIndicatorRows,
} from '#shared/month-indicators';
import type { Query } from '#shared/query';
import { q } from '#shared/query';
import { makeChild } from '#shared/transactions';
import type { CategoryEntity, CategoryGroupEntity } from '#types/models';

import { app as accountsApp } from './accounts/app';
import { aqlQuery } from './aql';
import * as db from './db';
import * as sheet from './sheet';
import { batchUpdateTransactions } from './transactions';

/**
 * The counting rules against a real file.
 *
 * The arithmetic is unit-tested with controlled rows in
 * `../shared/month-indicators.test.ts`. What that cannot show is whether the
 * queries hand it the right rows: whether a linked transfer really is left out
 * on both legs, whether an account's starting balance really stays out of the
 * month while staying in the balance, and whether a split is counted once
 * rather than twice. So each case here builds a throwaway budget with the real
 * handlers — `account-create` for the starting balance,
 * `batchUpdateTransactions` for the transfer, which creates the counterpart
 * itself — and then runs the same queries the screens run.
 *
 * `monthUtils.currentDay()` is frozen at 2017-01-01 under test, and that is the
 * day `account-create` dates a starting balance, so the month under test is
 * 2017-01.
 */

const MONTH = '2017-01';

type Read = {
  totals: IndicatorTotals;
  composition: SpendingComposition;
  categories: IndicatorCategories;
  earliestDate: string | null;
};

/** One query's rows, typed where they enter the test rather than asserted later. */
async function rowsOf<Row>(query: Query): Promise<Row[]> {
  const { data } = await aqlQuery(query);
  return data;
}

/** The two row queries, the notes and the categories, exactly as the hook reads them. */
async function readIndicators(month = MONTH): Promise<Read> {
  const outflows = await rowsOf<IndicatorQueryRow>(
    monthIndicatorRowsQuery(month, 'outflow'),
  );
  const inflows = await rowsOf<IndicatorQueryRow>(
    monthIndicatorRowsQuery(month, 'inflow'),
  );
  const notes = await rowsOf<{ id: string; note: string | null }>(
    indicatorNotesQuery(),
  );
  const earliest = await rowsOf<{ date: string }>(earliestIndicatorDateQuery());

  // The screens read these two through `useCategories`; the tables are the same.
  const list = await rowsOf<CategoryEntity>(
    q('categories').select(['id', 'name', 'is_income', 'group']),
  );
  const groups = await rowsOf<CategoryGroupEntity>(
    q('category_groups').select(['id', 'name', 'is_income']),
  );

  const categories = indicatorCategories(list, groups, notesLookup(notes));
  const rows = toIndicatorRows(outflows, inflows);

  return {
    totals: computeTotals(rows, categories),
    composition: spendingComposition(rows, categories),
    categories,
    earliestDate: earliest[0]?.date ?? null,
  };
}

async function transferPayeeFor(accountId: string): Promise<string> {
  const payee = await db.first<{ id: string }>(
    'SELECT id FROM payees WHERE transfer_acct = ?',
    [accountId],
  );
  if (!payee) {
    throw new Error(`no transfer payee for ${accountId}`);
  }
  return payee.id;
}

/**
 * The account's balance the way the application takes it: an AQL aggregate,
 * which the executor answers with `is_parent = 0`. Summing `v_transactions`
 * directly would add a split's parent on top of its parts and report twice the
 * money.
 */
async function accountBalance(accountId: string): Promise<number> {
  const { data } = await aqlQuery(
    q('transactions')
      .filter({ account: accountId })
      .calculate({ $sum: '$amount' }),
  );
  return typeof data === 'number' ? data : 0;
}

/** The categories of the demo file, with the extraordinary group marked by its note. */
async function createCategories() {
  await db.insertCategoryGroup({
    id: 'g-receitas',
    name: 'Receitas',
    is_income: 1,
  });
  await db.insertCategory({
    id: 'salario',
    name: 'Salário',
    cat_group: 'g-receitas',
    is_income: 1,
  });

  await db.insertCategoryGroup({
    id: 'g-extra',
    name: 'Entradas extraordinárias',
    is_income: 1,
  });
  await db.insertCategory({
    id: 'emprestimo',
    name: 'Recuperação de empréstimo',
    cat_group: 'g-extra',
    is_income: 1,
  });

  await db.insertCategoryGroup({ id: 'g-casa', name: 'Casa', is_income: 0 });
  await db.insertCategory({
    id: 'mercado',
    name: 'Supermercado',
    cat_group: 'g-casa',
    is_income: 0,
  });
  await db.insertCategory({
    id: 'farmacia',
    name: 'Farmácia',
    cat_group: 'g-casa',
    is_income: 0,
  });

  // The mark, written the way `notes-save` writes it. Renaming the group or the
  // category later leaves this untouched, which is the whole point of it.
  await db.update('notes', {
    id: 'g-extra',
    note: 'Entradas sem previsão de repetição. #extraordinária',
  });
}

describe('month indicators against a real file', () => {
  beforeEach(global.emptyDatabase());
  afterEach(global.emptyDatabase());

  it('o cenário de demonstração inteiro fecha nos valores recalculados à mão', async () => {
    await sheet.loadSpreadsheet(db);
    await createCategories();

    // Starting balances created by the real handler, so they carry
    // `starting_balance_flag` exactly as the application sets it.
    const corrente: string = await accountsApp.handlers['account-create']({
      name: 'Corrente',
      balance: 3000,
    });
    const cartao: string = await accountsApp.handlers['account-create']({
      name: 'Cartão',
      balance: 0,
    });

    await batchUpdateTransactions({
      added: [
        {
          id: uuidv4(),
          account: corrente,
          date: '2017-01-05',
          amount: 500000,
          category: 'salario',
        },
        {
          id: uuidv4(),
          account: corrente,
          date: '2017-01-06',
          amount: 500000,
          category: 'emprestimo',
        },
        {
          id: uuidv4(),
          account: corrente,
          date: '2017-01-07',
          amount: -20000,
          category: 'mercado',
        },
        {
          id: uuidv4(),
          account: corrente,
          date: '2017-01-08',
          amount: 5000,
          category: 'mercado',
        },
        // No category at all, which is not the same as a category set to
        // nothing: the field is simply absent, as the application leaves it.
        {
          id: uuidv4(),
          account: corrente,
          date: '2017-01-09',
          amount: -10000,
        },
        {
          id: uuidv4(),
          account: corrente,
          date: '2017-01-10',
          amount: 3000,
        },
        // The transfer: one leg only. `batchUpdateTransactions` runs transfers
        // and creates the counterpart in Cartão itself.
        {
          id: uuidv4(),
          account: corrente,
          date: '2017-01-11',
          amount: -100000,
          payee: await transferPayeeFor(cartao),
        },
        {
          id: uuidv4(),
          account: cartao,
          date: '2017-01-12',
          amount: -30000,
          category: 'farmacia',
        },
      ],
    });

    // The transfer really is linked: two legs, each pointing at the other.
    const legs = await db.all<{ id: string; transfer_id: string | null }>(
      'SELECT id, transfer_id FROM v_transactions WHERE amount = -100000 OR amount = 100000',
    );
    expect(legs).toHaveLength(2);
    expect(legs.every(leg => leg.transfer_id != null)).toBe(true);

    const { totals, composition } = await readIndicators();

    // Recomputed by hand, in centavos:
    //   classified receipts  5.000,00            (salary; the loan is marked)
    //   extraordinary        5.000,00
    //   spending             200 - 50 + 100 + 300 = 550,00
    //   result               5.000,00 - 550,00   = 4.450,00
    expect(totals.classifiedIncome).toBe(500000);
    expect(totals.extraordinaryIncome).toBe(500000);
    expect(totals.categorizedSpending).toBe(45000);
    expect(totals.uncategorizedSpending).toBe(10000);
    expect(totals.spending).toBe(55000);
    expect(totals.refunds).toBe(5000);
    expect(totals.pendingInflows).toBe(3000);
    expect(totals.classifiedResult).toBe(445000);
    expect(totals.resultWithExtraordinary).toBe(945000);

    // The list adds up to the figure the tile prints.
    expect(composition.net).toBe(totals.spending);
    expect(
      composition.entries.map(entry => [entry.name, entry.amount]),
    ).toEqual([
      ['Farmácia', 30000],
      ['Supermercado', 15000],
      [null, 10000],
    ]);
    expect(composition.credits).toEqual([]);

    // The starting balance is in the balance and in no month: 3.000 in,
    // 5.000 + 5.000 + 50 + 30 in, 200 + 100 + 1.000 out.
    expect(await accountBalance(corrente)).toBe(1178000);
    // The card holds the transfer it received, less its own spending.
    expect(await accountBalance(cartao)).toBe(70000);
  });

  it('a devolução líquida em outra categoria aparece como crédito e o total fecha', async () => {
    await sheet.loadSpreadsheet(db);
    await createCategories();
    const corrente: string = await accountsApp.handlers['account-create']({
      name: 'Corrente',
      balance: 0,
    });

    await batchUpdateTransactions({
      added: [
        {
          id: uuidv4(),
          account: corrente,
          date: '2017-01-07',
          amount: -20000,
          category: 'mercado',
        },
        // A refund in a category with no purchase of its own this month.
        {
          id: uuidv4(),
          account: corrente,
          date: '2017-01-09',
          amount: 5000,
          category: 'farmacia',
        },
      ],
    });

    const { totals, composition } = await readIndicators();

    expect(totals.spending).toBe(15000);
    expect(totals.classifiedIncome).toBe(0);
    expect(composition.outflows).toBe(20000);
    expect(composition.credited).toBe(5000);
    expect(composition.net).toBe(totals.spending);
    expect(composition.entries.map(entry => entry.name)).toEqual([
      'Supermercado',
    ]);
    expect(composition.credits.map(entry => entry.name)).toEqual(['Farmácia']);
  });

  it('lançamento dividido conta pelas partes, nunca pelo principal mais as partes', async () => {
    await sheet.loadSpreadsheet(db);
    await createCategories();
    const corrente: string = await accountsApp.handlers['account-create']({
      name: 'Corrente',
      balance: 0,
    });

    const parent = {
      id: uuidv4(),
      account: corrente,
      date: '2017-01-14',
      amount: -8000,
      is_parent: true,
    };

    await batchUpdateTransactions({
      added: [
        parent,
        makeChild(parent, { amount: -5000, category: 'mercado' }),
        makeChild(parent, { amount: -3000, category: 'farmacia' }),
      ],
    });

    const { totals, composition } = await readIndicators();

    // R$ 80 left the account once. Counting the parent as well would print 160.
    expect(totals.spending).toBe(8000);
    expect(totals.uncategorizedSpending).toBe(0);
    expect(composition.net).toBe(8000);
    expect(
      composition.entries.map(entry => [entry.name, entry.amount]),
    ).toEqual([
      ['Supermercado', 5000],
      ['Farmácia', 3000],
    ]);
    expect(await accountBalance(corrente)).toBe(-8000);
  });

  it('saldo inicial: no saldo da conta, fora das receitas do mês', async () => {
    await sheet.loadSpreadsheet(db);
    await createCategories();
    const corrente: string = await accountsApp.handlers['account-create']({
      name: 'Corrente',
      balance: 3000,
    });

    const starting = await db.first<{ count: number }>(
      'SELECT COUNT(*) AS count FROM v_transactions_internal WHERE starting_balance_flag = 1',
    );
    expect(starting?.count).toBe(1);

    const { totals, earliestDate } = await readIndicators();

    expect(totals.classifiedIncome).toBe(0);
    expect(totals.extraordinaryIncome).toBe(0);
    expect(totals.pendingInflows).toBe(0);
    expect(totals.spending).toBe(0);
    expect(await accountBalance(corrente)).toBe(300000);

    // Out of scope for the queries too, so it cannot become the start of the
    // comparison window either.
    expect(earliestDate).toBe(null);
    expect(
      comparisonWindow(MONTH, 6, earliestDate, '2017-01-20').months,
    ).toEqual([MONTH]);
  });

  it('a transferência vinculada não vira renda nem gasto em nenhuma das duas contas', async () => {
    await sheet.loadSpreadsheet(db);
    await createCategories();
    const corrente: string = await accountsApp.handlers['account-create']({
      name: 'Corrente',
      balance: 0,
    });
    const cartao: string = await accountsApp.handlers['account-create']({
      name: 'Cartão',
      balance: 0,
    });

    await batchUpdateTransactions({
      added: [
        {
          id: uuidv4(),
          account: corrente,
          date: '2017-01-11',
          amount: -100000,
          payee: await transferPayeeFor(cartao),
        },
      ],
    });

    const { totals } = await readIndicators();

    expect(totals.spending).toBe(0);
    expect(totals.classifiedIncome).toBe(0);
    expect(totals.pendingInflows).toBe(0);
    // Both legs exist and both are out of the indicators.
    expect(await accountBalance(corrente)).toBe(-100000);
    expect(await accountBalance(cartao)).toBe(100000);
  });

  it('lançamento de valor zero não antecipa o começo da janela', async () => {
    await sheet.loadSpreadsheet(db);
    await createCategories();
    const corrente: string = await accountsApp.handlers['account-create']({
      name: 'Corrente',
      balance: 0,
    });

    await batchUpdateTransactions({
      added: [
        // An entry of nothing, months before the first movement. It is counted
        // nowhere, so it must not hand the comparison months with no history.
        {
          id: uuidv4(),
          account: corrente,
          date: '2016-08-20',
          amount: 0,
          category: 'mercado',
        },
        {
          id: uuidv4(),
          account: corrente,
          date: '2016-12-04',
          amount: -4000,
          category: 'mercado',
        },
      ],
    });

    const { earliestDate } = await readIndicators();
    expect(earliestDate).toBe('2016-12-04');

    const window = comparisonWindow(MONTH, 6, earliestDate, '2017-01-20');
    expect(window.months).toEqual(['2016-12', '2017-01']);
  });

  it('a janela do comparativo começa no mês do registro mais antigo e o marca parcial', async () => {
    await sheet.loadSpreadsheet(db);
    await createCategories();
    const corrente: string = await accountsApp.handlers['account-create']({
      name: 'Corrente',
      balance: 0,
    });

    await batchUpdateTransactions({
      added: [
        {
          id: uuidv4(),
          account: corrente,
          date: '2016-11-01',
          amount: 100000,
          category: 'salario',
        },
      ],
    });

    const { earliestDate } = await readIndicators();
    expect(earliestDate).toBe('2016-11-01');

    const window = comparisonWindow(MONTH, 6, earliestDate, '2017-01-20');
    expect(window.months).toEqual(['2016-11', '2016-12', '2017-01']);
    // Dated the 1st, and still not claimed as a whole month.
    expect(window.partial['2016-11']).toEqual(['start']);
    expect(window.partial['2017-01']).toEqual(['inProgress']);
  });
});
