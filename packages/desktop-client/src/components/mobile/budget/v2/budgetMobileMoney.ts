/**
 * Money and month presentation for the mobile Budget.
 *
 * Every amount arrives as the integer minor units Actual stores, straight from
 * the budget engine's own cells, and is formatted here and nowhere else on this
 * screen. Nothing in this module computes a financial figure: it decides
 * separators, a symbol and a month's name, and that is all.
 *
 * pt-BR with the real symbol, the same choice the mobile Home already made in
 * `home/v2mobile/mobileMoneyFormat`. It is a presentation decision scoped to
 * this route: it reads no `numberFormat` preference, changes none, and touches
 * no other screen.
 */
const brl = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const monthName = new Intl.DateTimeFormat('pt-BR', { month: 'long' });

/** The symbol, kept separate wherever it is set at its own size. */
export const CURRENCY = 'R$';

/**
 * What a figure shows before its cell resolves.
 *
 * An em dash, never "R$ 0,00": zero is a truthful budget figure, so printing it
 * while the cell is still loading would state a fact the app does not yet know.
 */
export const PENDING = '—';

/** Digits only — "9.850,00". */
export function formatAmount(minorUnits: number): string {
  return brl.format(minorUnits / 100);
}

/**
 * With the symbol — "R$ 9.850,00", and "-R$ 48,90" for a negative amount.
 *
 * The minus leads, ahead of the symbol, which is how the application's own
 * `useFormat()` writes a negative amount and how the mobile Home already writes
 * one. Putting it between the symbol and the digits would invent a second
 * convention inside one product.
 */
export function formatCurrency(minorUnits: number): string {
  const sign = minorUnits < 0 ? '-' : '';
  return `${sign}${CURRENCY} ${formatAmount(Math.abs(minorUnits))}`;
}

/**
 * Actual stores an outflow as a negative amount. The screen labels its
 * direction — "Gasto", "usado" — and shows the magnitude, so the sign is turned
 * here rather than at eight call sites.
 *
 * Negation, never `Math.abs`: a month whose refunds exceeded its spending has a
 * *positive* `total-spent`, and that comes back through this as a negative
 * figure, which is what actually happened. Taking the absolute value would
 * print the same number for two opposite facts.
 */
export function asMagnitude(outflow: number): number {
  return -outflow;
}

/**
 * How much of a plan has been used, as a whole percent.
 *
 * Derived from the two amounts every time rather than stored beside them: a
 * percentage written down is a second source of truth, and the first time one
 * of the amounts changes it becomes a lie.
 *
 * A plan of zero has no share to report and comes back as `null` — the caller
 * decides what to draw — which is also what keeps a division by zero from ever
 * reaching the screen as `NaN` or `Infinity`. A non-finite input is refused for
 * the same reason.
 */
export function usedPercent(
  spent: number | null,
  planned: number | null,
): number | null {
  if (spent === null || planned === null) {
    return null;
  }

  if (!Number.isFinite(spent) || !Number.isFinite(planned) || planned <= 0) {
    return null;
  }

  const percent = Math.round((spent / planned) * 100);

  return Number.isFinite(percent) ? percent : null;
}

/**
 * "Agosto 2026", from the `YYYY-MM` the page is actually showing.
 *
 * Pinned to pt-BR like every other string this screen prints, and derived from
 * the real month every time — no month name is written down here. pt-BR names
 * the month in lower case ("agosto"), so the first letter is raised to match
 * the approved bar.
 */
export function formatMonthLabel(month: string): string {
  const [year, monthNumber] = month.split('-');
  const name = monthName.format(
    new Date(Number(year), Number(monthNumber) - 1, 1),
  );

  return `${name.charAt(0).toLocaleUpperCase('pt-BR')}${name.slice(1)} ${year}`;
}
