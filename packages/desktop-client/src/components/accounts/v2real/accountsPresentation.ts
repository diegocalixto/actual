/**
 * Presentation arithmetic for the real Accounts.
 *
 * Nothing here reads or writes anything: it turns a set of real balances into
 * the axis and labels the approved chart takes. Kept out of the adapter so the
 * rounding rules can be read — and argued with — on their own.
 */

/** The axis is divided into this many bands, giving one more tick than bands. */
const BANDS = 4;

const STEPS = [1, 2, 2.5, 5, 10];

/** The smallest "round" number at or above `raw`. */
function niceStep(raw: number): number {
  if (!Number.isFinite(raw) || raw <= 0) {
    return 1;
  }

  const magnitude = 10 ** Math.floor(Math.log10(raw));

  for (const step of STEPS) {
    if (step * magnitude >= raw) {
      return step * magnitude;
    }
  }

  return 10 * magnitude;
}

export type Axis = {
  min: number;
  max: number;
  /** Highest first, as the approved chart prints them down the left edge. */
  ticks: number[];
};

/**
 * An axis that contains every point and lands on round numbers.
 *
 * The floor is zero whenever the balances allow it — a chart of money that
 * starts above zero exaggerates every movement on it — and drops below only
 * when an account is genuinely overdrawn.
 */
export function axisFor(values: number[]): Axis {
  const max = values.length > 0 ? Math.max(...values) : 0;
  const min = values.length > 0 ? Math.min(...values) : 0;

  const floor = Math.min(0, min);
  const step = niceStep(Math.max(max - floor, 1) / BANDS);

  const axisMin = Math.floor(floor / step) * step;
  const axisMax = Math.max(Math.ceil(max / step) * step, axisMin + step);

  const bands = Math.round((axisMax - axisMin) / step);
  const ticks = Array.from(
    { length: bands + 1 },
    (_, index) => axisMax - index * step,
  );

  return { min: axisMin, max: axisMax, ticks };
}

/**
 * Positions of the x labels: the ends, plus evenly spaced points between them.
 *
 * Indices rather than dates, so the caller keeps ownership of the formatting
 * and of the locale it formats in.
 */
export function labelIndices(length: number, count: number): number[] {
  if (length <= 0) {
    return [];
  }
  if (length <= count) {
    return Array.from({ length }, (_, index) => index);
  }

  return Array.from({ length: count }, (_, index) =>
    Math.round((index / (count - 1)) * (length - 1)),
  );
}
