import { expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

import type { AccountPage } from './account-page';
import { Navigation } from './navigation';
import type { V2Shell } from './v2-shell';

/** A transaction, as a person enters it. */
export type Entry = {
  account: string;
  /** Integer cents; below zero is money out. */
  amount: number;
  /**
   * A payee's name; for a transfer, the name of the other account. Absent ⇒
   * none, which the application allows — and which keeps its rules, learnt
   * from what a payee was categorised as before, from choosing a category.
   */
  payee?: string;
  /** Absent for a transfer between two on-budget accounts, which takes none. */
  category?: string;
  /** The entry's own words. The suite finds it again by them. */
  notes: string;
  /** "2016-12-15". Absent ⇒ today, which the form already holds. */
  date?: string;
};

export type EntryChanges = Partial<
  Pick<Entry, 'account' | 'amount' | 'category' | 'notes'>
>;

/** Which of an entry's rows: a transfer is listed once per account. */
type Which = { notes: string; account?: string };

function escapeForRegExp(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** 4567 as a person in Brazil types it into a field: "45,67". */
function typed(cents: number) {
  return (Math.abs(cents) / 100).toFixed(2).replace('.', ',');
}

/** 4567 as the entry screens print it for a file with no format chosen. */
function printed(cents: number) {
  return (Math.abs(cents) / 100).toLocaleString('en-US', {
    minimumFractionDigits: 2,
  });
}

/** "2016-12-15" as the register's date field reads it: "12/15/2016". */
function registerDate(date: string) {
  const [year, month, day] = date.split('-');
  return `${month}/${day}/${year}`;
}

/**
 * Entering, changing and deleting transactions the way each layout offers it.
 *
 * The four V2 pages show money; they do not take it. A transaction is entered
 * where the application has always taken one — the register of an account on
 * the desktop, the transaction form on the phone — and those screens are
 * reached from the V2 pages, which is the journey this model walks: the rail's
 * Accounts and a row of it, or the bar's raised action.
 *
 * Every act ends on a page that has the navigation, so whatever comes next can
 * start from it.
 */
export class V2Entries {
  readonly page: Page;
  readonly shell: V2Shell;
  private readonly navigation: Navigation;

  constructor(shell: V2Shell) {
    this.page = shell.page;
    this.shell = shell;
    this.navigation = new Navigation(shell.page);
  }

  async add(entry: Entry) {
    if (this.shell.layout === 'desktop') {
      await this.addInRegister(entry);
    } else {
      await this.addInForm(entry);
    }
  }

  async change(which: Which, changes: EntryChanges) {
    if (this.shell.layout === 'desktop') {
      await this.changeInRegister(which, changes);
    } else {
      await this.changeInForm(which, changes);
    }
  }

  /** Deletes the entry; of a transfer, both of its sides go with it. */
  async remove(which: Which) {
    if (this.shell.layout === 'desktop') {
      await this.removeInRegister(which);
    } else {
      await this.removeInForm(which);
    }
  }

  /**
   * Opens an account inside the budget with the balance it starts on, from
   * the Accounts page. Both layouts offer it there and ask the same form.
   */
  async addAccount(name: string, cents: number) {
    await this.backToTheBar();
    await this.shell.goTo('accounts');
    await this.page
      .getByRole('button', {
        name:
          this.shell.layout === 'desktop' ? 'Add account' : 'Adicionar conta',
      })
      .first()
      .click();

    const title = this.page.getByRole('heading', { name: 'Add account' });
    await title.waitFor();
    await this.page.getByLabel('Name').fill(name);
    await this.page.getByLabel('Balance').fill(typed(cents));
    await this.page
      .getByRole('button', { name: 'Create', exact: true })
      .click();

    // The form gives way to the new account's own page.
    await expect(title).toHaveCount(0);
    await this.backToTheBar();
  }

  // ---- Desktop: the register -------------------------------------------------

  /** Types into a cell of the register; the notes' field is a combobox. */
  private async typeInCell(
    cell: Locator,
    text: string,
    role: 'textbox' | 'combobox' = 'textbox',
  ) {
    await cell.click();
    const input = cell.getByRole(role);
    if (await input.inputValue()) {
      await input.selectText();
    }
    await input.pressSequentially(text);
  }

  private async addInRegister(entry: Entry) {
    const register = await this.navigation.goToAccountPage(entry.account);

    await register.addNewTransactionButton.click();
    const row = register.newTransactionRow;
    if (entry.date) {
      await this.typeInCell(row.getByTestId('date'), registerDate(entry.date));
      await this.page.keyboard.press('Tab');
    }
    await register._fillTransactionFields(row, {
      payee: entry.payee,
      notes: entry.notes,
      category: entry.category,
      debit: entry.amount < 0 ? typed(entry.amount) : undefined,
      credit: entry.amount > 0 ? typed(entry.amount) : undefined,
    });
    await register.addTransactionButton.click();
    // An account's own register has no column naming the account.
    await this.keepAsTransaction(this.rowsIn(register, { notes: entry.notes }));
    await this.page.getByTestId('cancel-button').click();

    await expect(this.rowsIn(register, { notes: entry.notes })).toHaveCount(1);
  }

  /**
   * An entry dated ahead of today is offered as a schedule instead. The suite
   * means a transaction, and says so; any other entry is simply done.
   */
  private async keepAsTransaction(done: Locator) {
    const offer = this.page.getByTestId('convert-to-schedule-modal');

    await expect(offer.or(done).first()).toBeVisible();
    if (await offer.isVisible()) {
      await offer.getByRole('button', { name: 'Cancel' }).click();
      await expect(offer).toHaveCount(0);
    }
  }

  private rowsIn(register: AccountPage, { notes, account }: Which) {
    let rows = register.transactionTableRow.filter({
      has: this.page.getByTestId('notes').getByText(notes, { exact: true }),
    });
    if (account) {
      rows = rows.filter({
        has: this.page.getByTestId('account').getByText(account, {
          exact: true,
        }),
      });
    }
    return rows;
  }

  /**
   * The entry's row in the register of every account, which is the one that
   * names the account in a column and so the one an account can be changed in.
   */
  private async findInRegister(which: Which) {
    const register = await this.navigation.goToAccountPage('All accounts');
    // The list draws only the rows in view; the search brings the entry there.
    await this.page.getByPlaceholder('Search').fill(which.notes);

    // The search answers a moment after the typing, and redraws the list when
    // it does — which would take a cell being edited with it. So: wait until
    // the register says it is filtered and lists nothing but the entry. The
    // parts of a split come with it, and have no words of their own.
    await expect(this.page.getByText('Filtered balance:')).toBeVisible();
    const rows = register.transactionTableRow;
    let notes: string[] = [];
    await expect(async () => {
      notes = await rows.getByTestId('notes').allInnerTexts();
      expect(
        notes.filter(text => text.trim() !== '' && text.trim() !== which.notes),
      ).toEqual([]);
      expect(notes.map(text => text.trim())).toContain(which.notes);
    }).toPass();
    await expect(this.rowsIn(register, which)).toHaveCount(1);

    // By its place from here on, not by what it says: a cell being edited
    // holds its text in a field, and the row would stop matching itself.
    const accounts = await rows.getByTestId('account').allInnerTexts();
    const place = notes.findIndex(
      (text, index) =>
        text.trim() === which.notes &&
        (!which.account || accounts[index]?.trim() === which.account),
    );
    return { register, row: rows.nth(place) };
  }

  private async changeInRegister(which: Which, changes: EntryChanges) {
    const { row } = await this.findInRegister(which);
    // Enter saves the cell. Not Escape after it: where there is no row below
    // to step into, the cell stays open, and Escape there puts the old value
    // back for the next blur to save.
    const commit = () => this.page.keyboard.press('Enter');

    if (changes.amount !== undefined) {
      await this.typeInCell(
        row.getByTestId(changes.amount < 0 ? 'debit' : 'credit'),
        typed(changes.amount),
      );
      await commit();
    }
    if (changes.category !== undefined) {
      await this.typeInCell(row.getByTestId('category'), changes.category);
      await commit();
    }
    if (changes.account !== undefined) {
      await this.typeInCell(row.getByTestId('account'), changes.account);
      await commit();
    }
    if (changes.notes !== undefined) {
      await this.typeInCell(
        row.getByTestId('notes'),
        changes.notes,
        'combobox',
      );
      await commit();
    }
  }

  private async removeInRegister(which: Which) {
    const { register, row } = await this.findInRegister(which);

    await row.getByTestId('select').click();
    await register.clickSelectAction('Delete');
    // Deleting asks first: it is the one act here that cannot be typed back.
    const confirmation = this.page.getByRole('dialog');
    await expect(confirmation).toContainText(
      'Are you sure you want to delete the transaction?',
    );
    await confirmation
      .getByRole('button', { name: 'Delete', exact: true })
      .click();

    await expect(this.rowsIn(register, { notes: which.notes })).toHaveCount(0);
  }

  // ---- Phone: the transaction form -------------------------------------------

  get form() {
    return this.page.getByTestId('transaction-form');
  }

  /** The form's one action: it names what the form still needs. */
  get formAction() {
    return this.page.getByTestId('transaction-form-footer').getByRole('button');
  }

  /** Opens the phone's form for a new transaction, from the bar. */
  async openNewForm() {
    await this.backToTheBar();
    await this.shell.navigation
      .getByRole('button', { name: 'New transaction' })
      .click();
    await this.form.waitFor();
  }

  /** The phone's entry screens have no bar; their Back leads to one. */
  async backToTheBar() {
    if (this.shell.layout === 'desktop') return;

    await expect(async () => {
      if (!(await this.shell.navigation.isVisible())) {
        await this.page.getByRole('button', { name: 'Back' }).click();
      }
      await expect(this.shell.navigation).toBeVisible({ timeout: 2_000 });
    }).toPass();
  }

  /** The amount, which the keypad fills from the cents up. */
  private async typeAmount(cents: number) {
    const amount = this.form.getByTestId('amount-input');
    await amount.fill(String(Math.abs(cents)));
    await amount.blur();
    await expect(
      this.form.getByRole('button', { name: printed(cents), exact: true }),
    ).toBeVisible();
  }

  /** The control beside the amount says which way the money goes. */
  private async setDirection(cents: number) {
    const wanted = cents > 0 ? '+' : '-';
    const direction = this.form.getByRole('button', { name: /^[+-]$/ }).first();
    if ((await direction.innerText()).trim() !== wanted) {
      await direction.click();
    }
    await expect(direction).toHaveText(wanted);
  }

  /** Picks from one of the form's lists by typing a name and tapping it. */
  private async pick(field: Locator, name: string) {
    await field.click();
    const search = this.page.getByRole('combobox').locator('input');
    await search.pressSequentially(name);
    // The name and nothing before it: typing an account's name also offers to
    // create a payee called that, which would not be a transfer. A category
    // is listed with what it has left, after its name.
    await this.page
      .getByRole('option')
      .filter({
        hasText: new RegExp(`^${escapeForRegExp(name)}(\\s*-?[\\d.,]+)?$`),
      })
      .first()
      .click();
    await search.waitFor({ state: 'hidden' });
    await expect(field).toContainText(name);
  }

  private async addInForm(entry: Entry) {
    await this.openNewForm();

    if (entry.amount !== 0) {
      await this.typeAmount(entry.amount);
      await this.setDirection(entry.amount);
    } else {
      // Nothing to type: leave the field the form opens in.
      await this.form.getByTestId('amount-input').blur();
    }
    if (entry.payee) {
      await this.pick(this.page.getByTestId('payee-field'), entry.payee);
    }
    if (entry.category) {
      await this.pick(this.page.getByTestId('category-field'), entry.category);
    }
    await this.pick(this.page.getByTestId('account-field'), entry.account);
    if (entry.date) {
      const date = this.form.locator('input[type="date"]');
      await date.fill(entry.date);
      await date.blur();
    }
    const notes = this.form.getByPlaceholder('Add a note (optional)');
    await notes.fill(entry.notes);
    await notes.blur();

    await expect(this.formAction).toHaveText('Add transaction');
    await this.formAction.click();
    // The form gives way to the page it was opened from, which has the bar.
    await this.keepAsTransaction(this.shell.navigation);
    await expect(this.form).toHaveCount(0);
    await this.backToTheBar();
  }

  /**
   * Opens the entry's form from a list of transactions: every account's, or
   * the one account's when the entry is a side of a transfer — a transfer is
   * listed once per account, and each row names the other account.
   */
  private async openInForm({ notes, account }: Which) {
    await this.backToTheBar();
    await this.shell.goTo('accounts');
    if (account) {
      await this.shell.main
        .getByTestId('account-list-item')
        .filter({
          has: this.page
            .getByTestId('account-name')
            .getByText(account, { exact: true }),
        })
        .click();
    } else {
      await this.page
        .getByRole('button', { name: 'Ver todas as transações' })
        .click();
    }

    const list = this.page.getByLabel('Transaction list');
    await list.waitFor();
    await this.page.getByPlaceholder(/^Search/).fill(notes);

    const rows = list.getByRole('button').filter({ hasText: notes });
    await expect(rows).toHaveCount(1);
    await rows.click();
    await this.form.waitFor();
  }

  private async changeInForm(which: Which, changes: EntryChanges) {
    await this.openInForm(which);

    if (changes.amount !== undefined) {
      // The amount is a figure until it is tapped, and a field after.
      await this.form
        .getByRole('button', { name: /^[\d,]+\.\d{2}$/ })
        .first()
        .click();
      await this.typeAmount(changes.amount);
      await this.setDirection(changes.amount);
    }
    if (changes.category !== undefined) {
      await this.pick(
        this.page.getByTestId('category-field'),
        changes.category,
      );
    }
    if (changes.account !== undefined) {
      await this.pick(this.page.getByTestId('account-field'), changes.account);
    }
    if (changes.notes !== undefined) {
      const notes = this.form.getByPlaceholder('Add a note (optional)');
      await notes.fill(changes.notes);
      await notes.blur();
    }

    await expect(this.formAction).toHaveText('Save changes');
    await this.formAction.click();
    await expect(this.form).toHaveCount(0);
    await this.backToTheBar();
  }

  private async removeInForm(which: Which) {
    await this.openInForm(which);

    await this.page.getByRole('button', { name: 'Delete transaction' }).click();
    const confirmation = this.page.getByRole('dialog');
    await expect(confirmation).toContainText(
      'Are you sure you want to delete the transaction?',
    );
    await confirmation
      .getByRole('button', { name: 'Delete', exact: true })
      .click();

    await expect(this.form).toHaveCount(0);
    await this.backToTheBar();
  }
}
