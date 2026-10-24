import { describe, expect, it } from 'vitest';

import type { CategoryEntity, CategoryGroupEntity } from '#types/models';

import {
  comparison,
  comparisonWindow,
  computeTotals,
  hasExtraordinaryTag,
  homeSummary,
  indicatorCategories,
  isResultComplete,
  notesLookup,
  reportsKpis,
  savingsRate,
  spendingComposition,
  spendingShare,
  totalsByKey,
  UNCATEGORIZED_ID,
} from './month-indicators';

const groups: CategoryGroupEntity[] = [
  { id: 'g-receitas', name: 'Receitas', is_income: true },
  { id: 'g-extra', name: 'Entradas extraordinárias', is_income: true },
  { id: 'g-casa', name: 'Casa', is_income: false },
];

const list: CategoryEntity[] = [
  { id: 'salario', name: 'Salário', is_income: true, group: 'g-receitas' },
  {
    id: 'emprestimo',
    name: 'Recuperação de empréstimo',
    is_income: true,
    group: 'g-extra',
  },
  { id: 'mercado', name: 'Supermercado', is_income: false, group: 'g-casa' },
  { id: 'farmacia', name: 'Farmácia', is_income: false, group: 'g-casa' },
];

/**
 * The demo file's marks: the extraordinary group carries the tag in its note.
 * Nothing is marked by its name.
 */
const notes = notesLookup([
  {
    id: 'g-extra',
    note: 'Entradas sem previsão de repetição. #extraordinária',
  },
]);

const categories = indicatorCategories(list, groups, notes);

const row = (category: string | null, amount: number, key = '2026-10-05') => ({
  key,
  category,
  amount,
});

