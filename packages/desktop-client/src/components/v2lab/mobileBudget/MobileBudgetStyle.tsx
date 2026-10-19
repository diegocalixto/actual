import React from 'react';

import { tokensCssFor } from '#components/v2lab/LabStyle';

/**
 * The scope this screen paints inside.
 *
 * Its own class rather than the shared `df-v2lab` or the Home laboratory's:
 * the Budget has measurements no other screen should inherit, and a class of
 * its own means nothing written here can reach `/v2-lab/overview`, the Home
 * laboratory or any published route. The colour tokens come from
 * `tokensCssFor`, so this screen and the rest of the product read from one list
 * of hex codes instead of two that drift.
 */
export const MOBILE_BUDGET_ROOT_CLASS = 'df-mobilebudget-v2lab';

/**
 * Measurements several components have to agree on.
 */
export const budgetLayout = {
  /** Side margin. The reference keeps 16px of ground on both edges. */
  gutter: 16,
  /**
   * The strip the app shell reserves above every narrow route for the shared
   * mobile page header. This screen draws its own bar, so it renders nothing
   * into that slot and the strip would otherwise sit above the design as an
   * empty band in the shell's lighter grey. The root pulls itself up by exactly
   * this much to cover it — a change to where the laboratory paints and to
   * nothing else.
   */
  reservedHeaderHeight: 50,
  /** Vertical rhythm between sections. */
  stackGap: 14,
  /** Matches the published `AppBottomNav`, so the lab reserves what it would. */
  navHeight: 62,
  actionSize: 52,
};

/**
 * Values that only make sense on this screen, kept out of the shared token list
 * so no other route can pick them up.
 */
const BUDGET_DECLARATIONS = `
  --dfmb-radius: 16px;
  --dfmb-radius-sm: 12px;
  --dfmb-radius-tile: 11px;

  /* The bar sits on the canvas, separated by a hairline rather than a lighter
     fill — the same rule the panels follow. */
  --dfmb-nav-bg: rgba(7, 10, 16, 0.94);

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

  /* Track behind every progress bar on the screen. */
  --dfmb-track: rgba(140, 172, 210, 0.13);
`;

/**
 * Injects the tokens. Mounted only by the laboratory route, so the rules leave
 * the document the moment the route does.
 */
export function MobileBudgetStyle() {
  return (
    <style>
      {`${tokensCssFor(MOBILE_BUDGET_ROOT_CLASS)}
.${MOBILE_BUDGET_ROOT_CLASS} {${BUDGET_DECLARATIONS}}
`}
    </style>
  );
}
