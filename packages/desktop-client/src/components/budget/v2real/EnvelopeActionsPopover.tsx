import React, { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { useTranslation } from 'react-i18next';

import { SvgPencil1 } from '@actual-app/components/icons/v2';
import { Menu } from '@actual-app/components/menu';
import { Popover } from '@actual-app/components/popover';
import { View } from '@actual-app/components/view';

import {
  useSaveCategoryGroupMutation,
  useSaveCategoryMutation,
} from '#budget/mutations';
import { renamedRow } from '#budget/renamedRow';
import { BalanceMovementMenu } from '#components/budget/envelope/BalanceMovementMenu';
import type { EnvelopeActionsIntent } from '#components/v2lab/budget/BudgetView';
import { useCategory } from '#hooks/useCategory';
import { useCategoryGroup } from '#hooks/useCategoryGroup';
import { SheetNameProvider } from '#hooks/useSheetName';

import { RenameEnvelopeForm } from './RenameEnvelopeForm';

type EnvelopeActionsPopoverProps = {
  categoryId: string;
  month: string;
  /** The month's spreadsheet, which the menu reads the category balance from. */
  sheetName: string;
  triggerRef: RefObject<HTMLButtonElement | null>;
  /** What the person reached for: the row's actions, or its name. */
  intent: EnvelopeActionsIntent;
  isOpen: boolean;
  onClose: () => void;
  onBudgetAction: (month: string, type: string, args: unknown) => void;
};

type PopoverView = 'actions' | 'rename-category' | 'rename-group';

/**
 * The category's actions, anchored to the row's chevron — or to its name, when
 * the name is what was clicked.
 *
 * This contributes no behaviour of its own. `BalanceMovementMenu` is the
 * surface the classic Budget already opens from its balance column — transfer
 * money, cover overspending, flip carryover — and every one of those goes
 * through the application's own budget actions. Reusing it whole is what keeps
 * the rules in the engine: there is no second implementation of "where may this
 * money come from" to drift from the first.
 *
 * Renaming is the classic sidebar's "Rename", through the same save mutations
 * the classic Budget and the phone use: they refuse a duplicate name, and they
 * write a category the file shipped with back under its stored name when the
 * name typed is only its translation. Only `name` changes, so every
 * transaction keeps its category.
 *
 * It reads the category's balance through the sheet in scope, so the month's
 * sheet is provided here rather than assumed.
 */
export function EnvelopeActionsPopover({
  categoryId,
  month,
  sheetName,
  triggerRef,
  intent,
  isOpen,
  onClose,
  onBudgetAction,
}: EnvelopeActionsPopoverProps) {
  const { t } = useTranslation();
  const [view, setView] = useState<PopoverView>(
    intent === 'rename' ? 'rename-category' : 'actions',
  );
  // Once money is being moved, the rename items would sit under a transfer
  // form they have nothing to do with; the balance menu owns the popover then.
  const [isMovingMoney, setIsMovingMoney] = useState(false);
  const balanceMenuRef = useRef<HTMLDivElement>(null);

  // Every Menu takes the focus when it mounts, and the rename items mount
  // after the balance menu: left alone, the keyboard would land on "Rename"
  // instead of the money actions. A parent's effect runs after its children's,
  // so this one has the last word.
  useEffect(() => {
    if (view === 'actions') {
      balanceMenuRef.current
        ?.querySelector<HTMLElement>('[role="menu"]')
        ?.focus();
    }
  }, [view]);

  const { data: category } = useCategory(categoryId);
  const { data: group } = useCategoryGroup(category?.group);
  const saveCategory = useSaveCategoryMutation();
  const saveGroup = useSaveCategoryGroupMutation();

  // Back to the menu when the rename came from it; closed when it came from
  // the name, which has no menu behind it.
  const cancelRename = () => {
    if (intent === 'rename') {
      onClose();
    } else {
      setView('actions');
    }
  };

  const renameCategory = (typed: string) => {
    const renamed = category ? renamedRow(category, typed) : null;
    if (renamed) {
      saveCategory.mutate({ category: renamed });
    }
    onClose();
  };

  const renameGroup = (typed: string) => {
    const renamed = group ? renamedRow(group, typed) : null;
    if (renamed) {
      saveGroup.mutate({ group: renamed });
    }
    onClose();
  };

  return (
    <Popover
      triggerRef={triggerRef}
      // Under the name it was opened from, or under the chevron at the row's end.
      placement={intent === 'rename' ? 'bottom start' : 'bottom end'}
      isOpen={isOpen}
      onOpenChange={onClose}
      style={{ margin: 1, minWidth: 200 }}
      isNonModal
    >
      {view === 'rename-category' && category && (
        <RenameEnvelopeForm
          label={t('Category name')}
          initialName={category.name}
          onSubmit={renameCategory}
          onCancel={cancelRename}
        />
      )}

      {view === 'rename-group' && group && (
        <RenameEnvelopeForm
          label={t('Group name')}
          initialName={group.name}
          onSubmit={renameGroup}
          onCancel={cancelRename}
        />
      )}

      {view === 'actions' && (
        <>
          <View
            ref={balanceMenuRef}
            // Any choice in the balance menu either closes the popover or
            // opens one of its forms in place.
            onClickCapture={() => setIsMovingMoney(true)}
            onKeyDownCapture={event => {
              if (event.key === 'Enter') {
                setIsMovingMoney(true);
              }
            }}
          >
            <SheetNameProvider name={sheetName}>
              <BalanceMovementMenu
                categoryId={categoryId}
                month={month}
                onBudgetAction={onBudgetAction}
                onClose={onClose}
              />
            </SheetNameProvider>
          </View>

          {!isMovingMoney && (
            <Menu
              items={[
                Menu.line,
                {
                  name: 'rename-category',
                  text: t('Rename category'),
                  icon: SvgPencil1,
                  iconSize: 12,
                },
                ...(group
                  ? [
                      {
                        name: 'rename-group',
                        text: t('Rename group'),
                        icon: SvgPencil1,
                        iconSize: 12,
                      },
                    ]
                  : []),
              ]}
              onMenuSelect={name => {
                if (name === 'rename-category' || name === 'rename-group') {
                  setView(name);
                }
              }}
            />
          )}
        </>
      )}
    </Popover>
  );
}
