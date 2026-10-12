import type { Locator, Page } from '@playwright/test';

import { AccountPage } from './account-page';
import { BankSyncPage } from './bank-sync-page';
import { BudgetPage } from './budget-page';
import { PayeesPage } from './payees-page';
import { ReportsPage } from './reports-page';
import { RulesPage } from './rules-page';
import { SchedulesPage } from './schedules-page';
import { SettingsPage } from './settings-page';

type AccountEntry = {
  name: string;
  balance: number;
  offBudget: boolean;
};

/**
 * Click a React Aria <Button> via a programmatic browser-side click.
 *
 * React Aria components re-render on focus state changes (`data-focused`,
 * `data-focus-visible`). Under parallel CI load, Playwright's `.click()`
 * stability check often sees the DOM node get detached and re-mounted
 * mid-action, leading to "element was detached from the DOM, retrying"
 * loops that exhaust the test timeout.
 *
 * `dispatchEvent('click')` is documented to skip stability checks but
 * dispatches a generic `Event` that React Aria's pointer-based onPress
 * does not respond to, so it doesn't actually activate the button.
 *
 * Calling `.click()` inside `page.evaluate` runs synchronously in the
 * browser: querySelector + click happen in one JS task with no CDP
 * roundtrip in between, so React has no chance to re-render between
 * resolution and click. HTMLElement.click() dispatches a real MouseEvent
 * that React Aria handles correctly.
 */
async function clickReactAriaButton(locator: Locator): Promise<void> {
  await locator.evaluate((el: HTMLElement) => el.click());
}

/**
 * Fill a React-controlled input via the native value setter + input event.
 *
 * React's controlled inputs respond to `input` events to update state.
 * Playwright's `.fill()` clears + types, dispatching multiple events that
 * each cause React Aria's input wrappers to re-render. Under load this
 * loops indefinitely as `.fill()`'s editability check keeps seeing
 * detached nodes.
 *
 * The native value setter pattern (https://stackoverflow.com/q/23892547)
 * sets the value once and dispatches a single input event. React
 * processes one state update and one re-render, then the input is stable.
 */
async function fillReactInput(locator: Locator, value: string): Promise<void> {
  await locator.evaluate((el, val) => {
    const input = el as HTMLInputElement;
    // oxlint-disable-next-line typescript/unbound-method -- documented React-controlled-input pattern
    const setter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      'value',
    )?.set;
    setter?.call(input, val);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }, value);
}

export class Navigation {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * A destination behind the rail's "More". The upstream sidebar listed these
   * as links; the rail keeps four destinations and opens the rest as a menu.
   */
  private async goToSecondaryPage(name: string) {
    const link = this.page.getByRole('link', { name });
    const menuItem = this.page.getByRole('menu').getByRole('button', { name });

    if (!(await link.or(menuItem).first().isVisible())) {
      await this.page.getByRole('button', { name: 'More' }).click();
    }

    await link.or(menuItem).first().click();
  }

  /**
   * Accounts are no longer links in the sidebar: each one is a row of the
   * Accounts page, and that row is what opens its register. The combined
   * register, the sidebar's "All accounts", is the button beside the title.
   */
  async goToAccountPage(accountName: string) {
    await this.page
      .getByRole('navigation')
      .getByRole('link', { name: 'Accounts', exact: true })
      .click();

    if (accountName === 'All accounts') {
      await this.page.getByRole('button', { name: 'All transactions' }).click();
    } else {
      await this.page
        .getByTestId('account-list-item')
        .filter({
          has: this.page
            .getByTestId('account-name')
            .getByText(accountName, { exact: true }),
        })
        .click();
    }

    // The list stays on screen until the register has loaded, and both name
    // their figures alike: wait for the register before handing it back.
    const accountPage = new AccountPage(this.page);
    await accountPage.waitFor();
    return accountPage;
  }

  async goToReportsPage() {
    await this.page.getByRole('link', { name: 'Reports' }).click();

    return new ReportsPage(this.page);
  }

  async goToBudgetPage() {
    await this.page.getByRole('link', { name: 'Budget', exact: true }).click();

    const budgetPage = new BudgetPage(this.page);
    await budgetPage.waitFor({ state: 'visible' });
    return budgetPage;
  }

  async goToSchedulesPage() {
    await this.goToSecondaryPage('Schedules');

    return new SchedulesPage(this.page);
  }

  async goToRulesPage() {
    await this.goToSecondaryPage('Rules');

    return new RulesPage(this.page);
  }

  async goToPayeesPage() {
    await this.goToSecondaryPage('Payees');

    return new PayeesPage(this.page);
  }

  async goToBankSyncPage() {
    await this.goToSecondaryPage('Bank Sync');

    return new BankSyncPage(this.page);
  }

  async goToSettingsPage() {
    await this.goToSecondaryPage('Settings');

    return new SettingsPage(this.page);
  }

  async createAccount(data: AccountEntry) {
    // "Add account" lives on the Accounts page, not in a sidebar that is
    // always on screen. The page offers it twice — beside the title and under
    // the list — and either opens the same form.
    const addAccount = this.page
      .getByRole('button', { name: 'Add account' })
      .first();
    if (!(await addAccount.isVisible())) {
      await this.page
        .getByRole('navigation')
        .getByRole('link', { name: 'Accounts', exact: true })
        .click();
    }
    await addAccount.click();

    // Wait for the form heading to confirm it is fully mounted before
    // touching any fields.
    await this.page
      .getByRole('heading', { name: 'Add account' })
      .waitFor({ state: 'visible' });

    await fillReactInput(this.page.getByLabel('Name'), data.name);
    await fillReactInput(this.page.getByLabel('Balance'), String(data.balance));

    if (data.offBudget) {
      await this.page.getByLabel('Off budget').click();
    }

    await clickReactAriaButton(
      this.page.getByRole('button', { name: 'Create', exact: true }),
    );

    const accountPage = new AccountPage(this.page);
    await accountPage.waitFor();
    if (data.balance !== 0) {
      await accountPage.transactionTableRow.first().waitFor();
    }
    return accountPage;
  }

  async clickOnNoServer() {
    await this.page.getByRole('button', { name: 'No server' }).click();
  }

  async rightClickAccount(accountName: string) {
    await this.page
      .getByRole('link', { name: new RegExp(`^${accountName}`) })
      .click({ button: 'right' });
  }

  async rightClickBudgetName() {
    await this.page.getByTestId('budget-name').click({ button: 'right' });
  }
}
