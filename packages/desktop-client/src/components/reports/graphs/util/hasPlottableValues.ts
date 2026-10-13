/**
 * Recharts strokes an `<Area>` even when every value in the series is zero:
 * the path collapses onto the chart baseline and is drawn as a horizontal rule
 * pinned to the bottom of the chart. On a compact dashboard card, where the
 * axes and the grid are hidden, that rule has no baseline to belong to, so it
 * reads as a stray border on the card rather than as data.
 *
 * A series holding at least one non-zero value is always plotted; only the
 * degenerate all-zero (or all-missing) case is worth skipping.
 */
export function hasPlottableValues(
  values: Array<number | null | undefined>,
): boolean {
  return values.some(
    value => typeof value === 'number' && Number.isFinite(value) && value !== 0,
  );
}
