import type {
  CategoryEntity,
  CategoryGroupEntity,
} from '@actual-app/core/types/models';
import i18next from 'i18next';
import type { TFunction } from 'i18next';
import { beforeAll, describe, expect, it } from 'vitest';

import {
  localizeStarterCategory,
  localizeStarterCategoryGroup,
  withStoredStarterCategoryName,
  withStoredStarterGroupName,
} from './starterCategories';

// The ids the bundled database gives its rows.
const FOOD = '541836f1-e756-4473-a5d0-6c1d3f06c7fa';
const STARTING_BALANCES = '506e8d9d-7ed0-4397-84e4-07a9185dc6b2';
const USUAL_EXPENSES = 'fc3825fd-b982-4b72-b768-5b30844cf832';

const portuguese = i18next.createInstance();
const english = i18next.createInstance();
let pt: TFunction;
let en: TFunction;

beforeAll(async () => {
  const options = {
    nsSeparator: false as const,
    keySeparator: false as const,
    fallbackLng: false as const,
    interpolation: { escapeValue: false },
  };
  await portuguese.init({
    ...options,
    lng: 'pt-BR',
    resources: {
      'pt-BR': {
        translation: {
          Food_starter: 'Alimentação',
          'Usual Expenses_starter': 'Despesas do dia a dia',
          'Starting Balances': 'Saldos iniciais',
        },
      },
    },
  });
  // English has no catalog in a checkout: every key answers with itself.
  await english.init({ ...options, lng: 'en', resources: {} });
  pt = portuguese.t.bind(portuguese);
  en = english.t.bind(english);
});

function category(overrides: Partial<CategoryEntity>): CategoryEntity {
  return { id: FOOD, name: 'Food', group: USUAL_EXPENSES, ...overrides };
}

function group(overrides: Partial<CategoryGroupEntity>): CategoryGroupEntity {
  return { id: USUAL_EXPENSES, name: 'Usual Expenses', ...overrides };
}

describe('the categories a new file ships with', () => {
  it('are shown translated while they carry the id and the name they shipped with', () => {
    expect(localizeStarterCategory(category({}), pt).name).toBe('Alimentação');
    expect(localizeStarterCategoryGroup(group({}), pt).name).toBe(
      'Despesas do dia a dia',
    );
  });

  it('keep every other field as it was', () => {
    const shown = localizeStarterCategory(
      category({ hidden: true, sort_order: 3 }),
      pt,
    );
    expect(shown).toEqual(
      category({ name: 'Alimentação', hidden: true, sort_order: 3 }),
    );
  });

  it('are left alone once a person has renamed them', () => {
    const renamed = category({ name: 'Mercado' });
    expect(localizeStarterCategory(renamed, pt)).toBe(renamed);
    // Even to another capitalisation of the shipped name: it is theirs now.
    const recased = category({ name: 'food' });
    expect(localizeStarterCategory(recased, pt)).toBe(recased);
  });

  it('do not lend their translation to a category somebody made', () => {
    const own = category({ id: 'a-category-of-my-own', name: 'Food' });
    expect(localizeStarterCategory(own, pt)).toBe(own);
    const ownGroup = group({ id: 'a-group-of-my-own' });
    expect(localizeStarterCategoryGroup(ownGroup, pt)).toBe(ownGroup);
  });

  it('are shown as stored where the language has no word for them', () => {
    const shipped = category({});
    expect(localizeStarterCategory(shipped, en)).toBe(shipped);
    // Portuguese here translates Food and nothing else.
    const general = category({
      id: 'af375fd4-d759-46b3-bffe-74a856151d57',
      name: 'General',
    });
    expect(localizeStarterCategory(general, pt)).toBe(general);
  });
});

describe('what is written back to the file', () => {
  it('is the stored name, where the name is only the translation it was shown under', () => {
    // Hiding the category sends the whole row, translated name and all.
    const hidden = {
      ...localizeStarterCategory(category({}), pt),
      hidden: true,
    };
    expect(hidden.name).toBe('Alimentação');
    expect(withStoredStarterCategoryName(hidden, pt)).toEqual(
      category({ hidden: true }),
    );

    const shownGroup = localizeStarterCategoryGroup(group({}), pt);
    expect(withStoredStarterGroupName(shownGroup, pt)).toEqual(group({}));
  });

  it('is the name a person typed, when they typed one', () => {
    const renamed = category({ name: 'Mercado' });
    expect(withStoredStarterCategoryName(renamed, pt)).toBe(renamed);
    const renamedGroup = group({ name: 'Casa' });
    expect(withStoredStarterGroupName(renamedGroup, pt)).toBe(renamedGroup);
  });

  it('leaves alone a category somebody made that reads like a translation', () => {
    const own = category({ id: 'a-category-of-my-own', name: 'Alimentação' });
    expect(withStoredStarterCategoryName(own, pt)).toBe(own);
  });

  it('keeps the name the server looks the starting balances up by', () => {
    const shown = category({ id: STARTING_BALANCES, name: 'Saldos iniciais' });
    expect(withStoredStarterCategoryName(shown, pt).name).toBe(
      'Starting Balances',
    );
  });

  it('changes nothing in English', () => {
    const shipped = category({});
    expect(withStoredStarterCategoryName(shipped, en)).toBe(shipped);
  });
});
