/**
 * Money and percentage formatting for the Reports.
 *
 * Amounts are integer minor units, exactly as Actual stores them, so component
 * props already speak the application's language. The symbol, the separators
 * and the decimals follow the budget file's own preferences — see
 * `../regionalFormat`.
 */
import {
  currencySymbol,
  formatDecimal,
  formatDigits,
  formatNumber,
  toMajorUnits,
} from '#components/v2lab/LabStyle';

export function formatCurrency(value: number): string {
  const sign = value < 0 ? '-' : '';
  return `${sign}${currencySymbol()} ${formatDigits(Math.abs(value))}`;
}

/** Without the prefix, full precision — for aligned columns. */
export function formatPlain(value: number): string {
  return formatDigits(value);
}

/** Without the prefix, whole units — for the label inside the donut. */
export function formatCompact(value: number): string {
  return formatNumber(toMajorUnits(value), 0);
}

/** Below this an axis figure is printed in full rather than in thousands. */
const AXIS_COMPACT_FLOOR = 10_000;

/**
 * Axis labels: "R$ 80K", "R$ 12,5K", "R$ 3.750", "R$ 0", "-R$ 20K".
 *
 * A tick has to print the value its gridline is drawn at. The ticks are
 * quarters of a round ceiling, so most of them are not whole thousands, and
 * rounding them to "K" labelled the R$ 3.750 line "R$ 4K" and every line of a
 * small month "R$ 0K". Below ten thousand the figure is printed in full, as
 * the Accounts axis already does; above it, the thousands keep one decimal.
 */
export function formatAxis(value: number): string {
  const symbol = currencySymbol();
  if (value === 0) {
    return `${symbol} 0`;
  }
  const sign = value < 0 ? '-' : '';
  const units = toMajorUnits(Math.abs(value));
  if (units < AXIS_COMPACT_FLOOR) {
    return `${sign}${symbol} ${formatNumber(units, 2)}`;
  }
  return `${sign}${symbol} ${formatNumber(units / 1000, 1)}K`;
}

/** One decimal, with the file's decimal mark. */
export function formatPercent(ratio: number): string {
  return `${formatDecimal(ratio * 100, 1)}%`;
}

/** Signed change, for the comparisons against a previous period. */
export function formatChange(ratio: number): string {
  const sign = ratio >= 0 ? '+' : '-';
  return `${sign}${formatDecimal(Math.abs(ratio) * 100, 1)}%`;
}

/** Percentage points — a difference between two rates, not a ratio of them. */
export function formatPoints(points: number): string {
  const sign = points >= 0 ? '+' : '-';
  return `${sign}${formatDecimal(Math.abs(points), 1)} pp`;
}
