/**
 * The counting rules Início and Relatórios share.
 *
 * One month, one set of transactions, one way of adding them up. Both screens
 * feed their rows through `computeTotals`, so a figure labelled the same on the
 * two of them is the same figure — not two queries that happen to agree.
 *
 * The rules, in the order a transaction is tested:
 *
 * - A transfer between the file's own accounts is neither income nor spending,
 *   and neither is an account's starting balance, which belongs to the
 *   account's balance and to no month. Neither reaches this module: the queries
 *   below exclude them.
 * - A transaction in an income category is income. An income category — or a
 *   whole income group — whose note carries the `#extraordinária` tag is an
 *   *extraordinary* inflow: real money, in the account and in the budget, but
 *   kept apart from the income a month is judged by, and never projected
 *   forward. The mark is the tag, never the category's name, so renaming the
 *   category changes nothing.
 * - A transaction in an expense category is spending. A positive amount there
 *   is a refund of that spending and reduces it; it is not income. A category
 *   refunded more than it was spent is a credit of the month, shown as such
 *   rather than dropped.
 * - A transaction with no category is spending when it is an outflow, shown as
 *   "Sem categoria" so it is counted and visibly unexplained; an inflow with no
 *   category is money of unknown nature, listed for review and added to
 *   nothing. While there is one, the month's result is provisional and says so.
 *
 * Two results come out, each named for what it includes: the result of the
 * classified receipts (those less the spending) and the result with the
 * extraordinary inflows. Neither is the growth of a net worth — accounts
 * outside the budget and the timing of card payments are not part of either.
 *
 * Amounts are integers in minor units, as Actual stores them. Rows arrive
 * already summed per key (a day or a month), per category and per sign, so a
 * category refunded and spent on the same day is two rows, not one.
 *
 * The arithmetic here reads neither the database nor React, so it is tested
 * with controlled rows in `month-indicators.test.ts`; the queries it also
 * declares are run against a real file in
 * `../server/month-indicators.db.test.ts`.
 */
import type { CategoryEntity, CategoryGroupEntity } from '#types/models';

import * as monthUtils from './months';
import { q } from './query';

export type IndicatorRow = {
  /** What the row was grouped by: a day (`YYYY-MM-DD`) or a month (`YYYY-MM`). */
  key: string;
  category: string | null;
  /** Integer minor units. A row carries one sign only. */
  amount: number;
};

export type CategoryKind =
  | 'classifiedIncome'
  | 'extraordinaryIncome'
  | 'expense'
  | 'uncategorized';

/** The id the uncategorized pseudo-category is listed under. */
export const UNCATEGORIZED_ID = 'uncategorized';

/**
 * The tag that marks an income category — or a whole income group — as an
 * extraordinary inflow.
 *
 * It is written in the entity's note, which is where the file already keeps
 * marks like this one: it is set deliberately, it survives renaming the
 * category, it syncs with the file, and it is editable from the note button the
 * budget's categories and groups already have. So no new table and no new
 * screen, and nothing inferred from what a category happens to be called.
 */
export const EXTRAORDINARY_TAG = '#extraordinária';

/**
 * The spellings that count, normalized.
 *
 * An explicit list rather than a stem: matching anything that starts with
 * "extraordin" would take `#extraordinariamente` — or `#extraordinarioXYZ` —
 * for the mark, which is the accidental classification this rule exists to
 * end. Accents and case are the writer's business, so they are normalized
 * away; gender and number are what a person actually varies.
 */
const EXTRAORDINARY_TAGS = new Set([
  'extraordinaria',
  'extraordinarias',
  'extraordinario',
  'extraordinarios',
]);

function normalizeTag(tag: string): string {
  return (
    tag
      .normalize('NFD')
      // Every combining mark NFD just split off, i.e. the accents.
      .replace(/\p{M}/gu, '')
      .toLowerCase()
      // Trailing punctuation, so "#extraordinária," is the same tag.
      .replace(/[^\p{L}\p{N}]+$/u, '')
  );
}

/**
 * Whether a note marks its entity as extraordinary.
 *
 * Only a tag counts. A note that merely mentions the word — "pagamento
 * extraordinário do condomínio" — marks nothing, which is what makes the mark
 * an explicit act rather than a turn of phrase.
 */
