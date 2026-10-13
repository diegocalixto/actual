/**
 * The four V2 pages, read in Portuguese.
 *
 *   yarn workspace @actual-app/web run playwright test v2-pages-ptbr --browser=chromium
 *
 * `v2-pages` runs in the suite's default English and asserts what the pages
 * hold. This opens the same deterministic file in a pt-BR browser and asserts
 * what they are called: that the document declares its language, that the
 * navigation, the titles and the labels of each page are the product's
 * Portuguese, and that money and months are written the way pt-BR writes them.
 *
 * It needs no downloaded catalog. Every string it looks for is the fork's own
 * (`src/locale-overrides.ts`, or Portuguese at the source), which is the
 * point: a label renamed without its translation shows up here as English.
 */
import type { Locator, Page } from '@playwright/test';

import { expect, test } from './fixtures';
import { V2Ledger } from './page-models/v2-ledger';
import type { V2Layout } from './page-models/v2-shell';

const CONTEXTS = {
  desktop: { viewport: { width: 1440, height: 900 }, locale: 'pt-BR' },
  mobile: {
    viewport: { width: 428, height: 926 },
    hasTouch: true,
    isMobile: true,
    locale: 'pt-BR',
  },
};

/** "R$ 1.234,56" or "-R$ 312.500,00": the symbol, a point per thousand, a comma. */
const BRL = /^-?R\$\s?\d{1,3}(\.\d{3})*,\d{2}$/;

type Destination = { tab: string; title: string | RegExp; route: string };

/** The four destinations, as each layout names them in Portuguese. */
const DESTINATIONS: Record<V2Layout, Destination[]> = {
  desktop: [
    { tab: 'Início', title: 'Visão geral', route: '/home' },
    { tab: 'Orçamento', title: 'Orçamento', route: '/budget' },
    { tab: 'Contas', title: 'Contas', route: '/accounts' },
    { tab: 'Relatórios', title: 'Relatórios', route: '/reports' },
  ],
  mobile: [
    { tab: 'Início', title: 'Início', route: '/home' },
    { tab: 'Orçamento', title: 'Orçamento', route: '/budget' },
    { tab: 'Contas', title: 'Contas', route: '/accounts' },
    { tab: 'Relatórios', title: /^Relatórios/, route: '/reports' },
  ],
};

