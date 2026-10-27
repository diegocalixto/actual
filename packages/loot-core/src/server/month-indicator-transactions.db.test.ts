import { v4 as uuidv4 } from 'uuid';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { IndicatorSlice } from '#shared/month-indicator-transactions';
import {
  indicatorRegisterAccount,
  indicatorRegisterConditions,
  indicatorTransactionsFilter,
} from '#shared/month-indicator-transactions';
import type {
  IndicatorQueryRow,
  IndicatorTotals,
  SpendingComposition,
} from '#shared/month-indicators';
import {
  computeTotals,
  indicatorCategories,
  indicatorNotesQuery,
  monthIndicatorRowsQuery,
  notesLookup,
  spendingComposition,
  toIndicatorRows,
  UNCATEGORIZED_ID,
} from '#shared/month-indicators';
import type { Query } from '#shared/query';
import { q } from '#shared/query';
import { makeChild } from '#shared/transactions';
import type {
  CategoryEntity,
  CategoryGroupEntity,
  TransactionEntity,
} from '#types/models';

import { app as accountsApp } from './accounts/app';
import { aqlQuery } from './aql';
import * as db from './db';
import * as sheet from './sheet';
import { batchUpdateTransactions } from './transactions';
import { conditionsToAQL } from './transactions/transaction-rules';

/**
 * The lists Início and Relatórios open, against a real file.
 *
 * Each figure on those screens opens the transactions it is made of. The proof
 * that a list matches its figure is here: the same throwaway budget is read
 * twice — once through the indicator queries, as the screens add it up, and
 * once through the list's own filter — and the list has to hold exactly the
 * transactions that add up to the figure, in the month asked for and no other.
 *
 * Both shapes of the list are run: the AQL filter the phone reads with inline
 * splits, and the desktop register's filter conditions on top of the register
 * they are meant for. The register's base filter is the application's own
 * (`accountFilter` in `desktop-client/src/queries/index.ts`), restated here
 * because this package cannot import the client.
 *
 * `monthUtils.currentDay()` is frozen at 2017-01-01 under test, so 2017-01 is
 * the current month, 2016-12 the previous one and 2017-02 the future.
 */

const MONTH = '2017-01';
const PREVIOUS = '2016-12';

const REGISTER_BASE: Record<
  'all' | 'uncategorized',
  Record<string, unknown>
> = {
  all: {},
  uncategorized: {
    'account.offbudget': false,
    category: null,
    is_parent: false,
    $or: [
      {
        'payee.transfer_acct.offbudget': true,
        'payee.transfer_acct': null,
      },
    ],
  },
};

async function rowsOf<Row>(query: Query): Promise<Row[]> {
  const { data } = await aqlQuery(query);
  return data;
}

async function readIndicators(month: string): Promise<{
  totals: IndicatorTotals;
  composition: SpendingComposition;
}> {
  const outflows = await rowsOf<IndicatorQueryRow>(
    monthIndicatorRowsQuery(month, 'outflow'),
  );
  const inflows = await rowsOf<IndicatorQueryRow>(
    monthIndicatorRowsQuery(month, 'inflow'),
  );
  const notes = await rowsOf<{ id: string; note: string | null }>(
    indicatorNotesQuery(),
  );
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
  };
}

/** The phone's list: the slice's rows with splits listed by their parts. */
async function phoneList(month: string, slice: IndicatorSlice) {
  const rows = await rowsOf<Pick<TransactionEntity, 'amount' | 'notes'>>(
    q('transactions')
      .filter(indicatorTransactionsFilter(month, slice))
      .options({ splits: 'inline' })
      .select(['amount', 'notes']),
  );
  return rows.map(row => row.notes).sort();
}

/** The desktop register's query once the conditions are applied. */
function registerQuery(month: string, slice: IndicatorSlice) {
  const { filters, errors } = conditionsToAQL(
    indicatorRegisterConditions(month, slice),
  );
  expect(errors).toEqual([]);
  return q('transactions')
    .options({ splits: 'grouped' })
    .filter(REGISTER_BASE[indicatorRegisterAccount(slice)])
    .filter({ $and: filters });
}

type RegisterRow = TransactionEntity & {
  _unmatched?: boolean;
  subtransactions?: Array<TransactionEntity & { _unmatched?: boolean }>;
};

/** What the register draws: every row, the parts it dims marked as such. */
async function registerList(month: string, slice: IndicatorSlice) {
  const rows = await rowsOf<RegisterRow>(
    registerQuery(month, slice).select('*'),
  );
  const drawn: string[] = [];
  for (const row of rows) {
    drawn.push(row.notes ?? '');
    for (const sub of row.subtransactions ?? []) {
      drawn.push(`${sub.notes}${sub._unmatched ? ' (fora do filtro)' : ''}`);
    }
  }
  return drawn.sort();
}

