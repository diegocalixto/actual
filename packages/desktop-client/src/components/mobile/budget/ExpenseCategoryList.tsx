import { useMemo } from 'react';
import type { DragItem } from 'react-aria';
import { DropIndicator, GridList, useDragAndDrop } from 'react-aria-components';
import { useTranslation } from 'react-i18next';

import type {
  CategoryEntity,
  CategoryGroupEntity,
} from '@actual-app/core/types/models';
import { css } from '@emotion/css';

import { useMoveCategoryMutation } from '#budget';

import { ExpenseCategoryListItem } from './ExpenseCategoryListItem';

type ExpenseCategoryListProps = {
  categoryGroup: CategoryGroupEntity;
  categories: CategoryEntity[];
  shouldHideCategory: (category: CategoryEntity) => boolean;
  month: string;
  onEditCategory: (id: string) => void;
  onBudgetAction: (month: string, action: string, args: unknown) => void;
};

export function ExpenseCategoryList({
  categoryGroup,
  categories,
  month,
  onEditCategory,
  onBudgetAction,
  shouldHideCategory,
}: ExpenseCategoryListProps) {
  const { t } = useTranslation();
  const moveCategory = useMoveCategoryMutation();

  // A row's tile colour comes from its position, and the last row closes the
  // group's card. Both are properties of the list rather than of the category,
  // so they are resolved here instead of inside every row.
  const positions = useMemo(
    () => new Map(categories.map((category, index) => [category.id, index])),
    [categories],
  );

  const { dragAndDropHooks } = useDragAndDrop({
    getItems: keys =>
      [...keys].map(
        key =>
          ({
            'text/plain': key as CategoryEntity['id'],
          }) as DragItem,
      ),
    renderDropIndicator: target => {
      return (
        <DropIndicator
          target={target}
          className={css({
            '&[data-drop-target]': {
              height: 4,
              backgroundColor: 'var(--dfl-violet)',
              opacity: 1,
              borderRadius: 4,
            },
          })}
        />
      );
    },
    onReorder: e => {
      const [key] = e.keys;
      const categoryIdToMove = key as CategoryEntity['id'];
      const categoryToMove = categories.find(c => c.id === categoryIdToMove);

      if (!categoryToMove) {
        throw new Error(
          `Internal error: category with ID ${categoryIdToMove} not found.`,
        );
      }

      if (!categoryToMove.group) {
        throw new Error(
          `Internal error: category ${categoryIdToMove} is not in a group and cannot be moved.`,
        );
      }

      const targetCategoryId = e.target.key as CategoryEntity['id'];

      if (e.target.dropPosition === 'before') {
        moveCategory.mutate({
          id: categoryToMove.id,
          groupId: categoryToMove.group,
          targetId: targetCategoryId,
        });
      } else if (e.target.dropPosition === 'after') {
        const targetCategoryIndex = categories.findIndex(
          c => c.id === targetCategoryId,
        );

        if (targetCategoryIndex === -1) {
          throw new Error(
            `Internal error: category with ID ${targetCategoryId} not found.`,
          );
        }

        const nextToTargetCategory = categories[targetCategoryIndex + 1];

        moveCategory.mutate({
          id: categoryToMove.id,
          groupId: categoryToMove.group,
          // Due to the way `moveCategory` works, we use the category next to the
          // actual target category here because `moveCategory` always shoves the
          // category *before* the target category.
          // On the other hand, using `null` as `targetId` moves the category
          // to the end of the list.
          targetId: nextToTargetCategory?.id || null,
        });
      }
    },
  });

  return (
    <GridList
      aria-label={t('{{categoryGroupName}} expense group categories', {
        categoryGroupName: categoryGroup.name,
      })}
      items={categories}
      dragAndDropHooks={dragAndDropHooks}
      dependencies={[
        month,
        onEditCategory,
        onBudgetAction,
        shouldHideCategory,
        positions,
      ]}
    >
      {category => (
        <ExpenseCategoryListItem
          key={category.id}
          value={category}
          month={month}
          onEditCategory={onEditCategory}
          onBudgetAction={onBudgetAction}
          isHidden={shouldHideCategory(category)}
          isLast={positions.get(category.id) === categories.length - 1}
        />
      )}
    </GridList>
  );
}
