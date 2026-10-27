import type { AccountEntity } from '@actual-app/core/types/models';

/**
 * What the bank-sync data actually tells about the accounts — nothing more.
 *
 * Two questions the screens could not answer before: how fresh the figures
 * are (when the bank was last read, and whether that read failed), and what a
 * card's balance is made of (the bill still open, the purchases the bank has
 * not confirmed yet). Everything here is read off fields the sync already
 * writes — `last_sync`, `bank_sync_status`, and the raw entry the provider
 * delivered for each transaction — so a screen never claims to know a kind of
 * account or a bill the data does not carry. Pure functions; the hooks that
 * feed them live in `components/home/v2/useBankData.ts`.
 */

export type LinkedAccountLike = Pick<
  AccountEntity,
  | 'id'
  | 'name'
  | 'closed'
  | 'account_sync_source'
  | 'last_sync'
  | 'bank_sync_status'
>;

/** A read older than this is reported as stale: Pluggy collects once a day. */
export const STALE_AFTER_MS = 36 * 60 * 60 * 1000;

export type SyncFreshness = {
  /** Open accounts linked to a bank-sync provider. */
  linked: LinkedAccountLike[];
  /** The most recent successful read, as epoch milliseconds. */
  latestSync: number | null;
  /** The least recent one: the whole set is only as fresh as this. */
  oldestSync: number | null;
  neverSynced: LinkedAccountLike[];
  /** Read more than `staleAfterMs` ago. */
  stale: LinkedAccountLike[];
  /** The last attempt ended in an error the provider reported. */
  failed: LinkedAccountLike[];
};

/**
 * `last_sync` is stored as epoch milliseconds in a string. `new Date(string)`
 * cannot read that and yields an invalid date — the bug that kept "Última
 * atualização" off the desktop Accounts page.
 */
export function parseSyncTimestamp(
  ts: string | number | null | undefined,
): number | null {
  if (ts == null || ts === '') return null;
  // The whole string has to be the number: `parseInt` would read
  // "1761480000000abc" as a real instant.
  if (typeof ts === 'string' && !/^\d+$/.test(ts)) return null;
  const value = typeof ts === 'number' ? ts : Number(ts);
  return Number.isFinite(value) && value > 0 ? value : null;
}

export function isSyncFailed(
  account: Pick<AccountEntity, 'bank_sync_status'>,
): boolean {
  const status = account.bank_sync_status;
  return (
    status != null &&
    status !== 'ok' &&
    status !== 'pending' &&
    status !== 'sync-requested'
  );
}

export function syncFreshness(
  accounts: readonly LinkedAccountLike[],
  now: number = Date.now(),
  staleAfterMs: number = STALE_AFTER_MS,
): SyncFreshness {
  const linked = accounts.filter(
    account => !account.closed && account.account_sync_source,
  );
  const synced = linked
    .map(account => ({ account, at: parseSyncTimestamp(account.last_sync) }))
    .filter(
      (entry): entry is { account: LinkedAccountLike; at: number } =>
        entry.at !== null,
    );
  const times = synced.map(entry => entry.at);

  return {
    linked,
    latestSync: times.length ? Math.max(...times) : null,
    oldestSync: times.length ? Math.min(...times) : null,
    neverSynced: linked.filter(
      account => parseSyncTimestamp(account.last_sync) === null,
    ),
    stale: synced
      .filter(entry => now - entry.at > staleAfterMs)
      .map(entry => entry.account),
    failed: linked.filter(isSyncFailed),
  };
}

// ---------------------------------------------------------------- cards

export type SyncedTransactionLike = {
  id: string;
  /** Integer minor units, Actual's sign: a purchase is negative. */
  amount: number;
  cleared: boolean | 0 | 1 | null;
  /** The provider's entry as the sync stored it; `null` for an entry typed by hand. */
  raw_synced_data: string | null;
};

/**
 * Where a card bill stands, read off the bank's own entries:
 * - `open`: still being built, the bank has not started the next one;
 * - `closed`: the next bill has started and no payment of this one is seen;
 * - `paid`: a payment (or payments adding up) of its exact figure, dated from
 *   its last entry on;
 * - `partial`: payments after its last entry that add up to less than it;
 * - `uncertain`: a payment after its last entry that fits no bill.
 */
export type CardBillState =
  | 'open'
  | 'closed'
  | 'paid'
  | 'partial'
  | 'uncertain';

export type CardBill = {
  /** `YYYY-MM`: the month the bank files the bill under (its due month). */
  month: string;
  state: CardBillState;
  /**
   * The bill's figure: what the bank listed as pending on it, bill payments
   * left out. Negative for a debt.
   */
  figure: number;
  entryCount: number;
  /** The payments read against this bill: the last one's date, their sum. */
  paid: { on: string; amount: number } | null;
};

