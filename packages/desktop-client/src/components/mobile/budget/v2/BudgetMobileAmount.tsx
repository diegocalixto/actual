import React from 'react';

import { PrivacyFilter } from '#components/PrivacyFilter';

import { formatCurrency, PENDING } from './budgetMobileMoney';

type BudgetMobileAmountProps = {
  /** Integer minor units as Actual stores them, or `null` while the cell loads. */
  value: number | null;
  /**
   * The figure is what the control around it is for: the plan a press edits,
   * the balance a press moves. While privacy mode hides it, a first tap
   * anywhere on that control then shows the figure and the next one acts — a
   * finger does not have to find one line of small type inside a row that
   * already holds three other targets.
   */
  ownsControl?: boolean;
};

/**
 * The figure's touch target, grown far past its ink: the full width of the
 * screen and more than the height of a row. The button around the figure clips
 * its content to its own box, so what is left of the target is exactly that
 * button — whatever width the row gives it.
 */
const WHOLE_CONTROL = {
  '@media (any-hover: none)': {
    '&::after': {
      inset: '-40px -100vw',
    },
  },
};

/**
 * An amount on the mobile Budget, behind the app's privacy mode.
 *
 * Only the amount goes behind it. The words around a figure and the share
 * printed beside it stay readable, which is why this is the figure alone and
 * every caller keeps its own type, size and colour.
 *
 * The em dash of a cell that is still loading is not money and is left as is.
 */
export function BudgetMobileAmount({
  value,
  ownsControl = false,
}: BudgetMobileAmountProps) {
  if (value === null) {
    return PENDING;
  }

  return (
    <PrivacyFilter style={ownsControl ? WHOLE_CONTROL : undefined}>
      {formatCurrency(value)}
    </PrivacyFilter>
  );
}