export function describeV2PagesInPortuguese(layout: V2Layout) {
  test.describe(`V2 pages in pt-BR (${layout})`, () => {
    test.describe.configure({ mode: 'serial' });

    let page: Page;
    let navigation: Locator;
    let main: Locator;
    let title: Locator;

    /** Goes to a page through the navigation and waits until it has loaded. */
    async function goTo(tab: string) {
      const destination = DESTINATIONS[layout].find(item => item.tab === tab);
      if (!destination) {
        throw new Error(`No destination is called ${tab}`);
      }

      const link = navigation.getByRole('link', { name: tab, exact: true });
      if ((await link.count()) > 0) {
        await link.click();
      } else {
        // The phone keeps Reports behind "Mais".
        await navigation.getByRole('button', { name: 'Mais' }).click();
        await page
          .getByRole('menu')
          .getByRole('button', { name: tab, exact: true })
          .click();
      }

      await expect(page).toHaveURL(new RegExp(`${destination.route}(/|$)`));
      await expect(title).toHaveText(destination.title, { timeout: 45_000 });
      await expect(main.getByText(/^(Carregando|Loading)\b/)).toHaveCount(0, {
        timeout: 30_000,
      });
    }

    /** Every label is on the page, written exactly so. */
    async function expectLabels(labels: string[]) {
      for (const label of labels) {
        await expect(
          main.getByText(label, { exact: true }).first(),
          `"${label}" is on the page`,
        ).toBeVisible();
      }
    }

    /**
     * None of these is on the page: the English a label was translated from,
     * or a second name the product had for the same thing.
     */
    async function expectAbsent(labels: string[]) {
      for (const label of labels) {
        await expect(
          main.getByText(label, { exact: true }),
          `"${label}" is not on the page`,
        ).toHaveCount(0);
      }
    }

    test.beforeAll(async ({ browser }, testInfo) => {
      // Building the test file is most of the group's cost.
      testInfo.setTimeout(120_000);

      page = await browser.newPage(CONTEXTS[layout]);
      await page.goto('/');
      await page
        .getByRole('button', { name: 'Experimentar a demonstração' })
        .click();

      navigation = page.getByRole('navigation', { name: 'Principal' });
      main = page.getByRole('main');
      title = page.getByRole('heading', { level: 1 });
      await expect(title).toHaveText('Orçamento', { timeout: 90_000 });
    });

    test.afterAll(async () => {
      await page?.close();
    });

    test('the document says it is written in Portuguese', async () => {
      await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');
    });

    test('the navigation names the four pages in Portuguese', async () => {
      for (const { tab } of DESTINATIONS[layout]) {
        await goTo(tab);

        // The phone keeps Reports behind "Mais", so nothing on the bar is
        // current there; everywhere else the bar says where you are.
        if (layout === 'mobile' && tab === 'Relatórios') {
          continue;
        }
        await expect(navigation.locator('[aria-current="page"]')).toHaveText(
          tab,
        );
      }

      // The rail keeps "Mais" at its foot, outside the list of destinations.
      await expect(page.getByRole('button', { name: 'Mais' })).toBeVisible();
    });

    test('Home is labelled in Portuguese', async () => {
      await goTo('Início');

      await expectLabels([
        'Saldo disponível',
        'Soma das contas no orçamento',
        'Para distribuir',
        'Este mês',
        'Receitas',
        'Despesas',
        'Saldo do mês',
        'Contas',
        'Despesas do mês',
        'Transações recentes',
      ]);
      await expectAbsent([
        'Overview',
        'Available balance',
        'To Budget',
        'This month',
        'Money in',
        'Money out',
        'Monthly net',
        'Accounts',
        'Spending this month',
        'Recent activity',
        'On budget',
        'Off budget',
      ]);

      // The month under "Este mês" is written by pt-BR, not by the browser's
      // default: the suite's clock stands in January.
      await expect(main.getByText(/^janeiro\b/i).first()).toBeVisible();
    });

    test('Budget is labelled in Portuguese', async () => {
      await goTo('Orçamento');

      await expectLabels([
        'Para distribuir',
        'Orçado',
        'Gasto',
        'Saldo do mês',
      ]);
      if (layout === 'desktop') {
        await expectLabels([
          'Receitas',
          'Seus envelopes',
          'Disponível',
          'Transações recentes',
        ]);
        await expect(main.getByText('Janeiro de 2017')).toBeVisible();
      } else {
        await expectLabels(['do orçado']);
        await expect(
          page.getByRole('button', { name: 'Ações do mês' }),
        ).toHaveText(/Janeiro 2017/);
      }
      // "Planejado" and "Renda" were second names for "Orçado" and "Receitas".
      await expectAbsent(['Planejado', 'Renda', 'Atividade recente']);
    });

    test('Accounts is labelled in Portuguese, and money is written in reais', async () => {
      await goTo('Contas');

      await expectLabels(['Saldo total', 'No orçamento', 'Fora do orçamento']);
      await expect(
        page.getByRole('button', { name: 'Adicionar conta' }).first(),
      ).toBeVisible();
      if (layout === 'desktop') {
        await expectLabels([
          'vs. mês anterior',
          'Evolução do saldo',
          'Distribuição das contas',
        ]);
        await expect(
          main.getByRole('button', { name: 'Todas as transações' }),
        ).toBeVisible();
      }
      await expectAbsent([
        'Accounts',
        'Total balance',
        'vs last month',
        'On budget',
        'Off budget',
        'Add account',
        'Balance over time',
        'Account distribution',
      ]);

      await expect(page.getByTestId('accounts-total-balance')).toHaveText(BRL);
    });

    test('Reports is labelled in Portuguese', async () => {
      await goTo('Relatórios');

      // One page in two arrangements: the phone leaves the ranked list to
      // the ring's legend and lists the detailed reports instead.
      for (const card of layout === 'desktop'
        ? [
            'Principais categorias',
            'Despesas por categoria',
            'Comparativo mensal',
          ]
        : [
            'Despesas por categoria',
            'Comparativo mensal',
            'Relatórios detalhados',
          ]) {
        await expect(
          main.getByRole('heading', { level: 2, name: card, exact: true }),
        ).toBeVisible();
      }
      await expectLabels([
        'Receitas',
        'Despesas',
        'Saldo',
        'Taxa de poupança',
        'Receitas, despesas e saldo',
        'Receitas (média)',
        'Despesas (média)',
        'Saldo (média)',
      ]);
      if (layout === 'desktop') {
        await expectLabels([
          'Total de receitas',
          'Total de despesas',
          'Saldo do período',
          'Para onde foi o seu dinheiro',
          'Categoria',
          'Valor',
          '% do total',
        ]);
        await expect(
          page.getByRole('button', { name: 'Relatórios detalhados' }),
        ).toBeVisible();
      } else {
        await expectLabels([
          'Relatório de fluxo de caixa',
          'Relatório de patrimônio líquido',
          'Relatório de despesas',
          'Painel personalizável',
          'Abra um relatório com filtros próprios',
        ]);
      }
      // The period is named in Portuguese, and so is its menu.
      const period = page.getByRole('button', { name: /^Período: / });
      await expect(period).toHaveText('Este mês');
      await period.click();
      await expect(
        page.getByRole('menu').getByRole('button').first(),
      ).toHaveText('Este mês');
      await expect(
        page.getByRole('menu').getByRole('button').nth(1),
      ).toHaveText(/^[A-ZÇ][a-zç]+ de \d{4}$/);
      await page.keyboard.press('Escape');
      await expect(page.getByRole('menu')).toHaveCount(0);
      // A comparison names the month it is against, in lower case.
      await expect(main.getByText(/^vs\. [a-zç]+$/).first()).toBeVisible();
      // A count of months takes the plural the language gives it.
      await expect(
        main.getByText(/^(Último 1 mês|Últimos \d+ meses)$/),
      ).toBeVisible();
      await expectAbsent([
        'Reports',
        'Income',
        'Expenses',
        'Net Result',
        'Savings Rate',
        'Income, Expenses & Net Result',
        'Total income',
        'Total expenses',
        'Total net result',
        'Top categories',
        'Where your money went',
        'Category',
        'Amount',
        '% of total',
        'Expenses by category',
        'Monthly comparison',
        'This month',
        'Detailed reports',
        'Cash flow report',
        'Net worth report',
        'Spending report',
        'Custom dashboard',
      ]);
    });

    // The pages lead into the application's older screens. Their text is the
    // upstream catalog's to translate, and a checkout that never downloaded it
    // used to show them in English one tap away from a Portuguese page.
    test('what the pages open is in Portuguese too', async () => {
      /** Each of these is on the screen, written exactly so. */
      async function expectOnScreen(labels: string[], within: Locator) {
        for (const label of labels) {
          await expect(
            within.getByText(label, { exact: true }).first(),
            `"${label}" is on the screen`,
          ).toBeVisible();
        }
      }

      /** None of these is: the English each was translated from. */
      async function expectNowhere(labels: string[], within: Locator) {
        for (const label of labels) {
          await expect(
            within.getByText(label, { exact: true }),
            `"${label}" is not on the screen`,
          ).toHaveCount(0);
        }
      }

      const body = page.locator('body');

      if (layout === 'desktop') {
        // The register of an account, where a transaction is entered.
        await goTo('Contas');
        await page
          .getByTestId('account-list-item')
          .filter({ hasText: 'Bank of America' })
          .first()
          .click();
        await page.getByTestId('transaction-table').waitFor();

        for (const name of ['Nova transação', 'Importar', 'Filtrar']) {
          await expect(
            page.getByRole('button', { name, exact: true }).first(),
          ).toBeVisible();
        }
        await expect(page.getByPlaceholder('Buscar')).toBeVisible();
        await expectOnScreen(
          ['Data', 'Beneficiário', 'Notas', 'Categoria', 'Saída', 'Entrada'],
          body,
        );
        await expectNowhere(
          ['Add New', 'Import', 'Filter', 'Date', 'Payee', 'Notes', 'Payment'],
          body,
        );

        // Its list of payees, with a name nobody has.
        await page.getByRole('button', { name: 'Nova transação' }).click();
        const payee = page
          .getByTestId('new-transaction')
          .getByTestId('row')
          .getByTestId('payee');
        await payee.click();
        await payee.getByRole('textbox').pressSequentially('zq');
        await expectOnScreen(
          ['Criar beneficiário "zq"', 'Fazer transferência'],
          page.getByTestId('autocomplete'),
        );
        await page.keyboard.press('Escape');
        await page.getByTestId('cancel-button').click();
      } else {
        // The form a transaction is entered on.
        await navigation
          .getByRole('button', { name: 'Nova transação' })
          .click();
        const form = page.getByTestId('transaction-form');
        await form.waitFor();
        // The form opens in its amount; its lists unlock once that is left.
        await form.getByTestId('amount-input').blur();

        await expectOnScreen(
          ['Beneficiário', 'Categoria', 'Conta', 'Data', 'Confirmado', 'Notas'],
          form,
        );
        await expectNowhere(
          ['Payee', 'Category', 'Account', 'Date', 'Cleared', 'Notes'],
          form,
        );
        await expect(
          form.getByPlaceholder('Adicionar uma nota (opcional)'),
        ).toBeVisible();

        // Its list of payees: the choice above it, and how it is left.
        await page.getByTestId('payee-field').click();
        const list = page.getByRole('dialog');
        await expect(
          list.getByRole('button', { name: 'Transferência', exact: true }),
        ).toBeVisible();
        await list.getByRole('button', { name: 'Fechar' }).click();
        await expect(list).toHaveCount(0);

        await page.getByRole('button', { name: 'Voltar' }).click();
        await expect(navigation).toBeVisible();
      }

      // A detailed report, from the Reports page.
      await goTo('Relatórios');
      if (layout === 'desktop') {
        await page
          .getByRole('button', { name: 'Relatórios detalhados' })
          .click();
        await page
          .getByRole('menu')
          .getByRole('button', { name: 'Relatório de fluxo de caixa' })
          .click();
      } else {
        await main
          .getByRole('button', { name: 'Relatório de fluxo de caixa' })
          .click();
      }
      await expect(page).toHaveURL(/\/reports\/cash-flow$/);
      await expect(
        body.getByText('Fluxo de caixa', { exact: true }).first(),
      ).toBeVisible({ timeout: 45_000 });
      await expectOnScreen(
        ['Receitas:', 'Despesas:', 'Transferências:', 'Ocultar saldo'],
        body,
      );
      await expectNowhere(
        ['Cash Flow', 'Income:', 'Expenses:', 'Transfers:', 'Hide balance'],
        body,
      );

      // Back on a page with the navigation, as the next reader expects.
      await page.goBack();
      await expect(title).toHaveText(/^Relatórios/, { timeout: 45_000 });
    });
  });

  /**
   * A file of one's own, as the application hands it over. It is not empty: it
   * has a name, three groups and seven categories, all the application's
   * words and all of them English in the file. They are read in Portuguese —
   * and stay English in the file, because the translation is made where they
   * are shown and nothing rewrites what is stored.
   */
  test.describe(`A new file in pt-BR (${layout})`, () => {
    /** What the file itself holds, read past everything the pages translate. */
    type FileWindow = {
      $q: (table: string) => { select: (fields: string[]) => unknown };
      $query: (query: unknown) => Promise<{
        data: Array<{ name: string; hidden: number | boolean }>;
      }>;
    };

    let page: Page;

    const stored = async (table: 'categories' | 'category_groups') =>
      await page.evaluate(async from => {
        // On `window` by the application's own doing.
        const file = window as unknown as FileWindow;
        const { data } = await file.$query(
          file.$q(from).select(['name', 'hidden']),
        );
        return data;
      }, table);

    test.beforeAll(async ({ browser, baseURL }, testInfo) => {
      testInfo.setTimeout(120_000);

      const app = new URL(baseURL ?? 'http://localhost:3002');
      page = await browser.newPage({
        ...CONTEXTS[layout],
        // The phone's test hides a group. Whatever it writes stays here:
        // everything but the application's own host goes to a dead port.
        proxy: { server: 'http://127.0.0.1:9', bypass: app.hostname },
      });
      await page.goto('/');
      await page.getByRole('button', { name: 'Criar meu orçamento' }).click();
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(
        'Orçamento',
        { timeout: 90_000 },
      );
    });

    test.afterAll(async () => {
      await page?.close();
    });

    test('the file and what it ships with are named in Portuguese, and stored as shipped', async () => {
      const main = page.getByRole('main');

      // The name the file was given, in a profile with no server to sync to.
      const profile = await new V2Ledger(page).profile();
      expect(profile.serverUrl, 'no sync server').toBeNull();
      expect(profile.files).toEqual([
        expect.objectContaining({ name: 'Minhas finanças', isSynced: false }),
      ]);

      // The categories, as the Budget lists them.
      for (const name of [
        'Alimentação',
        'Geral',
        'Contas fixas',
        'Contas variáveis',
        'Poupança',
      ]) {
        await expect(
          main.getByText(name, { exact: true }).first(),
          `"${name}" is on the page`,
        ).toBeVisible();
      }
      for (const name of ['Food', 'General', 'Bills', 'Savings']) {
        await expect(
          main.getByText(name, { exact: true }),
          `"${name}" is not on the page`,
        ).toHaveCount(0);
      }

      // And as the file has them.
      const categories = await stored('categories');
      expect(categories.map(category => category.name).sort()).toEqual(
        [
          'Bills',
          'Bills (Flexible)',
          'Food',
          'General',
          'Income',
          'Savings',
          'Starting Balances',
        ].sort(),
      );
      const groups = await stored('category_groups');
      expect(groups.map(group => group.name).sort()).toEqual(
        ['Income', 'Investments and Savings', 'Usual Expenses'].sort(),
      );
    });

    if (layout === 'mobile') {
      test('hiding a group it ships with does not write the translation into the file', async () => {
        // Hiding sends the whole group back to the file — under the name the
        // file has for it, not the one it was shown under.
        await expect(
          page.getByTestId('category-group-name').first(),
        ).toHaveText('Despesas do dia a dia');
        await page
          .getByRole('button', {
            name: 'Abrir menu do grupo Despesas do dia a dia',
          })
          .click();
        await page
          .getByRole('dialog')
          .getByRole('button', { name: 'Menu', exact: true })
          .click();
        await page
          .getByRole('menu')
          .getByRole('button', { name: 'Ocultar', exact: true })
          .click();

        await expect(async () => {
          const groups = await stored('category_groups');
          const hidden = groups.filter(group => Boolean(group.hidden));
          expect(hidden.map(group => group.name)).toEqual(['Usual Expenses']);
        }).toPass();
        const names = (await stored('category_groups')).map(g => g.name);
        expect(names).not.toContain('Despesas do dia a dia');
      });
    }
  });
}
