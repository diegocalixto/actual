/**
 * What colour a category is reading in, and why.
 *
 * Colour here is a statement about *pressure*, never about size. A small
 * balance is not an overspend: 93% used with money still in the envelope is
 * attention, which is amber; only a balance that has actually gone below zero
 * earns the negative tone. Painting R$ 15,00 red because it is a small number
 * would tell the reader something untrue.
 *
 * A category with no plan has no pressure to report — there is nothing to be
 * 90% of — so it reads calm unless its balance is genuinely negative.
 */
export function toneFor(
  balance: number | null,
  usedPercent: number | null,
): string {
  if (balance !== null && balance < 0) {
    return 'var(--dfmb-over)';
  }

  if (usedPercent === null) {
    return 'var(--dfmb-calm)';
  }

  if (usedPercent >= 90) {
    return 'var(--dfmb-tight)';
  }

  if (usedPercent >= 70) {
    return 'var(--dfmb-watch)';
  }

  return 'var(--dfmb-calm)';
}