/** The figure the register prints above a filtered list. */
async function registerTotal(month: string, slice: IndicatorSlice) {
  const { data } = await aqlQuery(
    registerQuery(month, slice).calculate({ $sum: '$amount' }),
  );
  return data;
}

function entryAmount(composition: SpendingComposition, id: string): number {
  return composition.entries.find(entry => entry.id === id)?.amount ?? 0;
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
  await db.insertCategory({
    id: 'emprestimo',
    name: 'Recuperação de empréstimo',
    cat_group: 'g-receitas',
    is_income: 1,
  });
  await db.update('notes', { id: 'emprestimo', note: '#extraordinária' });
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
}

/**
 * Two months and one future day, with every case a list can get wrong: a
 * refund, a split with one part uncategorized, transfers inside the budget and
 * to an account outside it, an inflow with no category, and an uncategorized
 * outflow in an account closed afterwards.
 */
async function createBudget() {
  await sheet.loadSpreadsheet(db);
  await createCategories();

  const corrente: string = await accountsApp.handlers['account-create']({
    name: 'Corrente',
    balance: 3000,
  });
  const cartao: string = await accountsApp.handlers['account-create']({
    name: 'Cartão',
    balance: 0,
  });
  const antiga: string = await accountsApp.handlers['account-create']({
    name: 'Conta antiga',
    balance: 0,
  });
  const investimentos: string = await accountsApp.handlers['account-create']({
    name: 'Investimentos',
    balance: 1000,
    offBudget: true,
  });

  const tx = (
    account: string,
    date: string,
    amount: number,
    notes: string,
    extra: Partial<TransactionEntity> = {},
  ) => ({ id: uuidv4(), account, date, amount, notes, ...extra });

  const split = {
    ...tx(corrente, '2017-01-13', -9000, 'jan: divisão'),
    is_parent: true,
  };

  await batchUpdateTransactions({
    added: [
      tx(corrente, '2016-12-05', 500000, 'dez: salário', {
        category: 'salario',
      }),
      tx(corrente, '2016-12-08', -12000, 'dez: mercado', {
        category: 'mercado',
      }),
      tx(corrente, '2016-12-12', -8000, 'dez: farmácia', {
        category: 'farmacia',
      }),
      tx(corrente, '2016-12-15', -6000, 'dez: sem categoria (saída)'),
      tx(corrente, '2016-12-18', 2000, 'dez: sem categoria (entrada)'),

      tx(corrente, '2017-01-05', 500000, 'jan: salário', {
        category: 'salario',
      }),
      tx(corrente, '2017-01-06', 500000, 'jan: empréstimo', {
        category: 'emprestimo',
      }),
      tx(corrente, '2017-01-07', -20000, 'jan: mercado', {
        category: 'mercado',
      }),
      tx(corrente, '2017-01-08', 5000, 'jan: devolução mercado', {
        category: 'mercado',
      }),
      tx(corrente, '2017-01-09', -10000, 'jan: sem categoria (saída)'),
      tx(corrente, '2017-01-10', 3000, 'jan: sem categoria (entrada)'),
      split,
      makeChild(split, {
        amount: -6000,
        category: 'mercado',
        notes: 'jan: divisão, parte mercado',
      }),
      makeChild(split, {
        amount: -3000,
        notes: 'jan: divisão, parte sem categoria',
      }),
      tx(corrente, '2017-01-11', -100000, 'jan: transferência p/ cartão', {
        payee: await transferPayeeFor(cartao),
      }),
      tx(
        corrente,
        '2017-01-14',
        -50000,
        'jan: transferência p/ investimentos',
        {
          payee: await transferPayeeFor(investimentos),
        },
      ),
      tx(corrente, '2017-01-15', -4000, 'jan: transferência p/ conta antiga', {
        payee: await transferPayeeFor(antiga),
      }),
      tx(cartao, '2017-01-12', -30000, 'jan: farmácia', {
        category: 'farmacia',
      }),
      tx(antiga, '2017-01-16', -4000, 'jan: sem categoria na conta encerrada'),

      tx(corrente, '2017-02-03', -7000, 'fev: mercado (futuro)', {
        category: 'mercado',
      }),
    ],
  });

  // Closed after the month it moved money in, with nothing left in it.
  await db.updateAccount({ id: antiga, closed: 1 });
}

