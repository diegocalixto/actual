import React from 'react';
import type { RefObject } from 'react';

import { Popover } from '@actual-app/components/popover';

import { BalanceMovementMenu } from '#components/budget/envelope/BalanceMovementMenu';
import { SheetNameProvider } from '#hooks/useSheetName';

type EnvelopeActionsPopoverProps = {
  categoryId: string;
  month: string;
  /** The month's spreadsheet, which the menu reads the category balance from. */
  sheetName: string;
  triggerRef: RefObject<HTMLButtonElement | null>;
  isOpen: boolean;
  onClose: () => void;
  onBudgetAction: (month: string, type: string, args: unknown) => void;
};

/**
 * The category's actions, anchored to the row's chevron.
 *
 * This contributes no behaviour of its own. `BalanceMovementMenu` is the
 * surface the classic Budget already opens from its balance column — transfer
 * money, cover overspending, flip carryover — and every one of those goes
 * through the application's own budget actions. Reusing it whole is what keeps
 * the rules in the engine: there is no second implementation of "where may this
 * money come from" to drift from the first.
 *
 * It reads the category's balance through the sheet in scope, so the month's
 * sheet is provided here rather than assumed.
 */
export function EnvelopeActionsPopover({
  categoryId,
  month,
  sheetName,
  triggerRef,
  isOpen,
  onClose,
  onBudgetAction,
}: EnvelopeActionsPopoverProps) {
  return (
    <Popover
      triggerRef={triggerRef}
      placement="bottom end"
      isOpen={isOpen}
      onOpenChange={onClose}
      style={{ margin: 1, minWidth: 200 }}
      isNonModal
    >
      <SheetNameProvider name={sheetName}>
        <BalanceMovementMenu
          categoryId={categoryId}
          month={month}
          onBudgetAction={onBudgetAction}
          onClose={onClose}
        />
      </SheetNameProvider>
    </Popover>
  );
}
