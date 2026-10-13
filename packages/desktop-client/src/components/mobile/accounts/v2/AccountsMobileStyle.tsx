import React from 'react';

import { tokensCssFor } from '#components/v2lab/LabStyle';

/**
 * The scope this screen paints inside.
 *
 * Its own class, as every promoted V2 route has one: the shared `--dfl-*`
 * values come from `tokensCssFor`, so the Accounts, the Budget, the Home and
 * the four desktop screens read from one list of hex codes, while the class
 * keeps the Accounts-only measurements below from reaching any of them.
 */
export const ACCOUNTS_MOBILE_ROOT_CLASS = 'df-accounts-mobile-v2';

/**
 * Measurements several components on this screen have to agree on.
 *
 * The bar's height is not among them: the real `AppBottomNav` publishes
 * `MOBILE_NAV_SPACER`, and the page reserves that rather than a number repeated
 * here that could drift from the bar it is supposed to clear.
 */
export const accountsLayout = {
  /** Side margin. The approved composition keeps 16px of ground on both edges. */
  gutter: 16,
  /** Vertical rhythm between sections, and between one group card and the next. */
  stackGap: 14,
};

/**
 * Values that only make sense on this screen, kept out of the shared token list
 * so no other route can pick them up: tighter radii than the desktop's 18px,
 * which would eat a 396px-wide card, and the hero's own strip.
 */
const ACCOUNTS_DECLARATIONS = `
  --dfma-radius: 16px;
  --dfma-radius-sm: 12px;
  --dfma-radius-tile: 11px;

  /* The hero's strip: darker than the plate above it, so the divider reads as a
     change of plane instead of as a drawn line. Identical to the mobile Home's,
     because it is the same object doing the same job. */
  --dfma-hero-strip: rgba(4, 8, 16, 0.5);

  /* The panel surface every group card on this screen is built from, written
     once so the on-budget, off-budget and closed cards cannot drift apart. */
  --dfma-panel-sheen: linear-gradient(
    180deg,
    rgba(150, 185, 225, 0.035),
    rgba(150, 185, 225, 0) 46%
  );

  /* The lit top edge a group header carries. It has to live on the header
     rather than on the card, because the header's own fill would paint over an
     inset highlight set on the container behind it. */
  --dfma-header-sheen: linear-gradient(
    180deg,
    rgba(150, 185, 225, 0.055),
    rgba(150, 185, 225, 0.006)
  );

  /* A closed account is still a real account, so it keeps a tile — in the
     screen's own grey rather than in a hue, which would give a dormant row the
     same weight as a live one. */
  --dfma-hue-closed: #7d8798;
`;

/**
 * The two values the page cannot reach with a token.
 *
 * The mobile page header is portalled into a slot the app shell owns, which
 * sits outside this page's class, so `var(--dfl-canvas)` does not resolve
 * there. These are that scope's copies of `--dfl-canvas` and `--dfl-line`, and
 * they exist for no other reason — exactly as the mobile Home and the mobile
 * Budget already do.
 */
export const chromeCanvas = '#070a10';
export const chromeLine = 'rgba(140, 172, 210, 0.10)';

/**
 * What is drawn on that ground: this scope's copies of `--dfl-text` and
 * `--dfl-hue-violet`.
 *
 * The ground above is dark in every theme, so its ink cannot be the theme's.
 * Left to the theme, the bar's title and controls came out as the light
 * theme's dark ink on a phone set to a light appearance — 1.3:1, which is to
 * say not there.
 */
export const chromeInk = '#e9eef6';
export const chromeAccent = '#9b7bff';

/**
 * Injects the tokens. Mounted with the page, so the rules leave the document
 * when the user navigates away and no other route is repainted.
 */
export function AccountsMobileStyle() {
  return (
    <style>
      {`${tokensCssFor(ACCOUNTS_MOBILE_ROOT_CLASS)}
.${ACCOUNTS_MOBILE_ROOT_CLASS} {${ACCOUNTS_DECLARATIONS}}
`}
    </style>
  );
}
