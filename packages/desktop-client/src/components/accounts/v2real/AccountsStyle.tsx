import React from 'react';

import { tokensCssFor } from '#components/v2lab/LabStyle';

/**
 * The production Accounts' own token scope.
 *
 * The approved values are shared with the laboratory rather than copied, but
 * the class is this route's alone: `df-v2lab` marks work still under review.
 * Mounted with the page, so the rules leave the document when the user
 * navigates away and no other route is repainted.
 */
export const ACCOUNTS_ROOT_CLASS = 'df-accounts-v2';

export function AccountsStyle() {
  return <style>{tokensCssFor(ACCOUNTS_ROOT_CLASS)}</style>;
}
