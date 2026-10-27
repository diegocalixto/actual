/**
 * The transactions behind one figure of Início or Relatórios.
 *
 * `month-indicators.ts` adds a month up; this file lists what one of its
 * figures is made of, so a row that says "Farmácia 300,00" opens exactly the
 * transactions that add up to 300,00 — the same accounts, the same days, the
 * same exclusions — and not the broader list a category or "Sem categoria"
 * means elsewhere in the application.
 *
 * Two shapes of the same selection, one per layout:
 *
 * - `indicatorTransactionsFilter` is an AQL filter, read with `splits:
 *   'inline'` by the phone's list, so a split is listed by its parts and its
 *   parent never adds to them — exactly how the indicator queries count.
 * - `indicatorRegisterConditions` is the same selection as the desktop
 *   register's filter conditions, applied on top of the register named by
 *   `indicatorRegisterAccount`. The register groups a split under its parent
 *   for context, dims the parts outside the filter, and totals only the parts
 *   that match (an aggregate over grouped splits runs with `is_parent = 0`), so
 *   nothing is counted twice and no other part is attributed to the slice.
 *
 * What both share with the indicators: the budget's own accounts, closed ones
 * included, since a closed account still belongs to the months it moved money
 * in; no transfer between the file's accounts, and no transfer to an account
 * outside the budget either; no starting balance. A category is listed with
 * its refunds, because the figure is net of them; "Sem categoria" in the
 * spending list is its outflows, and the inflows without a category are the
 * "entradas a revisar", listed apart.
 *
 * One edge the lists do not reach: a transaction left pointing at a category
 * the file has since deleted counts as "Sem categoria" in the indicators but
 * appears in neither list. Deleting a category with transactions asks for a
 * replacement in the application, so only a file written through the API can
 * hold one.
 */
import type { RuleConditionEntity } from '#types/models';

import { INDICATOR_SCOPE } from './month-indicators';
import * as monthUtils from './months';

export type IndicatorSlice =
  /** One expense category: its outflows and its refunds. */
  | { kind: 'category'; categoryId: string }
  /** Outflows with no category: the "Sem categoria" row of the spending list. */
  | { kind: 'uncategorizedSpending' }
  /** Inflows with no category: the "entradas a revisar". */
  | { kind: 'pendingInflows' };

/** The AQL filter of a slice in one month (`YYYY-MM`). */
export function indicatorTransactionsFilter(
  month: string,
  slice: IndicatorSlice,
) {
  const scope = {
    $and: [
      { date: { $gte: monthUtils.firstDayOfMonth(month) } },
      { date: { $lte: monthUtils.lastDayOfMonth(month) } },
    ],
    ...INDICATOR_SCOPE,
  };

  switch (slice.kind) {
    case 'category':
      return { ...scope, category: slice.categoryId };
    case 'uncategorizedSpending':
      return { ...scope, category: null, amount: { $lt: 0 } };
    case 'pendingInflows':
      return { ...scope, category: null, amount: { $gt: 0 } };
    default:
      throw new Error(`Unknown indicator slice: ${JSON.stringify(slice)}`);
  }
}

/**
 * The desktop register the conditions below are applied to.
 *
 * A category is read from every account — closed ones included, which the
 * on-budget register leaves out — and narrowed to the budget's own by a
 * condition. The uncategorized register already reads only the budget's
 * accounts, closed ones included, and only rows without a category.
 */
export function indicatorRegisterAccount(
  slice: IndicatorSlice,
): 'all' | 'uncategorized' {
  return slice.kind === 'category' ? 'all' : 'uncategorized';
}

/**
 * The same selection as `indicatorTransactionsFilter`, as filter conditions
 * the register shows as chips and the person can still edit.
 *
 * The register has no condition for an account's starting balance. None is
 * needed: the application files a starting balance under its own income
 * category, so it is never in an expense category nor without one.
 */
export function indicatorRegisterConditions(
  month: string,
  slice: IndicatorSlice,
): RuleConditionEntity[] {
  const inMonth: RuleConditionEntity = {
    field: 'date',
    op: 'is',
    value: month,
    options: { month: true },
    type: 'date',
  };
  // The uncategorized register still lists a transfer to an account outside
  // the budget, which the indicators leave out like any other transfer.
  const notTransfer: RuleConditionEntity = {
    field: 'transfer',
    op: 'is',
    value: false,
    type: 'boolean',
  };

  switch (slice.kind) {
    case 'category':
      return [
        { field: 'account', op: 'onBudget', value: '', type: 'id' },
        { field: 'category', op: 'is', value: slice.categoryId, type: 'id' },
        inMonth,
        notTransfer,
      ];
    case 'uncategorizedSpending':
      return [
        inMonth,
        notTransfer,
        { field: 'amount', op: 'lt', value: 0, type: 'number' },
      ];
    case 'pendingInflows':
      return [
        inMonth,
        notTransfer,
        { field: 'amount', op: 'gt', value: 0, type: 'number' },
      ];
    default:
      throw new Error(`Unknown indicator slice: ${JSON.stringify(slice)}`);
  }
}
