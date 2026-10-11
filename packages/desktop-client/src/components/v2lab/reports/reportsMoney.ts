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

const axisUnits = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 });
const axisThousands = new Intl.NumberFormat('pt-BR', {
  maximumFractionDigits: 1,
});

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

/** Below this an axis figure is printed in full rather than in thousands. */
const AXIS_COMPACT_FLOOR = 1_000_000;

/**
 * Axis labels: "R$ 80K", "R$ 12,5K", "R$ 3.750", "R$ 0", "-R$ 20K".
 *
 * A tick has to print the value its gridline is drawn at. The ticks are
 * quarters of a round ceiling, so most of them are not whole thousands, and
 * rounding them to "K" labelled the R$ 3.750 line "R$ 4K" and every line of a
 * small month "R$ 0K". Below ten thousand the figure is printed in full, as
 * the Accounts axis already does; above it, the thousands keep one decimal.
 */
export function formatAxis(value: number): string {
  if (value === 0) {
    return 'R$ 0';
  }
  const sign = value < 0 ? '-' : '';
  const magnitude = Math.abs(value);
  if (magnitude < AXIS_COMPACT_FLOOR) {
    return `${sign}R$ ${axisUnits.format(magnitude / 100)}`;
  }
  return `${sign}R$ ${axisThousands.format(magnitude / 100000)}K`;
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
