import type { Page } from '@playwright/test';

/** One category of the month: what was planned, what left, what remains. */
export type LedgerCategory = {
  budgeted: number;
  /** Money out of the category, as a positive amount. */
  spent: number;
  /** What the envelope still holds, carryover included. */
  available: number;
};

/** One month of the budget, in integer cents. */
export type LedgerMonth = {
  /** What the income categories received. */
  income: number;
  /** What the expense categories paid out, as a positive amount. */
  spent: number;
  budgeted: number;
  toDistribute: number;
  categories: Record<string, LedgerCategory>;
  /**
   * The month as a cash flow, which is how the Reports read it: every amount
   * that came into an on-budget account and every amount that left one,
   * transfers aside and whatever its category.
   */
  cashIn: number;
  cashOut: number;
};

/** Everything the suite holds the pages against, in integer cents. */
export type Ledger = {
  /** Whole transactions on file: a split counts once, a transfer twice. */
  transactionCount: number;
  balances: Record<string, number>;
  onBudget: number;
  offBudget: number;
  total: number;
  month: LedgerMonth;
};

/** What a browser profile holds of the application. */
export type Profile = {
  /** The budget files kept in the profile, and whether one is synced. */
  files: Array<{ id: string; name: string; isSynced: boolean }>;
  /** The sync server the profile is pointed at, if any. */
  serverUrl: string | null;
  cookies: string;
  localStorageKeys: string[];
};

/** What the file answers when asked, as far as this model reads it. */
type Query = {
  filter: (expression: object) => Query;
  groupBy: (expression: string[]) => Query;
  select: (expression: Array<string | object>) => Query;
  options: (expression: object) => Query;
};

type FileWindow = {
  $q: (table: string) => Query;
  $query: (query: Query) => Promise<{ data: Array<Record<string, unknown>> }>;
  $send: (
    name: 'get-cell',
    args: { sheetName: string; name: string },
  ) => Promise<{ value: unknown }>;
};

type ProfileWindow = {
  $send: {
    (name: 'get-budgets'): Promise<
      Array<{
        id?: string;
        name: string;
        cloudFileId?: string;
        groupId?: string;
      }>
    >;
    (name: 'get-server-url'): Promise<string | null | undefined>;
  };
};

/**
 * The open file's own records, read without going through any page.
 *
 * A page can be wrong in two ways: it can print a figure other than the one the
 * file holds, or the file can hold the wrong figure. Reading what a page prints
 * and comparing it to what the same page printed a moment ago tells the two
 * apart only by luck. This model adds up the transactions and the plan
 * themselves — balances, what each category paid out, what came in — so a page
 * is held against the file, and the file against the arithmetic of what was
 * entered.
 *
 * Two figures are the engine's own and are read from its cells, because they
 * carry history a sum of this month cannot see: what an envelope still holds,
 * and what is left to distribute.
 *
 * Read-only: it queries, and writes nothing.
 */
export class V2Ledger {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * What the browser profile holds of the application: its budget files, the
   * server it would sync with, and whatever a session leaves behind.
   */
  async profile(): Promise<Profile> {
    return await this.page.evaluate(async () => {
      // On `window` by the application's own doing; see `read` below.
      const app = window as unknown as ProfileWindow;
      const files = await app.$send('get-budgets');

      return {
        files: files.map(file => ({
          id: file.id ?? '',
          name: file.name,
          isSynced: Boolean(file.cloudFileId || file.groupId),
        })),
        serverUrl: (await app.$send('get-server-url')) ?? null,
        cookies: document.cookie,
        localStorageKeys: Object.keys(localStorage),
      };
    });
  }

  /** The file as it stands, with the budget of the month given as "2017-01". */
  async read(month: string): Promise<Ledger> {
    const [year, monthOfYear] = month.split('-').map(Number);
    const lastDay = new Date(Date.UTC(year, monthOfYear, 0)).getUTCDate();

    return await this.page.evaluate(
      async ({ start, end, sheetName, dbMonth }) => {
        // The application puts these three on `window` itself (`src/index.tsx`);
        // the e2e project does not include that file, so it cannot see them.
        const file = window as unknown as FileWindow;
        const run = async (query: Query) => (await file.$query(query)).data;
        const cell = async (name: string) => {
          const { value } = await file.$send('get-cell', { sheetName, name });
          return typeof value === 'number' ? value : 0;
        };
        const cents = (value: unknown) =>
          typeof value === 'number' ? value : 0;
        const inMonth = {
          $and: [{ date: { $gte: start } }, { date: { $lte: end } }],
        };

        const accounts = await run(
          file.$q('accounts').select(['id', 'name', 'offbudget', 'closed']),
        );
        const byAccount = await run(
          file
            .$q('transactions')
            .groupBy(['account'])
            .select(['account', { amount: { $sum: '$amount' } }]),
        );
        const wholeTransactions = await run(
          file.$q('transactions').options({ splits: 'none' }).select(['id']),
        );

        const balances: Record<string, number> = {};
        let onBudget = 0;
        let offBudget = 0;
        for (const account of accounts) {
          if (account.closed) continue;
          const balance = cents(
            byAccount.find(row => row.account === account.id)?.amount,
          );
          balances[String(account.name)] = balance;
          if (account.offbudget) offBudget += balance;
          else onBudget += balance;
        }

        const categories = await run(
          file.$q('categories').select(['id', 'name', 'is_income']),
        );
        const paid = await run(
          file
            .$q('transactions')
            .filter({ ...inMonth, 'account.offbudget': false })
            .groupBy(['category'])
            .select(['category', { amount: { $sum: '$amount' } }]),
        );
        const planned = await run(
          file
            .$q('zero_budgets')
            .filter({ month: dbMonth })
            .select(['category', 'amount']),
        );
        const cashFlow = async (direction: object) => {
          const rows = await run(
            file
              .$q('transactions')
              .filter({
                ...inMonth,
                'account.offbudget': false,
                'payee.transfer_acct': null,
                amount: direction,
              })
              .select([{ amount: { $sum: '$amount' } }]),
          );
          return cents(rows[0]?.amount);
        };

        let income = 0;
        let spent = 0;
        let budgeted = 0;
        const byCategory: Record<
          string,
          { budgeted: number; spent: number; available: number }
        > = {};
        for (const category of categories) {
          const sum = cents(
            paid.find(row => row.category === category.id)?.amount,
          );
          if (category.is_income) {
            income += sum;
            continue;
          }
          const plan = cents(
            planned.find(row => row.category === category.id)?.amount,
          );
          spent += -sum;
          budgeted += plan;
          byCategory[String(category.name)] = {
            budgeted: plan,
            // An amount paid out is stored below zero; `-0` is not a figure.
            spent: sum === 0 ? 0 : -sum,
            available: await cell(`leftover-${String(category.id)}`),
          };
        }

        return {
          transactionCount: wholeTransactions.length,
          balances,
          onBudget,
          offBudget,
          total: onBudget + offBudget,
          month: {
            income,
            spent,
            budgeted,
            toDistribute: await cell('to-budget'),
            categories: byCategory,
            cashIn: await cashFlow({ $gt: 0 }),
            cashOut: -(await cashFlow({ $lt: 0 })) || 0,
          },
        };
      },
      {
        start: `${month}-01`,
        end: `${month}-${String(lastDay).padStart(2, '0')}`,
        sheetName: `budget${month.replace('-', '')}`,
        dbMonth: Number(month.replace('-', '')),
      },
    );
  }
}
