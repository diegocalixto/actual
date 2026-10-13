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

      if (layout === 'mobile') {
        // The phone keeps the dashboard, whose cards are named by the fork.
        for (const card of ['Receita total (no ano)', 'Média por mês']) {
          await expect(
            main.getByRole('heading', { level: 2, name: card }),
          ).toBeVisible();
        }
        return;
      }

      for (const card of [
        'Principais categorias',
        'Despesas por categoria',
        'Comparativo mensal',
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
        'Total de receitas',
        'Total de despesas',
        'Saldo do período',
        'Para onde foi o seu dinheiro',
        'Categoria',
        'Valor',
        '% do total',
        'Receitas (média)',
        'Despesas (média)',
        'Saldo (média)',
      ]);
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
      ]);
    });
  });
}
