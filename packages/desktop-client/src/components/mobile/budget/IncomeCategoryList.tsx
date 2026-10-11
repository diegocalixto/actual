import { useMemo } from 'react';
import type { DragItem } from 'react-aria';
import { DropIndicator, GridList, useDragAndDrop } from 'react-aria-components';
import { useTranslation } from 'react-i18next';

import type { CategoryEntity } from '@actual-app/core/types/models';
import { css } from '@emotion/css';

import { useMoveCategoryMutation } from '#budget';

import { IncomeCategoryListItem } from './IncomeCategoryListItem';

type IncomeCategoryListProps = {
  categories: CategoryEntity[];
  month: string;
  onEditCategory: (id: string) => void;
  onBudgetAction: (month: string, action: string, args: unknown) => void;
};

export function IncomeCategoryList({
  categories,
  month,
  onEditCategory,
  onBudgetAction,
}: IncomeCategoryListProps) {
  const { t } = useTranslation();
  const moveCategory = useMoveCategoryMutation();

  // The last row closes the group's card, so it draws no divider. That is a
  // property of the list rather than of the category.
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
      aria-label={t('Income categories')}
      items={categories}
      dragAndDropHooks={dragAndDropHooks}
      dependencies={[month, onEditCategory, onBudgetAction, positions]}
    >
      {category => (
        <IncomeCategoryListItem
          key={category.id}
          value={category}
          month={month}
          onEdit={onEditCategory}
          onBudgetAction={onBudgetAction}
          isLast={positions.get(category.id) === categories.length - 1}
        />
      )}
    </GridList>
  );
}
