/**
 * Money presentation for the mobile Home laboratory.
 *
 * Amounts are integer minor units, exactly as Actual stores them, so a
 * component's props already speak the application's language and nothing here
 * has to change when the screen is wired to real cells — only this formatter
 * is replaced by the app's own `useFormat()`.
 *
 * The laboratory formats in pt-BR on purpose: the approved reference is a
 * Brazilian screen, and the global locale is not this round's business. Nothing
 * outside this folder imports it, so no other screen changes shape.
 */
const brl = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Digits only — "30.643,56". */
export function formatAmount(minorUnits: number): string {
  return brl.format(minorUnits / 100);
}

/** With the symbol — "R$ 30.643,56". */
export function formatBRL(minorUnits: number): string {
  return `${CURRENCY} ${formatAmount(minorUnits)}`;
}

/**
 * Rendered as its own element wherever the symbol has to sit at a different
 * size from the digits, which is most places: the hero prints it small beside a
 * very large number, and the account column keeps it out of the right-aligned
 * string so every row's digits line up.
 */
export const CURRENCY = 'R$';
