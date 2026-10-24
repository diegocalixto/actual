import React from 'react';
import { Trans } from 'react-i18next';

import { viewStyles } from '@actual-app/components/view';
import { css, cx } from '@emotion/css';

import { BudgetView } from '#components/v2lab/budget/BudgetView';
import {
  currencySymbol,
  formatDigits,
  useRegionalFormatKey,
} from '#components/v2lab/LabStyle';
import { useMonthIndicators } from '#reports/useMonthIndicators';

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
 * The one thing it adds is the surface behind each row's chevron and name —
 * moving money, renaming the category or its group — which the laboratory has
 * no categories to act on.
 */
export function V2RealBudget() {
  // Redrawn whole when the file's number format or currency changes.
  const regionalFormat = useRegionalFormatKey();
  const data = useRealBudgetData();
  // The band prints the engine's own month: every income category, and only
  // the categorized spending. This says so, and names the one figure the band
  // cannot see — the month's spending with no category — so the Budget and the
  // Home, which counts it, are read as two answers to two questions.
  const { totals: monthTotals } = useMonthIndicators(data.month);
  const uncategorized = monthTotals?.uncategorizedSpending ?? 0;
  const uncategorizedAmount = `${currencySymbol()} ${formatDigits(uncategorized)}`;
  const bandNote =
    monthTotals === null ? undefined : uncategorized > 0 ? (
      <Trans>
        Envelope figures: income here includes starting balances and
        extraordinary inflows, and spending only what has a category.
        Uncategorized spending this month, not in these figures:{' '}
        {{ uncategorizedAmount }}.
      </Trans>
    ) : (
      <Trans>
        Envelope figures: income here includes starting balances and
        extraordinary inflows, and spending only what has a category. Nothing is
        uncategorized this month.
      </Trans>
    );

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
          envelopeActions: ({
            envelopeId,
            triggerRef,
            intent,
            isOpen,
            onClose,
          }) => (
            <EnvelopeActionsPopover
              categoryId={envelopeId}
              month={data.month}
              sheetName={data.sheetName}
              triggerRef={triggerRef}
              intent={intent}
              isOpen={isOpen}
              onClose={onClose}
              onBudgetAction={data.onBudgetAction}
            />
          ),
          bandNote,
          // Authorship, in the slot the approved composition already ends with:
          // small, muted, right-aligned, in the normal flow of the page.
          footnote: AUTHOR,
        }}
      />
    </main>
  );
}
