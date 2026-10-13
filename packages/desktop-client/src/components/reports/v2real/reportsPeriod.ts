import * as monthUtils from '@actual-app/core/shared/months';

/**
 * Which month the Reports are showing, and which months they can show.
 *
 * Pure, so the desktop and the phone cannot disagree about it: both read the
 * month from the address through these functions and hand it to the same
 * queries.
 */

/** How many months the period's menu lists, the latest one included. */
export const PERIOD_MENU_MONTHS = 12;

export type PeriodBounds = {
  /**
   * The month of the first transaction the Reports count, as `YYYY-MM`.
   * `null` while it is not known, and in a file that has none.
   */
  earliest: string | null;
  /**
   * The current month. The Reports state what happened, and nothing has in a
   * month that has not begun.
   */
  latest: string;
};

/**
 * Where the periods stop on the early side: the first month with something in
 * it, and never later than the current one — a file whose only transactions
 * are dated ahead still has the current month to show.
 */
function floorOf({ earliest, latest }: PeriodBounds): string | null {
  if (earliest === null) {
    return null;
  }
  return earliest < latest ? earliest : latest;
}

/**
 * The month the address asks for, held to what the file can answer.
 *
 * Anything that is not a month — a mistyped address, a stale link — is the
 * current month, which is what the page shows when it is asked for nothing.
 * While the first transaction's month is not known the request stands, so a
 * link to an earlier month does not flash the current one on its way in.
 */
export function resolveReportsMonth(
  requested: string | null,
  bounds: PeriodBounds,
): string {
  if (!requested || !monthUtils.isValidYearMonth(requested)) {
    return bounds.latest;
  }
  if (requested > bounds.latest) {
    return bounds.latest;
  }
  const floor = floorOf(bounds);
  if (floor !== null && requested < floor) {
    return floor;
  }
  return requested;
}

/** Whether there is an earlier month with something to show. */
export function canStepBack(month: string, bounds: PeriodBounds): boolean {
  const floor = floorOf(bounds);
  return floor !== null && month > floor;
}

export function canStepForward(month: string, bounds: PeriodBounds): boolean {
  return month < bounds.latest;
}

/**
 * The months the period's menu offers, latest first.
 *
 * It reaches back a year or to the first month with a transaction, whichever
 * comes first. The month on screen is always on the list, however far back the
 * arrows took it: a menu that did not show where you are would be a list of
 * places to leave to.
 */
export function periodMenuMonths(
  month: string,
  bounds: PeriodBounds,
  limit: number = PERIOD_MENU_MONTHS,
): string[] {
  const floor = floorOf(bounds) ?? bounds.latest;
  const months: string[] = [];

  for (
    let cursor = bounds.latest;
    cursor >= floor && months.length < limit;
    cursor = monthUtils.prevMonth(cursor)
  ) {
    months.push(cursor);
  }

  if (!months.includes(month)) {
    months.push(month);
  }

  return months;
}
