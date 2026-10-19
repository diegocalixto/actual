import React from 'react';

import { tokensCssFor } from '#components/v2lab/LabStyle';

/**
 * The scope this screen paints inside.
 *
 * Its own class rather than the shared `df-v2lab`: the mobile proposal has
 * measurements the desktop laboratories must never inherit, and a class of its
 * own means nothing written here can reach `/v2-lab/overview` or the published
 * screens. The colour tokens come from `tokensCssFor`, so the phone and the
 * desktop read from one list of hex codes instead of two that drift.
 */
export const MOBILE_HOME_ROOT_CLASS = 'df-mobilehome-v2lab';

/**
 * Measurements, in one place because several components have to agree on them:
 * the page's bottom padding has to clear the bar, and the raised action has to
 * know how tall the bar is to sit on its edge.
 */
export const mobileLayout = {
  /** Side margin. The reference keeps 16px of ground on both edges. */
  gutter: 16,
  /**
   * The strip the app shell reserves above every narrow route for the shared
   * mobile page header (`MobilePageHeaderSlot`, `HEADER_HEIGHT` in `Page.tsx`).
   * This screen draws its own bar, so it renders nothing into that slot and the
   * strip would otherwise sit above the design as an empty band in the shell's
   * lighter grey. The root pulls itself up by exactly this much to cover it,
   * which is a change to where the laboratory paints and to nothing else.
   */
  reservedHeaderHeight: 50,
  /** Vertical rhythm between sections. */
  stackGap: 18,
  navHeight: 64,
  /** Diameter of the central action, deliberately below the reference's. */
  actionSize: 48,
};

/**
 * A few values that only make sense on a phone, kept out of the shared token
 * list so the desktop cannot pick them up: tighter radii than the desktop's
 * 18px, which would eat a 396px-wide card, and the ramp the hero is built on.
 */
const MOBILE_DECLARATIONS = `
  --dfm-radius: 16px;
  --dfm-radius-sm: 12px;
  --dfm-radius-tile: 11px;

  /* The bar sits on the canvas, separated by a hairline rather than by a
     lighter fill — the same rule the panels follow. */
  --dfm-nav-bg: rgba(7, 10, 16, 0.94);

  /* The hero's strip: darker than the card above it, so the divider reads as a
     change of plane instead of as a drawn line. */
  --dfm-hero-strip: rgba(4, 8, 16, 0.5);

  /* The cold light, at the weight a small surface can carry. */
  --dfm-hero-value: #a9cdff;
`;

/**
 * Injects the tokens. Mounted only by the laboratory route, so the rules leave
 * the document the moment the route does.
 */
export function MobileHomeStyle() {
  return (
    <style>
      {`${tokensCssFor(MOBILE_HOME_ROOT_CLASS)}
.${MOBILE_HOME_ROOT_CLASS} {${MOBILE_DECLARATIONS}}
`}
    </style>
  );
}