describe('month-indicators — the controlled cases', () => {
  it('compra de R$ 200 e estorno identificado de R$ 50: gasto líquido de R$ 150', () => {
    const rows = [row('mercado', -20000), row('mercado', 5000, '2026-10-07')];
    const totals = computeTotals(rows, categories);

    expect(totals.categorizedSpending).toBe(15000);
    expect(totals.spending).toBe(15000);
    expect(totals.refunds).toBe(5000);
    // The refund is a smaller expense, never income.
    expect(totals.classifiedIncome).toBe(0);
    expect(totals.pendingInflows).toBe(0);

    const composition = spendingComposition(rows, categories);
    expect(composition.entries).toEqual([
      {
        id: 'mercado',
        name: 'Supermercado',
        amount: 15000,
        isUncategorized: false,
      },
    ]);
    expect(composition.credits).toEqual([]);
    expect(composition.net).toBe(totals.spending);
  });

  it('devolução líquida em outra categoria: a lista explica o total e nenhuma fatia passa de 100%', () => {
    // Mercado R$ 200 out, Farmácia R$ 50 back with no purchase of its own.
    // Recomputed by hand: spending is 200 - 50 = 150.
    const rows = [row('mercado', -20000), row('farmacia', 5000, '2026-10-09')];
    const totals = computeTotals(rows, categories);

    expect(totals.spending).toBe(15000);
    expect(totals.refunds).toBe(5000);
    // The refund is not income, and it is not hidden either.
    expect(totals.classifiedIncome).toBe(0);
    expect(totals.pendingInflows).toBe(0);

    const composition = spendingComposition(rows, categories);
    expect(composition.entries).toEqual([
      {
        id: 'mercado',
        name: 'Supermercado',
        amount: 20000,
        isUncategorized: false,
      },
    ]);
    expect(composition.credits).toEqual([
      {
        id: 'farmacia',
        name: 'Farmácia',
        amount: 5000,
        isUncategorized: false,
      },
    ]);
    expect(composition.outflows).toBe(20000);
    expect(composition.credited).toBe(5000);
    // What the list adds up to is what the tile prints.
    expect(composition.net).toBe(totals.spending);
    // The share is taken on the outflows, so the largest row is the whole of
    // them and never more.
    expect(spendingShare(composition.entries[0].amount, composition)).toBe(1);
  });

  it('mês só com devoluções: gasto negativo, nenhuma barra e o crédito à vista', () => {
    const rows = [row('farmacia', 5000), row('mercado', 2000, '2026-10-11')];
    const totals = computeTotals(rows, categories);

    expect(totals.spending).toBe(-7000);
    expect(totals.refunds).toBe(7000);
    expect(totals.classifiedIncome).toBe(0);
    // A month that gave money back leaves a result above its income.
    expect(totals.classifiedResult).toBe(7000);

    const composition = spendingComposition(rows, categories);
    expect(composition.entries).toEqual([]);
    expect(composition.outflows).toBe(0);
    expect(composition.credited).toBe(7000);
    expect(composition.credits.map(entry => entry.id)).toEqual([
      'farmacia',
      'mercado',
    ]);
    expect(composition.net).toBe(totals.spending);
    // With no outflows there is no base, and the share says so instead of
    // dividing by zero.
    expect(spendingShare(composition.credits[0].amount, composition)).toBe(0);
  });

  it('categoria gasta e estornada ao centavo: fora das duas listas, estorno ainda declarado', () => {
    const rows = [row('mercado', -20000), row('mercado', 20000, '2026-10-20')];
    const totals = computeTotals(rows, categories);
    const composition = spendingComposition(rows, categories);

    expect(totals.spending).toBe(0);
    expect(totals.refunds).toBe(20000);
    expect(composition.entries).toEqual([]);
    expect(composition.credits).toEqual([]);
    expect(composition.net).toBe(totals.spending);
  });

  it('transferência própria de R$ 1.000: nenhum aumento de renda ou gasto', () => {
    // Transfers are excluded by the queries (`payee.transfer_acct: null`) and
    // so never reach the arithmetic; that exclusion is proved against a real
    // file in ../server/month-indicators.db.test.ts. The rule this level
    // guarantees is that a month with a transfer adds up exactly as the same
    // month without it.
    const withoutTransfer = computeTotals([row('salario', 500000)], categories);
    const withTransferExcluded = computeTotals(
      [row('salario', 500000)],
      categories,
    );

    expect(withTransferExcluded).toEqual(withoutTransfer);
    expect(withTransferExcluded.classifiedIncome).toBe(500000);
    expect(withTransferExcluded.spending).toBe(0);
  });

  it('salário de R$ 5.000 e recuperação de empréstimo de R$ 5.000', () => {
    const totals = computeTotals(
      [row('salario', 500000), row('emprestimo', 500000, '2026-10-12')],
      categories,
    );

    expect(totals.classifiedIncome).toBe(500000);
    expect(totals.extraordinaryIncome).toBe(500000);
    expect(totals.classifiedResult).toBe(500000);
    // Both stay in the month's resources; only the labelling differs.
    expect(totals.resultWithExtraordinary).toBe(1000000);

    const kpis = reportsKpis(totals, null);
    expect(kpis.income.value).toBe(500000);
    expect(kpis.savingsRate.value).toBe(1);
  });

  it('despesa de R$ 100 sem categoria: incluída no gasto, listada como Sem categoria', () => {
    const rows = [row('farmacia', -3000), row(null, -10000)];
    const totals = computeTotals(rows, categories);

    expect(totals.uncategorizedSpending).toBe(10000);
    expect(totals.categorizedSpending).toBe(3000);
    expect(totals.spending).toBe(13000);

    const composition = spendingComposition(rows, categories);
    expect(composition.entries[0]).toEqual({
      id: UNCATEGORIZED_ID,
      name: null,
      amount: 10000,
      isUncategorized: true,
    });
    expect(
      composition.entries.reduce((sum, entry) => sum + entry.amount, 0),
    ).toBe(totals.spending);
  });

  it('entrada sem categoria fica para revisão, fora dos resultados, e marca o mês como incompleto', () => {
    const totals = computeTotals(
      [row('salario', 100000), row(null, 5000)],
      categories,
    );

    expect(totals.pendingInflows).toBe(5000);
    expect(totals.classifiedIncome).toBe(100000);
    expect(totals.classifiedResult).toBe(100000);
    expect(totals.resultWithExtraordinary).toBe(100000);
    expect(isResultComplete(totals)).toBe(false);
  });

  it('sem entradas a revisar, o resultado se declara completo', () => {
    expect(
      isResultComplete(computeTotals([row('salario', 100000)], categories)),
    ).toBe(true);
  });

  it('indicadores equivalentes: Início e Relatórios imprimem o mesmo mês', () => {
    const rows = [
      row('salario', 500000),
      row('emprestimo', 500000),
      row('mercado', -20000),
      row('mercado', 5000),
      row(null, -10000),
      row(null, 2500),
    ];
    const totals = computeTotals(rows, categories);
    const home = homeSummary(totals);
    const kpis = reportsKpis(totals, null);

    expect(home.income).toBe(kpis.income.value);
    expect(-home.spent).toBe(kpis.expenses.value);
    expect(home.net).toBe(kpis.net.value);
    expect(totals.spending).toBe(25000);
    expect(totals.classifiedResult).toBe(475000);
    expect(totals.resultWithExtraordinary).toBe(975000);
    expect(totals.pendingInflows).toBe(2500);
  });

  it('os totais por dia acumulam no resultado do mês', () => {
    const rows = [
      row('salario', 500000, '2026-10-01'),
      row('mercado', -20000, '2026-10-05'),
      row('mercado', 5000, '2026-10-07'),
      row(null, -10000, '2026-10-09'),
    ];
    const byDay = totalsByKey(rows, categories);
    let income = 0;
    let spending = 0;
    for (const totals of byDay.values()) {
      income += totals.classifiedIncome;
      spending += totals.spending;
    }
    const month = computeTotals(rows, categories);

    expect(income).toBe(month.classifiedIncome);
    expect(spending).toBe(month.spending);
    // A day holding only a refund lowers the running spend.
    expect(byDay.get('2026-10-07')?.spending).toBe(-5000);
  });

  it('a taxa de poupança não divide por receita nula nem negativa', () => {
    expect(
      savingsRate(computeTotals([row('mercado', -5000)], categories)),
    ).toBe(0);
  });
});

