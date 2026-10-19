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
 * Wraps the two cards the phone keeps from the previous Home (balance trend,
 * recent transactions).
 *
 * Those cards paint with the app theme's variables, so under a light
 * appearance — the iPhone's default — they came out as white slabs between the
 * dark ones. Inside this class the theme variables they read are pointed at
 * this page's tokens, which repaints them, chart and text included, without
 * touching the cards (the desktop still mounts them) or the shared tokens.
 */
export const HOME_MOBILE_LEGACY_SCOPE_CLASS = 'df-home-mobile-legacy';

const LEGACY_SCOPE_DECLARATIONS = `
  --color-cardBackground: var(--dfl-surface);
  --color-pageText: var(--dfl-text);
  --color-pageTextLight: var(--dfl-text-2);
  --color-pageTextSubdued: var(--dfl-text-3);
  --color-pageTextPositive: var(--dfl-hue-violet);
  --color-buttonPrimaryBackground: var(--dfl-violet);
  --color-numberPositive: var(--dfl-positive);
  --color-numberNegative: var(--dfl-negative);
  --color-buttonBareText: var(--dfl-text);
  --color-buttonBareTextHover: var(--dfl-text);
  --color-buttonBareBackgroundHover: var(--dfl-inset);
  --color-buttonBareBackgroundActive: var(--dfl-inset);
  color: var(--dfl-text);
`;

/**
 * The same cards, given the surface and the section label the Contas and
 * Despesas do mês groups use, so the bottom of the page does not change
 * treatment halfway down.
 */
const LEGACY_SCOPE_RULES = `
.${HOME_MOBILE_ROOT_CLASS} .${HOME_MOBILE_LEGACY_SCOPE_CLASS} [data-surface='dashboard-card'] {
  border-radius: var(--dfm-radius);
  border: 1px solid var(--dfl-line-strong);
  box-shadow: var(--dfl-shadow), 0 1px 0 rgba(0, 0, 0, 0.5);
}
.${HOME_MOBILE_ROOT_CLASS} .${HOME_MOBILE_LEGACY_SCOPE_CLASS} [role='heading'] {
  font-size: 13.5px;
  letter-spacing: 1.4px;
  color: var(--dfl-text);
}
`;

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
export function HomeMobileStyle() {
  return (
    <style>
      {`${tokensCssFor(HOME_MOBILE_ROOT_CLASS)}
.${HOME_MOBILE_ROOT_CLASS} {${MOBILE_DECLARATIONS}}
.${HOME_MOBILE_ROOT_CLASS} .${HOME_MOBILE_LEGACY_SCOPE_CLASS} {${LEGACY_SCOPE_DECLARATIONS}}
${LEGACY_SCOPE_RULES}`}
    </style>
  );
}
