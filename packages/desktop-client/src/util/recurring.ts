import { getApproxNumberThreshold } from '@actual-app/core/shared/rules';
import { getScheduledAmount } from '@actual-app/core/shared/schedules';
import type {
  DiscoverScheduleEntity,
  RecurConfig,
  ScheduleEntity,
} from '@actual-app/core/types/models';

import { parseProviderEntry } from '#accounts/bankData';

/**
 * Recurring charges — subscriptions, memberships, insurance, the gym — read
 * off what the file already holds: the schedules the user created, and the
 * repeating patterns Actual's own "Find schedules" detects in the
 * transactions. Nothing is created here; a detected pattern stays a pattern
 * until the user turns it into a schedule, so no expense is counted twice.
 */

export type RecurringSource = 'schedule' | 'discovered';

export type RecurringItem = {
  /** The schedule's id, or the discovered pattern's id. */
  id: string;
  source: RecurringSource;
  name: string | null;
  payeeId: string | null;
  accountId: string | null;
  /** The usual charge, in integer minor units, negative for an outflow. */
  amount: number;
  frequency: RecurConfig['frequency'];
  interval: number;
  /** What the charge comes to in a month, negative. */
  monthlyEquivalent: number;
  /** Next occurrence (`YYYY-MM-DD`), known only for schedules. */
  nextDate: string | null;
  /**
   * The amount is approximate — a schedule whose amount condition is
   * approximate or a range (a charge in another currency moves with the
   * exchange rate), or a detected pattern whose amounts varied — and is shown
   * as such rather than as an exact figure.
   */
  isApproximate: boolean;
};

export type RecurringSummary = {
  /** The schedules the user keeps: confirmed charges. */
  scheduled: RecurringItem[];
  /** Detected patterns no schedule describes yet: suggestions only. */
  discovered: RecurringItem[];
  /** Sum of the schedules' `monthlyEquivalent`, negative. */
  scheduledMonthlyTotal: number;
  /** Sum of the suggestions' `monthlyEquivalent`, negative; kept apart. */
  discoveredMonthlyTotal: number;
  /** Detected patterns left out because the bank's own record says they are something else. */
  leftOut: Record<PatternEvidence, number>;
};

/**
 * What rules a detected pattern out as a subscription, read off the bank's
 * own record of the entries behind it: a tax, interest or fee line, a purchase
 * paid in installments, or money moved between the holder's own accounts.
 * Nothing here reads the user's categories, and nothing is written.
 */
export type PatternEvidence = 'bank-charge' | 'installments' | 'own-transfer';

export type PatternEntryLike = {
  payee: string | null;
  account: string | null;
  /** Integer minor units, Actual's sign. */
  amount: number;
  imported_payee: string | null;
  raw_synced_data: string | null;
};

/** Pluggy's own categories for taxes, interest and fees charged by the bank. */
const BANK_CHARGE_CATEGORIES = new Set([
  'Tax on financial operations',
  'Interests charged',
  'Late payment and overdraft costs',
  'Credit card fees',
  'Bank fees',
]);
/** Pluggy's own categories for money moved between the holder's accounts. */
const OWN_TRANSFER_CATEGORIES = new Set([
  'Same person transfer',
  'Credit card payment',
]);
/** The words Itaú and Nubank print on a tax, interest or fee line. */
const BANK_CHARGE_WORDS = /\b(IOF|JUROS|MULTA|ENCARGOS?|TARIFA|ANUIDADE)\b/i;
/** A fee line rules a pattern out before an installment count does. */
const EVIDENCE_BY_STRENGTH: PatternEvidence[] = [
  'bank-charge',
  'installments',
  'own-transfer',
];

function entryEvidence(entry: PatternEntryLike): PatternEvidence | null {
  const raw = parseProviderEntry(entry.raw_synced_data);
  const category = typeof raw?.category === 'string' ? raw.category : null;
  const wording = [raw?.description, raw?.descriptionRaw, entry.imported_payee]
    .filter((value): value is string => typeof value === 'string')
    .join(' ');
  if (
    (category !== null && BANK_CHARGE_CATEGORIES.has(category)) ||
    BANK_CHARGE_WORDS.test(wording)
  ) {
    return 'bank-charge';
  }
  if (Number(raw?.['creditCardMetadata.totalInstallments']) > 1) {
    return 'installments';
  }
  if (category !== null && OWN_TRANSFER_CATEGORIES.has(category)) {
    return 'own-transfer';
  }
  return null;
}

/**
 * The evidence against each detected pattern, keyed by the pattern's id,
 * read from the entries of the same payee, account and (approximate) amount.
 * A pattern with none is a candidate subscription.
 */
export function patternEvidence(
  patterns: readonly DiscoverScheduleEntity[],
  entries: readonly PatternEntryLike[],
): Map<string, PatternEvidence> {
  const evidence = new Map<string, PatternEvidence>();
  for (const pattern of patterns) {
    const amount = getScheduledAmount(pattern.amount);
    const threshold = getApproxNumberThreshold(amount);
    const found = entries
      .filter(
        entry =>
          entry.payee === pattern.payee &&
          entry.account === pattern.account &&
          Math.abs(entry.amount - amount) <= threshold,
      )
      .map(entryEvidence);
    const strongest = EVIDENCE_BY_STRENGTH.find(kind => found.includes(kind));
    if (strongest) evidence.set(pattern.id, strongest);
  }
  return evidence;
}

const WEEKS_PER_MONTH = 52 / 12;
const DAYS_PER_MONTH = 365 / 12;

