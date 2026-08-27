import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  SvgRefresh,
  SvgSearch,
  SvgShield,
} from '@actual-app/components/icons/v1';
import * as monthUtils from '@actual-app/core/shared/months';
import { groupById } from '@actual-app/core/shared/util';
import type { CategoryEntity } from '@actual-app/core/types/models';
import { ptBR } from 'date-fns/locale';

import { useBudgetActions } from '#budget/mutations';
import { getPrettyPayee } from '#components/mobile/utils';
import type {
  LabEnvelope,
  LabMovement,
  LabTip,
} from '#components/v2lab/budget/BudgetView';
import { iconForCategory } from '#components/v2lab/LabStyle';
import { useAccounts } from '#hooks/useAccounts';
import { useCategories } from '#hooks/useCategories';
import { useLocalPref } from '#hooks/useLocalPref';
import { usePayeesById } from '#hooks/usePayees';
import { useSpreadsheet } from '#hooks/useSpreadsheet';
import { useSyncedPref } from '#hooks/useSyncedPref';
import { useTransactions } from '#hooks/useTransactions';
import * as queries from '#queries';
import { envelopeBudget, trackingBudget } from '#spreadsheet/bindings';

import { hueForId } from './budgetPresentation';

const RECENT_COUNT = 5;

/**
 * Everything the real Budget shows, read from the application's own sources.
 *
 * Dates are formatted in pt-BR rather than through `useLocale()`: this screen's
 * own copy — "Orçamento", "Seus envelopes", "Dicas rápidas" — is Portuguese, so
 * a month rendered as "August" would be the page disagreeing with itself.
 *
 * No figure is recomputed here: each one is a spreadsheet cell the Budget
 * engine already maintains — `catBudgeted`, `catSumAmount`, `totalIncome` — so
 * this page and the classic table can never disagree. The adapter's job is
 * shape, turning categories and cells into the props the approved components
 * take, plus the two writes the screen is allowed to make: moving month and
 * editing a budgeted amount, both through the app's own mutation.
 */
