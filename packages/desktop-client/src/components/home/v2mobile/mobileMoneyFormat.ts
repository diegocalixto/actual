/**
 * Money presentation for the mobile Home.
 *
 * Amounts arrive as the integer minor units Actual stores, straight from the
 * spreadsheet cells, and are formatted here and nowhere else on this screen.
 *
 * The screen formats in pt-BR with the real symbol. That is a presentation
 * choice scoped to this route: it does not read `numberFormat` or
 * `defaultCurrencyCode`, and it changes no preference, no locale and no other
 * screen. Every figure it prints is still a real cell — only the separators and
 * the symbol are decided here.
 */
const brl = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Digits only — "30.643,56". */
export function formatAmount(minorUnits: number): string {
  return brl.format(minorUnits / 100);
}

/**
 * With the symbol — "R$ 30.643,56", and "-R$ 48,90" for an outflow.
 *
 * The minus leads, ahead of the symbol, which is how the application's own
 * `useFormat()` writes a negative amount. Putting it between the symbol and the
 * digits would invent a second convention on a screen that already shows money
 * the first way.
 */
export function formatCurrency(minorUnits: number): string {
  const sign = minorUnits < 0 ? '-' : '';
  return `${sign}${CURRENCY} ${formatAmount(Math.abs(minorUnits))}`;
}

/**
 * What a figure shows before its cell resolves.
 *
 * An em dash, never "R$ 0,00": zero is a truthful balance for a real account,
 * so printing it while the cell is still loading would state a fact the app
 * does not yet know.
 */
export const PENDING = '—';

/**
 * Rendered as its own element wherever the symbol sits at a different size from
 * the digits, which is most places: the hero prints it small beside a very
 * large number, and the account column keeps it out of the right-aligned string
 * so every row's digits line up.
 */
export const CURRENCY = 'R$';
