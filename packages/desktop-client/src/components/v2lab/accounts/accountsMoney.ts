/**
 * Money formatting for the Accounts laboratory.
 *
 * Amounts are integer minor units, exactly as Actual stores them, so component
 * props already speak the application's language; only the formatter is local.
 */
const brl = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const compact = new Intl.NumberFormat('pt-BR', {
  maximumFractionDigits: 0,
});

export function formatBRL(value: number): string {
  return `R$ ${brl.format(value / 100)}`;
}

/** Without the prefix — for the two-line label inside the donut. */
export function formatPlain(value: number): string {
  return brl.format(value / 100);
}

/**
 * Axis labels: "R$ 45K".
 *
 * Below ten thousand the thousands form starts rounding a real figure into a
 * wrong one — R$ 500 is not "R$ 1K" — so small axes are printed in full.
 */
const AXIS_COMPACT_FLOOR = 1_000_000;

export function formatAxis(value: number): string {
  if (value === 0) {
    return 'R$ 0';
  }
  if (Math.abs(value) < AXIS_COMPACT_FLOOR) {
    return `R$ ${compact.format(value / 100)}`;
  }
  return `R$ ${compact.format(value / 100000)}K`;
}

/** One decimal, as the reference prints its shares. */
export function formatShare(ratio: number): string {
  if (!Number.isFinite(ratio)) {
    return '—';
  }
  return `${(ratio * 100).toFixed(1).replace('.', ',')}%`;
}

/** The hero's month-over-month chip. Two decimals, as the reference prints it. */
export function formatPercent(ratio: number): string {
  if (!Number.isFinite(ratio)) {
    return '—';
  }
  return `${(ratio * 100).toFixed(2).replace('.', ',')}%`;
}
