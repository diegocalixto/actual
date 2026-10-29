import { describe, expect, it } from 'vitest';

import {
  cardInsights,
  parseSyncTimestamp,
  STALE_AFTER_MS,
  syncFreshness,
} from './bankData';
import type { LinkedAccountLike, SyncedTransactionLike } from './bankData';

const HOUR = 60 * 60 * 1000;
const NOW = Date.parse('2026-10-26T12:00:00Z');

function account(
  overrides: Partial<LinkedAccountLike> & { id: string },
): LinkedAccountLike {
  return {
    name: overrides.id,
    closed: 0,
    account_sync_source: 'pluggyai',
    last_sync: null,
    bank_sync_status: null,
    ...overrides,
  };
}

describe('parseSyncTimestamp', () => {
  it('reads the epoch milliseconds the sync stores as a string', () => {
    expect(parseSyncTimestamp(String(NOW))).toBe(NOW);
    expect(parseSyncTimestamp(NOW)).toBe(NOW);
  });

  it('is null for nothing and for text that is not a number', () => {
    expect(parseSyncTimestamp(null)).toBeNull();
    expect(parseSyncTimestamp('')).toBeNull();
    expect(parseSyncTimestamp('ontem')).toBeNull();
    expect(parseSyncTimestamp(`${NOW}abc`)).toBeNull();
    expect(parseSyncTimestamp('-5')).toBeNull();
  });
});

describe('syncFreshness', () => {
  it('reports only open linked accounts, newest and oldest reads', () => {
    const fresh = account({ id: 'cc', last_sync: String(NOW - 2 * HOUR) });
    const older = account({ id: 'card', last_sync: String(NOW - 30 * HOUR) });
    const manual = account({ id: 'cash', account_sync_source: null });
    const closed = account({ id: 'old', closed: 1, last_sync: String(NOW) });

    const result = syncFreshness([fresh, older, manual, closed], NOW);

    expect(result.linked.map(a => a.id)).toEqual(['cc', 'card']);
    expect(result.latestSync).toBe(NOW - 2 * HOUR);
    expect(result.oldestSync).toBe(NOW - 30 * HOUR);
    expect(result.stale).toEqual([]);
    expect(result.failed).toEqual([]);
    expect(result.neverSynced).toEqual([]);
  });

  it('flags stale, failed and never-synced accounts', () => {
    const stale = account({
      id: 'stale',
      last_sync: String(NOW - STALE_AFTER_MS - HOUR),
    });
    const failed = account({
      id: 'failed',
      last_sync: String(NOW - HOUR),
      bank_sync_status: 'reauth-required',
    });
    const pending = account({
      id: 'pending',
      last_sync: String(NOW - HOUR),
      bank_sync_status: 'pending',
    });
    const never = account({ id: 'never' });

    const result = syncFreshness([stale, failed, pending, never], NOW);

    expect(result.stale.map(a => a.id)).toEqual(['stale']);
    expect(result.failed.map(a => a.id)).toEqual(['failed']);
    expect(result.neverSynced.map(a => a.id)).toEqual(['never']);
  });

  it('has no times when nothing is linked', () => {
    const result = syncFreshness(
      [account({ id: 'cash', account_sync_source: null })],
      NOW,
    );
    expect(result.linked).toEqual([]);
    expect(result.latestSync).toBeNull();
    expect(result.oldestSync).toBeNull();
  });
});

function raw(fields: Record<string, unknown>): string {
  return JSON.stringify({
    transactionId: 'x',
    'transactionAmount.amount': -1,
    ...fields,
  });
}
type CardEntryOptions = {
  bill: string | null;
  /** The bank still lists the entry as pending (`booked: false`). */
  pending?: boolean;
  cleared?: boolean;
  /** A bill payment, as the bank marks it. */
  payment?: boolean;
  date?: string;
  /** `creditCardMetadata.billPostDate`: when the bank posted it to the bill. */
  postDate?: string;
};