describe('the lists behind the month figures, against a real file', () => {
  beforeEach(global.emptyDatabase());
  afterEach(global.emptyDatabase());

  it('lista do telefone: cada recorte traz exatamente o que soma o número do indicador', async () => {
    await createBudget();
    const { totals, composition } = await readIndicators(MONTH);

    // The figures first, so the lists below are measured against known ones.
    expect(entryAmount(composition, 'mercado')).toBe(21000);
    expect(entryAmount(composition, 'farmacia')).toBe(30000);
    expect(totals.uncategorizedSpending).toBe(17000);
    expect(totals.pendingInflows).toBe(3000);

    // A category: its outflows and its refund, the split by its own part
    // only, nothing from December and nothing from the future.
    expect(
      await phoneList(MONTH, { kind: 'category', categoryId: 'mercado' }),
    ).toEqual([
      'jan: devolução mercado',
      'jan: divisão, parte mercado',
      'jan: mercado',
    ]);
    expect(
      await phoneList(MONTH, { kind: 'category', categoryId: 'farmacia' }),
    ).toEqual(['jan: farmácia']);

    // "Sem categoria": the outflows, the closed account's included, the
    // transfer to the account outside the budget left out like any transfer.
    expect(await phoneList(MONTH, { kind: 'uncategorizedSpending' })).toEqual([
      'jan: divisão, parte sem categoria',
      'jan: sem categoria (saída)',
      'jan: sem categoria na conta encerrada',
    ]);
    expect(await phoneList(MONTH, { kind: 'pendingInflows' })).toEqual([
      'jan: sem categoria (entrada)',
    ]);

    // And the amounts add up to the figures, sign for sign.
    const sum = async (slice: IndicatorSlice) => {
      const { data } = await aqlQuery(
        q('transactions')
          .filter(indicatorTransactionsFilter(MONTH, slice))
          .options({ splits: 'inline' })
          .calculate({ $sum: '$amount' }),
      );
      return data;
    };
    expect(await sum({ kind: 'category', categoryId: 'mercado' })).toBe(-21000);
    expect(await sum({ kind: 'uncategorizedSpending' })).toBe(
      -totals.uncategorizedSpending,
    );
    expect(await sum({ kind: 'pendingInflows' })).toBe(totals.pendingInflows);
  });

  it('o mês anterior abre só o próprio mês', async () => {
    await createBudget();
    const { totals, composition } = await readIndicators(PREVIOUS);

    expect(entryAmount(composition, 'mercado')).toBe(12000);
    expect(
      await phoneList(PREVIOUS, { kind: 'category', categoryId: 'mercado' }),
    ).toEqual(['dez: mercado']);
    expect(totals.uncategorizedSpending).toBe(6000);
    expect(
      await phoneList(PREVIOUS, { kind: 'uncategorizedSpending' }),
    ).toEqual(['dez: sem categoria (saída)']);
    expect(totals.pendingInflows).toBe(2000);
    expect(await phoneList(PREVIOUS, { kind: 'pendingInflows' })).toEqual([
      'dez: sem categoria (entrada)',
    ]);
  });

  it('extrato do desktop: a divisão aparece inteira, a outra parte esmaecida, e o total não duplica', async () => {
    await createBudget();
    const { totals, composition } = await readIndicators(MONTH);
    const mercado: IndicatorSlice = { kind: 'category', categoryId: 'mercado' };
    const semCategoria: IndicatorSlice = { kind: 'uncategorizedSpending' };

    expect(await registerList(MONTH, mercado)).toEqual([
      'jan: devolução mercado',
      'jan: divisão',
      'jan: divisão, parte mercado',
      'jan: divisão, parte sem categoria (fora do filtro)',
      'jan: mercado',
    ]);
    expect(await registerTotal(MONTH, mercado)).toBe(
      -entryAmount(composition, 'mercado'),
    );

    expect(await registerList(MONTH, semCategoria)).toEqual([
      'jan: divisão',
      'jan: divisão, parte mercado (fora do filtro)',
      'jan: divisão, parte sem categoria',
      'jan: sem categoria (saída)',
      'jan: sem categoria na conta encerrada',
    ]);
    expect(await registerTotal(MONTH, semCategoria)).toBe(
      -totals.uncategorizedSpending,
    );

    const entradas: IndicatorSlice = { kind: 'pendingInflows' };
    expect(await registerList(MONTH, entradas)).toEqual([
      'jan: sem categoria (entrada)',
    ]);
    expect(await registerTotal(MONTH, entradas)).toBe(totals.pendingInflows);

    // The uncategorized pseudo-category is never passed as an id.
    expect(
      composition.entries.some(entry => entry.id === UNCATEGORIZED_ID),
    ).toBe(true);
  });
});
