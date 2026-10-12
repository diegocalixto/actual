/**
 * The smoke suite of the four V2 pages — Home, Budget, Accounts, Reports —
 * shared by the desktop and the phone layout:
 *
 *   yarn workspace @actual-app/web run playwright test v2-pages --browser=chromium
 *
 * `v2-pages.test.ts` runs it at 1440×900 and `v2-pages.mobile.test.ts` at
 * 428×926 with touch. It asserts what a person relies on rather than how a
 * page is built: that the navigation reaches each page, that the accounts,
 * categories and indicators of the test file are on it, that the balances add
 * up, and that privacy mode leaves no amount readable.
 */
import type { Page } from '@playwright/test';

import { expect, test } from './fixtures';
import { ConfigurationPage } from './page-models/configuration-page';
import { V2_PAGES, V2Shell } from './page-models/v2-shell';
import type { V2Layout } from './page-models/v2-shell';

/** The accounts of the test file, in the order the file lists them. */
const ACCOUNTS = [
  'Bank of America',
  'Ally Savings',
  'Capital One Checking',
  'HSBC',
  'Vanguard 401k',
  'Mortgage',
  'House Asset',
  'Roth IRA',
];

/** The expense categories of the test file. */
const EXPENSE_CATEGORIES = [
  'Food',
  'Restaurants',
  'Entertainment',
  'Clothing',
  'General',
  'Gift',
  'Medical',
  'Savings',
  'Cell',
  'Internet',
  'Mortgage',
  'Water',
  'Power',
];

const VIEWPORTS = {
  desktop: { viewport: { width: 1440, height: 900 } },
  // A phone, with a finger: privacy mode reveals by touch there, and a mouse
  // would exercise the desktop's path instead.
  mobile: {
    viewport: { width: 428, height: 926 },
    hasTouch: true,
    isMobile: true,
  },
};

/** A figure that has arrived: digits, a comma and two decimals. */
const AMOUNT = /\d,\d{2}$/;

/** "R$ 1.234,56", "-R$312.500,00" or "1.234,56", as integer cents. */
function toCents(text: string) {
  const digits = text.replace(/[^\d,]/g, '').replace(',', '.');
  const cents = Math.round(Number(digits) * 100);
  return text.includes('-') ? -cents : cents;
}

/**
 * The four V2 pages, on one layout.
 *
 * Read-only by design: every test looks, navigates or flips a display
 * preference, so the whole group shares one page and one test file instead of
 * building a file per test. A failure stops the group, and a retry builds a
 * fresh file.
 */
