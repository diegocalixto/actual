/**
 * Money formatting for the laboratory.
 *
 * Amounts are integer minor units, exactly as Actual stores them, so the
 * component props already speak the application's language. Only the formatter
 * is local: when the laboratory is wired to real data this call is replaced by
 * the app's `useFormat()` hook and no component signature changes.
 */
const brl = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatMoney(value: number): string {
  return brl.format(value / 100);
}

/** Same, with an explicit sign — for movements, where direction is the point. */
export function formatSignedMoney(value: number): string {
  const sign = value > 0 ? '+' : value < 0 ? '-' : '';
  return `${sign}${brl.format(Math.abs(value) / 100)}`;
}
