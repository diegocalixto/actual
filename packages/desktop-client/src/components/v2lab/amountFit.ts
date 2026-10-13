/**
 * Type that gives way before an amount is cut.
 *
 * The V2 pages set their figures at one size in a slot of one width: a third
 * of a phone, a column of a band. That holds for the amounts the design was
 * drawn with and fails for longer ones — "R$ 1.234.567,89" runs out of a tile
 * sized for "R$ 9.850,00" — and an amount that is clipped is a wrong amount.
 *
 * This module answers how wide a figure will be before it is drawn, so a
 * caller can ask CSS for the design's size or for the size at which the figure
 * still fits, whichever is smaller. A figure that already fits is not touched:
 * the rule only ever takes size away, and only from the one that needs it.
 */

/**
 * Advance widths, in em, of the characters an amount is made of.
 *
 * Measured on the app's face with tabular figures, which is how
 * `FinancialText` sets every amount. Tabular figures are the reason an
 * estimate is enough: the ten digits and the minus share one width at every
 * weight, and so do the point, the comma and the space. The apostrophe some
 * number formats group thousands with is counted with those marks rather than
 * with the letters: it was not measured, and it is the narrower of the two.
 *
 * It is exact where characters are placed between pixels, which is every phone
 * and every dense display. An engine that sets each character on a whole pixel
 * can run a line a point or two past the sum; the slots these figures sit in
 * are padded by more than that, and a caller whose slot is not — a field,
 * which cuts what does not fit — leaves that much out of the room it states.
 */
const DIGIT = 0.65;
const SEPARATOR = 0.27;
const PERCENT = 1.02;
/** "R", "$" and anything else a figure might carry. */
const OTHER = 0.66;

/** How wide a figure sets, as a multiple of its font size. */
export function amountWidthInEm(figure: string): number {
  let width = 0;

  for (const character of figure) {
    if (/[\d\-−]/.test(character)) {
      width += DIGIT;
    } else if (/[.,\s'\u2019]/.test(character)) {
      width += SEPARATOR;
    } else if (character === '%') {
      width += PERCENT;
    } else {
      width += OTHER;
    }
  }

  return width;
}

type FittedFontSize = {
  /** The size the design draws, as CSS: `'36px'`, `'clamp(12px, 3.5vw, 14.5px)'`. */
  designSize: string;
  /**
   * The width the figure has, as CSS. `100cqi` is the whole of the nearest
   * ancestor that declares `containerType: 'inline-size'`; whatever shares the
   * line with the figure is subtracted from it — `'100cqi - 18px'`.
   */
  room: string;
  /** Below this the figure stops shrinking: legible and long beats fitted and unreadable. */
  floor: string;
  /**
   * The tracking the figure is set with, in px. Tight tracking is room given
   * back, a step for every character, and leaving it out of the sum would
   * shrink a figure that still fitted.
   */
  letterSpacing?: number;
  /**
   * What is printed. Several figures that sit side by side share the size of
   * the widest, so a row of tiles stays in one size. `null` is a figure that
   * has not arrived.
   */
  figures: Array<string | null>;
};

/**
 * The font size at which the figures fit their room.
 *
 * Container units rather than a measurement in script: the browser resolves
 * them during layout, so there is no second pass, nothing to observe and no
 * frame in which the figure is drawn too large. They need what the shell's
 * `color-mix()` surfaces already ask of a browser.
 */
export function fittedFontSize({
  designSize,
  room,
  floor,
  letterSpacing = 0,
  figures,
}: FittedFontSize): string {
  let widest = 0;
  let characters = 0;

  for (const figure of figures) {
    const width = figure === null ? 0 : amountWidthInEm(figure);
    if (figure !== null && width > widest) {
      widest = width;
      characters = Array.from(figure).length;
    }
  }

  if (widest === 0) {
    return designSize;
  }

  // Rounded up, so the estimate errs towards a figure a hair smaller than it
  // had to be rather than one a hair too wide. The sum is brought back to
  // thousandths first: a float's last digit is not a reason to round up.
  const em = Math.ceil(Math.round(widest * 1000) / 10) / 100;
  // What the tracking adds to the line, or gives back.
  const tracking = Math.round(characters * letterSpacing * 10) / 10;
  const line = tracking === 0 ? room : `${room} - ${tracking}px`;

  return `max(${floor}, min(${designSize}, calc((${line}) / ${em})))`;
}
