import type { Locator, Page } from '@playwright/test';

import { MobileAccountPage } from './mobile-account-page';
import { MobileAccountsPage } from './mobile-accounts-page';
import { MobileBankSyncPage } from './mobile-bank-sync-page';
import { MobileBudgetPage } from './mobile-budget-page';
import { MobilePayeesPage } from './mobile-payees-page';
import { MobileReportsPage } from './mobile-reports-page';
import { MobileRulesPage } from './mobile-rules-page';
import { MobileSchedulesPage } from './mobile-schedules-page';
import { MobileTransactionEntryPage } from './mobile-transaction-entry-page';
import { SettingsPage } from './settings-page';

/**
 * Where each destination sits on the phone's bar: a tab with the bar's own
 * label, the raised action in its centre, or an entry behind "Mais".
 */
const DESTINATIONS = {
  Budget: { route: '/budget', tab: 'Orçamento' },
  Accounts: { route: '/accounts', tab: 'Contas' },
  Transaction: { route: '/transactions/new', action: 'New transaction' },
  Reports: { route: '/reports', more: 'Reports' },
  Schedules: { route: '/schedules', more: 'Schedules' },
  Payees: { route: '/payees', more: 'Payees' },
  Rules: { route: '/rules', more: 'Rules' },
  'Bank Sync': { route: '/bank-sync', more: 'Bank Sync' },
  Settings: { route: '/settings', more: 'Settings' },
} satisfies Record<
  string,
  { route: string; tab?: string; action?: string; more?: string }
>;

export class MobileNavigation {
  readonly page: Page;
  readonly heading: Locator;
  readonly navbar: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading');
    this.navbar = page.getByRole('navigation');
  }

  async navigateToPage<T extends { waitFor: Locator['waitFor'] }>(
    pageName: keyof typeof DESTINATIONS,
    pageModelFactory: () => T,
  ): Promise<T> {
    const pageInstance = pageModelFactory();
    const destination: {
      route: string;
      tab?: string;
      action?: string;
      more?: string;
    } = DESTINATIONS[pageName];

    if (this.page.url().endsWith(destination.route)) {
      // Already on the page.
      return pageInstance;
    }

    await this.navbar.waitFor();

    if (destination.tab) {
      await this.navbar.getByRole('link', { name: destination.tab }).click();
    } else if (destination.action) {
      await this.navbar
        .getByRole('button', { name: destination.action })
        .click();
    } else if (destination.more) {
      // Everything the upstream sheet revealed by dragging is one tap away,
      // behind the bar's last entry.
      await this.navbar.getByRole('button', { name: 'Mais' }).click();
      await this.page
        .getByRole('menu')
        .getByRole('button', { name: destination.more, exact: true })
        .click();
    }

    await pageInstance.waitFor();

    return pageInstance;
  }

  async goToBudgetPage() {
    return await this.navigateToPage(
      'Budget',
      () => new MobileBudgetPage(this.page),
    );
  }

  async goToAccountsPage() {
    return await this.navigateToPage(
      'Accounts',
      () => new MobileAccountsPage(this.page),
    );
  }

  async goToUncategorizedPage() {
    // "Categorize" upstream; the phone's budget names the same banner action
    // "Categorizar transações sem categoria".
    const button = this.page.getByRole('button', { name: /^Categoriz/ });
    await button.click();

    return new MobileAccountPage(this.page);
  }

  async goToTransactionEntryPage() {
    return await this.navigateToPage(
      'Transaction',
      () => new MobileTransactionEntryPage(this.page),
    );
  }

  async goToReportsPage() {
    return await this.navigateToPage(
      'Reports',
      () => new MobileReportsPage(this.page),
    );
  }

  async goToPayeesPage() {
    return await this.navigateToPage(
      'Payees',
      () => new MobilePayeesPage(this.page),
    );
  }

  async goToSchedulesPage() {
    return this.navigateToPage(
      'Schedules',
      () => new MobileSchedulesPage(this.page),
    );
  }

  async goToRulesPage() {
    return await this.navigateToPage(
      'Rules',
      () => new MobileRulesPage(this.page),
    );
  }

  async goToBankSyncPage() {
    return await this.navigateToPage(
      'Bank Sync',
      () => new MobileBankSyncPage(this.page),
    );
  }

  async goToSettingsPage() {
    return await this.navigateToPage(
      'Settings',
      () => new SettingsPage(this.page),
    );
  }
}
