/**
 * Money presentation for the mobile Accounts.
 *
 * Every amount arrives as the integer minor units Actual stores, straight from
 * the balance cells the budget engine publishes, and is formatted here and
 * nowhere else on this screen. Nothing in this module computes a financial
 * figure: it decides separators and a symbol, and that is all.
 *
 * Drawn in pt-BR with `R$`, which is what it prints for a budget file that
 * states nothing else; a number format or a default currency chosen in the
 * settings is obeyed, as on the mobile Home and the mobile Budget (see
 * `v2lab/regionalFormat`).
 */
import { currencySymbol, formatDigits } from '#components/v2lab/LabStyle';

/**
 * What a figure shows before its cell resolves.
 *
 * An em dash, never "R$ 0,00": zero is a truthful balance for a real account,
 * so printing it while the cell is still loading would state a fact the app
 * does not yet know.
 */
export const PENDING = '—';

/** Digits only — "43.108,00". */
export function formatAmount(minorUnits: number): string {
  return formatDigits(minorUnits);
}

/**
 * With the symbol — "R$ 43.108,00", and "-R$ 312.500,00" for a liability.
 *
 * The minus leads, ahead of the symbol, which is how the application's own
 * `useFormat()` writes a negative amount and how the mobile Home and Budget
 * already write one. Putting it between the symbol and the digits would invent
 * a second convention inside one product.
 */
export function formatCurrency(minorUnits: number): string {
  const sign = minorUnits < 0 ? '-' : '';
  return `${sign}${currencySymbol()} ${formatAmount(Math.abs(minorUnits))}`;
}

/**
 * The symbol, carrying the sign — "R$", or "-R$" for a negative balance.
 *
 * The places that set the symbol at its own size cannot use `formatCurrency`,
 * so they would otherwise print "R$ -312.500,00" while the group headers beside
 * them print "-R$ 312.500,00". One screen, two conventions. This keeps the
 * minus in front of the symbol everywhere, which is where the application's own
 * `useFormat()` puts it; those call sites pair it with `magnitude()` so the
 * sign is not printed twice.
 */
export function currencyWithSign(minorUnits: number): string {
  return minorUnits < 0 ? `-${currencySymbol()}` : currencySymbol();
}

/** The figure without its sign, for the call sites `currencyWithSign` serves. */
export function magnitude(minorUnits: number | null): number | null {
  return minorUnits === null ? null : Math.abs(minorUnits);
}
