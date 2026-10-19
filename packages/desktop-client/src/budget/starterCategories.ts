import type {
  CategoryEntity,
  CategoryGroupEntity,
} from '@actual-app/core/types/models';
import type { TFunction } from 'i18next';

/**
 * A new budget file is not empty. Every file starts as a copy of one bundled
 * database, and that database carries three groups and seven categories, so
 * that a person has somewhere to put a first transaction. They are the
 * application's words, not the person's, and the database holds them in
 * English whatever language the application is being read in. They are
 * translated where they are shown.
 *
 * Shown, not stored. The name in the file is never rewritten: the server finds
 * one of these categories by its English name, and a file may be read in
 * another language tomorrow. `withStoredStarterName` is the other half of
 * that — whatever is written back to the file goes back under the name the
 * file had, unless a person typed another.
 *
 * What says a row is one of these is not what it is called. Being copies of
 * one database, the rows have the same ids in every file, and no row a person
 * creates can have one of them. A row is translated only while it has both
 * the id it shipped with and the name it shipped with: a category somebody
 * made is left alone whatever it is called, and so is one of these from the
 * moment it is renamed.
 */
type Starter = {
  /** The name the bundled database gives the row. */
  stored: string;
  localized: (t: TFunction) => string;
};

const STARTER_GROUPS: Record<string, Starter> = {
  'fc3825fd-b982-4b72-b768-5b30844cf832': {
    stored: 'Usual Expenses',
    localized: t => t('Usual Expenses', { context: 'starter' }),
  },
  '2E1F5BDB-209B-43F9-AF2C-3CE28E380C00': {
    stored: 'Income',
    localized: t => t('Income', { context: 'starter' }),
  },
  'a137772f-cf2f-4089-9432-822d2ddc1466': {
    stored: 'Investments and Savings',
    localized: t => t('Investments and Savings', { context: 'starter' }),
  },
};

const STARTER_CATEGORIES: Record<string, Starter> = {
  '541836f1-e756-4473-a5d0-6c1d3f06c7fa': {
    stored: 'Food',
    localized: t => t('Food', { context: 'starter' }),
  },
  'af375fd4-d759-46b3-bffe-74a856151d57': {
    stored: 'General',
    localized: t => t('General', { context: 'starter' }),
  },
  'd4b0f075-3343-4408-91ed-fae94f74e5bf': {
    stored: 'Bills',
    localized: t => t('Bills', { context: 'starter' }),
  },
  '29ec2c58-8cd3-42fe-9187-7b5dfe0f70a6': {
    stored: 'Bills (Flexible)',
    localized: t => t('Bills (Flexible)', { context: 'starter' }),
  },
  '3c1699a5-522a-435e-86dc-93d900a14f0e': {
    stored: 'Income',
    localized: t => t('Income', { context: 'starter' }),
  },
  // Already translated by name, in any file, by the query that lists the
  // categories. Listed here for the way back: this is the one category the
  // server looks for by its English name, so it is the one that must not be
  // written back translated.
  '506e8d9d-7ed0-4397-84e4-07a9185dc6b2': {
    stored: 'Starting Balances',
    localized: t => t('Starting Balances'),
  },
  '6bbd8472-25d4-4cee-8a11-5bd9f7e83d61': {
    stored: 'Savings',
    localized: t => t('Savings', { context: 'starter' }),
  },
};

/** The translation, or the stored name where the language has none. */
function localizedName(starter: Starter, t: TFunction) {
  return starter.localized(t) || starter.stored;
}

function localize<T extends { id: string; name: string }>(
  row: T,
  starters: Record<string, Starter>,
  t: TFunction,
): T {
  const starter = starters[row.id];
  if (!starter || row.name !== starter.stored) {
    return row;
  }

  const name = localizedName(starter, t);
  return name === row.name ? row : { ...row, name };
}

function withStoredName<T extends { id: string; name: string }>(
  row: T,
  starters: Record<string, Starter>,
  t: TFunction,
): T {
  const starter = starters[row.id];
  if (!starter || row.name === starter.stored) {
    return row;
  }

  // Still the translation it was shown under: nobody renamed it.
  return row.name === localizedName(starter, t)
    ? { ...row, name: starter.stored }
    : row;
}

/** A category as it is shown: a starter one still under its shipped name, translated. */
export function localizeStarterCategory(
  category: CategoryEntity,
  t: TFunction,
): CategoryEntity {
  return localize(category, STARTER_CATEGORIES, t);
}

/** A group as it is shown; its categories are not looked at. */
export function localizeStarterCategoryGroup(
  group: CategoryGroupEntity,
  t: TFunction,
): CategoryGroupEntity {
  return localize(group, STARTER_GROUPS, t);
}

/**
 * A category as it is written back to the file. Hiding one, or moving it, sends
 * the whole row: where the name on it is only the translation it was shown
 * under, the row goes back under the name the file has.
 */
export function withStoredStarterCategoryName<T extends CategoryEntity>(
  category: T,
  t: TFunction,
): T {
  return withStoredName(category, STARTER_CATEGORIES, t);
}

/** The same, for a group. */
export function withStoredStarterGroupName<
  T extends Omit<CategoryGroupEntity, 'categories'>,
>(group: T, t: TFunction): T {
  return withStoredName(group, STARTER_GROUPS, t);
}
