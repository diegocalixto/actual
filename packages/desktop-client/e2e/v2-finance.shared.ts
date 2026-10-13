/**
 * The money suite of the V2 — whether what a person does with their money
 * comes out right on every page, shared by the desktop and the phone layout:
 *
 *   yarn workspace @actual-app/web run playwright test v2-finance --browser=chromium
 *
 * `v2-finance.test.ts` runs it at 1440×900 and `v2-finance.mobile.test.ts` at
 * 428×926 with touch. Each test enters, changes or deletes something through
 * the screens a person would use, and then asks two questions in integer
 * cents: did the file's own records move by exactly what was entered, and do
 * Home, Budget, Accounts and Reports each print what those records add up to?
 *
 * The pages are held against the file, not against themselves — see
 * `page-models/v2-ledger.ts` — and each indicator against its own definition,
 * which `…Of` below spells out.
 */
import type { Page } from '@playwright/test';

import { expect, test } from './fixtures';
import { ConfigurationPage } from './page-models/configuration-page';
import { Navigation } from './page-models/navigation';
import { V2Books } from './page-models/v2-books';
import type {
  AccountsBooks,
  BudgetBooks,
  HomeBooks,
  ReportsBooks,
} from './page-models/v2-books';
import { V2Budget } from './page-models/v2-budget';
import { V2Entries } from './page-models/v2-entries';
import { V2Ledger } from './page-models/v2-ledger';
import type { Ledger, Profile } from './page-models/v2-ledger';
import {
  V2_NARROWER,
  V2_PAGES,
  V2_VIEWPORTS,
  V2Shell,
} from './page-models/v2-shell';
import type { V2Layout } from './page-models/v2-shell';

/**
 * The month the suite lives in. Its user agent stops the application's clock
 * on 1 January 2017, so "today" and "this month" never move.
 */
const THIS_MONTH = '2017-01';
const LAST_MONTH = '2016-12';
const NEXT_MONTH = '2017-02';

/** Three accounts inside the budget and one outside it. */
const SAVINGS = 'Ally Savings';
const CHECKING = 'HSBC';
/** The one with little in it: R$ 190,00. */
const WALLET = 'Bank of America';
const RETIREMENT = 'Vanguard 401k';
const ACCOUNTS = [SAVINGS, CHECKING, WALLET, RETIREMENT];
const OFF_BUDGET = [RETIREMENT];

/** The category the suite makes, on the layout that can make one. */
const NEW_CATEGORY = 'QA Mercado';

/** The account the suite opens, and what it opens it with. */
const NEW_ACCOUNT = 'QA Carteira';
const NEW_ACCOUNT_BALANCE = 15025;

/**
 * The categories the suite spends in — and Clothing, which the test file
 * leaves R$ 60,00 past its plan.
 */
const CATEGORIES = ['Food', 'Restaurants', 'General', 'Clothing'];

/** The test file, where the suite starts: the known ground under every delta. */
const OPENING = {
  balances: {
    [SAVINGS]: 765300,
    [CHECKING]: 781000,
    [WALLET]: 19000,
    [RETIREMENT]: 294500,
  },
  onBudget: 2091800,
  offBudget: 2219000,
  total: 4310800,
  income: 41500,
  spent: 13500,
  budgeted: 303000,
  toDistribute: 0,
  food: { budgeted: 40000, spent: 4500, available: 115500 },
  clothing: { budgeted: 3000, spent: 9000, available: -6000 },
};

// ---- What each page is meant to print, in terms of the file -----------------

function accountsOf(ledger: Ledger): AccountsBooks {
  return {
    total: ledger.total,
    onBudget: ledger.onBudget,
    offBudget: ledger.offBudget,
    balances: ledger.balances,
  };
}

function budgetOf({ month }: Ledger): BudgetBooks {
  return {
    toDistribute: month.toDistribute,
    budgeted: month.budgeted,
    spent: month.spent,
    income: month.income,
    monthResult: month.income - month.spent,
    categories: Object.fromEntries(
      CATEGORIES.map(name => [name, month.categories[name]]),
    ),
  };
}

/**
 * The Home's month is the Budget's: what the income categories received and
 * what the expense categories paid out. Its balance is the money inside the
 * budget, and its total every open account.
 */
function homeOf(ledger: Ledger): HomeBooks {
  return {
    available: ledger.onBudget,
    toDistribute: ledger.month.toDistribute,
    income: ledger.month.income,
    spent: ledger.month.spent,
    net: ledger.month.income - ledger.month.spent,
    total: ledger.total,
    balances: Object.fromEntries(
      ACCOUNTS.map(name => [name, ledger.balances[name]]),
    ),
  };
}

/**
 * The Reports read the month as a cash flow: what came into the on-budget
 * accounts and what left them, transfers aside. That is not the Budget's
 * "spent" — a transfer out of the budget is spending there and not here.
 */
function reportsOf({ month }: Ledger): ReportsBooks {
  return {
    income: month.cashIn,
    expenses: month.cashOut,
    net: month.cashIn - month.cashOut,
  };
}

/** Moves an account's balance, and with it the sums the account belongs to. */
function move(ledger: Ledger, account: string, cents: number) {
  ledger.balances[account] += cents;
  if (OFF_BUDGET.includes(account)) {
    ledger.offBudget += cents;
  } else {
    ledger.onBudget += cents;
  }
  ledger.total += cents;
}

