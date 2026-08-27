import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import * as monthUtils from '@actual-app/core/shared/months';
import type { AccountEntity } from '@actual-app/core/types/models';

import { useHomeCategorySpending } from '#components/home/useHomeCategorySpending';
import { useHomeMonth } from '#components/home/useHomeMonth';
import { useHomeSheetCell } from '#components/home/useHomeSheetCell';
import { getPrettyPayee } from '#components/mobile/utils';
import { iconForAccount, iconForCategory } from '#components/v2lab/LabStyle';
import { useAccounts } from '#hooks/useAccounts';
import { useCategoriesById } from '#hooks/useCategories';
import { useLocale } from '#hooks/useLocale';
import { useOffBudgetAccounts } from '#hooks/useOffBudgetAccounts';
import { useOnBudgetAccounts } from '#hooks/useOnBudgetAccounts';
import { usePayeesById } from '#hooks/usePayees';
import { useSheetValue } from '#hooks/useSheetValue';
import { useSpreadsheet } from '#hooks/useSpreadsheet';
import { useTransactions } from '#hooks/useTransactions';
import * as queries from '#queries';
import * as bindings from '#spreadsheet/bindings';
import { envelopeBudget, trackingBudget } from '#spreadsheet/bindings';

import { hueForId } from './overviewPresentation';
import type {
  OverviewAccount,
  OverviewCategory,
  OverviewData,
  OverviewMovement,
} from './overviewViewModel';

const RECENT_TRANSACTION_COUNT = 5;
const GLOBAL_SHEET = '__global';

/**
 * Everything the real Overview shows, read from the application's own sources.
 *
 * No figure here is recomputed: each one is the cell or query the published
 * Home already uses for the same indicator, so this route and that one can
 * never disagree. The adapter's whole job is shape — turning entities and cells
 * into the props the approved components take — and it deliberately keeps
 * `null` distinct from `0` all the way through, because "still loading" and
 * "genuinely nothing" are different things to draw.
 */
export function useRealOverviewData(): OverviewData {
  const { t } = useTranslation();
  const locale = useLocale();
  const { sheetName, month, budgetType } = useHomeMonth();
  const isTracking = budgetType === 'tracking';

  // --- Hero -----------------------------------------------------------------
  // The published card reads on-budget balances and labels itself "Sum of
  // on-budget accounts"; the approved hero carries that same subtitle, so this
  // is the same indicator, not a same-sounding one.
  const available = useSheetValue<'account', 'onbudget-accounts-balance'>(
    bindings.onBudgetAccountBalance(),
  );
  // Tracking budgets have no "to budget" cell; the read is skipped there.
  const toBudget = useHomeSheetCell(
    sheetName,
    isTracking ? null : envelopeBudget.toBudget,
  );

  // --- This month -----------------------------------------------------------
  const totalIncome = useHomeSheetCell(
    sheetName,
    isTracking ? trackingBudget.totalIncome : envelopeBudget.totalIncome,
  );
  const totalSpent = useHomeSheetCell(
    sheetName,
    isTracking ? trackingBudget.totalSpent : envelopeBudget.totalSpent,
  );

  const monthTotals = useMemo(() => {
    if (totalIncome === null || totalSpent === null) {
      return null;
    }

    return {
      income: totalIncome,
      spent: totalSpent,
      // `totalSpent` is already negative, so the month's result is a sum.
      net: totalIncome + totalSpent,
      label: monthUtils.format(month, "MMMM ''yy", locale),
    };
  }, [totalIncome, totalSpent, month, locale]);

  // --- Accounts -------------------------------------------------------------
  const { data: onBudgetAccounts = [], isLoading: isOnBudgetLoading } =
    useOnBudgetAccounts();
  const { data: offBudgetAccounts = [], isLoading: isOffBudgetLoading } =
    useOffBudgetAccounts();

  const accountEntities = useMemo(
    () => [...onBudgetAccounts, ...offBudgetAccounts],
    [onBudgetAccounts, offBudgetAccounts],
  );

  const balancesByAccount = useAccountBalances(accountEntities);

  const accounts = useMemo(
    () =>
      accountEntities.map(account =>
        toOverviewAccount(account, balancesByAccount[account.id] ?? 0, t),
      ),
    [accountEntities, balancesByAccount, t],
  );

  // --- Spending -------------------------------------------------------------
  const { categories: spendingCategories, isLoading: isSpendingLoading } =
    useHomeCategorySpending({ sheetName, budgetType, limit: 6 });

  const categories: OverviewCategory[] = useMemo(
    () =>
      spendingCategories.map(entry => ({
        id: entry.category.id,
        name: entry.category.name,
        Icon: iconForCategory(entry.category.name),
        hue: hueForId(entry.category.id),
        amount: entry.amount,
      })),
    [spendingCategories],
  );

  // --- Recent activity ------------------------------------------------------
  const transactionQuery = useMemo(
    () => queries.transactions().options({ splits: 'none' }).select('*'),
    [],
  );
  const { transactions, isLoading: isActivityLoading } = useTransactions({
    query: transactionQuery,
    options: { pageSize: RECENT_TRANSACTION_COUNT },
  });

  const { data: payeesById } = usePayeesById();
  const { data: allAccounts = [] } = useAccounts();
  const { data: categoriesById } = useCategoriesById();

  const movements: OverviewMovement[] = useMemo(
    () =>
      transactions
        .filter(transaction => !transaction.is_child)
        .slice(0, RECENT_TRANSACTION_COUNT)
        .map(transaction => {
          const payee = transaction.payee
            ? payeesById?.[transaction.payee]
            : undefined;
          const transferAccount = allAccounts.find(
            account => account.id === payee?.transfer_acct,
          );

          return {
            id: transaction.id,
            name:
              getPrettyPayee({ t, transaction, payee, transferAccount }) ||
              t('(No payee)'),
            when: monthUtils.format(transaction.date, 'd MMM', locale),
            Icon: iconForCategory(
              (transaction.category
                ? categoriesById?.list[transaction.category]?.name
                : undefined) ?? '',
            ),
            // Same hue the spending panel gives this category, so a row and a
            // bar for the same category are visibly the same thing.
            hue: hueForId(transaction.category ?? transaction.account ?? ''),
            amount: transaction.amount ?? 0,
          };
        }),
    [transactions, payeesById, allAccounts, categoriesById, locale, t],
  );

  return {
    balances: { available, toBudget },
    monthTotals,
    accounts,
    categories,
    movements,
    isAccountsLoading: isOnBudgetLoading || isOffBudgetLoading,
    isMonthLoading: totalIncome === null || totalSpent === null,
    isSpendingLoading,
    isActivityLoading,
  };
}