export type CardInsights = {
  /** The provider marks the account's entries as card entries. */
  isCard: boolean;
  /** Every bill with pending entries in the window, oldest first, each with its state. */
  bills: CardBill[];
  /**
   * The bill to look at: the earliest one not paid; when every bill is paid,
   * the latest paid one. `null` when the account is not a card or no bill
   * has pending entries.
   */
  current: CardBill | null;
  /** Pending entries filed under bills after the current one (the next cycle, installments ahead). */
  later: { total: number; count: number };
  /** Uncleared entries with no bank data: typed by hand, not cleared yet. */
  manualUncleared: { total: number; count: number };
};

const BILL_KEY = 'creditCardMetadata.billForecastDate';
const CARD_KEY_PREFIX = 'creditCardMetadata.';
/** How Pluggy marks a bill payment: the operation on Itaú and Nubank, and its own category. */
const BILL_PAYMENT_OPERATION = 'PAGAMENTO_FATURA';
const BILL_PAYMENT_CATEGORY = 'Credit card payment';

export type RawEntry = Record<string, unknown>;

function isRawEntry(value: unknown): value is RawEntry {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * The provider's record of an entry, as the sync stored it (nested fields
 * flattened to dotted keys); `null` when there is none or it is unreadable.
 */
export function parseProviderEntry(raw: string | null): RawEntry | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return isRawEntry(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function billMonth(raw: RawEntry | null): string | null {
  const value = raw?.[BILL_KEY];
  return typeof value === 'string' && /^\d{4}-\d{2}$/.test(value)
    ? value
    : null;
}

function isBillPayment(raw: RawEntry | null): boolean {
  return (
    raw !== null &&
    (raw.operationType === BILL_PAYMENT_OPERATION ||
      raw.category === BILL_PAYMENT_CATEGORY)
  );
}

function rawDate(raw: RawEntry | null, key: string): string | null {
  const value = raw?.[key];
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)
    ? value.slice(0, 10)
    : null;
}

type Payment = { date: string; amount: number };

/**
 * Reads a card's situation off the entries the provider delivered.
 *
 * Pluggy files every card entry under the bill it will appear on
 * (`creditCardMetadata.billForecastDate`, the bill's due month) and marks it
 * `PENDING` until the bill is settled: on Nubank a closed bill stays pending
 * until it is paid, on Itaú the bill still open is pending — in neither case
 * is it "awaiting the merchant". A bill payment is a credit the bank files
 * under the next bill (Nubank) or under none (Itaú): it settles the previous
 * bill and is left out of every figure. A bill's figure is what the bank
 * lists as pending there, which is the bill's total as the bank's own bills
 * state it. A bill has closed once the bank has started posting to a later
 * one (`creditCardMetadata.billPostDate` on or before `today`).
 *
 * The provider's record is stored once and kept on every later match, so an
 * entry settled after its first sight keeps `booked: false` forever; and the
 * `cleared` mark is no evidence either — the importer sets it on history, the
 * user may set it by hand. Settlement is therefore read off the bank's own
 * payment entries, each payment counting once: a payment of a bill's exact
 * figure dated from its first entry on settles it; payments dated from its
 * last entry on that add up to the figure settle it in parts; payments that
 * add up to less leave it partly paid; a payment after it that fits nothing
 * leaves it uncertain, and is only reported. Without dates on its entries, a
 * bill is not read against any payment.
 */