/**
 * The money flows of the V2, on one layout.
 *
 * The tests share one page and one test file and run in order, each from the
 * state the one before left: an entry is made in one, changed in the next and
 * deleted in a third, which is the life a transaction has. Every test reads
 * the file before it acts and states what should have moved, so none depends
 * on the figures of another.
 *
 * Nothing is written before the first test has shown that the file under test
 * is a throwaway of this run with no way out of the machine; a failure there
 * stops the group.
 *
 * So the file is meant to be run whole. A test picked out with `-g` needs the
 * first two with it — they build the file and read the state the others are
 * held to — and assumes the ones before it left the file as they found it.
 */
export function describeV2Finance(layout: V2Layout) {
  test.describe(`V2 money (${layout})`, () => {
    // A test here visits all four pages after each thing it enters, and the
    // phone's Home alone takes seconds to add up six months of balances.
    test.describe.configure({ mode: 'serial', timeout: 120_000 });

    let page: Page;
    let shell: V2Shell;
    let books: V2Books;
    let ledger: V2Ledger;
    let entries: V2Entries;
    let budget: V2Budget;

    let appOrigin: string;
    let profileBefore: Profile;
    let profileAfter: Profile;
    const requestedOrigins = new Set<string>();
    /** The file as the suite found it; what every deletion has to restore. */
    let opening: Ledger;

    test.beforeAll(async ({ browser, baseURL }, testInfo) => {
      // Building the test file is most of the group's cost.
      testInfo.setTimeout(120_000);

      const app = new URL(baseURL ?? 'http://localhost:3002');
      appOrigin = app.origin;

      page = await browser.newPage({
        ...V2_VIEWPORTS[layout],
        // A wall, not an observation: everything but the application's own
        // host is sent to a port nothing listens on, for this page and for
        // the workers behind it. A file opened here cannot reach a sync
        // server even if one were configured.
        proxy: { server: 'http://127.0.0.1:9', bypass: app.hostname },
      });
      page.on('request', request => {
        const url = new URL(request.url());
        // A `data:` address is the page talking to itself.
        if (url.protocol !== 'data:') requestedOrigins.add(url.origin);
      });

      await page.goto('/');
      ledger = new V2Ledger(page);
      // The welcome screen is itself the first evidence: it is what a profile
      // with no budget file and no server is shown.
      await page
        .getByRole('button', { name: 'Try the demo', exact: true })
        .waitFor();
      profileBefore = await ledger.profile();

      await new ConfigurationPage(page).createTestFile();
      profileAfter = await ledger.profile();

      shell = new V2Shell(page, layout);
      books = new V2Books(shell);
      entries = new V2Entries(shell);
      budget = new V2Budget(shell);
    });

    test.afterAll(async () => {
      await page?.close();
    });

    /** Waits for the file to be exactly what the change says it should be. */
    async function fileAfter(before: Ledger, change: (ledger: Ledger) => void) {
      const expected = structuredClone(before);
      change(expected);

      await expect(async () => {
        expect(await ledger.read(THIS_MONTH)).toEqual(expected);
      }).toPass();

      return expected;
    }

    /**
     * Starts the application again, as closing the tab and coming back does.
     * It reopens the file it had and the page it was on.
     */
    async function reload() {
      await page.reload();
      await expect(shell.navigation).toBeVisible({ timeout: 60_000 });
      // The file answers once the application has it open again.
      await expect(async () => {
        await ledger.read(THIS_MONTH);
      }).toPass({ timeout: 60_000 });
    }

    /** Every page prints what the file adds up to, by its own definition. */
    async function expectPagesToAgree(file: Ledger) {
      await entries.backToTheBar();

      await shell.goTo('accounts');
      await expect(async () => {
        expect(await books.accounts()).toEqual(accountsOf(file));
      }).toPass();

      await shell.goTo('budget');
      await expect(async () => {
        expect(await books.budget(CATEGORIES)).toEqual(budgetOf(file));
      }).toPass();

      await shell.goTo('home');
      await expect(async () => {
        expect(await books.home(ACCOUNTS)).toEqual(homeOf(file));
      }).toPass();

      // One page on both layouts, reading one set of queries: the phone's
      // indicators are held to the file exactly as the desktop's are.
      await shell.goTo('reports');
      await expect(async () => {
        expect(await books.reports()).toEqual(reportsOf(file));
      }).toPass();
    }

    test('the file under test is a throwaway with no way out', async () => {
      // Before the suite made its file the profile held nothing of the
      // application: no budget file, no server to sync with, no session.
      expect(profileBefore).toEqual({
        files: [],
        serverUrl: null,
        cookies: '',
        localStorageKeys: [],
      });

      // After, it holds the one file the suite made — the application's own
      // test file, which is never uploaded — and still no server.
      expect(profileAfter).toEqual({
        files: [{ id: '_test-budget', name: 'Test Budget', isSynced: false }],
        serverUrl: null,
        cookies: '',
        localStorageKeys: [],
      });

      // The wall holds: nothing outside the application's own host answers.
      const reached = await page.evaluate(async () => {
        try {
          await fetch('http://example.com/', { mode: 'no-cors' });
          return true;
        } catch {
          return false;
        }
      });
      expect(reached).toBe(false);
      requestedOrigins.delete('http://example.com');

      // And nothing was asked of any other host on the way here.
      expect([...requestedOrigins]).toEqual([appOrigin]);
    });

    test('the four pages agree with the file before anything is written', async () => {
      opening = await ledger.read(THIS_MONTH);

      // The known ground. Without it the suite could be comparing nothing
      // with nothing.
      expect(opening).toMatchObject({
        balances: OPENING.balances,
        onBudget: OPENING.onBudget,
        offBudget: OPENING.offBudget,
        total: OPENING.total,
        month: {
          income: OPENING.income,
          spent: OPENING.spent,
          budgeted: OPENING.budgeted,
          toDistribute: OPENING.toDistribute,
          categories: { Food: OPENING.food, Clothing: OPENING.clothing },
        },
      });
      expect(
        Object.values(opening.balances).reduce((sum, cents) => sum + cents, 0),
      ).toBe(opening.total);

      await expectPagesToAgree(opening);
    });

    test('the Reports of another month are that month of the file', async () => {
      // The period is a filter like any other: the figures of December have
      // to be December's cash flow, to the cent, and not this month's under
      // another name.
      const lastMonth = await ledger.read(LAST_MONTH);
      expect(reportsOf(lastMonth)).not.toEqual(reportsOf(opening));
      expect(lastMonth.month.cashIn).toBeGreaterThan(0);
      expect(lastMonth.month.cashOut).toBeGreaterThan(0);

      await shell.goTo('reports');
      const period = page.getByRole('button', { name: /^Period: / });
      await expect(period).toHaveAttribute('data-month', THIS_MONTH);

      await page.getByRole('button', { name: 'Mês anterior' }).click();
      await expect(period).toHaveAttribute('data-month', LAST_MONTH);
      await expect(async () => {
        expect(await books.reports()).toEqual(reportsOf(lastMonth));
      }).toPass();

      // The month survives a reload: it is in the address.
      await reload();
      await shell.waitForPage('reports');
      await expect(period).toHaveAttribute('data-month', LAST_MONTH);
      await expect(async () => {
        expect(await books.reports()).toEqual(reportsOf(lastMonth));
      }).toPass();

      // And back, the page is this month's again. Looking wrote nothing.
      await page.getByRole('button', { name: 'Próximo mês' }).click();
      await expect(period).toHaveAttribute('data-month', THIS_MONTH);
      await expect(async () => {
        expect(await books.reports()).toEqual(reportsOf(opening));
      }).toPass();
      expect(await ledger.read(THIS_MONTH)).toEqual(opening);
    });

    test('a transaction cannot be entered without an account', async () => {
      const before = await ledger.read(THIS_MONTH);

      if (layout === 'desktop') {
        // The register of every account is the one place the desktop lets an
        // amount be typed with no account behind it.
        const register = await new Navigation(page).goToAccountPage(
          'All accounts',
        );
        await register.addNewTransactionButton.click();
        const debit = register.newTransactionRow.getByTestId('debit');
        await debit.click();
        await debit.getByRole('textbox').pressSequentially('7,77');
        await page.keyboard.press('Tab');
        await register.addTransactionButton.click();

        await expect(
          page.getByText('Account is a required field'),
        ).toBeVisible();
        await register.cancelTransactionButton.click();
      } else {
        // The phone's form will not offer to add anything until it has an
        // account: its one action asks for it instead.
        await entries.openNewForm();
        const amount = entries.form.getByTestId('amount-input');
        await amount.fill('777');
        await amount.blur();

        await expect(entries.formAction).toHaveText('Select account');
        await entries.formAction.click();
        await expect(page.getByRole('combobox').locator('input')).toBeVisible();
        await page.keyboard.press('Escape');
        await expect(entries.formAction).toHaveText('Select account');
      }

      await entries.backToTheBar();
      expect(await ledger.read(THIS_MONTH)).toEqual(before);
    });

    test('an expense with cents reaches every page', async () => {
      const before = await ledger.read(THIS_MONTH);

      await entries.add({
        account: SAVINGS,
        payee: 'Kroger',
        category: 'Food',
        amount: -1234,
        notes: 'qa mercado',
      });

      const after = await fileAfter(before, file => {
        file.transactionCount += 1;
        move(file, SAVINGS, -1234);
        file.month.spent += 1234;
        file.month.cashOut += 1234;
        file.month.categories.Food.spent += 1234;
        file.month.categories.Food.available -= 1234;
      });
      await expectPagesToAgree(after);
    });

    test('an income reaches every page, and both survive a reload', async () => {
      const before = await ledger.read(THIS_MONTH);

      await entries.add({
        account: SAVINGS,
        payee: 'Deposit',
        category: 'Income',
        amount: 10005,
        notes: 'qa salario',
      });

      const after = await fileAfter(before, file => {
        file.transactionCount += 1;
        move(file, SAVINGS, 10005);
        file.month.income += 10005;
        file.month.cashIn += 10005;
        // Income nobody has planned yet is money left to distribute.
        file.month.toDistribute += 10005;
      });
      await expectPagesToAgree(after);

      // Nothing above is only in memory: a reload starts the application
      // again from what it stored.
      await reload();
      expect(await ledger.read(THIS_MONTH)).toEqual(after);
      await expectPagesToAgree(after);
    });

    test('changing an entry moves exactly the difference', async () => {
      const before = await ledger.read(THIS_MONTH);

      // The amount: R$ 12,34 becomes R$ 45,67.
      await entries.change({ notes: 'qa mercado' }, { amount: -4567 });
      const repriced = await fileAfter(before, file => {
        move(file, SAVINGS, -3333);
        file.month.spent += 3333;
        file.month.cashOut += 3333;
        file.month.categories.Food.spent += 3333;
        file.month.categories.Food.available -= 3333;
      });

      // The category: all of it leaves Food for Restaurants.
      await entries.change(
        { notes: 'qa mercado' },
        { category: 'Restaurants' },
      );
      const recategorised = await fileAfter(repriced, file => {
        file.month.categories.Food.spent -= 4567;
        file.month.categories.Food.available += 4567;
        file.month.categories.Restaurants.spent += 4567;
        file.month.categories.Restaurants.available -= 4567;
      });

      // The account and the description: the money was never in Savings.
      await entries.change(
        { notes: 'qa mercado' },
        { account: CHECKING, notes: 'qa jantar' },
      );
      const moved = await fileAfter(recategorised, file => {
        move(file, SAVINGS, 4567);
        move(file, CHECKING, -4567);
      });

      expect(moved.total).toBe(before.total - 3333);
      await expectPagesToAgree(moved);
    });

    test('deleting takes back exactly what was entered', async () => {
      await entries.remove({ notes: 'qa jantar' });
      await entries.remove({ notes: 'qa salario' });

      // Not "close to": the file is the one the suite opened, to the cent.
      await expect(async () => {
        expect(await ledger.read(THIS_MONTH)).toEqual(opening);
      }).toPass();
      await expectPagesToAgree(opening);
    });

    test('a transfer moves money without earning or spending it', async () => {
      const before = await ledger.read(THIS_MONTH);

      await entries.add({
        account: SAVINGS,
        payee: CHECKING,
        amount: -30025,
        notes: 'qa transferencia',
      });

      // One side leaves Savings and the other lands in Checking; nothing else
      // moves — no income, no spending, no cash flow, nothing to distribute.
      const after = await fileAfter(before, file => {
        file.transactionCount += 2;
        move(file, SAVINGS, -30025);
        move(file, CHECKING, 30025);
      });
      expect(after.total).toBe(before.total);
      expect(after.onBudget).toBe(before.onBudget);
      expect(after.month).toEqual(before.month);
      await expectPagesToAgree(after);

      // Changing one side changes the other with it.
      await entries.change(
        { notes: 'qa transferencia', account: SAVINGS },
        { amount: -15010 },
      );
      const repriced = await fileAfter(before, file => {
        file.transactionCount += 2;
        move(file, SAVINGS, -15010);
        move(file, CHECKING, 15010);
      });
      await expectPagesToAgree(repriced);

      // And deleting one side deletes both.
      await entries.remove({ notes: 'qa transferencia', account: SAVINGS });
      await expect(async () => {
        expect(await ledger.read(THIS_MONTH)).toEqual(before);
      }).toPass();
      await expectPagesToAgree(before);
    });

    test('a transfer out of the budget is spending for the Budget and not a cash flow', async () => {
      const before = await ledger.read(THIS_MONTH);

      await entries.add({
        account: SAVINGS,
        payee: RETIREMENT,
        category: 'General',
        amount: -5000,
        notes: 'qa aporte',
      });

      const after = await fileAfter(before, file => {
        file.transactionCount += 2;
        move(file, SAVINGS, -5000);
        move(file, RETIREMENT, 5000);
        // The money left the budget, so the category paid for it…
        file.month.spent += 5000;
        file.month.categories.General.spent += 5000;
        file.month.categories.General.available -= 5000;
        // …but it is still the person's own money: `cashOut` does not move,
        // and neither does anything the Reports print.
      });
      expect(after.total).toBe(before.total);
      expect(after.onBudget).toBe(before.onBudget - 5000);
      expect(after.offBudget).toBe(before.offBudget + 5000);
      await expectPagesToAgree(after);

      await entries.remove({ notes: 'qa aporte', account: SAVINGS });
      await expect(async () => {
        expect(await ledger.read(THIS_MONTH)).toEqual(before);
      }).toPass();
    });

    test('an entry dated in another month stays out of this one', async () => {
      const before = await ledger.read(THIS_MONTH);
      const lastMonthBefore = await ledger.read(LAST_MONTH);
      const nextMonthBefore = await ledger.read(NEXT_MONTH);

      await entries.add({
        account: SAVINGS,
        payee: 'Kroger',
        category: 'Food',
        amount: -1001,
        notes: 'qa dezembro',
        date: `${LAST_MONTH}-15`,
      });
      await entries.add({
        account: SAVINGS,
        payee: 'Kroger',
        category: 'Restaurants',
        amount: -2002,
        notes: 'qa fevereiro',
        date: `${NEXT_MONTH}-10`,
      });

      // A balance is every entry of the account, whatever its date. This
      // month's flows are not touched — but what December did not spend is
      // carried into January, so Food has that much less left.
      const after = await fileAfter(before, file => {
        file.transactionCount += 2;
        move(file, SAVINGS, -1001 - 2002);
        file.month.categories.Food.available -= 1001;
      });
      expect(after.month.spent).toBe(before.month.spent);
      expect(after.month.income).toBe(before.month.income);
      expect(after.month.toDistribute).toBe(before.month.toDistribute);
      await expectPagesToAgree(after);

      // Each entry is spending in the month it is dated in.
      const lastMonth = await ledger.read(LAST_MONTH);
      expect(lastMonth.month.categories.Food.spent).toBe(
        lastMonthBefore.month.categories.Food.spent + 1001,
      );
      expect(lastMonth.month.spent).toBe(lastMonthBefore.month.spent + 1001);
      const nextMonth = await ledger.read(NEXT_MONTH);
      expect(nextMonth.month.categories.Restaurants.spent).toBe(
        nextMonthBefore.month.categories.Restaurants.spent + 2002,
      );
      expect(nextMonth.month.spent).toBe(nextMonthBefore.month.spent + 2002);

      // And the Budget shows it there when it is turned to that month.
      await shell.goTo('budget');
      await budget.stepMonths(-1);
      await expect(async () => {
        expect(await books.budget(CATEGORIES)).toEqual(budgetOf(lastMonth));
      }).toPass();
      await budget.stepMonths(2);
      await expect(async () => {
        expect(await books.budget(CATEGORIES)).toEqual(budgetOf(nextMonth));
      }).toPass();
      await budget.stepMonths(-1);
      await expect(async () => {
        expect(await books.budget(CATEGORIES)).toEqual(budgetOf(after));
      }).toPass();

      await entries.remove({ notes: 'qa dezembro' });
      await entries.remove({ notes: 'qa fevereiro' });
      await expect(async () => {
        expect(await ledger.read(THIS_MONTH)).toEqual(before);
      }).toPass();
    });

    test('planning a category takes it from what is left to distribute', async () => {
      const before = await ledger.read(THIS_MONTH);
      const food = before.month.categories.Food;

      // More than there is: R$ 400,00 becomes R$ 525,50, and what is left to
      // distribute goes below zero by the difference.
      await shell.goTo('budget');
      await budget.plan('Food', 52550);
      const raised = await fileAfter(before, file => {
        file.month.budgeted += 12550;
        file.month.toDistribute -= 12550;
        file.month.categories.Food.budgeted += 12550;
        file.month.categories.Food.available += 12550;
      });
      expect(raised.month.toDistribute).toBeLessThan(0);
      await expectPagesToAgree(raised);

      // A plan is stored, not remembered by the page.
      await reload();
      expect(await ledger.read(THIS_MONTH)).toEqual(raised);
      await expectPagesToAgree(raised);

      // Nothing at all: the whole plan goes back to be distributed.
      await shell.goTo('budget');
      await budget.plan('Food', 0);
      const emptied = await fileAfter(before, file => {
        file.month.budgeted -= food.budgeted;
        file.month.toDistribute += food.budgeted;
        file.month.categories.Food.budgeted = 0;
        file.month.categories.Food.available -= food.budgeted;
      });
      await expectPagesToAgree(emptied);

      await shell.goTo('budget');
      await budget.plan('Food', food.budgeted);
      await expect(async () => {
        expect(await ledger.read(THIS_MONTH)).toEqual(before);
      }).toPass();
      await expectPagesToAgree(before);
    });

    if (layout === 'desktop') {
      test('a plan abandoned with Escape is not written', async () => {
        const before = await ledger.read(THIS_MONTH);

        await shell.goTo('budget');
        const field = budget.planField('Food');
        await field.fill('999,99');
        await field.press('Escape');

        await expect(field).toHaveValue('400,00');
        // Long enough for a write to have landed, had there been one.
        await page.waitForTimeout(1_000);
        expect(await ledger.read(THIS_MONTH)).toEqual(before);
        await expect(field).toHaveValue('400,00');
      });

      test('a plan typed with a dot is the amount it says', async () => {
        const before = await ledger.read(THIS_MONTH);
        const food = before.month.categories.Food;

        // The keypad's dot, on a page that writes amounts with a comma:
        // R$ 452,75, and not the R$ 45.275,00 that dropping the dot makes.
        await shell.goTo('budget');
        const field = budget.planField('Food');
        await field.fill('452.75');
        await field.press('Enter');

        await fileAfter(before, file => {
          file.month.budgeted += 45275 - food.budgeted;
          file.month.toDistribute -= 45275 - food.budgeted;
          file.month.categories.Food.budgeted = 45275;
          file.month.categories.Food.available += 45275 - food.budgeted;
        });
        await expect(field).toHaveValue('452,75');

        await budget.plan('Food', food.budgeted);
        await expect(async () => {
          expect(await ledger.read(THIS_MONTH)).toEqual(before);
        }).toPass();
      });

      test('a split transaction is counted once, by its parts', async () => {
        const before = await ledger.read(THIS_MONTH);

        const register = await new Navigation(page).goToAccountPage(SAVINGS);
        await register.createSplitTransaction([
          { payee: 'Kroger', notes: 'qa rateio', debit: '30.00' },
          { category: 'Food', debit: '20.00' },
          { category: 'Restaurants', debit: '10.00' },
        ]);

        const after = await fileAfter(before, file => {
          file.transactionCount += 1;
          move(file, SAVINGS, -3000);
          file.month.spent += 3000;
          file.month.cashOut += 3000;
          file.month.categories.Food.spent += 2000;
          file.month.categories.Food.available -= 2000;
          file.month.categories.Restaurants.spent += 1000;
          file.month.categories.Restaurants.available -= 1000;
        });
        await expectPagesToAgree(after);

        await entries.remove({ notes: 'qa rateio' });
        await expect(async () => {
          expect(await ledger.read(THIS_MONTH)).toEqual(before);
        }).toPass();
      });
    }

    test('an expense with no category leaves the account and waits to be planned', async () => {
      const before = await ledger.read(THIS_MONTH);

      // No payee either: the application files a known payee's transactions
      // under the category it learnt for them, and this one is to have none.
      await entries.add({
        account: SAVINGS,
        amount: -3210,
        notes: 'qa sem categoria',
      });

      // The account paid, and the Reports — a cash flow — count it. No
      // envelope did: the Budget's month and the Home's stand as they were.
      const after = await fileAfter(before, file => {
        file.transactionCount += 1;
        move(file, SAVINGS, -3210);
        file.month.cashOut += 3210;
      });
      expect(after.month.spent).toBe(before.month.spent);
      await expectPagesToAgree(after);

      // Which is why the application has to say that it is waiting, and where
      // to deal with it: in its header on the desktop, whichever page is
      // open, and on the phone at the top of the Budget, with what it adds
      // up to.
      const waitingOnDesktop = page.getByRole('button', {
        name: /^\d+ uncategorized transactions$/,
      });
      const waitingOnPhone = page.getByText(/^Você tem \d+ transaç/);
      if (layout === 'desktop') {
        await expect(waitingOnDesktop).toHaveText(
          '1 uncategorized transactions',
        );
        await waitingOnDesktop.click();
      } else {
        await shell.goTo('budget');
        await expect(waitingOnPhone).toHaveText(
          'Você tem 1 transação sem categoria',
        );
        await expect(page.getByText(/-R\$\s?32,10/).first()).toBeVisible();
        await page
          .getByRole('button', { name: 'Categorizar transações sem categoria' })
          .click();
      }
      await expect(page).toHaveURL(/\/categories\/uncategorized$/);
      await expect(page.getByText('qa sem categoria').first()).toBeVisible();

      // Given a category, it is spending like any other and nothing waits.
      await entries.change({ notes: 'qa sem categoria' }, { category: 'Food' });
      const planned = await fileAfter(after, file => {
        file.month.spent += 3210;
        file.month.categories.Food.spent += 3210;
        file.month.categories.Food.available -= 3210;
      });
      await expectPagesToAgree(planned);
      await shell.goTo('budget');
      await expect(waitingOnDesktop.or(waitingOnPhone)).toHaveCount(0);

      await entries.remove({ notes: 'qa sem categoria' });
      await expect(async () => {
        expect(await ledger.read(THIS_MONTH)).toEqual(before);
      }).toPass();
    });

    test('an account spent past its balance says so', async () => {
      const before = await ledger.read(THIS_MONTH);

      // R$ 250,75 out of an account that holds R$ 190,00.
      await entries.add({
        account: WALLET,
        payee: 'Kroger',
        category: 'Food',
        amount: -25075,
        notes: 'qa negativo',
      });

      const after = await fileAfter(before, file => {
        file.transactionCount += 1;
        move(file, WALLET, -25075);
        file.month.spent += 25075;
        file.month.cashOut += 25075;
        file.month.categories.Food.spent += 25075;
        file.month.categories.Food.available -= 25075;
      });
      expect(after.balances[WALLET]).toBe(-6075);
      await expectPagesToAgree(after);

      // Written as money below zero is written: the minus ahead of the
      // symbol, on the page that lists the account.
      await shell.goTo('accounts');
      await expect(
        shell.main
          .getByTestId('account-list-item')
          .filter({ hasText: WALLET })
          .getByTestId('account-balance'),
      ).toHaveText(/^-R\$\s?60,75$/);

      await entries.remove({ notes: 'qa negativo' });
      await expect(async () => {
        expect(await ledger.read(THIS_MONTH)).toEqual(before);
      }).toPass();
    });

    test('covering an overspent category moves the plan between two envelopes', async () => {
      const before = await ledger.read(THIS_MONTH);
      const { Clothing: clothing, Food: food } = before.month.categories;
      const overspent = -clothing.available;
      expect(overspent).toBe(6000);

      await shell.goTo('budget');
      await budget.cover('Clothing', 'Food');

      // Food gives up what Clothing was short of. The month's plan, what it
      // spent and what is left to distribute are the same as before.
      const after = await fileAfter(before, file => {
        file.month.categories.Clothing.budgeted += overspent;
        file.month.categories.Clothing.available = 0;
        file.month.categories.Food.budgeted -= overspent;
        file.month.categories.Food.available -= overspent;
      });
      expect(after.month.budgeted).toBe(before.month.budgeted);
      await expectPagesToAgree(after);

      await shell.goTo('budget');
      await budget.plan('Clothing', clothing.budgeted);
      await budget.plan('Food', food.budgeted);
      await expect(async () => {
        expect(await ledger.read(THIS_MONTH)).toEqual(before);
      }).toPass();
    });

    test('an entry of nothing changes nothing', async () => {
      const before = await ledger.read(THIS_MONTH);

      await entries.add({
        account: SAVINGS,
        payee: 'Kroger',
        category: 'Food',
        amount: 0,
        notes: 'qa zero',
      });

      const after = await fileAfter(before, file => {
        file.transactionCount += 1;
      });
      await expectPagesToAgree(after);

      await entries.remove({ notes: 'qa zero' });
      await expect(async () => {
        expect(await ledger.read(THIS_MONTH)).toEqual(before);
      }).toPass();
    });

    if (layout === 'mobile') {
      // The phone enters a transfer on the form it enters everything on, by
      // naming the other account where a payee would go. These hold the form
      // to saying which of the two it took, before and after it saves.
      test('an account named as the payee is offered as a transfer before a new payee', async () => {
        const before = await ledger.read(THIS_MONTH);
        const payees = await ledger.payees();

        await entries.openNewForm();
        await entries.enterAmount(-8040);
        await entries.field('payee').click();
        await entries.search.pressSequentially(CHECKING);

        // The account first. A payee of that name can still be made — after
        // it, where a tap on the top of the list does not land.
        await expect(entries.options).toHaveText([
          CHECKING,
          `Create payee "${CHECKING}"`,
        ]);
        await entries.options.first().click();
        await entries.search.waitFor({ state: 'hidden' });

        // The form says what it now holds: a transfer, which takes no category.
        await expect(entries.field('payee')).toContainText(
          `Transfer to ${CHECKING}`,
        );
        await expect(entries.field('category')).toContainText('Transfer');
        await expect(entries.field('category')).toBeDisabled();

        await entries.pick(entries.field('account'), SAVINGS);
        await entries.describe('qa transferencia digitada');
        await entries.submitNew();

        // And what it recorded.
        await expect(entries.notice('Transfer added.')).toBeVisible();
        const after = await fileAfter(before, file => {
          file.transactionCount += 2;
          move(file, SAVINGS, -8040);
          move(file, CHECKING, 8040);
        });
        expect(after.total).toBe(before.total);
        expect(after.month).toEqual(before.month);
        // Nobody called "HSBC" was made on the way.
        expect(await ledger.payees()).toEqual(payees);
        await expectPagesToAgree(after);

        await entries.remove({
          notes: 'qa transferencia digitada',
          account: SAVINGS,
        });
        await expect(entries.notice('Transfer deleted.')).toBeVisible();
        await expect(async () => {
          expect(await ledger.read(THIS_MONTH)).toEqual(before);
        }).toPass();
        expect(await ledger.payees()).toEqual(payees);
      });

      test('the transfer side of the payee list offers accounts and nothing to create', async () => {
        const before = await ledger.read(THIS_MONTH);
        const payees = await ledger.payees();

        await entries.openNewForm();
        await entries.enterAmount(-2550);
        await entries.field('payee').click();
        await expect(entries.payeeKind('Payee')).toHaveAttribute(
          'aria-pressed',
          'true',
        );

        await entries.payeeKind('Transfer').click();
        await expect(entries.payeeKind('Transfer')).toHaveAttribute(
          'aria-pressed',
          'true',
        );
        // Every account of the file, and nothing that is not one.
        const offered = await entries.options.allInnerTexts();
        expect(offered).toEqual(expect.arrayContaining(ACCOUNTS));
        expect(offered).not.toContain('Kroger');

        // A name no account has finds nothing here — and no payee to make.
        await entries.search.pressSequentially('Padaria');
        await expect(entries.options).toHaveCount(0);

        // The other side is one tap away, and there the name can be made one.
        await entries.payeeKind('Payee').click();
        await entries.search.pressSequentially('Padaria');
        await expect(entries.options).toHaveText(['Create payee "Padaria"']);

        await entries.payeeKind('Transfer').click();
        await entries.options.filter({ hasText: WALLET }).click();
        await entries.search.waitFor({ state: 'hidden' });
        await expect(entries.field('payee')).toContainText(
          `Transfer to ${WALLET}`,
        );

        // Left without adding: looking through the list wrote nothing.
        await entries.backToTheBar();
        expect(await ledger.read(THIS_MONTH)).toEqual(before);
        expect(await ledger.payees()).toEqual(payees);
      });

      test('the phone says what it did to a transaction, clear of the bar', async () => {
        const before = await ledger.read(THIS_MONTH);

        await entries.add({
          account: SAVINGS,
          payee: 'Kroger',
          category: 'Food',
          amount: -1999,
          notes: 'qa aviso',
        });
        await expect(entries.notice('Transaction added.')).toBeVisible();
        // The notice stands clear of the bar: the action a person adding
        // several transactions reaches for next is not under it. Asked of the
        // page itself — what is on top at the action's upper edge, which is
        // the part of it raised out of the bar.
        const isActionOnTop = await shell.navigation
          .getByRole('button', { name: 'New transaction' })
          .evaluate(action => {
            const box = action.getBoundingClientRect();
            const onTop = document.elementFromPoint(
              box.left + box.width / 2,
              box.top + 2,
            );
            return action.contains(onTop);
          });
        expect(isActionOnTop).toBe(true);

        const added = await fileAfter(before, file => {
          file.transactionCount += 1;
          move(file, SAVINGS, -1999);
          file.month.spent += 1999;
          file.month.cashOut += 1999;
          file.month.categories.Food.spent += 1999;
          file.month.categories.Food.available -= 1999;
        });

        await entries.change({ notes: 'qa aviso' }, { amount: -2999 });
        await expect(entries.notice('Transaction updated.')).toBeVisible();
        const changed = await fileAfter(added, file => {
          move(file, SAVINGS, -1000);
          file.month.spent += 1000;
          file.month.cashOut += 1000;
          file.month.categories.Food.spent += 1000;
          file.month.categories.Food.available -= 1000;
        });

        await expectPagesToAgree(changed);

        await entries.remove({ notes: 'qa aviso' });
        await expect(entries.notice('Transaction deleted.')).toBeVisible();
        await expect(async () => {
          expect(await ledger.read(THIS_MONTH)).toEqual(before);
        }).toPass();
      });

      test('covering from no category covers nothing and asks for one', async () => {
        const before = await ledger.read(THIS_MONTH);

        await shell.goTo('budget');
        await budget.openCover('Clothing');
        // The phone opens its list of categories at once; it is closed here
        // with none chosen.
        await entries.search.waitFor();
        await page.keyboard.press('Escape');
        await entries.search.waitFor({ state: 'hidden' });

        // Sent as it is, the form does not close as though it had covered
        // something: it asks again for what it is missing.
        await budget.coverAction.click();
        await expect(entries.search).toBeVisible();
        await expect(budget.coverAction).toBeAttached();

        await expect(async () => {
          await page.keyboard.press('Escape');
          await expect(page.getByRole('dialog')).toHaveCount(0, {
            timeout: 1_000,
          });
        }).toPass();
        expect(await ledger.read(THIS_MONTH)).toEqual(before);
      });
    }

    test('a new account opens with the balance it is given', async () => {
      const before = await ledger.read(THIS_MONTH);
      // Everything the suite entered so far it also took back.
      expect(before).toEqual(opening);

      await entries.addAccount(NEW_ACCOUNT, NEW_ACCOUNT_BALANCE);

      // An opening balance is money the budget did not have: it arrives as
      // income of today, and is left to be distributed.
      const after = await fileAfter(before, file => {
        file.transactionCount += 1;
        file.balances[NEW_ACCOUNT] = 0;
        move(file, NEW_ACCOUNT, NEW_ACCOUNT_BALANCE);
        file.month.income += NEW_ACCOUNT_BALANCE;
        file.month.cashIn += NEW_ACCOUNT_BALANCE;
        file.month.toDistribute += NEW_ACCOUNT_BALANCE;
      });
      await expectPagesToAgree(after);

      // It is on the Home too, with what it holds.
      await shell.goTo('home');
      await expect(async () => {
        expect((await books.home([NEW_ACCOUNT])).balances).toEqual({
          [NEW_ACCOUNT]: NEW_ACCOUNT_BALANCE,
        });
      }).toPass();
    });

    if (layout === 'mobile') {
      // The desktop's Budget lists the categories and has nowhere to make
      // one; the phone's does, from a group's own menu.
      test('a new category needs a name, and then plans and spends like any other', async () => {
        const before = await ledger.read(THIS_MONTH);

        await shell.goTo('budget');
        await page
          .getByRole('button', { name: 'Abrir menu do grupo Usual Expenses' })
          .click();
        await page.getByRole('button', { name: 'Add category' }).click();

        const add = page.getByRole('button', { name: 'Add', exact: true });
        await add.click();
        await expect(page.getByText('Name is required.')).toBeVisible();

        await page.getByPlaceholder('Category name').fill(NEW_CATEGORY);
        await add.click();
        await expect(
          shell.main.getByTestId('category-name').filter({
            hasText: NEW_CATEGORY,
          }),
        ).toBeVisible();

        // R$ 80,00 planned, R$ 30,15 of it spent.
        await budget.plan(NEW_CATEGORY, 8000);
        await entries.add({
          account: SAVINGS,
          category: NEW_CATEGORY,
          amount: -3015,
          notes: 'qa categoria nova',
        });

        const row = { budgeted: 8000, spent: 3015, available: 4985 };
        const after = await fileAfter(before, file => {
          file.transactionCount += 1;
          move(file, SAVINGS, -3015);
          file.month.budgeted += 8000;
          file.month.toDistribute -= 8000;
          file.month.spent += 3015;
          file.month.cashOut += 3015;
          file.month.categories[NEW_CATEGORY] = row;
        });
        await expectPagesToAgree(after);

        await shell.goTo('budget');
        await expect(async () => {
          expect(
            (await books.budget([NEW_CATEGORY])).categories[NEW_CATEGORY],
          ).toEqual(row);
        }).toPass();
      });
    }

    test('the narrower window prints the same books, and nothing left the machine', async () => {
      // The file as the suite leaves it: the one it opened, and what the
      // tests above added to it for good.
      const file = await ledger.read(THIS_MONTH);

      await page.setViewportSize(V2_NARROWER[layout]);
      await expectPagesToAgree(file);
      for (const name of V2_PAGES) {
        await shell.goTo(name);
        await shell.settledFigures();
        expect(await shell.figuresOutOfBounds(), name).toEqual([]);
      }
      await page.setViewportSize(V2_VIEWPORTS[layout].viewport);

      // The profile still holds the one unsynced file and no server; what the
      // suite left behind is that file's own preferences, such as the month
      // the Budget was turned to.
      const profile = await ledger.profile();
      expect(profile).toMatchObject({
        files: profileAfter.files,
        serverUrl: null,
        cookies: '',
      });
      expect(
        profile.localStorageKeys.filter(
          key => !key.startsWith('_test-budget-'),
        ),
      ).toEqual([]);
      expect([...requestedOrigins]).toEqual([appOrigin]);
    });
  });
}
