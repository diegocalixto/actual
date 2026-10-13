import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { send } from '@actual-app/core/platform/client/connection';
import * as monthUtils from '@actual-app/core/shared/months';
import type { CategoryEntity } from '@actual-app/core/types/models';

import { useFormat } from '#hooks/useFormat';
import { useLocale } from '#hooks/useLocale';
import { useNotes } from '#hooks/useNotes';
import { useSyncedPref } from '#hooks/useSyncedPref';
import { useUndo } from '#hooks/useUndo';
import { pushModal } from '#modals/modalsSlice';
import { useDispatch } from '#redux';

type UseCategoryBudgetMenuProps = {
  category: CategoryEntity;
  month: string;
  onBudgetAction: (month: string, action: string, args: unknown) => void;
};

/**
 * Opens the menu that edits what a category has budgeted for a month.
 *
 * Lifted out of the upstream `BudgetCell` unchanged so the approved row can
 * raise the same menu from a different control. Every action it dispatches — the amount, last
 * month's figure, the three averages, the templates, the notes — is the one
 * that was already here; nothing was added, removed or re-ordered in the move.
 *
 * Keeping it a hook rather than copying the handler is the point: there is one
 * definition of "edit this category's budget" in the mobile app, and a change
 * to it cannot reach one row type and miss the other.
 */
export function useCategoryBudgetMenu({
  category,
  month,
  onBudgetAction,
}: UseCategoryBudgetMenuProps) {
  const { t } = useTranslation();
  const locale = useLocale();
  const dispatch = useDispatch();
  const format = useFormat();
  const { showUndoNotification } = useUndo();
  const [budgetType = 'envelope'] = useSyncedPref('budgetType');
  const categoryNotes = useNotes(category.id);

  const onSaveNotes = useCallback(async (id: string, notes: string) => {
    await send('notes-save', { id, note: notes });
  }, []);

  const onEditNotes = useCallback(
    (id: string, notesMonth: string) => {
      dispatch(
        pushModal({
          modal: {
            name: 'notes',
            options: {
              id,
              name:
                category.name +
                ' - ' +
                monthUtils.format(notesMonth, "MMMM ''yy", locale),
              onSave: onSaveNotes,
            },
          },
        }),
      );
    },
    [category.name, locale, dispatch, onSaveNotes],
  );

  return useCallback(() => {
    const sharedOptions = {
      categoryId: category.id,
      month,
      onEditNotes,
      onUpdateBudget: (amount: number) => {
        onBudgetAction(month, 'budget-amount', {
          category: category.id,
          amount,
        });
        showUndoNotification({
          message: `${category.name} budget has been updated to ${format(amount, 'financial')}.`,
        });
      },
      onCopyLastMonthAverage: () => {
        onBudgetAction(month, 'copy-single-last', {
          category: category.id,
        });
        showUndoNotification({
          message: `${category.name} budget has been set to last month's budgeted amount.`,
        });
      },
      onSetMonthsAverage: (numberOfMonths: number) => {
        if (
          numberOfMonths !== 3 &&
          numberOfMonths !== 6 &&
          numberOfMonths !== 12
        ) {
          return;
        }
        onBudgetAction(month, `set-single-${numberOfMonths}-avg`, {
          category: category.id,
        });
        showUndoNotification({
          message: `${category.name} budget has been set to ${numberOfMonths === 12 ? 'yearly' : `${numberOfMonths} month`} average.`,
        });
      },
      onApplyBudgetTemplate: () => {
        onBudgetAction(month, 'apply-single-category-template', {
          category: category.id,
        });
        showUndoNotification({
          message: `${category.name} budget templates have been applied.`,
          pre: categoryNotes ?? undefined,
        });
      },
    };

    if (budgetType === 'envelope') {
      dispatch(
        pushModal({
          modal: {
            name: 'envelope-budget-menu',
            options: sharedOptions,
          },
        }),
      );
    } else {
      dispatch(
        pushModal({
          modal: {
            name: 'tracking-budget-menu',
            options: {
              ...sharedOptions,
              onCopyUntilYearEnd: () => {
                onBudgetAction(month, 'copy-until-year-end', {
                  category: category.id,
                });
                showUndoNotification({
                  message: t('{{categoryName}} budget copied until year end.', {
                    categoryName: category.name,
                  }),
                });
              },
            },
          },
        }),
      );
    }
  }, [
    budgetType,
    category.id,
    category.name,
    categoryNotes,
    dispatch,
    month,
    onBudgetAction,
    showUndoNotification,
    onEditNotes,
    format,
    t,
  ]);
}
