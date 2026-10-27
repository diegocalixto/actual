import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import * as monthUtils from '@actual-app/core/shared/months';
import type { AccountEntity } from '@actual-app/core/types/models';

import { useHomeCategorySpending } from '#components/home/useHomeCategorySpending';
import { useHomeMonth } from '#components/home/useHomeMonth';
import { useMonthTotals } from '#components/home/v2/useMonthTotals';
import { getPrettyPayee } from '#components/mobile/utils';
import { hueForCategory } from '#components/v2lab/categoryHue';
import { iconForAccount, iconForCategory } from '#components/v2lab/LabStyle';
import { useAccountBalances } from '#hooks/useAccountBalances';
import { useAccounts } from '#hooks/useAccounts';
import { useCardInsightsByAccount } from '#hooks/useBankData';
import { useCategoriesById } from '#hooks/useCategories';
import { useLocale } from '#hooks/useLocale';
import { useOffBudgetAccounts } from '#hooks/useOffBudgetAccounts';
import { useOnBudgetAccounts } from '#hooks/useOnBudgetAccounts';
import { usePayeesById } from '#hooks/usePayees';
import { useSheetValue } from '#hooks/useSheetValue';
import { useTransactions } from '#hooks/useTransactions';
import * as queries from '#queries';
import * as bindings from '#spreadsheet/bindings';

import { hueForId } from './overviewPresentation';
import type {
  OverviewAccount,
  OverviewCategory,
  OverviewData,
  OverviewMovement,
} from './overviewViewModel';

const RECENT_TRANSACTION_COUNT = 5;

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
  const { month } = useHomeMonth();

  // --- Hero -----------------------------------------------------------------
  // The published card reads on-budget balances and labels itself "Sum of
  // on-budget accounts"; the approved hero carries that same subtitle, so this
  // is the same indicator, not a same-sounding one.
  const available = useSheetValue<'account', 'onbudget-accounts-balance'>(
    bindings.onBudgetAccountBalance(),
  );

  // --- This month -----------------------------------------------------------
  // Read under the rules in `@actual-app/core/shared/month-indicators`, the same ones the
  // Reports print: classified receipts, spending with and without a category,
  // refunds netted, transfers and starting balances out. The budget engine's
  // own month cells stay on the Budget screen, where they mean what they say.
  const {
    income: classifiedIncome,
    spent: monthSpent,
    net: monthNet,
    details: monthDetails,
    isLoading: isMonthTotalsLoading,
  } = useMonthTotals(month);

  const monthTotals = useMemo(() => {
    if (classifiedIncome === null || monthSpent === null || monthNet === null) {
      return null;
    }

    return {
      income: classifiedIncome,
      spent: monthSpent,
      net: monthNet,
      label: monthUtils.format(month, "MMMM ''yy", locale),
    };
  }, [classifiedIncome, monthSpent, monthNet, month, locale]);

  // --- Accounts -------------------------------------------------------------
  const { data: onBudgetAccounts = [], isLoading: isOnBudgetLoading } =
    useOnBudgetAccounts();
  const { data: offBudgetAccounts = [], isLoading: isOffBudgetLoading } =
    useOffBudgetAccounts();

  const accountEntities = useMemo(
    () => [...onBudgetAccounts, ...offBudgetAccounts],
    [onBudgetAccounts, offBudgetAccounts],
  );

  // The same hook the mobile Accounts page binds its rows with.
  const balancesByAccount = useAccountBalances(
    accountEntities.map(account => account.id),
  );

  const accounts = useMemo(
    () =>
      accountEntities.map(account =>
        toOverviewAccount(account, balancesByAccount[account.id] ?? 0, t),
      ),
    [accountEntities, balancesByAccount, t],
  );

  // --- Cards ----------------------------------------------------------------
  // Which on-budget accounts the bank's own entries prove to be cards, and
  // what they add up to, so the hero can say how much of its headline is card
  // debt. Stated only when every card balance has resolved, so the two parts
  // always add up to the headline — the same rule the phone's Home applies.
  const cards = useCardInsightsByAccount(accountEntities);
  const cardAccounts = onBudgetAccounts.filter(account =>
    cards.cardAccountIds.includes(account.id),
  );
  const cardsDebt =
    cardAccounts.length > 0 &&
    cardAccounts.every(
      account => typeof balancesByAccount[account.id] === 'number',
    )
      ? cardAccounts.reduce(
          (sum, account) => sum + (balancesByAccount[account.id] ?? 0),
          0,
        )
      : null;

  // --- Spending -------------------------------------------------------------
  const {
    categories: spendingCategories,
    credits: spendingCredits,
    outflows: spendingOutflows,
    totalSpent,
    isLoading: isSpendingLoading,
  } = useHomeCategorySpending({ month, limit: 6 });

  const categories: OverviewCategory[] = useMemo(
    () =>
      spendingCategories.map(entry => ({
        id: entry.category.id,
        name: entry.category.name,
        Icon: iconForCategory(entry.category.name),
        hue: hueForCategory(entry.category.id),
        amount: entry.amount,
        isUncategorized: entry.isUncategorized,
      })),
    [spendingCategories],
  );

  // What the ranked rows do not add up to on their own. The panel states the
  // subtraction rather than letting the list disagree with the summary above
  // it.
  const spendingComposition = useMemo(
    () =>
      totalSpent === null
        ? null
        : {
            credits: spendingCredits,
            outflows: spendingOutflows,
            net: totalSpent,
          },
    [spendingCredits, spendingOutflows, totalSpent],
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
            // bar for the same category are visibly the same thing. No
            // category — a transfer, or one still to be filed — is grey.
            hue: hueForCategory(transaction.category),
            amount: transaction.amount ?? 0,
          };
        }),
    [transactions, payeesById, allAccounts, categoriesById, locale, t],
  );

  return {
    month,
    balances: { available, cardsDebt },
    monthTotals,
    monthDetails,
    accounts,
    categories,
    spendingComposition,
    movements,
    isAccountsLoading: isOnBudgetLoading || isOffBudgetLoading,
    isMonthLoading: isMonthTotalsLoading || monthTotals === null,
    isSpendingLoading,
    isActivityLoading,
  };
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
