import type { Locator, Page } from '@playwright/test';

import type { V2Layout, V2Shell } from './v2-shell';

/** The Accounts page, in integer cents. */
export type AccountsBooks = {
  total: number;
  onBudget: number;
  offBudget: number;
  balances: Record<string, number>;
};

/** One row of the Budget. */
export type CategoryBooks = {
  budgeted: number;
  spent: number;
  available: number;
};

/** The Budget page for the month on screen, in integer cents. */
export type BudgetBooks = {
  toDistribute: number;
  budgeted: number;
  spent: number;
  income: number;
  /** What came in less what left: the page's own "Saldo do mês". */
  monthResult: number;
  categories: Record<string, CategoryBooks>;
};

/** The Home page, in integer cents. */
export type HomeBooks = {
  available: number;
  toDistribute: number;
  income: number;
  /** Money out, as a positive amount whichever way the layout signs it. */
  spent: number;
  net: number;
  total: number;
  balances: Record<string, number>;
};

/** The desktop Reports' indicators for the period, in integer cents. */
export type ReportsBooks = {
  income: number;
  expenses: number;
  net: number;
};

/**
 * What each layout calls a figure. The words are the ones printed beside the
 * amount, which is how a person finds it — and how this model does.
 */
const LABELS = {
  desktop: {
    home: {
      available: 'Available balance',
      toDistribute: 'To Budget',
      income: 'Money in',
      spent: 'Money out',
      net: 'Monthly net',
      total: 'Total',
    },
    budget: {
      toDistribute: 'Para distribuir',
      budgeted: 'Orçado',
      spent: 'Gasto',
      income: 'Receitas',
      monthResult: 'Saldo do mês',
    },
    accounts: { onBudget: 'On budget', offBudget: 'Off budget' },
  },
  mobile: {
    home: {
      available: 'Saldo disponível',
      toDistribute: 'Para distribuir',
      income: 'Receitas',
      spent: 'Despesas',
      net: 'Saldo do mês',
      total: 'Total',
    },
    budget: {
      toDistribute: 'Para distribuir',
      budgeted: 'Orçado',
      spent: 'Gasto',
      income: 'Total recebido',
      monthResult: 'Saldo do mês',
    },
    accounts: { onBudget: 'No orçamento', offBudget: 'Fora do orçamento' },
  },
} satisfies Record<V2Layout, object>;

/**
 * What the phone's Budget calls the amount left to distribute once it is
 * below zero. The figure keeps its minus; only its name changes.
 */
const OVERBUDGETED = 'Orçado a mais';

const REPORTS_LABELS = {
  income: 'Income',
  expenses: 'Expenses',
  net: 'Net Result',
};

/** "R$ 1.234,56", "-R$312.500,00", "R$-60,00" or "1,234.56", as cents. */
export function toCents(text: string) {
  if (!/\d[.,]\d{2}\D*$/.test(text)) {
    throw new Error(`Not an amount with cents: "${text}"`);
  }
  const cents = Number(text.replace(/\D/g, ''));
  return text.includes('-') && cents !== 0 ? -cents : cents;
}

/**
 * The amounts printed beside each of the given words.
 *
 * For every element whose own text is one of the words, the nearest box around
 * it that holds an amount is the one a reader takes them to belong to: a
 * tile's label and its figure, a row's name and its columns. The amounts of
 * that box come back in reading order, one list per place the word appears.
 *
 * It runs in the page, so it has to stand alone.
 */
