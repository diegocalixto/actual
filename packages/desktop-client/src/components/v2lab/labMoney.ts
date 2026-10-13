/**
 * Money formatting for the Overview.
 *
 * Amounts are integer minor units, exactly as Actual stores them, so the
 * component props already speak the application's language. The separators
 * and the decimals follow the budget file's own preferences — see
 * `./regionalFormat`.
 */
import { formatDigits } from './regionalFormat';

export function formatMoney(value: number): string {
  return formatDigits(value);
}

/** Same, with an explicit sign — for movements, where direction is the point. */
export function formatSignedMoney(value: number): string {
  const sign = value > 0 ? '+' : value < 0 ? '-' : '';
  return `${sign}${formatDigits(Math.abs(value))}`;
}
