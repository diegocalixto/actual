/**
 * Money and percentage formatting for the Reports laboratory.
 *
 * Amounts are integer minor units, exactly as Actual stores them, so component
 * props already speak the application's language; only the formatter is local.
 */
const brl = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const compact = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });

export function formatBRL(value: number): string {
  const sign = value < 0 ? '-' : '';
  return `${sign}R$ ${brl.format(Math.abs(value) / 100)}`;
}

/** Without the prefix, full precision — for aligned columns. */
export function formatPlain(value: number): string {
  return brl.format(value / 100);
}

/** Without the prefix, whole units — for the label inside the donut. */
export function formatCompact(value: number): string {
  return compact.format(value / 100);
}

/** Axis labels: "R$ 80K", "R$ 0", "-R$ 20K". */
export function formatAxis(value: number): string {
  if (value === 0) {
    return 'R$ 0';
  }
  const sign = value < 0 ? '-' : '';
  return `${sign}R$ ${compact.format(Math.abs(value) / 100000)}K`;
}

/** One decimal, pt-BR comma. */
export function formatPercent(ratio: number): string {
  return `${(ratio * 100).toFixed(1).replace('.', ',')}%`;
}

/** Signed change, for the comparisons against a previous period. */
export function formatChange(ratio: number): string {
  const sign = ratio >= 0 ? '+' : '-';
  return `${sign}${(Math.abs(ratio) * 100).toFixed(1).replace('.', ',')}%`;
}

/** Percentage points — a difference between two rates, not a ratio of them. */
export function formatPoints(points: number): string {
  const sign = points >= 0 ? '+' : '-';
  return `${sign}${Math.abs(points).toFixed(1).replace('.', ',')} pp`;
}
