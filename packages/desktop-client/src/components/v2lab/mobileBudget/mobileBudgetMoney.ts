/**
 * Money for the mobile Budget laboratory.
 *
 * Amounts are integer minor units, exactly as Actual stores them, so the
 * component props already speak the application's language and nothing here has
 * to change when the screen is wired to real cells — only this formatter is
 * replaced by the app's own.
 *
 * pt-BR on purpose: the approved reference is a Brazilian screen, and the
 * global locale is not this round's business. Nothing outside this folder
 * imports it, so no other screen changes shape.
 */
const brl = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** The symbol, kept separate wherever it is set at its own size. */
export const CURRENCY = 'R$';

/** Digits only — "9.850,00". */
export function formatAmount(minorUnits: number): string {
  return brl.format(minorUnits / 100);
}

/** With the symbol — "R$ 9.850,00", the minus ahead of it on an outflow. */
export function formatCurrency(minorUnits: number): string {
  const sign = minorUnits < 0 ? '-' : '';
  return `${sign}${CURRENCY} ${formatAmount(Math.abs(minorUnits))}`;
}

/**
 * How much of a plan has been used, as a whole percent.
 *
 * Derived from the two amounts every time rather than written down beside them:
 * a percentage typed by hand is a second source of truth, and the first time
 * one of the amounts changes it becomes a lie. A plan of zero has no share to
 * report, so it comes back as `null` and the caller decides what to draw.
 */
export function usedPercent(spent: number, planned: number): number | null {
  if (planned <= 0) {
    return null;
  }

  return Math.round((spent / planned) * 100);
}