/** What a charge repeating under `config` comes to per month. */
export function monthlyEquivalent(amount: number, config: RecurConfig): number {
  const interval = Math.max(1, config.interval ?? 1);
  switch (config.frequency) {
    case 'daily':
      return Math.round((amount * DAYS_PER_MONTH) / interval);
    case 'weekly':
      return Math.round((amount * WEEKS_PER_MONTH) / interval);
    case 'monthly':
      return Math.round(amount / interval);
    case 'yearly':
      return Math.round(amount / (12 * interval));
    default:
      return 0;
  }
}

function isRecurConfig(date: ScheduleEntity['_date']): date is RecurConfig {
  return typeof date === 'object' && date !== null && 'frequency' in date;
}

function fromSchedule(schedule: ScheduleEntity): RecurringItem | null {
  if (schedule.completed || !isRecurConfig(schedule._date)) return null;
  const amount = getScheduledAmount(schedule._amount);
  if (amount >= 0) return null;
  return {
    id: schedule.id,
    source: 'schedule',
    name: schedule.name ?? null,
    payeeId: schedule._payee ?? null,
    accountId: schedule._account ?? null,
    amount,
    frequency: schedule._date.frequency,
    interval: Math.max(1, schedule._date.interval ?? 1),
    monthlyEquivalent: monthlyEquivalent(amount, schedule._date),
    nextDate: schedule.next_date ?? null,
    isApproximate:
      schedule._amountOp === 'isapprox' || typeof schedule._amount !== 'number',
  };
}

function fromDiscovered(
  candidate: DiscoverScheduleEntity,
): RecurringItem | null {
  const amount = getScheduledAmount(candidate.amount);
  if (amount >= 0 || !candidate.date) return null;
  return {
    id: candidate.id,
    source: 'discovered',
    name: null,
    payeeId: candidate.payee ?? null,
    accountId: candidate.account ?? null,
    amount,
    frequency: candidate.date.frequency,
    interval: Math.max(1, candidate.date.interval ?? 1),
    monthlyEquivalent: monthlyEquivalent(amount, candidate.date),
    nextDate: null,
    isApproximate:
      typeof candidate.amount !== 'number' ||
      candidate._conditions.some(
        condition =>
          condition.field === 'amount' && condition.op === 'isapprox',
      ),
  };
}

/**
 * Whether the schedule's own amount condition accepts `amount`, read the way
 * Actual reads it: exactly, within the approximate tolerance, or inside the
 * range. The single number `getScheduledAmount` gives (the range's middle)
 * would leave a charge the schedule already covers listed again.
 */
function scheduleAcceptsAmount(
  schedule: ScheduleEntity,
  amount: number,
): boolean {
  const scheduled = schedule._amount;
  if (typeof scheduled !== 'number') {
    const low = Math.min(scheduled.num1, scheduled.num2);
    const high = Math.max(scheduled.num1, scheduled.num2);
    return amount >= low && amount <= high;
  }
  if (schedule._amountOp === 'isapprox') {
    return Math.abs(amount - scheduled) <= getApproxNumberThreshold(scheduled);
  }
  return amount === scheduled;
}

/**
 * The charge a schedule and a detected pattern would both describe: same
 * payee, same account, and an amount the schedule's condition accepts.
 * Anything less (a missing payee or account, another amount) is not the same
 * charge, and stays listed.
 */
function scheduleCovers(
  schedule: ScheduleEntity,
  pattern: RecurringItem,
): boolean {
  return (
    !!pattern.payeeId &&
    !!pattern.accountId &&
    schedule._payee === pattern.payeeId &&
    schedule._account === pattern.accountId &&
    scheduleAcceptsAmount(schedule, pattern.amount)
  );
}

function byMonthlyCost(a: RecurringItem, b: RecurringItem): number {
  return a.monthlyEquivalent - b.monthlyEquivalent;
}

function sumMonthly(items: readonly RecurringItem[]): number {
  return items.reduce((sum, item) => sum + item.monthlyEquivalent, 0);
}

/**
 * Schedules, and apart from them the detected patterns no schedule already
 * describes — the same charge is never listed twice, a different one is never
 * hidden, and a suggestion is never added to the confirmed total. Each list
 * is ordered by what it costs per month, biggest first.
 */
export function recurringSummary(
  schedules: readonly ScheduleEntity[],
  discovered: readonly DiscoverScheduleEntity[],
  evidence: ReadonlyMap<string, PatternEvidence> = new Map(),
): RecurringSummary {
  const recurringSchedules = schedules.filter(
    schedule => fromSchedule(schedule) !== null,
  );
  const fromSchedules = recurringSchedules
    .map(fromSchedule)
    .filter((item): item is RecurringItem => item !== null);

  const leftOut: Record<PatternEvidence, number> = {
    'bank-charge': 0,
    installments: 0,
    'own-transfer': 0,
  };
  const fromPatterns: RecurringItem[] = [];
  for (const pattern of discovered) {
    const item = fromDiscovered(pattern);
    if (item === null) continue;
    const ruledOutBy = evidence.get(pattern.id);
    if (ruledOutBy) {
      leftOut[ruledOutBy]++;
      continue;
    }
    if (recurringSchedules.some(schedule => scheduleCovers(schedule, item))) {
      continue;
    }
    fromPatterns.push(item);
  }

  const scheduled = fromSchedules.sort(byMonthlyCost);
  const suggestions = fromPatterns.sort(byMonthlyCost);
  return {
    scheduled,
    discovered: suggestions,
    scheduledMonthlyTotal: sumMonthly(scheduled),
    discoveredMonthlyTotal: sumMonthly(suggestions),
    leftOut,
  };
}
