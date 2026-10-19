import type {
  CategoryEntity,
  CategoryGroupEntity,
} from '@actual-app/core/types/models';
import i18next from 'i18next';
import type { TFunction } from 'i18next';
import { beforeAll, describe, expect, it } from 'vitest';

import { renamedRow } from './renamedRow';
import {
  localizeStarterCategory,
  localizeStarterCategoryGroup,
  withStoredStarterCategoryName,
  withStoredStarterGroupName,
} from './starterCategories';

// The ids the bundled database gives its rows.
const FOOD = '541836f1-e756-4473-a5d0-6c1d3f06c7fa';
const USUAL_EXPENSES = 'fc3825fd-b982-4b72-b768-5b30844cf832';

const portuguese = i18next.createInstance();
let pt: TFunction;

beforeAll(async () => {
  await portuguese.init({
    nsSeparator: false,
    keySeparator: false,
    fallbackLng: false,
    interpolation: { escapeValue: false },
    lng: 'pt-BR',
    resources: {
      'pt-BR': {
        translation: {
          Food_starter: 'Alimentação',
          'Usual Expenses_starter': 'Despesas do dia a dia',
        },
      },
    },
  });
  pt = portuguese.t.bind(portuguese);
});

/** A starter category as the screen shows it: translated. */
function shownFood(): CategoryEntity {
  return localizeStarterCategory(
    {
      id: FOOD,
      name: 'Food',
      group: USUAL_EXPENSES,
      hidden: false,
      sort_order: 16384,
    },
    pt,
  );
}

function shownUsualExpenses(): CategoryGroupEntity {
  return localizeStarterCategoryGroup(
    { id: USUAL_EXPENSES, name: 'Usual Expenses', hidden: false },
    pt,
  );
}

describe('renaming a category', () => {
  it('writes the typed name and nothing else', () => {
    const renamed = renamedRow(shownFood(), 'Mercado');
    expect(renamed).toEqual({ ...shownFood(), name: 'Mercado' });
  });

  it('keeps the id and the group, which is what transactions point at', () => {
    const renamed = renamedRow(shownFood(), 'Mercado');
    expect(renamed?.id).toBe(FOOD);
    expect(renamed?.group).toBe(USUAL_EXPENSES);
  });

  it('reaches the file under the new name, past the translation layer', () => {
    // What the update mutation sends: the row after `withStored…`.
    const renamed = renamedRow(shownFood(), 'Mercado');
    expect(renamed).not.toBeNull();
    if (renamed) {
      expect(withStoredStarterCategoryName(renamed, pt).name).toBe('Mercado');
    }
  });

  it('trims what was typed', () => {
    expect(renamedRow(shownFood(), '  Mercado  ')?.name).toBe('Mercado');
  });

  it('writes nothing for an empty name or the name already shown', () => {
    expect(renamedRow(shownFood(), '')).toBeNull();
    expect(renamedRow(shownFood(), '   ')).toBeNull();
    // The translation it is shown under: no change, by design.
    expect(renamedRow(shownFood(), 'Alimentação')).toBeNull();
  });

  it('is a change when only the capitalisation differs', () => {
    const renamed = renamedRow(shownFood(), 'alimentação');
    expect(renamed?.name).toBe('alimentação');
    if (renamed) {
      // Not the translation any more, so it is the person's own name.
      expect(withStoredStarterCategoryName(renamed, pt).name).toBe(
        'alimentação',
      );
    }
  });
});

describe('renaming a group', () => {
  it('reaches the file under the new name', () => {
    const renamed = renamedRow(shownUsualExpenses(), 'Casa');
    expect(renamed).toEqual({ ...shownUsualExpenses(), name: 'Casa' });
    if (renamed) {
      expect(withStoredStarterGroupName(renamed, pt).name).toBe('Casa');
    }
  });

  it('writes nothing for the name already shown', () => {
    expect(renamedRow(shownUsualExpenses(), 'Despesas do dia a dia')).toBe(
      null,
    );
  });
});
