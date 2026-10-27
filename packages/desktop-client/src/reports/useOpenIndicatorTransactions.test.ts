import { describe, expect, it } from 'vitest';

import {
  indicatorPhonePath,
  indicatorSliceFromParams,
  sliceForSpendingEntry,
} from './useOpenIndicatorTransactions';

describe('the phone address of an indicator list', () => {
  it('leva uma categoria à página dela, no escopo dos indicadores', () => {
    expect(
      indicatorPhonePath('2026-10', { kind: 'category', categoryId: 'cat-1' }),
    ).toBe('/categories/cat-1?month=2026-10&scope=indicators');
  });

  it('separa as saídas e as entradas sem categoria', () => {
    expect(
      indicatorPhonePath('2026-09', { kind: 'uncategorizedSpending' }),
    ).toBe(
      '/categories/uncategorized?month=2026-09&scope=indicators&flow=outflow',
    );
    expect(indicatorPhonePath('2026-09', { kind: 'pendingInflows' })).toBe(
      '/categories/uncategorized?month=2026-09&scope=indicators&flow=inflow',
    );
  });

  it('lê de volta o recorte que escreveu', () => {
    for (const slice of [
      { kind: 'category', categoryId: 'cat-1' },
      { kind: 'uncategorizedSpending' },
      { kind: 'pendingInflows' },
    ] as const) {
      const [path, query] = indicatorPhonePath('2026-10', slice).split('?');
      const id = path.split('/').pop();
      expect(indicatorSliceFromParams(id, new URLSearchParams(query))).toEqual(
        slice,
      );
    }
  });

  it('sem o escopo, a página continua sendo a do orçamento', () => {
    expect(
      indicatorSliceFromParams('cat-1', new URLSearchParams('month=2026-10')),
    ).toBeNull();
    expect(
      indicatorSliceFromParams(
        'uncategorized',
        new URLSearchParams('month=2026-10'),
      ),
    ).toBeNull();
  });

  it('a linha "Sem categoria" de uma lista de gastos abre as saídas sem categoria', () => {
    expect(sliceForSpendingEntry('uncategorized')).toEqual({
      kind: 'uncategorizedSpending',
    });
    expect(sliceForSpendingEntry('cat-1')).toEqual({
      kind: 'category',
      categoryId: 'cat-1',
    });
  });
});
