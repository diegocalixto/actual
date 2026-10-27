import { useResponsive } from '@actual-app/components/hooks/useResponsive';
import {
  indicatorRegisterAccount,
  indicatorRegisterConditions,
} from '@actual-app/core/shared/month-indicator-transactions';
import type { IndicatorSlice } from '@actual-app/core/shared/month-indicator-transactions';
import { UNCATEGORIZED_ID } from '@actual-app/core/shared/month-indicators';
import * as monthUtils from '@actual-app/core/shared/months';

import { useLocale } from '#hooks/useLocale';
import { useNavigate } from '#hooks/useNavigate';

/**
 * Where the phone lists a slice: the category page, told to follow the
 * indicators' rules instead of the budget's.
 *
 * `scope=indicators` makes the page read
 * `indicatorTransactionsFilter` — the indicators' accounts, no transfers, no
 * starting balance — and total the rows it lists. Without it the same address
 * stays the budget's view of the category, which counts everything filed
 * under it. `flow` says which side of "no category" is meant.
 */
export function indicatorPhonePath(month: string, slice: IndicatorSlice) {
  const params = new URLSearchParams({ month, scope: 'indicators' });

  switch (slice.kind) {
    case 'category':
      return `/categories/${slice.categoryId}?${params}`;
    case 'uncategorizedSpending':
      params.set('flow', 'outflow');
      return `/categories/uncategorized?${params}`;
    case 'pendingInflows':
      params.set('flow', 'inflow');
      return `/categories/uncategorized?${params}`;
    default:
      throw new Error(`Unknown indicator slice: ${JSON.stringify(slice)}`);
  }
}

/** The slice behind one row of a spending list: a category, or "Sem categoria". */
export function sliceForSpendingEntry(id: string): IndicatorSlice {
  return id === UNCATEGORIZED_ID
    ? { kind: 'uncategorizedSpending' }
    : { kind: 'category', categoryId: id };
}

/** Reads the phone path back. `null` when the page is the budget's own view. */
export function indicatorSliceFromParams(
  categoryId: string | undefined,
  params: URLSearchParams,
): IndicatorSlice | null {
  if (params.get('scope') !== 'indicators' || !categoryId) {
    return null;
  }
  if (categoryId !== 'uncategorized') {
    return { kind: 'category', categoryId };
  }
  return params.get('flow') === 'inflow'
    ? { kind: 'pendingInflows' }
    : { kind: 'uncategorizedSpending' };
}

/**
 * Opens the transactions behind one figure of Início or Relatórios.
 *
 * On a phone, the category page in the indicators' scope. On the desktop, the
 * register with the same selection as filter chips — editable, and named after
 * the row that opened it — on the register that already reads the right
 * accounts: every account for a category, so a closed one keeps its history,
 * and the uncategorized register for the rows without a category.
 */
export function useOpenIndicatorTransactions() {
  const navigate = useNavigate();
  const { isNarrowWidth } = useResponsive();
  const locale = useLocale();

  return (month: string, slice: IndicatorSlice, label: string) => {
    if (isNarrowWidth) {
      void navigate(indicatorPhonePath(month, slice));
      return;
    }

    void navigate(`/accounts/${indicatorRegisterAccount(slice)}`, {
      state: {
        goBack: true,
        filterName: `${label} · ${monthUtils.format(month, 'MMMM yyyy', locale)}`,
        filterConditions: indicatorRegisterConditions(month, slice),
        // New rows added from this list start in the category it shows.
        categoryId: slice.kind === 'category' ? slice.categoryId : undefined,
      },
    });
  };
}
