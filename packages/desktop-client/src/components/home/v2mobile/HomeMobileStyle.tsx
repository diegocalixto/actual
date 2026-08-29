import React from 'react';

import { tokensCssFor } from '#components/v2lab/LabStyle';

/**
 * The scope this screen paints inside.
 *
 * Its own class, as every promoted V2 route has one: the shared `--dfl-*`
 * values come from `tokensCssFor`, so the phone and the four desktop screens
 * read from one list of hex codes, while the class keeps the mobile-only
 * measurements below from reaching any of them.
 */
export const HOME_MOBILE_ROOT_CLASS = 'df-home-mobile-v2';

/**
 * Measurements several components have to agree on.
 *
 * The bar's height is not among them: the real `AppBottomNav` publishes
 * `MOBILE_NAV_SPACER`, and the page reserves that rather than a number repeated
 * here that could drift from the bar it is supposed to clear.
 */
export const mobileLayout = {
  /** Side margin. The approved composition keeps 16px of ground on both edges. */
  gutter: 16,
  /** Vertical rhythm between sections. */
  stackGap: 18,
};

/**
 * A few values that only make sense on a phone, kept out of the shared token
 * list so the desktop screens cannot pick them up: tighter radii than the
 * desktop's 18px, which would eat a 396px-wide card, and the ramp the hero is
 * built on.
 */
const MOBILE_DECLARATIONS = `
  --dfm-radius: 16px;
  --dfm-radius-sm: 12px;
  --dfm-radius-tile: 11px;

  /* The hero's strip: darker than the card above it, so the divider reads as a
     change of plane instead of as a drawn line. */
  --dfm-hero-strip: rgba(4, 8, 16, 0.5);

  /* The cold light, at the weight a small surface can carry. */
  --dfm-hero-value: #a9cdff;
`;

/**
 * The two values the page cannot reach with a token.
 *
 * The mobile page header is portalled into a slot the app shell owns, which
 * sits outside this page's class, so `var(--dfl-canvas)` does not resolve
 * there. These are that scope's copies of `--dfl-canvas` and `--dfl-line`, and
 * they exist for no other reason: without them the header would keep the
 * shell's lighter grey and draw a band across the top of the screen.
 */
export const chromeCanvas = '#070a10';
export const chromeLine = 'rgba(140, 172, 210, 0.10)';

/**
 * Injects the tokens. Mounted with the page, so the rules leave the document
 * when the user navigates away and no other route is repainted.
 */
export function HomeMobileStyle() {
  return (
    <style>
      {`${tokensCssFor(HOME_MOBILE_ROOT_CLASS)}
.${HOME_MOBILE_ROOT_CLASS} {${MOBILE_DECLARATIONS}}
`}
    </style>
  );
}