export function useRealBudgetData() {
  const { t } = useTranslation();
  const applyBudgetAction = useBudgetActions();

  // The same preference the classic Budget page uses, so moving month here
  // moves it there too.
  const [startMonthPref, setStartMonthPref] = useLocalPref('budget.startMonth');
  const month = startMonthPref || monthUtils.currentMonth();
  const sheetName = monthUtils.sheetForMonth(month);

  const [budgetTypePref] = useSyncedPref('budgetType');
  const isTracking = budgetTypePref === 'tracking';
  const bindings = isTracking ? trackingBudget : envelopeBudget;

  // --- month totals ---------------------------------------------------------
  const income = useCell(sheetName, bindings.totalIncome);

  // What is still free to assign, taken from the cell the classic Budget's own
  // "To Budget" reads. Never derived here: the engine's `to-budget` is
  // `available-funds + last-month-overspent + total-budgeted - buffered`, where
  // `available-funds` already folds in the balance carried from the previous
  // month. A local `income - budgeted` sees none of that and drifts the moment
  // a month closes with anything left over or overspent.
  //
  // Tracking budgets maintain no such cell, so the figure is `null` there and
  // the band omits the metric rather than inventing one.
  const toDistribute = useCell(
    sheetName,
    isTracking ? null : envelopeBudget.toBudget,
  );

  // The month's whole plan and whole spend, as the engine totals them. Summing
  // the visible rows would leave out a hidden category that still holds budget
  // and still spends, and the band speaks for the month, not for the list.
  //
  // Signs differ by budget type and are normalised here, once: the envelope
  // engine stores `total-budgeted` negated, the tracking engine does not, and
  // `total-spent` is negative in both because it sums transactions.
  const totalBudgetedCell = useCell(
    sheetName,
    isTracking
      ? trackingBudget.totalBudgetedExpense
      : envelopeBudget.totalBudgeted,
  );
  const totalSpentCell = useCell(sheetName, bindings.totalSpent);

  const totalBudgeted =
    totalBudgetedCell === null
      ? null
      : isTracking
        ? totalBudgetedCell
        : -totalBudgetedCell;
  const totalSpent = totalSpentCell === null ? null : -totalSpentCell;

  // --- envelopes ------------------------------------------------------------
  const {
    data: { list: categories, grouped: categoryGroups } = {
      list: [],
      grouped: [],
    },
    isPlaceholderData: areCategoriesPending,
  } = useCategories();

  const groupsById = useMemo(() => groupById(categoryGroups), [categoryGroups]);

  const expenseCategories = useMemo(
    () =>
      categories.filter(
        category =>
          !category.is_income &&
          !category.hidden &&
          !groupsById[category.group]?.hidden,
      ),
    [categories, groupsById],
  );

  const budgetedByCategory = useCategoryCells(
    sheetName,
    expenseCategories,
    bindings.catBudgeted,
  );
  const spentByCategory = useCategoryCells(
    sheetName,
    expenseCategories,
    bindings.catSumAmount,
  );
  // The same cell the classic Budget's "Balance" column reads. Not
  // `budgeted - spent`: the engine folds in whatever the envelope carried over
  // from last month, which a local subtraction cannot see.
  const balanceByCategory = useCategoryCells(
    sheetName,
    expenseCategories,
    bindings.catBalance,
  );

  const envelopes: LabEnvelope[] = useMemo(
    () =>
      expenseCategories.map(category => ({
        id: category.id,
        name: category.name,
        // Chosen from the name, and only as presentation: the model carries no
        // icon, and an unrecognised name falls back to a plain tag.
        Icon: iconForCategory(category.name),
        hue: hueForId(category.id),
        budgeted: budgetedByCategory[category.id] ?? 0,
        // Cells report spending as negative; the approved row reads it as an
        // amount consumed, so the sign is flipped once, here.
        spent: -(spentByCategory[category.id] ?? 0),
        available: balanceByCategory[category.id] ?? 0,
      })),
    [expenseCategories, budgetedByCategory, spentByCategory, balanceByCategory],
  );

  const isEnvelopesLoading =
    areCategoriesPending ||
    expenseCategories.some(category => !(category.id in budgetedByCategory));

  // --- recent activity within the month ------------------------------------
  const [monthStart, monthEnd] = useMemo(
    () => [monthUtils.firstDayOfMonth(month), monthUtils.lastDayOfMonth(month)],
    [month],
  );

  const transactionQuery = useMemo(
    () =>
      queries
        .transactions()
        .filter({ date: { $gte: monthStart, $lte: monthEnd } })
        .options({ splits: 'none' })
        .select('*'),
    [monthStart, monthEnd],
  );
  const { transactions, isLoading: isActivityLoading } = useTransactions({
    query: transactionQuery,
    options: { pageSize: RECENT_COUNT * 4 },
  });

  const { data: payeesById } = usePayeesById();
  const { data: accounts = [] } = useAccounts();
  const categoriesById = useMemo(() => groupById(categories), [categories]);

  const movements: LabMovement[] = useMemo(
    () =>
      transactions
        .filter(transaction => !transaction.is_child)
        .slice(0, RECENT_COUNT)
        .map(transaction => {
          const payee = transaction.payee
            ? payeesById?.[transaction.payee]
            : undefined;
          const transferAccount = accounts.find(
            account => account.id === payee?.transfer_acct,
          );
          const category = transaction.category
            ? categoriesById[transaction.category]
            : undefined;

          return {
            id: transaction.id,
            name:
              getPrettyPayee({ t, transaction, payee, transferAccount }) ||
              t('(Sem beneficiário)'),
            envelope: category?.name ?? t('Sem categoria'),
            date: monthUtils.format(transaction.date, 'd MMM', ptBR),
            amount: transaction.amount ?? 0,
            Icon: iconForCategory(category?.name ?? ''),
            // The same hue the envelope above carries, so a row and a bar for
            // one category are visibly the same thing.
            hue: hueForId(category?.id ?? 'uncategorised'),
          };
        }),
    [transactions, payeesById, accounts, categoriesById, t],
  );

  // --- the two writes this screen may make ---------------------------------
  const onPreviousMonth = useCallback(
    () => setStartMonthPref(monthUtils.subMonths(month, 1)),
    [month, setStartMonthPref],
  );
  const onNextMonth = useCallback(
    () => setStartMonthPref(monthUtils.addMonths(month, 1)),
    [month, setStartMonthPref],
  );

  /**
   * The bridge to the application's own budget actions.
   *
   * A passthrough, and nothing more: transferring money between categories,
   * covering overspending and flipping carryover are the engine's rules, and
   * this screen only asks for them. No amount is computed here, and no decision
   * is made about where money may come from.
   *
   * The one assertion is the seam between two type styles: `BalanceMovementMenu`
   * is the classic Budget's own component and hands its payload as `unknown`,
   * while the mutation takes a discriminated union. The menu is the only caller,
   * and the payloads it raises are the engine's own shapes — the same ones the
   * classic Budget page forwards unchecked.
   */
  const onBudgetAction = useCallback(
    (actionMonth: string, type: string, args: unknown) => {
      // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- the classic menu types its payload as `unknown`
      applyBudgetAction.mutate({
        month: actionMonth,
        type,
        args,
      } as Parameters<typeof applyBudgetAction.mutate>[0]);
    },
    [applyBudgetAction],
  );

  const onBudgetedChange = useCallback(
    (categoryId: string, amount: number) => {
      applyBudgetAction.mutate({
        month,
        type: 'budget-amount',
        args: { category: categoryId, amount },
      });
    },
    [applyBudgetAction, month],
  );

  return {
    income,
    toDistribute,
    totalBudgeted,
    totalSpent,
    month,
    sheetName,
    onBudgetAction,
    envelopes,
    movements,
    monthLabel: capitalise(monthUtils.format(month, "MMMM 'de' yyyy", ptBR)),
    tips: TIPS,
    isEnvelopesLoading,
    isActivityLoading,
    onPreviousMonth,
    onNextMonth,
    onBudgetedChange,
  };
}

