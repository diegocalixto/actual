import React from 'react';

import { tokensCssFor } from '#components/v2lab/LabStyle';

/**
 * The scope the phone's Reports paint inside.
 *
 * Its own class, as every promoted V2 route has one: the shared `--dfl-*`
 * values come from `tokensCssFor`, so the phone's Reports, its Home, Budget
 * and Accounts and the four desktop screens read from one list of hex codes.
 */
export const REPORTS_MOBILE_ROOT_CLASS = 'df-reports-mobile-v2';

/**
 * Measurements several components on this screen have to agree on.
 *
 * The bar's height is not among them: the real `AppBottomNav` publishes
 * `MOBILE_NAV_SPACER`, and the page reserves that rather than a number repeated
 * here that could drift from the bar it is supposed to clear.
 */
export const reportsMobileLayout = {
  /** Side margin. The approved compositions keep 16px of ground on both edges. */
  gutter: 16,
  /** Vertical rhythm between one card and the next. */
  stackGap: 14,
  /** The side a control gets under a finger: the 44pt iOS asks of a touch target. */
  touchTarget: 44,
};

/**
 * What this screen reads differently from the desktop it shares panels with.
 *
 * The panels round their corners with `--dfl-radius`, which is 18px on the
 * desktop. The phone's other three screens use 16px — 18 eats a 396px-wide
 * card — so the token is restated for this scope alone. The shared list is not
 * touched.
 *
 * `--dfr-card-padding` is the panels' own: on the desktop each keeps the
 * padding it was approved with, and here they all take this one, so every
 * card's title starts on the same edge down the column.
 */
const MOBILE_DECLARATIONS = `
  --dfl-radius: 16px;
  --dfr-card-padding: 14px 16px 12px;
`;

/**
 * The two values the page cannot reach with a token.
 *
 * The mobile page header is portalled into a slot the app shell owns, which
 * sits outside this page's class, so `var(--dfl-canvas)` does not resolve
 * there. These are that scope's copies of `--dfl-canvas` and `--dfl-line` —
 * exactly as the phone's Home, Budget and Accounts already do.
 */
export const chromeCanvas = '#070a10';
export const chromeLine = 'rgba(140, 172, 210, 0.10)';

/**
 * What is drawn on that ground: this scope's copies of `--dfl-text` and
 * `--dfl-hue-violet`. The ground is dark in every theme, so its ink cannot be
 * the theme's.
 */
export const chromeInk = '#e9eef6';
export const chromeAccent = '#9b7bff';

/**
 * Injects the tokens. Mounted with the page, so the rules leave the document
 * when the user navigates away and no other route is repainted.
 */
export function ReportsMobileStyle() {
  return (
    <style>
      {`${tokensCssFor(REPORTS_MOBILE_ROOT_CLASS)}
.${REPORTS_MOBILE_ROOT_CLASS} {${MOBILE_DECLARATIONS}}
`}
    </style>
  );
}
