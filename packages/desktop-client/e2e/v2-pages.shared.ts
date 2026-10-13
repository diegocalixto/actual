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
 * up, that privacy mode leaves no amount readable, that a control is large
 * enough for the finger it is meant for, and that an amount is printed whole
 * however long it is.
 */
import type { Page } from '@playwright/test';

import { expect, test } from './fixtures';
import { ConfigurationPage } from './page-models/configuration-page';
import { V2Books } from './page-models/v2-books';
import {
  V2_NARROWER as NARROWER,
  V2_PAGES,
  V2Shell,
  V2_VIEWPORTS as VIEWPORTS,
} from './page-models/v2-shell';
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

/** The smallest side iOS asks of something a finger has to hit. */
const TOUCH_TARGET = 44;

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
 * fresh file. The one test that writes — it plans a category in the millions
 * to see the amount printed whole — is the last, so nothing reads the file
 * after it.
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
        // The phone's sections are headings too: a title is not the only
        // place a screen reader's user can jump to.
        for (const section of [
          'Este mês',
          'Contas',
          'Evolução do saldo',
          'Transações recentes',
        ]) {
          await expect(
            shell.main.getByRole('heading', {
              level: 2,
              name: section,
              exact: true,
            }),
          ).toBeVisible();
        }
        // An account below zero is written as the Accounts page writes it:
        // the minus ahead of the symbol, never "R$ -312.500,00".
        await expect(
          shell.main.getByRole('button', {
            name: 'Ver transações de Mortgage',
          }),
        ).toHaveText(/-R\$\s?312\.500,00/);

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
        // One editable plan per expense category, each named for its own.
        await expect(shell.main.getByRole('textbox')).toHaveCount(
          EXPENSE_CATEGORIES.length,
        );
        for (const category of EXPENSE_CATEGORIES) {
          await expect(
            shell.main.getByRole('textbox', {
              name: `Orçado de ${category}`,
              exact: true,
            }),
          ).toHaveCount(1);
          // And one set of actions, which says whose it is.
          await expect(
            shell.main.getByRole('button', {
              name: `Ações da categoria ${category}`,
              exact: true,
            }),
          ).toHaveCount(1);
        }
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

      // One page in two arrangements. The phone leaves the ranked list to
      // the ring's legend, and lists the detailed reports the desktop keeps
      // behind the chart's menu.
      for (const card of layout === 'desktop'
        ? ['Top categories', 'Expenses by category', 'Monthly comparison']
        : ['Expenses by category', 'Monthly comparison', 'Detailed reports']) {
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
      // The phone no longer opens on the dashboard of widgets.
      await expect(page.getByTestId('reports-overview')).toHaveCount(0);

      await expect
        .poll(async () => (await shell.figures()).readable.length)
        .toBeGreaterThan(0);
      await expect(shell.main.locator('svg').first()).toBeVisible({
        timeout: 30_000,
      });
    });

    test('Reports steps between months, jumps to one and comes back', async () => {
      await shell.goTo('reports');

      const previous = page.getByRole('button', { name: 'Mês anterior' });
      const next = page.getByRole('button', { name: 'Próximo mês' });
      const period = page.getByRole('button', { name: /^Period: / });

      // It opens on the current month, which is as far forward as it goes.
      await expect(period).toHaveAttribute('data-month', '2017-01');
      await expect(period).toHaveText('This month');
      await expect(next).toBeDisabled();
      await expect(previous).toBeEnabled();
      const thisMonth = await shell.settledFigures();

      // A step back: the month is in the address and on the control, and the
      // figures are another month's.
      await previous.click();
      await expect(period).toHaveAttribute('data-month', '2016-12');
      await expect(period).toHaveText('Dezembro de 2016');
      await expect(page).toHaveURL(/\/reports\?month=2016-12$/);
      await expect(next).toBeEnabled();
      await expect(
        shell.main.getByText('1 dez – 31 dez de 2016', { exact: false }),
      ).toBeVisible();
      await expect
        .poll(async () => (await shell.settledFigures()).readable)
        .not.toEqual(thisMonth.readable);

      // Every indicator is now measured against the month before that one.
      await expect(
        shell.main.getByText('vs novembro', { exact: true }).first(),
      ).toBeVisible();

      // The menu lists the months there is something to show for, and the
      // first of them is the way back.
      await period.click();
      const months = page.getByRole('menu').getByRole('button');
      await expect(months.first()).toHaveText('This month');
      await expect(months.nth(1)).toHaveText('Dezembro de 2016');
      expect(await months.count()).toBeGreaterThan(2);
      await months.nth(2).click();
      await expect(period).toHaveAttribute('data-month', '2016-11');
      await expect(page.getByRole('menu')).toHaveCount(0);

      await period.click();
      await page
        .getByRole('menu')
        .getByRole('button', { name: 'This month', exact: true })
        .click();
      await expect(period).toHaveAttribute('data-month', '2017-01');
      // Asked for nothing, the address says nothing.
      await expect(page).toHaveURL(/\/reports$/);
      await expect
        .poll(async () => (await shell.settledFigures()).readable)
        .toEqual(thisMonth.readable);
    });

    test('the links of the Reports open what they name', async () => {
      await shell.goTo('reports');
      // December has more categories than a card opens on.
      await page.getByRole('button', { name: 'Mês anterior' }).click();
      await expect(
        page.getByRole('button', { name: /^Period: / }),
      ).toHaveAttribute('data-month', '2016-12');
      await shell.settledFigures();

      // "View all…" brings in the rest of a card's own list, and puts it
      // away again. December has six categories, one more than a ranking
      // opens on — which is the desktop's ranked list, and the phone's ring.
      const [title, link] =
        layout === 'desktop'
          ? ['Top categories', 'View all spending']
          : ['Expenses by category', 'View all categories'];
      const card = shell.main
        .getByRole('heading', { level: 2, name: title })
        .locator('xpath=ancestor::div[3]');
      // A row ends on its share of the total.
      const rows = card.getByText(/^\d+,\d%$/);
      const viewAll = card.getByRole('button', { name: link });
      await viewAll.scrollIntoViewIfNeeded();
      await expect(viewAll).toHaveAttribute('aria-expanded', 'false');
      await expect(rows).toHaveCount(5);
      await viewAll.click();
      const fewer = card.getByRole('button', { name: 'Show fewer' });
      await expect(fewer).toHaveAttribute('aria-expanded', 'true');
      await expect(rows).toHaveCount(6);
      await fewer.click();
      await expect(rows).toHaveCount(5);

      if (layout === 'desktop') {
        // The ring's legend opens on six: in a month of six it has nothing
        // more to bring in, and offers no link that would do nothing.
        await expect(
          shell.main.getByRole('button', { name: 'View all categories' }),
        ).toHaveCount(0);

        // The comparison's link is the cash-flow report — which opens, though
        // nothing here has been to the dashboard first: reached on its own
        // address it used to wait for a widget it was never going to get.
        await shell.main
          .getByRole('button', { name: 'View full comparison' })
          .click();
        await expect(page).toHaveURL(/\/reports\/cash-flow$/);
        await expect(
          page.getByTestId('reports-page').getByText('Cash Flow', {
            exact: true,
          }),
        ).toBeVisible({ timeout: 45_000 });
        // Back is this page again, on the month it was left on.
        await page.goBack();
        await expect(page).toHaveURL(/\/reports\?month=2016-12$/);
        await shell.waitForPage('reports');

        // The chart's menu names the four detailed reports.
        await page.getByRole('button', { name: 'Detailed reports' }).click();
        const reports = page.getByRole('menu').getByRole('button');
        await expect(reports).toHaveText([
          'Cash flow report',
          'Net worth report',
          'Spending report',
          'Custom dashboard',
        ]);
        await reports.nth(2).click();
        await expect(page).toHaveURL(/\/reports\/spending$/);
        await expect(
          page.getByTestId('reports-page').getByText('Monthly Spending', {
            exact: true,
          }),
        ).toBeVisible({ timeout: 45_000 });
        await page.goBack();
        await shell.waitForPage('reports');
      } else {
        // The phone lists them, each a row a finger can hit.
        const detailed = shell.main
          .getByRole('heading', { level: 2, name: 'Detailed reports' })
          .locator('xpath=ancestor::div[4]');
        const rows = detailed.getByRole('button');
        await expect(rows).toHaveText([
          'Cash flow report',
          'Net worth report',
          'Spending report',
          'Custom dashboard',
        ]);
        for (const row of await rows.all()) {
          await row.scrollIntoViewIfNeeded();
          expect((await row.boundingBox())?.height).toBeGreaterThanOrEqual(
            TOUCH_TARGET,
          );
        }

        // A detailed report opens — though nothing here has been to the
        // dashboard first: reached on its own address it used to wait for a
        // widget it was never going to get — and its own back button
        // returns here.
        await rows.first().click();
        await expect(page).toHaveURL(/\/reports\/cash-flow$/);
        await expect(shell.title).toHaveText('Cash Flow', { timeout: 45_000 });
        await page.getByRole('button', { name: 'Back' }).click();
        await shell.waitForPage('reports');

        // The dashboard the phone used to open on is one row away.
        await rows.nth(3).click();
        await expect(page.getByTestId('reports-overview')).toBeVisible({
          timeout: 45_000,
        });
        await page.goBack();
        await shell.waitForPage('reports');
      }

      // Left as it was found: the current month.
      const period = page.getByRole('button', { name: /^Period: / });
      if ((await period.getAttribute('data-month')) !== '2017-01') {
        await period.click();
        await page
          .getByRole('menu')
          .getByRole('button', { name: 'This month', exact: true })
          .click();
      }
      await expect(period).toHaveAttribute('data-month', '2017-01');
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

    if (layout === 'mobile') {
      test('the top bar can be read in a light and in a dark appearance', async () => {
        // A phone follows its owner's appearance and the application follows
        // the phone, but these four pages paint their bar on a ground that is
        // dark either way. What is drawn on it has to be light either way.
        const BAR = {
          home: ['Ocultar valores'],
          budget: [
            'Mês anterior',
            'Ações do mês',
            'Próximo mês',
            'Ocultar valores',
          ],
          accounts: ['Adicionar conta', 'Ocultar valores'],
          reports: ['Ocultar valores'],
        } as const;

        for (const colorScheme of ['light', 'dark'] as const) {
          await page.emulateMedia({ colorScheme });

          for (const name of V2_PAGES) {
            await shell.goTo(name);

            // 4.5:1 is what WCAG asks of text this size; the glyphs, which
            // need 3:1, are held to the same so nothing sits near the line.
            const off = await shell.topBarContrast([...BAR[name]]);
            for (const [what, ratio] of Object.entries(off)) {
              expect(
                ratio,
                `${what} on ${name}, ${colorScheme}`,
              ).toBeGreaterThanOrEqual(4.5);
            }

            // The eye is tinted while privacy mode is on, and still an eye.
            await shell.setPrivacy(true);
            const on = await shell.topBarContrast(['Ocultar valores']);
            expect(
              on['Ocultar valores'],
              `the eye, on, on ${name}, ${colorScheme}`,
            ).toBeGreaterThanOrEqual(4.5);
            await shell.setPrivacy(false);
          }
        }

        await page.emulateMedia({ colorScheme: null });
      });

      test('the Budget and the menu give a finger something to hit', async () => {
        await shell.goTo('budget');

        const sizeOf = async (name: string | RegExp) => {
          const control = page.getByRole('button', { name }).first();
          await control.scrollIntoViewIfNeeded();
          const box = await control.boundingBox();
          if (!box) {
            throw new Error(`No control named ${String(name)} on screen.`);
          }
          return box;
        };

        // The bar, a group's line, and the two controls that span a row.
        for (const name of [
          'Menu da página de orçamento',
          'Mês anterior',
          'Ações do mês',
          'Próximo mês',
          'Ocultar valores',
          'Abrir menu do grupo Usual Expenses',
          'Recolher ou expandir o grupo Usual Expenses',
          'Abrir menu de saldo de Food',
        ]) {
          const box = await sizeOf(name);
          expect(box.height, name).toBeGreaterThanOrEqual(TOUCH_TARGET);
          expect(box.width, name).toBeGreaterThanOrEqual(TOUCH_TARGET);
        }

        // A row is 58pt tall and holds two controls one above the other, so
        // each has half of it; and its chevron has every point of width the
        // row can give it without moving the balance.
        const name = await sizeOf('Abrir menu da categoria Food');
        const plan = await sizeOf(/^Editar o orçamento de Food/);
        const chevron = await sizeOf('Ver as transações de Food');
        expect(name.height).toBeGreaterThanOrEqual(28);
        expect(plan.height).toBeGreaterThanOrEqual(24);
        expect(chevron.width).toBeGreaterThanOrEqual(40);
        expect(chevron.height).toBeGreaterThanOrEqual(TOUCH_TARGET);
        // Nothing is left between the two that a finger could land on.
        expect(plan.y - (name.y + name.height)).toBeLessThanOrEqual(0.5);

        // Everything "Mais" holds is a row of the same height.
        await shell.navigation.getByRole('button', { name: 'Mais' }).click();
        const rows = page.getByRole('menu').getByRole('button');
        await expect(rows.first()).toBeVisible();
        for (const row of await rows.all()) {
          const box = await row.boundingBox();
          expect(box?.height).toBeGreaterThanOrEqual(TOUCH_TARGET);
        }
        await page.keyboard.press('Escape');
        await expect(page.getByRole('menu')).toHaveCount(0);
      });
    }

    if (layout === 'mobile') {
      test('the Reports give a finger something to hit', async () => {
        await shell.goTo('reports');

        for (const name of [
          'Mês anterior',
          'Próximo mês',
          /^Period: /,
          'Ocultar valores',
        ]) {
          const control = page.getByRole('button', { name }).first();
          const box = await control.boundingBox();
          expect(box?.height, String(name)).toBeGreaterThanOrEqual(
            TOUCH_TARGET,
          );
          expect(box?.width, String(name)).toBeGreaterThanOrEqual(TOUCH_TARGET);
        }

        // The months of the period's menu are rows of that height too.
        await page.getByRole('button', { name: /^Period: / }).click();
        const months = page.getByRole('menu').getByRole('button');
        await expect(months.first()).toBeVisible();
        for (const month of await months.all()) {
          expect((await month.boundingBox())?.height).toBeGreaterThanOrEqual(
            TOUCH_TARGET,
          );
        }
        await page.keyboard.press('Escape');
        await expect(page.getByRole('menu')).toHaveCount(0);

        // A finger on the plot reads the day under it, on the line above.
        const plot = shell.main.locator('svg[viewBox="0 0 1000 420"]');
        await plot.scrollIntoViewIfNeeded();
        const box = await plot.boundingBox();
        if (!box) {
          throw new Error('The chart is not on screen.');
        }
        await page.touchscreen.tap(box.x + 2, box.y + box.height / 2);
        await expect(
          shell.main.getByText('1 de janeiro de 2017', { exact: true }),
        ).toBeVisible();
        await page.touchscreen.tap(
          box.x + box.width - 2,
          box.y + box.height / 2,
        );
        await expect(
          shell.main.getByText('31 de janeiro de 2017', { exact: true }),
        ).toBeVisible();
      });
    }

    test('an amount in the millions is still printed whole', async () => {
      // The one test that writes. A plan of R$ 1.234.567,89 reaches the
      // Budget's headline, its indicators, its group and its row, and the
      // Home's line for what is left to distribute.
      await shell.goTo('budget');
      if (layout === 'desktop') {
        const plan = shell.main.getByRole('textbox', {
          name: 'Orçado de Food',
          exact: true,
        });
        await plan.fill('1234567,89');
        await plan.press('Enter');
      } else {
        // The phone's keypad fills from the cents up.
        await page
          .getByRole('button', { name: /^Editar o orçamento de Food/ })
          .click();
        const dialog = page.getByRole('dialog', { name: 'Modal dialog' });
        const amount = dialog.getByTestId('amount-input');
        await amount.fill('123456789');
        await amount.blur();
        await dialog
          .getByRole('heading')
          .getByRole('button', { name: 'Close' })
          .click();
        await expect(dialog).toHaveCount(0);
      }
      // The month's plan, with the new amount in it.
      await expect(
        shell.main.getByText(/1\.237\.197,89/).first(),
      ).toBeVisible();

      for (const viewport of [VIEWPORTS[layout].viewport, NARROWER[layout]]) {
        await page.setViewportSize(viewport);

        for (const name of V2_PAGES) {
          await shell.goTo(name);
          await shell.settledFigures();
          expect(
            await shell.figuresOutOfBounds(),
            `${name} at ${viewport.width}×${viewport.height}`,
          ).toEqual([]);
        }
      }

      await page.setViewportSize(VIEWPORTS[layout].viewport);
    });
  });

  /**
   * The Reports of a file nothing has been entered in. It has its own page:
   * the group above reads the test file, and this needs the opposite of one.
   */
  test.describe(`V2 Reports with nothing to report (${layout})`, () => {
    let page: Page;
    let shell: V2Shell;

    test.beforeAll(async ({ browser }, testInfo) => {
      testInfo.setTimeout(120_000);

      page = await browser.newPage(VIEWPORTS[layout]);
      await page.goto('/');
      await new ConfigurationPage(page).startFresh();
      shell = new V2Shell(page, layout);
    });

    test.afterAll(async () => {
      await page?.close();
    });

    test('an empty file is said to be empty, and offers no month to go to', async () => {
      await shell.goTo('reports');

      // The indicators are there and read nothing, rather than not arriving.
      await expect(async () => {
        expect(await new V2Books(shell).reports()).toEqual({
          income: 0,
          expenses: 0,
          net: 0,
        });
      }).toPass();
      await expect(
        shell.main.getByText('0,0%', { exact: true }).first(),
      ).toBeVisible();

      if (layout === 'mobile') {
        // The phone says it in words, once, where the chart would be.
        await expect(
          shell.main.getByText('No transactions in this period.'),
        ).toBeVisible();
        await expect(
          shell.main.getByText('Income, Expenses & Net Result'),
        ).toHaveCount(0);
        await expect(
          shell.main.getByRole('heading', {
            level: 2,
            name: 'Expenses by category',
          }),
        ).toHaveCount(0);
        // With no plot there is no scale either: every amount left is a zero.
        for (const figure of (await shell.settledFigures()).readable) {
          expect(figure, figure).toMatch(/^R\$\s?0,00$/);
        }
      } else {
        // The desktop keeps its plot, empty, on the scale it gives a period
        // nothing has happened in — and names the two lists it cannot draw.
        await expect(
          shell.main.getByText('No spending recorded in this period.'),
        ).toBeVisible();
        await expect(
          shell.main.getByText('No spending to break down.'),
        ).toBeVisible();
      }
      await expect(shell.main.getByText(/^(Carregando|Loading)\b/)).toHaveCount(
        0,
      );

      // Without a transaction there is no earlier month, and none later.
      await expect(
        page.getByRole('button', { name: 'Mês anterior' }),
      ).toBeDisabled();
      await expect(
        page.getByRole('button', { name: 'Próximo mês' }),
      ).toBeDisabled();
      const period = page.getByRole('button', { name: /^Period: / });
      await expect(period).toHaveText('This month');
      await period.click();
      await expect(page.getByRole('menu').getByRole('button')).toHaveText([
        'This month',
      ]);
      await page.keyboard.press('Escape');
      await expect(page.getByRole('menu')).toHaveCount(0);

      // A row of zeros is still a row of amounts: each inside its box.
      expect(await shell.figuresOutOfBounds()).toEqual([]);
    });
  });
}