/** One cell, read-only. A `null` name means this budget type has no such cell. */
function useCell(sheetName: string, cellName: string | null): number | null {
  const spreadsheet = useSpreadsheet();
  const [value, setValue] = useState<number | null>(null);

  useEffect(() => {
    setValue(null);

    if (cellName === null) {
      return;
    }

    return spreadsheet.bind(sheetName, cellName, result => {
      setValue(typeof result.value === 'number' ? result.value : null);
    });
  }, [spreadsheet, sheetName, cellName]);

  return value;
}

/**
 * One binding per category, the same subscription shape the Home dashboard
 * uses. Read-only: opening this page never changes the budget.
 */
function useCategoryCells(
  sheetName: string,
  categories: CategoryEntity[],
  field: (id: string) => string,
): Record<CategoryEntity['id'], number> {
  const spreadsheet = useSpreadsheet();
  const [values, setValues] = useState<Record<string, number>>({});

  const bindings = useMemo(
    () =>
      categories.map(category => [category.id, field(category.id)] as const),
    [categories, field],
  );

  useEffect(() => {
    setValues({});
  }, [sheetName]);

  useEffect(() => {
    const unbinds = bindings.map(([id, binding]) =>
      spreadsheet.bind(sheetName, binding, result => {
        const value = typeof result.value === 'number' ? result.value : 0;
        setValues(previous =>
          previous[id] === value ? previous : { ...previous, [id]: value },
        );
      }),
    );

    return () => unbinds.forEach(unbind => unbind());
  }, [bindings, sheetName, spreadsheet]);

  return values;
}

function capitalise(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Standing advice, deliberately not analysis.
 *
 * These say nothing about this month's numbers — no score, no recommendation.
 * They are habits, and keeping them static is what stops them being read as a
 * verdict the product cannot actually give.
 */
const TIPS: LabTip[] = [
  {
    id: 'variaveis',
    title: 'Revise os variáveis',
    body: 'Gastos como delivery e transporte mudam rápido ao longo do mês.',
    Icon: SvgSearch,
    hue: 'blue',
  },
  {
    id: 'sobras',
    title: 'Proteja o que sobrar',
    body: 'Sobras de envelopes podem reforçar sua reserva em vez de sumirem.',
    Icon: SvgShield,
    hue: 'green',
  },
  {
    id: 'recorrencias',
    title: 'Cheque recorrências',
    body: 'Assinaturas e pequenos débitos merecem revisão frequente.',
    Icon: SvgRefresh,
    hue: 'amber',
  },
];
