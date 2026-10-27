import type {
  DiscoverScheduleEntity,
  ScheduleEntity,
} from '@actual-app/core/types/models';
import { describe, expect, it } from 'vitest';

import {
  monthlyEquivalent,
  patternEvidence,
  recurringSummary,
} from './recurring';
import type { PatternEntryLike, PatternEvidence } from './recurring';

function schedule(
  overrides: Partial<ScheduleEntity> & { id: string },
): ScheduleEntity {
  return {
    rule: 'rule',
    next_date: '2026-11-05',
    completed: false,
    posts_transaction: false,
    tombstone: false,
    _payee: 'payee-a',
    _account: 'acct-1',
    _amount: -4990,
    _amountOp: 'is',
    _date: { frequency: 'monthly', start: '2026-01-05' },
    _conditions: [],
    _actions: [],
    ...overrides,
  };
}

function discovered(
  overrides: Partial<DiscoverScheduleEntity> & { id: string },
): DiscoverScheduleEntity {
  return {
    account: 'acct-1',
    payee: 'payee-b',
    date: { frequency: 'monthly', start: '2026-02-10' },
    amount: -1990,
    _conditions: [],
    ...overrides,
  };
}

describe('monthlyEquivalent', () => {
  it('converts each frequency to a month', () => {
    expect(
      monthlyEquivalent(-1200, { frequency: 'monthly', start: '2026-01-01' }),
    ).toBe(-1200);
    expect(
      monthlyEquivalent(-1200, { frequency: 'yearly', start: '2026-01-01' }),
    ).toBe(-100);
    expect(
      monthlyEquivalent(-1200, {
        frequency: 'monthly',
        interval: 3,
        start: '2026-01-01',
      }),
    ).toBe(-400);
    expect(
      monthlyEquivalent(-1000, { frequency: 'weekly', start: '2026-01-01' }),
    ).toBe(-4333);
    expect(
      monthlyEquivalent(-100, { frequency: 'daily', start: '2026-01-01' }),
    ).toBe(-3042);
  });
});

describe('recurringSummary', () => {
  it('keeps schedules and detected patterns apart, biggest monthly cost first', () => {
    const result = recurringSummary(
      [schedule({ id: 's1', name: 'Academia' })],
      [
        discovered({ id: 'd1' }),
        discovered({ id: 'd2', amount: -9900, payee: 'payee-c' }),
      ],
    );
    expect(result.scheduled.map(item => item.id)).toEqual(['s1']);
    expect(result.discovered.map(item => item.id)).toEqual(['d2', 'd1']);
    // A suggestion never enters the confirmed total.
    expect(result.scheduledMonthlyTotal).toBe(-4990);
    expect(result.discoveredMonthlyTotal).toBe(-9900 - 1990);
    expect(result.scheduled[0]).toMatchObject({
      source: 'schedule',
      name: 'Academia',
      nextDate: '2026-11-05',
      frequency: 'monthly',
    });
  });

  it('does not list a detected pattern a schedule already describes', () => {
    const result = recurringSummary(
      [
        schedule({
          id: 's1',
          _payee: 'payee-b',
          _account: 'acct-1',
          _amount: -1990,
        }),
      ],
      [
        discovered({ id: 'd1', payee: 'payee-b', account: 'acct-1' }),
        // Same payee and account, another amount: a different charge.
        discovered({
          id: 'd2',
          payee: 'payee-b',
          account: 'acct-1',
          amount: -4990,
        }),
        // Incomplete identity never counts as covered.
        discovered({ id: 'd3', payee: '', account: '', amount: -1990 }),
      ],
    );
    expect(result.scheduled.map(item => item.id)).toEqual(['s1']);
    expect(result.discovered.map(item => item.id)).toEqual(['d2', 'd3']);
  });

  it("reads the schedule's own amount condition when matching a pattern", () => {
    const result = recurringSummary(
      [
        schedule({
          id: 'range',
          _payee: 'payee-r',
          _account: 'acct-1',
          _amount: { num1: -1000, num2: -2000 },
          _amountOp: 'isbetween',
        }),
        schedule({
          id: 'approx',
          _payee: 'payee-a',
          _account: 'acct-1',
          _amount: -10000,
          _amountOp: 'isapprox',
        }),
      ],
      [
        // Inside the range, though not its middle: the same charge.
        discovered({
          id: 'in-range',
          payee: 'payee-r',
          account: 'acct-1',
          amount: -1100,
        }),
        // Outside the range: another charge.
        discovered({
          id: 'off-range',
          payee: 'payee-r',
          account: 'acct-1',
          amount: -2500,
        }),
        // Within 7.5% of the approximate amount: the same charge.
        discovered({
          id: 'near',
          payee: 'payee-a',
          account: 'acct-1',
          amount: -10700,
        }),
        // Beyond the tolerance: another charge.
        discovered({
          id: 'far',
          payee: 'payee-a',
          account: 'acct-1',
          amount: -10800,
        }),
      ],
    );
    expect(result.scheduled.map(item => item.id).sort()).toEqual([
      'approx',
      'range',
    ]);
    expect(result.discovered.map(item => item.id).sort()).toEqual([
      'far',
      'off-range',
    ]);
  });

  it('leaves out income, one-off and completed schedules', () => {
    const result = recurringSummary(
      [
        schedule({ id: 'income', _amount: 500000 }),
        schedule({ id: 'once', _date: '2026-12-01' }),
        schedule({ id: 'done', completed: true }),
      ],
      [discovered({ id: 'refund', amount: 2500 })],
    );
    expect(result.scheduled).toEqual([]);
    expect(result.discovered).toEqual([]);
    expect(result.scheduledMonthlyTotal).toBe(0);
    expect(result.discoveredMonthlyTotal).toBe(0);
  });

  it('reads an approximate or ranged schedule amount', () => {
    const result = recurringSummary(
      [
        schedule({
          id: 'range',
          _amount: { num1: -1000, num2: -2000 },
          _amountOp: 'isbetween',
        }),
      ],
      [],
    );
    expect(result.scheduled[0].amount).toBe(-1500);
  });
});

