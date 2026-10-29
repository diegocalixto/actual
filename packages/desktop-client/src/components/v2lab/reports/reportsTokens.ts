import { CATEGORY_HUE_HEX } from '#components/v2lab/categoryHue';

/**
 * Colour map for the Reports laboratory.
 *
 * The three series own the page's semantics and never borrow each other's hue:
 * income is green, expenses coral, the result between them cold blue. The
 * category ramp reuses what the approved Overview already publishes under
 * `.df-v2lab`; nothing is injected into that ramp.
 */
export const SERIES = {
  income: '#3ad07f',
  expenses: '#f2645f',
  net: '#4d9bf5',
} as const;

export type SeriesKey = keyof typeof SERIES;

export type CategoryHue =
  | 'blue'
  | 'green'
  | 'amber'
  | 'coral'
  | 'rose'
  | 'violet'
  | 'cyan'
  | 'neutral';

/**
 * Literals, because SVG gradient stops cannot resolve CSS variables.
 *
 * The real Reports only ever receive the hues of `categoryHue.ts` — violet,
 * cyan, rose and the neutral grey — whose values come from there, so a
 * category is the same colour here as on every other screen. The others stay
 * for the laboratory's fixtures.
 */
export const CATEGORY_HUE: Record<CategoryHue, string> = {
  blue: '#4d9bf5',
  green: '#3ad07f',
  amber: '#f0a63c',
  coral: '#f2645f',
  rose: CATEGORY_HUE_HEX.rose,
  violet: CATEGORY_HUE_HEX.violet,
  cyan: CATEGORY_HUE_HEX.cyan,
  neutral: CATEGORY_HUE_HEX.neutral,
};
