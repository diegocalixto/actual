/**
 * Colour map for the Accounts laboratory.
 *
 * Each account owns one hue, and that hue drives three things at once: the icon
 * tile, the connector that runs to its amount, and its slice of the donut. That
 * is what lets the eye follow one account across three different components
 * without reading a single label.
 *
 * The ramp the approved Overview publishes under `.df-v2lab` is reused where it
 * fits; nothing here is injected into that ramp, so the approved files stay
 * closed.
 */
export type AccountHue = 'blue' | 'green' | 'amber' | 'violet' | 'magenta';

/**
 * The ramp in the order the approved reference walks it.
 *
 * Assigning by position rather than by a hash of the id is deliberate: the ring
 * has to be readable, and a hash cheerfully hands two neighbouring slices the
 * same colour. Walking this order also reproduces the reference exactly on a
 * file with three on-budget and two off-budget accounts.
 */
export const ACCOUNT_HUE_ORDER: AccountHue[] = [
  'blue',
  'green',
  'amber',
  'violet',
  'magenta',
];

export const ACCOUNT_HUE: Record<AccountHue, string> = {
  blue: 'var(--dfl-hue-blue)',
  green: 'var(--dfl-hue-green)',
  amber: 'var(--dfl-hue-amber)',
  violet: 'var(--dfl-hue-violet)',
  magenta: '#f2649c',
};

/**
 * Literal fallbacks for the few places that cannot take a CSS variable — the
 * SVG gradient stops of the donut, which are interpolated at build time.
 */
export const ACCOUNT_HUE_LITERAL: Record<AccountHue, string> = {
  blue: '#4d9bf5',
  green: '#3ad07f',
  amber: '#f0a63c',
  violet: '#9b7bff',
  magenta: '#f2649c',
};