function cardEntry(
  id: string,
  amount: number,
  {
    bill,
    pending = false,
    cleared = !pending,
    payment = false,
    date,
    postDate,
  }: CardEntryOptions,
): SyncedTransactionLike {
  return {
    id,
    amount,
    cleared,
    raw_synced_data: raw({
      booked: !pending,
      'creditCardMetadata.cardNumber': '7937',
      ...(bill ? { 'creditCardMetadata.billForecastDate': bill } : {}),
      ...(payment ? { operationType: 'PAGAMENTO_FATURA' } : {}),
      ...(date ? { date } : {}),
      ...(postDate ? { 'creditCardMetadata.billPostDate': postDate } : {}),
    }),
  };
}

const TODAY = '2026-10-26';

describe('cardInsights', () => {
  it('is not a card when no entry carries card data', () => {
    const result = cardInsights(
      [
        {
          id: 'a',
          amount: -1500,
          cleared: true,
          raw_synced_data: raw({ operationType: 'PIX' }),
        },
        { id: 'b', amount: -2000, cleared: false, raw_synced_data: null },
      ],
      TODAY,
    );
    expect(result.isCard).toBe(false);
    expect(result.current).toBeNull();
    expect(result.bills).toEqual([]);
    expect(result.manualUncleared).toEqual({ total: -2000, count: 1 });
  });

  it('reads a closed bill awaiting payment and the open one after it', () => {
    // As Nubank delivers it on 26/10: October settled; November closed on the
    // 26th and unpaid, with the previous payment filed under it; December
    // already receiving posts.
    const result = cardInsights(
      [
        cardEntry('oct', -80208, { bill: '2026-10' }),
        cardEntry('nov-fee', -1865, { bill: '2026-11' }),
        cardEntry('nov-1', -6588, {
          bill: '2026-11',
          pending: true,
          date: '2026-09-24',
          postDate: '2026-09-25',
        }),
        cardEntry('nov-2', -67415, {
          bill: '2026-11',
          pending: true,
          date: '2026-10-22',
          postDate: '2026-10-22',
        }),
        cardEntry('nov-refund', 1990, {
          bill: '2026-11',
          pending: true,
          date: '2026-10-20',
          postDate: '2026-10-21',
        }),
        cardEntry('pay-oct', 147593, {
          bill: '2026-11',
          pending: true,
          payment: true,
          date: '2026-10-01',
          postDate: '2026-10-01',
        }),
        cardEntry('dec-1', -5572, {
          bill: '2026-12',
          pending: true,
          date: '2026-10-26',
          postDate: '2026-10-26',
        }),
      ],
      TODAY,
    );
    expect(result.isCard).toBe(true);
    expect(result.current).toEqual({
      month: '2026-11',
      state: 'closed',
      figure: -6588 - 67415 + 1990,
      entryCount: 3,
      paid: null,
    });
    expect(result.bills.map(bill => [bill.month, bill.state])).toEqual([
      ['2026-11', 'closed'],
      ['2026-12', 'open'],
    ]);
    expect(result.later).toEqual({ total: -5572, count: 1 });
    expect(result.manualUncleared).toEqual({ total: 0, count: 0 });
  });

  it('keeps a bill open while the bank has not started posting to the next one', () => {
    // As Itaú delivers it on 26/10: October settled and paid (the payment
    // carries no bill), November all pending — part of it cleared by the
    // imported history — and one installment filed ahead, to be posted on
    // the 30th.
    const result = cardInsights(
      [
        cardEntry('oct', -404420, { bill: '2026-10' }),
        cardEntry('pay-oct', 404420, {
          bill: null,
          payment: true,
          date: '2026-10-01',
        }),
        cardEntry('nov-imported', -186193, {
          bill: '2026-11',
          pending: true,
          cleared: true,
          date: '2026-10-02',
          postDate: '2026-10-03',
        }),
        cardEntry('nov-new', -95616, {
          bill: '2026-11',
          pending: true,
          date: '2026-10-23',
          postDate: '2026-10-24',
        }),
        cardEntry('nov-refund', 5650, {
          bill: '2026-11',
          pending: true,
          date: '2026-10-22',
          postDate: '2026-10-22',
        }),
        cardEntry('dec-installment', -58648, {
          bill: '2026-12',
          pending: true,
          date: '2026-11-03',
          postDate: '2026-10-30',
        }),
      ],
      TODAY,
    );
    expect(result.current).toEqual({
      month: '2026-11',
      state: 'open',
      figure: -186193 - 95616 + 5650,
      entryCount: 3,
      paid: null,
    });
    expect(result.later).toEqual({ total: -58648, count: 1 });
  });

  it('reads a bill as paid by a payment of its exact figure, and moves on to the next', () => {
    // Nubank after 3 November: the November bill paid in full; the payment is
    // filed under December, and the November entries keep the record the
    // sync stored first, still pending.
    const result = cardInsights(
      [
        cardEntry('nov-1', -6588, {
          bill: '2026-11',
          pending: true,
          cleared: true,
          date: '2026-09-24',
        }),
        cardEntry('nov-2', -67415, {
          bill: '2026-11',
          pending: true,
          cleared: true,
          date: '2026-10-22',
        }),
        cardEntry('pay-nov', 74003, {
          bill: '2026-12',
          pending: true,
          payment: true,
          date: '2026-11-03',
        }),
        cardEntry('dec-1', -5572, {
          bill: '2026-12',
          pending: true,
          date: '2026-10-26',
        }),
      ],
      '2026-11-05',
    );
    expect(result.bills[0]).toEqual({
      month: '2026-11',
      state: 'paid',
      figure: -74003,
      entryCount: 2,
      paid: { on: '2026-11-03', amount: 74003 },
    });
    expect(result.current).toEqual({
      month: '2026-12',
      state: 'open',
      figure: -5572,
      entryCount: 1,
      paid: null,
    });
    expect(result.later).toEqual({ total: 0, count: 0 });
  });

  it('shows the latest paid bill when every bill is paid', () => {
    const result = cardInsights(
      [
        cardEntry('nov', -1000, {
          bill: '2026-11',
          pending: true,
          date: '2026-10-20',
        }),
        cardEntry('pay', 1000, {
          bill: null,
          payment: true,
          date: '2026-11-06',
        }),
      ],
      '2026-11-10',
    );
    expect(result.current).toMatchObject({ month: '2026-11', state: 'paid' });
  });

  it('reads payments in parts after the last entry: paid when they add up, partly paid when short', () => {
    const nov = [
      cardEntry('a', -1000, {
        bill: '2026-11',
        pending: true,
        date: '2026-10-20',
      }),
      cardEntry('b', -500, {
        bill: '2026-11',
        pending: true,
        date: '2026-10-22',
      }),
    ];
    const paidInParts = cardInsights(
      [
        ...nov,
        cardEntry('p1', 1000, {
          bill: null,
          payment: true,
          date: '2026-11-03',
        }),
        cardEntry('p2', 500, { bill: null, payment: true, date: '2026-11-04' }),
      ],
      '2026-11-05',
    );
    expect(paidInParts.current).toMatchObject({
      state: 'paid',
      paid: { on: '2026-11-04', amount: 1500 },
    });

    const partly = cardInsights(
      [
        ...nov,
        cardEntry('p1', 500, { bill: null, payment: true, date: '2026-11-03' }),
      ],
      '2026-11-05',
    );
    expect(partly.current).toEqual({
      month: '2026-11',
      state: 'partial',
      figure: -1500,
      entryCount: 2,
      paid: { on: '2026-11-03', amount: 500 },
    });
  });

  it('says it cannot tell when a payment after the bill fits nothing', () => {
    const result = cardInsights(
      [
        cardEntry('a', -1000, {
          bill: '2026-11',
          pending: true,
          date: '2026-10-20',
        }),
        cardEntry('p1', 2000, {
          bill: null,
          payment: true,
          date: '2026-11-03',
        }),
      ],
      '2026-11-05',
    );
    expect(result.current).toEqual({
      month: '2026-11',
      state: 'uncertain',
      figure: -1000,
      entryCount: 1,
      paid: { on: '2026-11-03', amount: 2000 },
    });
  });

  it('keeps a bill unpaid while no payment is seen, whatever the marks say, and ignores earlier payments', () => {
    // Imported history comes cleared, and a mark can be set by hand: neither
    // says the bank was paid. A payment dated before the entries of the bill
    // is not read as paying it either.
    const result = cardInsights(
      [
        cardEntry('a', -1000, {
          bill: '2026-11',
          pending: true,
          cleared: true,
          date: '2026-10-02',
        }),
        cardEntry('b', -500, {
          bill: '2026-11',
          pending: true,
          cleared: true,
          date: '2026-10-09',
        }),
        cardEntry('earlier', 1500, {
          bill: null,
          payment: true,
          date: '2026-10-01',
        }),
      ],
      TODAY,
    );
    expect(result.current).toEqual({
      month: '2026-11',
      state: 'open',
      figure: -1500,
      entryCount: 2,
      paid: null,
    });
  });

  it('settles bills oldest first, one payment each, whatever order the entries come in', () => {
    const nov = cardEntry('nov', -1000, {
      bill: '2026-11',
      pending: true,
      date: '2026-10-20',
    });
    const dec = cardEntry('dec', -1000, {
      bill: '2026-12',
      pending: true,
      date: '2026-11-20',
    });
    const payNov = cardEntry('pay-nov', 1000, {
      bill: null,
      payment: true,
      date: '2026-11-06',
    });
    const payDec = cardEntry('pay-dec', 1000, {
      bill: null,
      payment: true,
      date: '2026-12-06',
    });
    const states = (list: SyncedTransactionLike[]) =>
      cardInsights(list, '2026-12-10').bills.map(bill => bill.state);
    expect(states([nov, dec, payNov, payDec])).toEqual(['paid', 'paid']);
    expect(states([payDec, dec, payNov, nov])).toEqual(['paid', 'paid']);
    // One payment late enough for either bill goes to the older one.
    expect(states([nov, dec, payDec])).toEqual(['paid', 'open']);
  });

  it('gives a payment to the bill it fits, not to the older one it merely follows', () => {
    // A big payment after November that fits nothing there, but settles
    // December exactly: December is paid, November stays as it was.
    const result = cardInsights(
      [
        cardEntry('nov', -1000, {
          bill: '2026-11',
          pending: true,
          date: '2026-10-20',
        }),
        cardEntry('dec', -2000, {
          bill: '2026-12',
          pending: true,
          date: '2026-11-20',
        }),
        cardEntry('pay-dec', 2000, {
          bill: null,
          payment: true,
          date: '2026-12-06',
        }),
      ],
      '2026-12-10',
    );
    expect(result.bills.map(bill => [bill.month, bill.state])).toEqual([
      ['2026-11', 'open'],
      ['2026-12', 'paid'],
    ]);
  });

  it('reads nothing against a bill whose entries carry no date', () => {
    const result = cardInsights(
      [
        cardEntry('nov', -1000, { bill: '2026-11', pending: true }),
        cardEntry('pay', 1000, {
          bill: null,
          payment: true,
          date: '2026-11-06',
        }),
      ],
      '2026-11-10',
    );
    expect(result.current).toEqual({
      month: '2026-11',
      state: 'uncertain',
      figure: -1000,
      entryCount: 1,
      paid: null,
    });
  });

  it('counts entries typed by hand that are not cleared', () => {
    const result = cardInsights(
      [
        cardEntry('p1', -1000, { bill: '2026-11' }),
        { id: 'hand', amount: -2500, cleared: false, raw_synced_data: null },
        { id: 'hand-ok', amount: -900, cleared: true, raw_synced_data: null },
      ],
      TODAY,
    );
    expect(result.manualUncleared).toEqual({ total: -2500, count: 1 });
  });

  it('has no bill when every entry is billed', () => {
    const result = cardInsights(
      [
        cardEntry('a', -1000, { bill: '2026-10' }),
        cardEntry('b', -2000, { bill: '2026-11' }),
      ],
      TODAY,
    );
    expect(result.isCard).toBe(true);
    expect(result.current).toBeNull();
    expect(result.later).toEqual({ total: 0, count: 0 });
  });

  it('ignores unreadable raw data', () => {
    const result = cardInsights(
      [{ id: 'bad', amount: -1, cleared: true, raw_synced_data: '{not json' }],
      TODAY,
    );
    expect(result.isCard).toBe(false);
  });
});
