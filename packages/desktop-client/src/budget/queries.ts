import { send } from '@actual-app/core/platform/client/connection';
import type {
  CategoryEntity,
  CategoryGroupEntity,
} from '@actual-app/core/types/models';
import { queryOptions } from '@tanstack/react-query';
import i18n from 'i18next';

import {
  localizeStarterCategory,
  localizeStarterCategoryGroup,
} from './starterCategories';

type CategoryViews = {
  grouped: CategoryGroupEntity[];
  list: CategoryEntity[];
};

export const categoryQueries = {
  all: () => ['categories'],
  lists: () => [...categoryQueries.all(), 'lists'],
  list: () =>
    queryOptions<CategoryViews>({
      queryKey: [...categoryQueries.lists()],
      queryFn: async () => {
        const categories = await send('get-categories');
        return translateStartingBalances(categories);
      },
      placeholderData: {
        grouped: [],
        list: [],
      },
      // Manually invalidated when categories change
      staleTime: Infinity,
    }),
};

function translateStartingBalances(categories: {
  grouped: CategoryGroupEntity[];
  list: CategoryEntity[];
}): CategoryViews {
  return {
    list: translateStartingBalancesCategories(categories.list) ?? [],
    grouped: categories.grouped.map(group => ({
      ...localizeStarterCategoryGroup(group, i18n.t),
      categories: translateStartingBalancesCategories(group.categories),
    })),
  };
}

function translateStartingBalancesCategories(
  categories: CategoryEntity[] | undefined,
): CategoryEntity[] | undefined {
  return categories
    ? categories.map(cat => translateStartingBalancesCategory(cat))
    : undefined;
}

function translateStartingBalancesCategory(
  category: CategoryEntity,
): CategoryEntity {
  // The other categories a new file ships with are the application's words
  // too, and are translated on the same way out; see `./starterCategories`.
  const shown = localizeStarterCategory(category, i18n.t);
  return {
    ...shown,
    name:
      shown.name?.toLowerCase() === 'starting balances'
        ? i18n.t('Starting Balances')
        : shown.name,
  };
}
