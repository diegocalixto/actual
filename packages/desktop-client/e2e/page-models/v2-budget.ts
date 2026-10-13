import { expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

import type { V2Shell } from './v2-shell';

/** 52550 as pt-BR writes it into a field: "525,50". */
function typed(cents: number) {
  return (cents / 100).toFixed(2).replace('.', ',');
}

/**
 * The two things a person does on the Budget page: look at another month, and
 * say how much a category is planned to take.
 */
export class V2Budget {
  readonly page: Page;
  readonly shell: V2Shell;
  /** The month on screen, as the page words it. */
  readonly month: Locator;

  constructor(shell: V2Shell) {
    this.page = shell.page;
    this.shell = shell;
    this.month =
      shell.layout === 'desktop'
        ? this.page.getByRole('button', { name: 'Mês anterior' }).locator('..')
        : this.page.getByRole('button', { name: 'Ações do mês' });
  }

  /** Steps the page that many months: back below zero, forward above. */
  async stepMonths(count: number) {
    const step = this.page.getByRole('button', {
      name: count < 0 ? 'Mês anterior' : 'Próximo mês',
    });

    for (let taken = 0; taken < Math.abs(count); taken++) {
      const before = await this.month.innerText();
      await step.click();
      await expect(this.month).not.toHaveText(before);
    }
  }

  /**
   * Covers what a category spent past its plan with money planned for another:
   * the application's own "Cover overspending", reached from the row.
   */
  async cover(category: string, from: string) {
    if (this.shell.layout === 'desktop') {
      await this.shell.main
        .getByRole('button', {
          name: `Ações da categoria ${category}`,
          exact: true,
        })
        .click();
    } else {
      await this.page
        .getByRole('button', {
          name: `Abrir menu de saldo de ${category}`,
          exact: true,
        })
        .click();
    }
    await this.page.getByRole('button', { name: 'Cover overspending' }).click();

    // The amount offered is the whole overspending; only the source is asked.
    if (this.shell.layout === 'desktop') {
      await this.page.getByPlaceholder('(none)').click();
      await this.page.keyboard.type(from);
      await this.page.keyboard.press('Enter');
    } else {
      // The phone opens its list of categories at once, over the form.
      const search = this.page.getByRole('combobox').locator('input');
      await search.pressSequentially(from);
      await this.page
        .getByRole('option')
        .filter({ hasText: new RegExp(`^${from}`) })
        .first()
        .click();
      await search.waitFor({ state: 'hidden' });
    }
    await this.page
      .getByRole('button', { name: 'Transfer', exact: true })
      .click();
  }

  /** The desktop's field for a category's plan. */
  planField(category: string) {
    return this.shell.main.getByRole('textbox', {
      name: `Orçado de ${category}`,
      exact: true,
    });
  }

  /** Plans a category for the month on screen, in integer cents. */
  async plan(category: string, cents: number) {
    if (this.shell.layout === 'desktop') {
      const field = this.planField(category);
      await field.fill(typed(cents));
      await field.press('Enter');
      return;
    }

    await this.page
      .getByRole('button', {
        name: new RegExp(`^Editar o orçamento de ${category}\\.`),
      })
      .click();
    const dialog = this.page.getByRole('dialog', { name: 'Modal dialog' });
    // The phone's keypad fills from the cents up.
    const amount = dialog.getByTestId('amount-input');
    await amount.fill(String(cents));
    await amount.blur();
    await dialog
      .getByRole('heading')
      .getByRole('button', { name: 'Close' })
      .click();
    await expect(dialog).toHaveCount(0);
  }
}
