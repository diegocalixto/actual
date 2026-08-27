import React from 'react';

import { tokensCssFor } from '#components/v2lab/LabStyle';

/**
 * The production Reports' own token scope.
 *
 * The approved values are shared with the laboratory rather than copied, but
 * the class is this route's alone: `df-v2lab` marks work still under review.
 * Mounted with the page, so the rules leave the document when the user
 * navigates away and no other route is repainted.
 */
export const REPORTS_ROOT_CLASS = 'df-reports-v2';

export function ReportsStyle() {
  return <style>{tokensCssFor(REPORTS_ROOT_CLASS)}</style>;
}