describe('patternEvidence', () => {
  function entry(
    overrides: Partial<PatternEntryLike> & {
      raw?: Record<string, unknown> | null;
    } = {},
  ): PatternEntryLike {
    const { raw = {}, ...rest } = overrides;
    return {
      payee: 'payee-b',
      account: 'acct-1',
      amount: -1990,
      imported_payee: null,
      raw_synced_data: raw === null ? null : JSON.stringify(raw),
      ...rest,
    };
  }

  it('reads a tax, fee or interest line off the bank category or wording', () => {
    const evidence = patternEvidence(
      [
        discovered({ id: 'iof' }),
        discovered({ id: 'fee', payee: 'payee-f' }),
        discovered({ id: 'sub', payee: 'payee-s' }),
      ],
      [
        entry({ raw: { category: 'Tax on financial operations' } }),
        entry({
          payee: 'payee-f',
          raw: { description: 'ANUIDADE DIFERENCIADA 03/12' },
        }),
        entry({ payee: 'payee-s', raw: { category: 'Digital services' } }),
      ],
    );
    expect(evidence.get('iof')).toBe('bank-charge');
    expect(evidence.get('fee')).toBe('bank-charge');
    expect(evidence.has('sub')).toBe(false);
  });

  it('reads an installment plan off the card record, for that amount only', () => {
    const evidence = patternEvidence(
      [discovered({ id: 'plan' }), discovered({ id: 'other', amount: -4990 })],
      [
        entry({
          raw: {
            'creditCardMetadata.totalInstallments': 12,
            'creditCardMetadata.installmentNumber': 3,
          },
        }),
        // Same payee, another amount: says nothing about the other pattern.
        entry({ amount: -4990, raw: { category: 'Digital services' } }),
      ],
    );
    expect(evidence.get('plan')).toBe('installments');
    expect(evidence.has('other')).toBe(false);
  });

  it('reads money moved between own accounts off the bank category', () => {
    const evidence = patternEvidence(
      [discovered({ id: 'own' })],
      [entry({ raw: { category: 'Same person transfer' } })],
    );
    expect(evidence.get('own')).toBe('own-transfer');
  });

  it('says nothing about entries typed by hand', () => {
    const evidence = patternEvidence(
      [discovered({ id: 'hand' })],
      [entry({ raw: null })],
    );
    expect(evidence.size).toBe(0);
  });
});

describe('recurringSummary with evidence', () => {
  it('leaves out the patterns the bank record rules out, and counts them', () => {
    const evidence = new Map<string, PatternEvidence>([
      ['iof', 'bank-charge'],
      ['plan', 'installments'],
    ]);
    const result = recurringSummary(
      [],
      [
        discovered({ id: 'iof' }),
        discovered({ id: 'plan', payee: 'payee-p' }),
        discovered({ id: 'sub', payee: 'payee-s' }),
      ],
      evidence,
    );
    expect(result.discovered.map(item => item.id)).toEqual(['sub']);
    expect(result.discoveredMonthlyTotal).toBe(-1990);
    expect(result.leftOut).toEqual({
      'bank-charge': 1,
      installments: 1,
      'own-transfer': 0,
    });
  });
});

describe('approximate amounts', () => {
  it('marks a schedule by its amount condition, and a pattern whose amounts varied', () => {
    const result = recurringSummary(
      [
        schedule({ id: 'exact' }),
        schedule({ id: 'approx', _amountOp: 'isapprox', _payee: 'payee-x' }),
        schedule({
          id: 'range',
          _amount: { num1: -5000, num2: -6000 },
          _amountOp: 'isbetween',
          _payee: 'payee-y',
        }),
      ],
      [
        discovered({ id: 'fixed' }),
        discovered({
          id: 'varied',
          payee: 'payee-v',
          amount: { num1: -1900, num2: -2100 },
        }),
      ],
    );
    const byId = Object.fromEntries(
      [...result.scheduled, ...result.discovered].map(item => [
        item.id,
        item.isApproximate,
      ]),
    );
    expect(byId).toEqual({
      exact: false,
      approx: true,
      range: true,
      fixed: false,
      varied: true,
    });
  });
});
