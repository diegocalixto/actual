/**
 * Money formatting for the Budget laboratory.
 *
 * Amounts are integer minor units, exactly as Actual stores them, so component
 * props already speak the application's language; only the formatter is local.
 * The Budget reference prints the `R$` prefix, which the Overview did not, so
 * this lives here instead of borrowing the Overview's helper.
 */
const brl = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatBRL(value: number): string {
  return `R$ ${brl.format(value / 100)}`;
}

/** Same, with an explicit sign — for movements, where direction is the point. */
export function formatSignedBRL(value: number): string {
  const sign = value > 0 ? '+' : value < 0 ? '-' : '';
  return `${sign}R$ ${brl.format(Math.abs(value) / 100)}`;
}

/**
 * Without the prefix, so a column can pin the symbol and the figure separately
 * and both line up down the list.
 */
export function formatPlain(value: number): string {
  const sign = value < 0 ? '-' : '';
  return `${sign}${brl.format(Math.abs(value) / 100)}`;
}

/** Whole percent, for shares. Rounded once so the column always adds up. */
export function formatPercent(ratio: number): string {
  return `${Math.round(ratio * 100)}%`;
}