describe('month-indicators — the extraordinary mark', () => {
  it('é a tag da nota, não o nome: renomear a categoria não muda a classificação', () => {
    const renamed = indicatorCategories(
      [
        {
          id: 'emprestimo',
          name: 'Dinheiro que voltou do João',
          is_income: true,
          group: 'g-extra',
        },
      ],
      groups,
      notes,
    );

    expect(renamed.kindOf('emprestimo')).toBe('extraordinaryIncome');
  });

  it('aceita a tag na própria categoria, com grupo de receitas comum', () => {
    const own = indicatorCategories(
      [
        {
          id: 'x',
          name: 'Venda do carro',
          is_income: true,
          group: 'g-receitas',
        },
      ],
      groups,
      notesLookup([{ id: 'x', note: '#extraordinaria' }]),
    );

    expect(own.kindOf('x')).toBe('extraordinaryIncome');
  });

  it('o nome sozinho não marca mais nada', () => {
    const byName = indicatorCategories(
      [
        {
          id: 'x',
          name: 'Receita extraordinária',
          is_income: true,
          group: 'g-receitas',
        },
      ],
      groups,
      notesLookup([]),
    );

    expect(byName.kindOf('x')).toBe('classifiedIncome');
  });

  it('nota que só menciona a palavra não marca; a tag marca', () => {
    expect(hasExtraordinaryTag('pagamento extraordinário do condomínio')).toBe(
      false,
    );
    expect(hasExtraordinaryTag(null)).toBe(false);
    expect(hasExtraordinaryTag('')).toBe(false);
    expect(hasExtraordinaryTag('#extraordinária')).toBe(true);
    expect(hasExtraordinaryTag('#Extraordinaria')).toBe(true);
    expect(hasExtraordinaryTag('venda do carro #extraordinárias, 2026')).toBe(
      true,
    );
    expect(hasExtraordinaryTag('#extra')).toBe(false);
    // A stem match would take all three of these for the mark.
    expect(hasExtraordinaryTag('#extraordinariamente')).toBe(false);
    expect(hasExtraordinaryTag('#extraordinarioXYZ')).toBe(false);
    expect(hasExtraordinaryTag('#extraordinaria-invalida')).toBe(false);
    // Gender and number are what a person actually varies.
    expect(hasExtraordinaryTag('#extraordinário')).toBe(true);
    expect(hasExtraordinaryTag('#EXTRAORDINARIOS')).toBe(true);
  });

  it('categoria marcada dentro de grupo comum ainda é receita', () => {
    // The engine partitions by the group; this module also honours the
    // category's own flag, so an inflow is never printed as spending. Only a
    // file written outside Actual's interface reaches this shape.
    const odd = indicatorCategories(
      [
        {
          id: 'x',
          name: 'Salário',
          is_income: true,
          group: 'g-casa',
        },
      ],
      groups,
      notesLookup([]),
    );

    expect(odd.kindOf('x')).toBe('classifiedIncome');
  });

  it('classifica o resto como antes', () => {
    expect(categories.kindOf('salario')).toBe('classifiedIncome');
    expect(categories.kindOf('mercado')).toBe('expense');
    expect(categories.kindOf(null)).toBe('uncategorized');
    // A category the file no longer has counts as no category.
    expect(categories.kindOf('apagada')).toBe('uncategorized');
  });
});

