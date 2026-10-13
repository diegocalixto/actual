/**
 * Money formatting for the Budget.
 *
 * Amounts are integer minor units, exactly as Actual stores them, so component
 * props already speak the application's language. The Budget reference prints
 * the currency symbol, which the Overview did not, so this lives here instead
 * of borrowing the Overview's helper. The symbol, the separators and the
 * decimals follow the budget file's own preferences — see `../regionalFormat`.
 */
import { currencySymbol, formatDigits } from '#components/v2lab/LabStyle';

/** The sign leads the symbol, as pt-BR writes it: "-R$ 1.528,20". */
export function formatCurrency(value: number): string {
  const sign = value < 0 ? '-' : '';
  return `${sign}${currencySymbol()} ${formatDigits(Math.abs(value))}`;
}

/** Same, with an explicit sign — for movements, where direction is the point. */
export function formatSignedCurrency(value: number): string {
  const sign = value > 0 ? '+' : value < 0 ? '-' : '';
  return `${sign}${currencySymbol()} ${formatDigits(Math.abs(value))}`;
}

/**
 * Without the prefix, so a column can pin the symbol and the figure separately
 * and both line up down the list.
 */
export function formatPlain(value: number): string {
  const sign = value < 0 ? '-' : '';
  return `${sign}${formatDigits(Math.abs(value))}`;
}

/** Whole percent, for shares. Rounded once so the column always adds up. */
export function formatPercent(ratio: number): string {
  return `${Math.round(ratio * 100)}%`;
}
