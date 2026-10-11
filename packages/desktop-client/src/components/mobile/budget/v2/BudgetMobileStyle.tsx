import React from 'react';

import { tokensCssFor } from '#components/v2lab/LabStyle';

/**
 * The scope this screen paints inside.
 *
 * Its own class, as every promoted V2 route has one: the shared `--dfl-*`
 * values come from `tokensCssFor`, so the Budget, the Home and the four desktop
 * screens read from one list of hex codes, while the class keeps the
 * Budget-only measurements below from reaching any of them.
 */
export const BUDGET_MOBILE_ROOT_CLASS = 'df-budget-mobile-v2';

/**
 * Measurements several components on this screen have to agree on.
 *
 * The bar's height is not among them: the real `AppBottomNav` publishes
 * `MOBILE_NAV_SPACER`, and the page reserves that rather than a number repeated
 * here that could drift from the bar it is supposed to clear.
 */
export const budgetLayout = {
  /** Side margin. The approved composition keeps 16px of ground on both edges. */
  gutter: 16,
  /** Vertical rhythm between sections, and between one group card and the next. */
  stackGap: 14,
  /** The bar the page draws for itself, in place of the shared mobile header. */
  topBarHeight: 58,
};

/**
 * Values that only make sense on this screen, kept out of the shared token list
 * so no other route can pick them up.
 */
const BUDGET_DECLARATIONS = `
  --dfmb-radius: 16px;
  --dfmb-radius-sm: 12px;
  --dfmb-radius-tile: 11px;

  /* The hero's ground. Violet rather than the Home's blue: Budget is the active
     destination in the bar, and the screen earns the accent it is lit by. */
  --dfmb-hero-from: #1d1440;
  --dfmb-hero-to: #241a52;
  --dfmb-hero-edge: rgba(155, 123, 255, 0.34);
  --dfmb-hero-sub: #b9aef0;

  /* How a category reads at a glance. Amber is attention, never alarm; coral is
     reserved for a balance that has actually gone negative. */
  --dfmb-calm: #8fa6c4;
  --dfmb-watch: #f0a63c;
  --dfmb-tight: #ffb44f;
  --dfmb-over: var(--dfl-negative);

  /* The quietest tier of text on this screen: the captions under a figure
     ("Saldo", "Recebido", "SALDO DO MÊS") and the amount on a banner's second
     line. It exists because the shared --dfl-text-3 is a graphics grey — it
     clears the 3:1 that a chevron needs and lands at 3.2–3.8:1 against the
     surfaces here, short of the 4.5:1 WCAG AA asks of text. This is the same
     blue-grey lifted until it clears that on every background this screen
     paints, while staying visibly below --dfl-text-2 so the three tiers still
     read as three. Scoped here, so no other route changes. */
  --dfmb-label: #848e9d;

  /* The violet a banner's action is lettered in. --dfl-violet is the screen's
     accent for fills and strokes, where 3:1 is the bar; as 12.5px text on the
     banner's tinted ground it reads 3.3:1. The lighter violet of the shared
     ramp is the same accent at a weight text can carry. */
  --dfmb-action: var(--dfl-hue-violet);

  /* Track behind every progress bar on the screen. */
  --dfmb-track: rgba(140, 172, 210, 0.13);

  /* The panel surface every card on this screen is built from, written once so
     the group cards and the metric tiles cannot drift apart. */
  --dfmb-panel-sheen: linear-gradient(
    180deg,
    rgba(150, 185, 225, 0.035),
    rgba(150, 185, 225, 0) 46%
  );
`;

/**
 * The two values the page cannot reach with a token.
 *
 * The mobile page header is portalled into a slot the app shell owns, which
 * sits outside this page's class, so `var(--dfl-canvas)` does not resolve
 * there. These are that scope's copies of `--dfl-canvas` and `--dfl-line`, and
 * they exist for no other reason — exactly as the mobile Home already does.
 */
export const chromeCanvas = '#070a10';
export const chromeLine = 'rgba(140, 172, 210, 0.10)';

/**
 * Injects the tokens. Mounted with the page, so the rules leave the document
 * when the user navigates away and no other route is repainted.
 */
export function BudgetMobileStyle() {
  return (
    <style>
      {`${tokensCssFor(BUDGET_MOBILE_ROOT_CLASS)}
.${BUDGET_MOBILE_ROOT_CLASS} {${BUDGET_DECLARATIONS}}
`}
    </style>
  );
}
