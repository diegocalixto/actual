/**
 * Tile colours for the category lists.
 *
 * Three cold hues cycled by position, not one hue per category. Painting every
 * category a different colour turns a list into a colour chart and — worse on
 * this screen — competes with amber, the one colour that here means something.
 * A short rotation keeps adjacent rows distinguishable and leaves the semantic
 * channel to the state.
 */
const TILE_HUES = [
  'var(--dfl-hue-violet)',
  'var(--dfl-hue-blue)',
  'var(--dfl-hue-cyan)',
];

/** The hue for the row at `index` within its group. */
export function hueForIndex(index: number): string {
  return TILE_HUES[index % TILE_HUES.length];
}