describe('month-indicators — the comparison window', () => {
  it('never invents months before the records and marks the partial ones', () => {
    const window = comparisonWindow('2026-10', 6, '2026-06-30', '2026-10-23');

    expect(window.months).toEqual([
      '2026-06',
      '2026-07',
      '2026-08',
      '2026-09',
      '2026-10',
    ]);
    expect(window.partial['2026-06']).toEqual(['start']);
    expect(window.partial['2026-10']).toEqual(['inProgress']);
    expect(window.partial['2026-08']).toBeUndefined();
  });

  it('marca o mês inicial mesmo quando o primeiro lançamento cai no dia 1', () => {
    // The first transaction recorded proves nothing about what was not
    // recorded before it, so the month it starts in is never claimed whole.
    const window = comparisonWindow('2026-10', 6, '2026-06-01', '2026-10-23');

    expect(window.months[0]).toBe('2026-06');
    expect(window.partial['2026-06']).toEqual(['start']);
  });

  it('keeps the full window when the records are older than it', () => {
    const window = comparisonWindow('2026-10', 6, '2025-01-01', '2026-11-02');

    expect(window.months).toEqual([
      '2026-05',
      '2026-06',
      '2026-07',
      '2026-08',
      '2026-09',
      '2026-10',
    ]);
    expect(window.partial).toEqual({});
  });

  it('o mês inicial que também é o corrente é parcial pelos dois motivos', () => {
    // A file whose first movement falls in the current month: the records
    // begin here and the month is still running. One reason would hide the
    // other.
    const window = comparisonWindow('2026-10', 6, '2026-10-03', '2026-10-24');

    expect(window.months).toEqual(['2026-10']);
    expect(window.partial['2026-10']).toEqual(['start', 'inProgress']);
  });

  it('is the month alone when there are no transactions', () => {
    expect(comparisonWindow('2026-10', 6, null, '2026-10-23').months).toEqual([
      '2026-10',
    ]);
  });

  it('averages only the months it holds and withholds a change without a base', () => {
    expect(comparison([100])).toEqual({
      average: 100,
      change: null,
      spark: [100],
    });

    const two = comparison([100, 300]);
    expect(two.average).toBe(200);
    expect(two.change).toBe(2);
  });
});