/**
 * One balance binding per account, exactly as the published Accounts section
 * does it. Subscriptions only — nothing here writes.
 */
function useAccountBalances(
  accounts: AccountEntity[],
): Record<AccountEntity['id'], number> {
  const spreadsheet = useSpreadsheet();
  const [balances, setBalances] = useState<Record<AccountEntity['id'], number>>(
    {},
  );

  const accountIds = useMemo(
    () => accounts.map(account => account.id).join(','),
    [accounts],
  );

  useEffect(() => {
    const ids = accountIds === '' ? [] : accountIds.split(',');

    // Account balances live on the spreadsheet's global sheet, the same one
    // `useSheetValue` falls back to when no `SheetNameProvider` is in scope.
    const unbinds = ids.map(id =>
      spreadsheet.bind(GLOBAL_SHEET, bindings.accountBalance(id), result => {
        const value = typeof result.value === 'number' ? result.value : 0;
        setBalances(previous =>
          previous[id] === value ? previous : { ...previous, [id]: value },
        );
      }),
    );

    return () => unbinds.forEach(unbind => unbind());
  }, [accountIds, spreadsheet]);

  return balances;
}

/**
 * Secondary context for an account row.
 *
 * Only what the record actually holds: the sync-provided bank name, or the
 * masked tail of the account number. Neither is inferred, and when neither
 * exists the row states which side of the budget the account is on rather than
 * guessing at a kind of account the model never stores.
 */
function toOverviewAccount(
  account: AccountEntity,
  balance: number,
  t: (key: string) => string,
): OverviewAccount {
  const detail =
    account.bankName ||
    (account.mask ? `•••• ${account.mask}` : null) ||
    (account.offbudget ? t('Off budget') : t('On budget'));

  return {
    id: account.id,
    name: account.name,
    detail,
    balance,
    // Chosen from the name, and only as presentation: the model carries no
    // icon, and an unrecognised name falls back to a plain account glyph.
    Icon: iconForAccount(account.name),
    hue: hueForId(account.id),
  };
}