export function cardInsights(
  transactions: readonly SyncedTransactionLike[],
  today: string,
): CardInsights {
  const entries = transactions.map(transaction => {
    const raw = parseProviderEntry(transaction.raw_synced_data);
    return {
      amount: transaction.amount,
      cleared: Boolean(transaction.cleared),
      raw,
      date: rawDate(raw, 'date'),
      postDate: rawDate(raw, 'creditCardMetadata.billPostDate'),
      bill: billMonth(raw),
      pendingAtBank: raw !== null && raw.booked === false,
      isPayment: isBillPayment(raw),
    };
  });

  const isCard = entries.some(
    entry =>
      entry.raw !== null &&
      Object.keys(entry.raw).some(key => key.startsWith(CARD_KEY_PREFIX)),
  );

  // Typed by hand and not cleared: a fact about the register, not a claim
  // about what the bank will do with them.
  const manual = entries.filter(entry => entry.raw === null && !entry.cleared);
  const manualUncleared = {
    total: manual.reduce((sum, entry) => sum + entry.amount, 0),
    count: manual.length,
  };

  const none = {
    isCard,
    bills: [],
    current: null,
    later: { total: 0, count: 0 },
    manualUncleared,
  };
  if (!isCard) {
    return none;
  }

  const onBills = entries.filter(
    entry => entry.bill !== null && !entry.isPayment,
  );
  const sum = (list: readonly { amount: number }[]) =>
    list.reduce((total, entry) => total + entry.amount, 0);

  // Oldest payment first, whatever order the query delivered them in: two
  // bills of the same figure must each take their own payment.
  const payments: Payment[] = entries
    .flatMap(entry =>
      entry.isPayment && entry.date !== null
        ? [{ amount: entry.amount, date: entry.date }]
        : [],
    )
    .sort((a, b) => a.date.localeCompare(b.date));
  const used = new Set<Payment>();
  const fits = (paid: number, figure: number) => Math.abs(paid + figure) <= 1;

  type PendingBill = {
    month: string;
    entries: typeof entries;
    figure: number;
    firstDate: string | null;
    lastDate: string | null;
  };
  const pendingBills: PendingBill[] = [
    ...new Set(onBills.map(entry => entry.bill)),
  ]
    .filter((month): month is string => month !== null)
    .sort()
    .map(month => {
      const pending = onBills.filter(
        entry => entry.bill === month && entry.pendingAtBank,
      );
      const dates = pending
        .map(entry => entry.date)
        .filter((date): date is string => date !== null)
        .sort();
      return {
        month,
        entries: pending,
        figure: sum(pending),
        firstDate: dates[0] ?? null,
        lastDate: dates.at(-1) ?? null,
      };
    })
    .filter(pendingBill => pendingBill.entries.length > 0);

  const settled = new Map<string, { state: CardBillState; taken: Payment[] }>();
  const settle = (
    pendingBill: PendingBill,
    state: CardBillState,
    taken: Payment[],
  ) => {
    taken.forEach(payment => used.add(payment));
    settled.set(pendingBill.month, { state, taken });
  };

  // 1. A payment of the bill's exact figure, dated from its first entry on,
  //    settles it — read over every bill first, so a payment goes to the bill
  //    it fits, not to the oldest one it merely follows.
  for (const pendingBill of pendingBills) {
    const first = pendingBill.firstDate;
    if (first === null) continue;
    const exact = payments.find(
      payment =>
        !used.has(payment) &&
        payment.date >= first &&
        fits(payment.amount, pendingBill.figure),
    );
    if (exact) settle(pendingBill, 'paid', [exact]);
  }

  // 2. Payments dated from the bill's last entry on, in order, while they
  //    still fit: paid when they add up to the figure, partly paid when short.
  for (const pendingBill of pendingBills) {
    const last = pendingBill.lastDate;
    if (settled.has(pendingBill.month) || last === null) continue;
    const parts: Payment[] = [];
    for (const payment of payments) {
      if (used.has(payment) || payment.date < last) continue;
      if (sum(parts) + payment.amount > -pendingBill.figure + 1) break;
      parts.push(payment);
      if (fits(sum(parts), pendingBill.figure)) break;
    }
    if (parts.length > 0) {
      settle(
        pendingBill,
        fits(sum(parts), pendingBill.figure) ? 'paid' : 'partial',
        parts,
      );
    }
  }

  // 3. What is left. A payment after the bill that fits nothing is reported,
  //    not consumed: it may belong to a bill outside the window. Without
  //    dates, no payment can be read against the bill at all.
  const paidOf = (taken: Payment[]) =>
    taken.length > 0
      ? { on: taken[taken.length - 1].date, amount: sum(taken) }
      : null;
  const bills: CardBill[] = pendingBills.map(pendingBill => {
    const base = {
      month: pendingBill.month,
      figure: pendingBill.figure,
      entryCount: pendingBill.entries.length,
    };
    const done = settled.get(pendingBill.month);
    if (done) {
      return { ...base, state: done.state, paid: paidOf(done.taken) };
    }
    const last = pendingBill.lastDate;
    if (last === null) {
      return { ...base, state: 'uncertain', paid: null };
    }
    const stray = payments.filter(
      payment => !used.has(payment) && payment.date >= last,
    );
    if (stray.length > 0) {
      return { ...base, state: 'uncertain', paid: paidOf(stray) };
    }
    const closed = onBills.some(
      entry =>
        entry.bill !== null &&
        entry.bill > pendingBill.month &&
        entry.postDate !== null &&
        entry.postDate <= today,
    );
    return { ...base, state: closed ? 'closed' : 'open', paid: null };
  });

  const current =
    bills.find(bill => bill.state !== 'paid') ?? bills.at(-1) ?? null;
  if (current === null) {
    return none;
  }
  const laterEntries = onBills.filter(
    entry =>
      entry.pendingAtBank && entry.bill !== null && entry.bill > current.month,
  );
  return {
    isCard,
    bills,
    current,
    later: { total: sum(laterEntries), count: laterEntries.length },
    manualUncleared,
  };
}
