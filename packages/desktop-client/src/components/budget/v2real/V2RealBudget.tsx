import React from 'react';

import { viewStyles } from '@actual-app/components/view';
import { css, cx } from '@emotion/css';

import { BudgetView } from '#components/v2lab/budget/BudgetView';
import { useRegionalFormatKey } from '#components/v2lab/LabStyle';

import { BUDGET_ROOT_CLASS, BudgetStyle } from './BudgetStyle';
import { EnvelopeActionsPopover } from './EnvelopeActionsPopover';
import { useRealBudgetData } from './useRealBudgetData';

/** A person's name. Not copy, so never a translation key. */
const AUTHOR = 'Diego Calixto';

/**
 * The real Budget.
 *
 * It contributes no layout of its own: `BudgetView` is the approved
 * composition, shared with `/v2-lab/budget`, and this file only supplies real
 * data and the token scope. Anything that looks different between the two
 * routes is a difference in the data, never in the design.
 *
 * The one thing it adds is the surface behind each row's chevron, which the
 * laboratory has no categories to act on.
 */
export function V2RealBudget() {
  // Redrawn whole when the file's number format or currency changes.
  const regionalFormat = useRegionalFormatKey();
  const data = useRealBudgetData();

  return (
    // The page's landmark. The upstream pages get theirs from `Page`; these
    // are drawn outside it, and without one a screen reader has no way to jump
    // past the navigation to the content.
    <main
      key={regionalFormat}
      className={cx(
        viewStyles,
        BUDGET_ROOT_CLASS,
        css({ flex: 1, minHeight: 0 }),
      )}
    >
      <BudgetStyle />
      <BudgetView
        data={{
          ...data,
          envelopeActions: ({ envelopeId, triggerRef, isOpen, onClose }) => (
            <EnvelopeActionsPopover
              categoryId={envelopeId}
              month={data.month}
              sheetName={data.sheetName}
              triggerRef={triggerRef}
              isOpen={isOpen}
              onClose={onClose}
              onBudgetAction={data.onBudgetAction}
            />
          ),
          // Authorship, in the slot the approved composition already ends with:
          // small, muted, right-aligned, in the normal flow of the page.
          footnote: AUTHOR,
        }}
      />
    </main>
  );
}
