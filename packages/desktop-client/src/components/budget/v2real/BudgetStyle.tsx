import React from 'react';

import { tokensCssFor } from '#components/v2lab/LabStyle';

/**
 * The production Budget's own token scope.
 *
 * The approved values are shared with the laboratory rather than copied, but
 * the class is this route's alone: `df-v2lab` marks work still under review,
 * and shipping a page under it would tie production to a name meant to
 * disappear. Mounted with the page, so the rules leave the document when the
 * user navigates away and no other route is repainted.
 */
export const BUDGET_ROOT_CLASS = 'df-budget-v2';

export function BudgetStyle() {
  return <style>{tokensCssFor(BUDGET_ROOT_CLASS)}</style>;
}