function amountsBeside(root: Element, words: string[]) {
  const DIGITS = /\d{1,3}(?:[.,]\d{3})*[.,]\d{2}(?!\d)(?!\s?%)(?!\s?pp)/;
  const AMOUNT = /[-+]?\s?(?:R\$)?\s?[-+]?\s?\d{1,3}(?:[.,]\d{3})*[.,]\d{2}/;
  const WHOLE = /^[-+]?(?:R\$)?[-+]?\d{1,3}(?:[.,]\d{3})*[.,]\d{2}$/;

  const ownText = (el: Element) =>
    Array.from(el.childNodes)
      .filter(node => node.nodeType === Node.TEXT_NODE)
      .map(node => (node.textContent ?? '').trim())
      .filter(Boolean)
      .join(' ');
  const isShown = (el: Element) => {
    const box = el.getBoundingClientRect();
    return box.width > 0 && box.height > 0;
  };
  const squashed = (el: Element) => (el.textContent ?? '').replace(/\s/g, '');

  // Every amount on the page, once, with the element that prints all of it:
  // the symbol and the sign are often set in an element of their own.
  const amounts: Array<{ el: Element; text: string }> = [];
  const seen = new Set<Element>();
  for (const el of Array.from(root.querySelectorAll<HTMLElement>('*'))) {
    if (el.tagName === 'STYLE' || el.tagName === 'SCRIPT' || !isShown(el)) {
      continue;
    }
    if (el instanceof HTMLInputElement) {
      if (DIGITS.test(el.value)) amounts.push({ el, text: el.value });
      continue;
    }
    const own = ownText(el);
    if (!DIGITS.test(own)) continue;

    let whole: Element = el;
    while (
      whole.parentElement &&
      root.contains(whole.parentElement) &&
      WHOLE.test(squashed(whole.parentElement))
    ) {
      whole = whole.parentElement;
    }
    if (seen.has(whole)) continue;
    seen.add(whole);
    amounts.push({
      el: whole,
      text: WHOLE.test(squashed(whole))
        ? squashed(whole)
        : (own.match(AMOUNT)?.[0] ?? own),
    });
  }

  const found: Record<string, string[][]> = {};
  for (const word of words) {
    found[word] = [];
  }
  for (const el of Array.from(root.querySelectorAll<HTMLElement>('*'))) {
    const word = ownText(el);
    if (!(word in found) || !isShown(el)) continue;

    for (
      let around = el.parentElement;
      around && root.contains(around);
      around = around.parentElement
    ) {
      const inside = amounts.filter(amount => around.contains(amount.el));
      if (inside.length === 0) continue;
      found[word].push(inside.map(amount => amount.text));
      break;
    }
  }

  return found;
}

/**
 * The money the four V2 pages print, as integer cents.
 *
 * One model for both layouts. Each reader takes the page as it is on screen
 * and says nothing of how it got there, so a test can poll it until the page
 * has caught up with what was just entered.
 *
 * An amount is found by the words printed beside it, never by where it sits
 * in the markup: that is the pairing a person makes, and a figure that moved
 * away from its label would be a defect this model should trip over.
 */
export class V2Books {
  readonly page: Page;
  readonly shell: V2Shell;

  constructor(shell: V2Shell) {
    this.page = shell.page;
    this.shell = shell;
  }

  private get layout() {
    return this.shell.layout;
  }

  private async beside(words: string[], root: Locator = this.shell.main) {
    return await root.first().evaluate(amountsBeside, words);
  }

  /** The one amount beside a word, in the first place the word appears. */
  private static single(found: Record<string, string[][]>, word: string) {
    const [first] = found[word] ?? [];
    if (first?.length !== 1) {
      throw new Error(
        `Expected one amount beside "${word}", found ${JSON.stringify(found[word])}.`,
      );
    }
    return toCents(first[0]);
  }

  /** The account rows both layouts mark the same way. */
  private async listedBalances() {
    const rows = this.shell.main.getByTestId('account-list-item');
    const names = await rows.getByTestId('account-name').allInnerTexts();
    const balances = await rows.getByTestId('account-balance').allInnerTexts();

    return Object.fromEntries(
      names.map((name, index) => [name.trim(), toCents(balances[index])]),
    );
  }

  async accounts(): Promise<AccountsBooks> {
    const labels = LABELS[this.layout].accounts;
    const found = await this.beside(Object.values(labels));

    return {
      total: toCents(
        await this.shell.main.getByTestId('accounts-total-balance').innerText(),
      ),
      onBudget: V2Books.single(found, labels.onBudget),
      offBudget: V2Books.single(found, labels.offBudget),
      balances: await this.listedBalances(),
    };
  }