export function hasExtraordinaryTag(note: string | null | undefined): boolean {
  if (!note) {
    return false;
  }

  for (const [, tag] of note.matchAll(/#([^#\s]+)/g)) {
    if (EXTRAORDINARY_TAGS.has(normalizeTag(tag))) {
      return true;
    }
  }

  return false;
}

/** A note by entity id — a category's or a group's. */
export type IndicatorNotes = (id: string) => string | null | undefined;

/** The lookup `indicatorCategories` takes, built from the notes query's rows. */
export function notesLookup(
  notes: ReadonlyArray<{ id: string; note: string | null }> | null | undefined,
): IndicatorNotes {
  const byId = new Map((notes ?? []).map(note => [note.id, note.note]));
  return id => byId.get(id);
}

export type IndicatorCategories = {
  kindOf: (categoryId: string | null) => CategoryKind;
  nameOf: (categoryId: string) => string | null;
};

/**
 * Classifies the file's categories once, so every row is a map lookup.
 *
 * A category counts as income when it is flagged, or when its group is an
 * income group. The budget engine partitions by the group alone (`if
 * (group.is_income)` in `../server/budget/app.ts`), so the two rules differ for
 * one shape: a flagged income category inside an expense group. Actual's own
 * interface cannot produce it — it sets a category's flag from its group — but
 * a file written through the API can, and the defensive reading is the one that
 * never prints an inflow as spending. The Budget's band says on screen that the
 * engine's figures are its own.
 */
export function indicatorCategories(
  list: ReadonlyArray<CategoryEntity>,
  groups: ReadonlyArray<CategoryGroupEntity>,
  noteOf: IndicatorNotes,
): IndicatorCategories {
  const groupsById = new Map(groups.map(group => [group.id, group]));
  const kinds = new Map<string, CategoryKind>();
  const names = new Map<string, string>();

  for (const category of list) {
    const group = groupsById.get(category.group) ?? null;
    const isIncome = Boolean(category.is_income || group?.is_income);
    let kind: CategoryKind = 'expense';

    if (isIncome) {
      const isMarked =
        hasExtraordinaryTag(noteOf(category.id)) ||
        (group ? hasExtraordinaryTag(noteOf(group.id)) : false);
      kind = isMarked ? 'extraordinaryIncome' : 'classifiedIncome';
    }

    kinds.set(category.id, kind);
    names.set(category.id, category.name);
  }

  return {
    // A category the file no longer has (deleted under a transaction) is as
    // unexplained as no category at all, and is counted the same way.
    kindOf: categoryId =>
      categoryId === null
        ? 'uncategorized'
        : (kinds.get(categoryId) ?? 'uncategorized'),
    nameOf: categoryId => names.get(categoryId) ?? null,
  };
}

export type IndicatorTotals = {
  /**
   * Net of the income categories that are not marked extraordinary. Named for
   * what it is — receipts the file has classified as income — because nothing
   * here proves any of it recurs.
   */
  classifiedIncome: number;
  /** Net of the income categories marked with `EXTRAORDINARY_TAG`. */
  extraordinaryIncome: number;
  /** Inflows with no category: unknown money, counted in no result. */
  pendingInflows: number;
  /**
   * Net outflow in expense categories, refunds already deducted. Positive
   * normally, and negative in a month whose refunds outweigh its spending.
   */
  categorizedSpending: number;
  /** Outflows with no category. Positive. */
  uncategorizedSpending: number;
  /** `categorizedSpending + uncategorizedSpending`. */
  spending: number;
  /** Positive amounts in expense categories, for information: already inside `categorizedSpending`. */
  refunds: number;
  /** `classifiedIncome - spending`. */
  classifiedResult: number;
  /** `classifiedResult + extraordinaryIncome`. */
  resultWithExtraordinary: number;
};

export function emptyTotals(): IndicatorTotals {
  return {
    classifiedIncome: 0,
    extraordinaryIncome: 0,
    pendingInflows: 0,
    categorizedSpending: 0,
    uncategorizedSpending: 0,
    spending: 0,
    refunds: 0,
    classifiedResult: 0,
    resultWithExtraordinary: 0,
  };
}

function addToTotals(
  totals: IndicatorTotals,
  kind: CategoryKind,
  amount: number,
): void {
  switch (kind) {
    case 'classifiedIncome':
      totals.classifiedIncome += amount;
      break;
    case 'extraordinaryIncome':
      totals.extraordinaryIncome += amount;
      break;
    case 'expense':
      // Outflows are negative; a refund is positive and nets against them.
      totals.categorizedSpending -= amount;
      if (amount > 0) {
        totals.refunds += amount;
      }
      break;
    case 'uncategorized':
      if (amount < 0) {
        totals.uncategorizedSpending -= amount;
      } else {
        totals.pendingInflows += amount;
      }
      break;
    default: {
      // Exhaustive over `CategoryKind`: a kind added without a case here is a
      // compile error rather than an amount counted nowhere.
      const exhaustive: never = kind;
      throw new Error(`unknown category kind: ${String(exhaustive)}`);
    }
  }

  totals.spending = totals.categorizedSpending + totals.uncategorizedSpending;
  totals.classifiedResult = totals.classifiedIncome - totals.spending;
  totals.resultWithExtraordinary =
    totals.classifiedResult + totals.extraordinaryIncome;
}

/** The month (or any set of rows) added up under the rules above. */
export function computeTotals(
  rows: ReadonlyArray<IndicatorRow>,
  categories: IndicatorCategories,
): IndicatorTotals {
  const totals = emptyTotals();
  for (const row of rows) {
    addToTotals(totals, categories.kindOf(row.category), row.amount);
  }
  return totals;
}

/** The same totals, one per key — per day for the curve, per month for the comparison. */
export function totalsByKey(
  rows: ReadonlyArray<IndicatorRow>,
  categories: IndicatorCategories,
): Map<string, IndicatorTotals> {
  const byKey = new Map<string, IndicatorTotals>();
  for (const row of rows) {
    let totals = byKey.get(row.key);
    if (!totals) {
      totals = emptyTotals();
      byKey.set(row.key, totals);
    }
    addToTotals(totals, categories.kindOf(row.category), row.amount);
  }
  return byKey;
}

/**
 * Whether the month's results account for everything the month holds.
 *
 * An inflow still without a category is money of unknown nature: it is in the
 * account's balance, but no result can claim it without deciding what it is. A
 * result shown next to one is provisional, and the screens say so rather than
 * printing it as settled.
 */
export function isResultComplete(totals: IndicatorTotals): boolean {
  return totals.pendingInflows === 0;
}

export type SpendingEntry = {
  /** A category id, or `UNCATEGORIZED_ID`. */
  id: string;
  /** `null` for the uncategorized row; the screen names it in its language. */
  name: string | null;
  /** Always positive: an outflow in `entries`, a credit in `credits`. */
  amount: number;
  isUncategorized: boolean;
};

export type SpendingComposition = {
  /** Categories left with a net outflow, largest first. */
  entries: SpendingEntry[];
  /**
   * Categories the month ends up owing nothing to: refunded more than they
   * were spent, so they lower the month's spending instead of adding to it.
   */
  credits: SpendingEntry[];
  /**
   * Sum of `entries`. The base for every bar and every share: taken on this,
   * no share can exceed the whole, so nothing has to be clamped or hidden.
   */
  outflows: number;
  /** Sum of `credits`, positive. */
  credited: number;
  /** `outflows - credited`, which is `IndicatorTotals.spending` for the same rows. */
  net: number;
};

/**
 * Where the month's spending went, and what came back.
 *
 * Refunds net inside their own category first. What is left splits in two: the
 * categories still costing money, and the ones that gave more back than they
 * took. Both are reported, because `outflows - credited` is exactly the figure
 * the tiles print: a list that dropped the credits would add up to more than
 * the total it sits under, and its largest row could claim more than 100% of
 * it.
 *
 * A category spent and refunded to the same cent is left out of both lists: it
 * moves no part of the total, and `IndicatorTotals.refunds` still discloses the
 * refund.
 */
export function spendingComposition(
  rows: ReadonlyArray<IndicatorRow>,
  categories: IndicatorCategories,
): SpendingComposition {
  const net = new Map<string, number>();

  for (const row of rows) {
    const kind = categories.kindOf(row.category);
    if (kind === 'expense' && row.category !== null) {
      net.set(row.category, (net.get(row.category) ?? 0) - row.amount);
    } else if (kind === 'uncategorized' && row.amount < 0) {
      net.set(UNCATEGORIZED_ID, (net.get(UNCATEGORIZED_ID) ?? 0) - row.amount);
    }
  }

  const entries: SpendingEntry[] = [];
  const credits: SpendingEntry[] = [];
  let outflows = 0;
  let credited = 0;

  for (const [id, amount] of net) {
    if (amount === 0) {
      continue;
    }

    const entry: SpendingEntry = {
      id,
      name: id === UNCATEGORIZED_ID ? null : categories.nameOf(id),
      amount: Math.abs(amount),
      isUncategorized: id === UNCATEGORIZED_ID,
    };

    if (amount > 0) {
      entries.push(entry);
      outflows += amount;
    } else {
      credits.push(entry);
      credited += entry.amount;
    }
  }

  entries.sort((a, b) => b.amount - a.amount);
  credits.sort((a, b) => b.amount - a.amount);

  return { entries, credits, outflows, credited, net: outflows - credited };
}

/**
 * One listed amount's share of the month's outflows, in `[0, 1]`.
 *
 * The denominator is the outflow side of the composition, never the net total:
 * on the net, a single category can exceed the whole month, and a month that
 * ends in credit has no meaningful whole at all. `amount` is a listed outflow,
 * so its own sign does not matter.
 */
export function spendingShare(
  amount: number,
  composition: SpendingComposition,
): number {
  return composition.outflows > 0 ? Math.abs(amount) / composition.outflows : 0;
}

/**
 * The month as Início prints it. `spent` is negative, as Actual stores outflows
 * and as the Home's tiles expect it; a month whose refunds outweigh its
 * spending prints a positive one, which is what it is.
 */
export function homeSummary(totals: IndicatorTotals): {
  income: number;
  spent: number;
  net: number;
} {
  return {
    income: totals.classifiedIncome,
    spent: -totals.spending,
    net: totals.classifiedResult,
  };
}

/**
 * A ratio against a non-positive base is arithmetic without meaning — "up
 * 1184% from a loss" tells a reader nothing — so it comes back `null`.
 */
export function change(current: number, previous: number): number | null {
  return previous > 0 ? current / previous - 1 : null;
}

/** The share of the classified receipts kept: `classifiedResult / classifiedIncome`. */
export function savingsRate(totals: IndicatorTotals): number {
  return totals.classifiedIncome > 0
    ? totals.classifiedResult / totals.classifiedIncome
    : 0;
}

/** The month as Relatórios prints it in its four tiles, against the month before. */
export function reportsKpis(
  current: IndicatorTotals,
  previous: IndicatorTotals | null,
): {
  income: { value: number; change: number | null };
  expenses: { value: number; change: number | null };
  net: { value: number; change: number | null };
  savingsRate: { value: number; points: number | null };
} {
  const before = previous ?? emptyTotals();

  return {
    income: {
      value: current.classifiedIncome,
      change: change(current.classifiedIncome, before.classifiedIncome),
    },
    expenses: {
      value: current.spending,
      change: change(current.spending, before.spending),
    },
    net: {
      value: current.classifiedResult,
      change: change(current.classifiedResult, before.classifiedResult),
    },
    savingsRate: {
      value: savingsRate(current),
      points: previous
        ? (savingsRate(current) - savingsRate(previous)) * 100
        : null,
    },
  };
}

// ---- the comparison window -------------------------------------------------

export type MonthPartial = 'start' | 'inProgress';

export type MonthWindow = {
  /** Oldest first, the month compared on last. */
  months: string[];
  /**
   * Why the window cannot vouch for a month whole, when it cannot: the records
   * begin there, the month is still running, or **both** — which is what a
   * file whose first movement falls in the current month is. Hence a list per
   * month rather than one reason, which would hide the other.
   */
  partial: Partial<Record<string, MonthPartial[]>>;
  /** The day the oldest counted transaction falls on, when there is one. */
  earliestDate: string | null;
};

/**
 * Which months the comparison may speak for.
 *
 * A window of `maxMonths` ending on `month`, cut at the month of the oldest
 * transaction in scope: a month before the file's records is not a month
 * nothing happened in, and averaging it in as zero would invent a trend.
 *
 * The month the records begin in is marked partial whatever day they begin on.
 * A first transaction dated the 1st proves only that nothing older was written
 * down — not that the month was recorded whole — so the window never claims it
 * is. With no transactions at all the window is the month alone.
 */
export function comparisonWindow(
  month: string,
  maxMonths: number,
  earliestDate: string | null,
  today: string,
): MonthWindow {
  const earliestMonth = earliestDate ? earliestDate.slice(0, 7) : month;
  let start = monthUtils.addMonths(month, -(Math.max(1, maxMonths) - 1));
  if (earliestMonth > start) {
    start = earliestMonth;
  }
  if (start > month) {
    start = month;
  }

  const months = monthUtils.rangeInclusive(start, month);

  const partial: Partial<Record<string, MonthPartial[]>> = {};
  const mark = (month: string, reason: MonthPartial) => {
    partial[month] = [...(partial[month] ?? []), reason];
  };

  if (earliestDate && months[0] === earliestMonth) {
    mark(months[0], 'start');
  }
  const currentMonth = today.slice(0, 7);
  if (months.includes(currentMonth)) {
    mark(currentMonth, 'inProgress');
  }

  return { months, partial, earliestDate };
}

export type Comparison = {
  average: number;
  change: number | null;
  spark: number[];
};

/**
 * The window's average and its trend: the mean of the later half against the
 * mean of the earlier half, over the months the window actually holds. A window
 * of one month has no earlier half, and says so with `null`.
 */
export function comparison(values: ReadonlyArray<number>): Comparison {
  const mean = (list: ReadonlyArray<number>) =>
    list.length === 0
      ? 0
      : list.reduce((sum, value) => sum + value, 0) / list.length;
  const half = Math.floor(values.length / 2);
  const earlier = values.slice(0, half);
  const later = values.slice(half);

  return {
    average: Math.round(mean(values)),
    change: earlier.length === 0 ? null : change(mean(later), mean(earlier)),
    spark: [...values],
  };
}

// ---- the queries -----------------------------------------------------------

/**
 * What every indicator query reads: the budget's own accounts, without
 * transfers between them and without starting balances. Stated once so Início
 * and Relatórios cannot drift apart on scope.
 *
 * A linked transfer is excluded on both legs (each one's payee carries a
 * `transfer_acct`), so moving money between the file's accounts — paying a card
 * included — adds neither income nor spending. A starting balance belongs to
 * the account's balance and to no month.
 */
export const INDICATOR_SCOPE = {
  'account.offbudget': false,
  'payee.transfer_acct': null,
  starting_balance_flag: false,
} as const;

export type IndicatorSign = 'outflow' | 'inflow';

/**
 * Outflows and inflows are read apart so a category spent and refunded in the
 * same period stays two rows: summed together they would hide the refund that
 * `IndicatorTotals.refunds` has to report.
 */
function amountFilter(sign: IndicatorSign) {
  return sign === 'outflow' ? { amount: { $lt: 0 } } : { amount: { $gt: 0 } };
}

/** The shape both row queries select. */
export type IndicatorQueryRow = {
  date: string;
  category: string | null;
  amount: number;
};

/**
 * One month's rows, summed per day, category and sign.
 *
 * `transactions` answers with `splits: 'inline'` unless told otherwise, which
 * is `is_parent = 0` in SQL: a split transaction is counted by its parts, and
 * the parent that merely holds them is never added on top.
 */
export function monthIndicatorRowsQuery(month: string, sign: IndicatorSign) {
  return q('transactions')
    .filter({
      $and: [
        { date: { $gte: monthUtils.firstDayOfMonth(month) } },
        { date: { $lte: monthUtils.lastDayOfMonth(month) } },
      ],
      ...INDICATOR_SCOPE,
      ...amountFilter(sign),
    })
    .groupBy(['date', 'category'])
    .select(['date', 'category', { amount: { $sum: '$amount' } }]);
}

/** The same rows for a range of months, summed per month instead of per day. */
export function windowIndicatorRowsQuery(
  startMonth: string,
  endMonth: string,
  sign: IndicatorSign,
) {
  return q('transactions')
    .filter({
      $and: [
        { date: { $transform: '$month', $gte: startMonth } },
        { date: { $transform: '$month', $lte: endMonth } },
      ],
      ...INDICATOR_SCOPE,
      ...amountFilter(sign),
    })
    .groupBy([{ $month: '$date' }, 'category'])
    .select([
      { date: { $month: '$date' } },
      'category',
      { amount: { $sum: '$amount' } },
    ]);
}

/**
 * The day the file's oldest **counted** transaction falls on.
 *
 * The row queries read one sign or the other, so an amount of exactly zero is
 * in neither and counts nowhere. It must not start the window either: an old
 * entry of nothing would hand the comparison months the file has no movement
 * in, and average them in as zero.
 */
export function earliestIndicatorDateQuery() {
  return q('transactions')
    .filter({ ...INDICATOR_SCOPE, amount: { $ne: 0 } })
    .orderBy('date')
    .limit(1)
    .select('date');
}

/** Every note in the file: where the extraordinary marks are kept. */
export function indicatorNotesQuery() {
  return q('notes').select(['id', 'note']);
}

/** The two halves of a period, as the rows `computeTotals` takes. */
export function toIndicatorRows(
  outflows: ReadonlyArray<IndicatorQueryRow> | null | undefined,
  inflows: ReadonlyArray<IndicatorQueryRow> | null | undefined,
): IndicatorRow[] {
  const rows: IndicatorRow[] = [];
  for (const row of outflows ?? []) {
    rows.push({ key: row.date, category: row.category, amount: row.amount });
  }
  for (const row of inflows ?? []) {
    rows.push({ key: row.date, category: row.category, amount: row.amount });
  }
  return rows;
}