export function describeV2Pages(layout: V2Layout) {
  test.describe(`V2 pages (${layout})`, () => {
    test.describe.configure({ mode: 'serial' });

    let page: Page;
    let shell: V2Shell;

    test.beforeAll(async ({ browser }, testInfo) => {
      // Building the test file is most of the group's cost.
      testInfo.setTimeout(120_000);

      page = await browser.newPage(VIEWPORTS[layout]);
      await page.goto('/');
      await new ConfigurationPage(page).createTestFile();
      shell = new V2Shell(page, layout);
    });

    test.afterEach(async () => {
      // Whatever a test did with privacy mode, the next one starts with it off.
      await shell.setPrivacy(false);
    });

    test.afterAll(async () => {
      await page?.close();
    });

    test('the navigation reaches the four pages', async () => {
      for (const name of V2_PAGES) {
        await shell.goTo(name);

        await expect(page).toHaveURL(new RegExp(`${shell.routeOf(name)}(/|$)`));
        await expect(shell.title).toHaveText(shell.titleOf(name));
        // The phone keeps Reports behind "Mais", so nothing on the bar is
        // current there; everywhere else the bar says where you are.
        if (layout === 'mobile' && name === 'reports') {
          await expect(shell.currentDestination).toHaveCount(0);
        } else {
          await expect(shell.currentDestination).toHaveText(
            shell.labelOf(name),
          );
        }
      }
    });

    test('Home shows the balances, the month and every account', async () => {
      // The total the Accounts page states is the one Home has to repeat.
      await shell.goTo('accounts');
      const totalBalance = page.getByTestId('accounts-total-balance');
      // The total is a dash until its cell resolves: wait for the figure, or
      // the comparison below would be made against nothing.
      await expect(totalBalance).toHaveText(AMOUNT);
      const totalDigits = (await totalBalance.innerText()).replace(
        /[^\d.,]/g,
        '',
      );

      await shell.goTo('home');

      for (const account of ACCOUNTS) {
        await expect(
          shell.main.getByText(account, { exact: true }).first(),
        ).toBeVisible();
      }
      await expect(shell.main.getByText(totalDigits).first()).toBeVisible();

      if (layout === 'desktop') {
        for (const section of [
          'Accounts',
          'This month',
          'Spending this month',
          'Recent activity',
        ]) {
          await expect(
            shell.main.getByRole('heading', {
              level: 2,
              name: section,
              exact: true,
            }),
          ).toBeVisible();
        }
      } else {
        // On the phone the balance card is also the way into the budget.
        await page.getByRole('button', { name: 'Abrir o orçamento' }).click();
        await shell.waitForPage('budget');
      }

      await expect
        .poll(async () => (await shell.figures()).readable.length)
        .toBeGreaterThan(10);
    });

    test('Budget lists the categories of the month and steps between months', async () => {
      await shell.goTo('budget');

      const categories = shell.main.getByTestId('category-name');
      await expect(categories.first()).toBeVisible();
      const names = await categories.allInnerTexts();
      expect(names).toEqual(expect.arrayContaining(EXPENSE_CATEGORIES));

      if (layout === 'desktop') {
        // One editable plan per expense category.
        await expect(shell.main.getByRole('textbox')).toHaveCount(
          EXPENSE_CATEGORIES.length,
        );
      } else {
        await expect(shell.main.getByTestId('category-group-name')).toHaveText([
          'Usual Expenses',
          'Bills',
          'Income',
        ]);
      }
      await expect
        .poll(async () => (await shell.figures()).readable.length)
        .toBeGreaterThan(EXPENSE_CATEGORIES.length);

      // Stepping back a month and forward again: the month named on the page
      // changes and comes back. Looking at another month writes nothing.
      const previous = page.getByRole('button', { name: 'Mês anterior' });
      const next = page.getByRole('button', { name: 'Próximo mês' });
      const month =
        layout === 'desktop'
          ? previous.locator('..')
          : page.getByRole('button', { name: 'Ações do mês' });
      const current = await month.innerText();

      await previous.click();
      await expect(month).not.toHaveText(current);
      await expect(categories.first()).toBeVisible();

      await next.click();
      await expect(month).toHaveText(current);
    });

    test('Accounts lists every account and the balances add up to the total', async () => {
      await shell.goTo('accounts');

      const rows = shell.main.getByTestId('account-list-item');
      await expect(rows).toHaveCount(ACCOUNTS.length);
      await expect(shell.main.getByTestId('account-name')).toHaveText(ACCOUNTS);

      const balanceCells = shell.main.getByTestId('account-balance');
      await expect(balanceCells).toHaveText(ACCOUNTS.map(() => AMOUNT));
      const balances = await balanceCells.allInnerTexts();
      // The minus leads the symbol on both layouts: "-R$ 1,00", never
      // "R$ -1,00".
      for (const balance of balances) {
        expect(balance.replace(/\s/g, '')).toMatch(/^-?R\$\d[\d.]*,\d{2}$/);
      }

      const totalBalance = shell.main.getByTestId('accounts-total-balance');
      await expect(totalBalance).toHaveText(AMOUNT);
      const total = await totalBalance.innerText();
      const sum = balances.reduce((cents, text) => cents + toCents(text), 0);
      expect(sum).not.toBe(0);
      expect(toCents(total)).toBe(sum);
    });

    test('Reports shows the indicators and the charts', async () => {
      await shell.goTo('reports');

      if (layout === 'desktop') {
        for (const card of [
          'Top categories',
          'Expenses by category',
          'Monthly comparison',
        ]) {
          await expect(
            shell.main.getByRole('heading', {
              level: 2,
              name: card,
              exact: true,
            }),
          ).toBeVisible();
        }
        for (const indicator of [
          'Income',
          'Expenses',
          'Net Result',
          'Savings Rate',
        ]) {
          await expect(
            shell.main.getByText(indicator, { exact: true }).first(),
          ).toBeVisible();
        }
        // The period has transactions, so the chart is drawn and not its
        // empty state.
        await expect(
          shell.main.getByText('Income, Expenses & Net Result'),
        ).toBeVisible();
        await expect(
          shell.main.getByText('No transactions in this period.'),
        ).toHaveCount(0);
      } else {
        await expect(page.getByTestId('reports-overview')).toBeVisible();
        for (const indicator of [
          'Total Income (YTD)',
          'Total Expenses (YTD)',
          'Avg Per Month',
          'Avg Per Transaction',
        ]) {
          await expect(
            shell.main.getByRole('heading', { level: 2, name: indicator }),
          ).toBeVisible();
        }
      }

      await expect
        .poll(async () => (await shell.figures()).readable.length)
        .toBeGreaterThan(0);

      // The dashboard draws a card when it comes on screen, so the first
      // chart is one scroll below the indicators on a phone.
      if (layout === 'mobile') {
        await shell.main.getByRole('button').nth(4).scrollIntoViewIfNeeded();
      }
      await expect(shell.main.locator('svg').first()).toBeVisible({
        timeout: 30_000,
      });
    });

    test('privacy mode hides every amount on the four pages and gives them back', async () => {
      for (const name of V2_PAGES) {
        await shell.goTo(name);
        const before = await shell.settledFigures();
        expect(before.readable.length).toBeGreaterThan(0);
        expect(before.hidden).toBe(0);

        // Nothing readable and nothing spelled out in a label, with every
        // amount that was there still in the page, hidden. A card that lands
        // late can only add to the count.
        await shell.setPrivacy(true);
        await expect
          .poll(() => shell.figures())
          .toMatchObject({ readable: [], labelled: [] });
        expect((await shell.figures()).hidden).toBeGreaterThanOrEqual(
          before.readable.length,
        );

        await shell.setPrivacy(false);
        await expect.poll(async () => (await shell.figures()).hidden).toBe(0);
        expect((await shell.figures()).readable).toEqual(
          expect.arrayContaining(before.readable),
        );
      }
    });

    test('privacy mode follows the navigation, and one amount can be looked at', async () => {
      await shell.goTo('home');
      await shell.setPrivacy(true);

      for (const name of V2_PAGES) {
        await shell.goTo(name);
        await expect
          .poll(async () => (await shell.figures()).hidden)
          .toBeGreaterThan(0);
        expect((await shell.figures()).readable).toEqual([]);
      }

      await shell.goTo('accounts');
      const { x, y } = await shell.hiddenFigurePosition();

      if (layout === 'desktop') {
        // Resting the pointer on an amount shows that one; moving off hides it.
        await page.mouse.move(x, y);
        await expect
          .poll(async () => (await shell.figures()).readable.length)
          .toBe(1);
        await page.mouse.move(0, 0);
      } else {
        // A tap shows that one; a second tap hides it again.
        await page.touchscreen.tap(x, y);
        await expect
          .poll(async () => (await shell.figures()).readable.length)
          .toBe(1);
        await page.touchscreen.tap(x, y);
      }
      await expect
        .poll(async () => (await shell.figures()).readable)
        .toEqual([]);
    });

    test('an amount printed outside the privacy filter is noticed', async () => {
      // The guard on the two tests above: if the way they read the page ever
      // stopped seeing amounts, they would pass on a page that leaks them.
      await shell.goTo('accounts');
      await shell.setPrivacy(true);
      await expect
        .poll(async () => (await shell.figures()).readable)
        .toEqual([]);

      await shell.main.first().evaluate(root => {
        const leak = document.createElement('span');
        leak.setAttribute('data-e2e-leak', '');
        leak.textContent = 'R$ 1.234,56';
        root.append(leak);
      });
      expect((await shell.figures()).readable).toEqual(['R$ 1.234,56']);

      await page.locator('[data-e2e-leak]').evaluate(leak => leak.remove());
      expect((await shell.figures()).readable).toEqual([]);
    });
  });
}