  /** The Budget, with the rows of the categories named. */
  async budget(categories: string[]): Promise<BudgetBooks> {
    const labels = LABELS[this.layout].budget;
    // On the phone the month's figures share their words with every group's
    // line, so they are read from the summary that leads the page.
    const summary =
      this.layout === 'mobile'
        ? this.page.getByTestId('budget-table-header')
        : this.shell.main;
    const found = await this.beside(
      [
        labels.toDistribute,
        OVERBUDGETED,
        labels.budgeted,
        labels.spent,
        labels.monthResult,
      ],
      summary,
    );
    const income = await this.beside([labels.income]);

    return {
      toDistribute: V2Books.single(
        found,
        found[OVERBUDGETED].length > 0 ? OVERBUDGETED : labels.toDistribute,
      ),
      budgeted: V2Books.single(found, labels.budgeted),
      spent: V2Books.single(found, labels.spent),
      income: V2Books.single(income, labels.income),
      monthResult: V2Books.single(found, labels.monthResult),
      categories:
        this.layout === 'desktop'
          ? await this.desktopCategories(categories)
          : await this.mobileCategories(categories),
    };
  }

  /** A row is its name and three columns: budgeted, spent, available. */
  private async desktopCategories(categories: string[]) {
    const found = await this.beside(categories);

    return Object.fromEntries(
      categories.map(name => {
        const row = found[name]?.find(amounts => amounts.length === 3);
        if (!row) {
          throw new Error(
            `No row of three amounts for "${name}": ${JSON.stringify(found[name])}.`,
          );
        }
        const [budgeted, spent, available] = row.map(toCents);
        return [name, { budgeted, spent, available }];
      }),
    );
  }

  /**
   * A row says what was spent of what was planned in the name of its plan
   * control, which is what a screen reader's user hears, and prints what is
   * left on its balance control.
   */
  private async mobileCategories(categories: string[]) {
    const rows: Record<string, CategoryBooks> = {};

    for (const name of categories) {
      const plan = await this.page
        .getByRole('button', {
          name: new RegExp(`^Editar o orçamento de ${name}\\.`),
        })
        .getAttribute('aria-label');
      const spoken = plan?.match(/Gasto (.+?) de (.+?) orçado\.$/);
      if (!spoken) {
        throw new Error(`The plan of "${name}" is not spoken: "${plan}".`);
      }
      const balance = await this.page
        .getByRole('button', {
          name: `Abrir menu de saldo de ${name}`,
          exact: true,
        })
        .innerText();

      rows[name] = {
        budgeted: toCents(spoken[2]),
        spent: toCents(spoken[1]),
        available: toCents(balance.split('\n')[0]),
      };
    }

    return rows;
  }

  /** The Home, with the balances of the accounts named. */
  async home(accounts: string[]): Promise<HomeBooks> {
    const labels = LABELS[this.layout].home;
    const found = await this.beside([...Object.values(labels), ...accounts]);
    const spent = V2Books.single(found, labels.spent);

    return {
      available: V2Books.single(found, labels.available),
      toDistribute: V2Books.single(found, labels.toDistribute),
      income: V2Books.single(found, labels.income),
      // The desktop prints money out below zero, the phone as an amount.
      spent: Math.abs(spent),
      net: V2Books.single(found, labels.net),
      total: V2Books.single(found, labels.total),
      balances: Object.fromEntries(
        accounts.map(name => [name, V2Books.single(found, name)]),
      ),
    };
  }

  /** The desktop Reports: the indicators that lead the page. */
  async reports(): Promise<ReportsBooks> {
    const found = await this.beside(Object.values(REPORTS_LABELS));

    return {
      income: V2Books.single(found, REPORTS_LABELS.income),
      expenses: V2Books.single(found, REPORTS_LABELS.expenses),
      net: V2Books.single(found, REPORTS_LABELS.net),
    };
  }
}
