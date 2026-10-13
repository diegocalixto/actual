/**
 * Money formatting for the Accounts.
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

/** The sign leads the symbol, as pt-BR writes it: "-R$ 1.528,20". */
export function formatCurrency(value: number): string {
  const sign = value < 0 ? '-' : '';
  return `${sign}${currencySymbol()} ${formatDigits(Math.abs(value))}`;
}

/** Without the prefix — for the two-line label inside the donut. */
export function formatPlain(value: number): string {
  return formatDigits(value);
}

/**
 * Axis labels: "R$ 45K".
 *
 * Below ten thousand the thousands form starts rounding a real figure into a
 * wrong one — R$ 500 is not "R$ 1K" — so small axes are printed in full.
 */
const AXIS_COMPACT_FLOOR = 10_000;

export function formatAxis(value: number): string {
  const symbol = currencySymbol();
  if (value === 0) {
    return `${symbol} 0`;
  }
  const units = toMajorUnits(value);
  if (Math.abs(units) < AXIS_COMPACT_FLOOR) {
    return `${symbol} ${formatNumber(units, 0)}`;
  }
  return `${symbol} ${formatNumber(units / 1000, 0)}K`;
}

/** One decimal, as the reference prints its shares. */
export function formatShare(ratio: number): string {
  if (!Number.isFinite(ratio)) {
    return '—';
  }
  return `${formatDecimal(ratio * 100, 1)}%`;
}

/** The hero's month-over-month chip. Two decimals, as the reference prints it. */
export function formatPercent(ratio: number): string {
  if (!Number.isFinite(ratio)) {
    return '—';
  }
  return `${formatDecimal(ratio * 100, 2)}%`;
}
