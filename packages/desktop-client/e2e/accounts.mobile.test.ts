import type { Page } from '@playwright/test';

import { expect, test } from './fixtures';
import { ConfigurationPage } from './page-models/configuration-page';
import { MobileNavigation } from './page-models/mobile-navigation';

test.describe('Mobile Accounts', () => {
  let page: Page;
  let navigation: MobileNavigation;
  let configurationPage: ConfigurationPage;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    navigation = new MobileNavigation(page);
    configurationPage = new ConfigurationPage(page);

    await page.setViewportSize({
      width: 350,
      height: 600,
    });
    await page.goto('/');
    await configurationPage.createTestFile();
  });

  test.afterEach(async () => {
    await page?.close();
  });

  test('opens the accounts page and asserts on balances', async () => {
    const accountsPage = await navigation.goToAccountsPage();
    await accountsPage.waitFor();

    const account = await accountsPage.getNthAccount(1);

    await expect(account.name).toHaveText('Ally Savings');
    // The V2 mobile Accounts prints money in pt-BR with the symbol, and the
    // `account-balance` testid now covers the symbol and the digits together
    // (they are set at different sizes, so they are separate elements). A
    // regex keeps the assertion on the figure itself rather than on the
    // spacing between the two.
    await expect(account.balance).toHaveText(/7\.653,00/);
    await expect(page).toMatchThemeScreenshots();
  });

  test('opens individual account page and checks that filtering is working', async () => {
    const accountsPage = await navigation.goToAccountsPage();
    await accountsPage.waitFor();

    const accountPage = await accountsPage.openNthAccount(0);
    await accountPage.waitFor();

    await expect(accountPage.heading).toHaveText('Bank of America');
    await expect(accountPage.transactionList).toBeVisible();
    expect(await accountPage.getBalance()).toBeGreaterThan(0);
    await expect(accountPage.noTransactionsMessage).not.toBeVisible();
    await expect(page).toMatchThemeScreenshots();

    await accountPage.searchByText('nothing should be found');
    await expect(accountPage.noTransactionsMessage).toBeVisible();
    await expect(accountPage.transactions).toHaveCount(0);
    await expect(page).toMatchThemeScreenshots();

    await accountPage.clearSearch();
    await expect(accountPage.transactions).not.toHaveCount(0);

    await accountPage.searchByText('Kroger');
    await expect(accountPage.transactions).not.toHaveCount(0);
    await expect(page).toMatchThemeScreenshots();
  });

  test('reconciles an account', async () => {
    const accountsPage = await navigation.goToAccountsPage();
    await accountsPage.waitFor();

    const accountPage = await accountsPage.openNthAccount(0);
    await accountPage.waitFor();

    await accountPage.startReconciliation('200.00');
    await expect(accountPage.reconcilingBannerDifference).toBeVisible();
    await expect(page).toMatchThemeScreenshots();

    await accountPage.createReconciliationTransaction();
    await expect(accountPage.reconcilingBannerAllReconciled).toBeVisible();
    await expect(page).toMatchThemeScreenshots();

    await accountPage.unclearFirstTransaction();
    await expect(accountPage.reconcilingBannerDifference).toBeVisible();

    await accountPage.clearFirstTransaction();
    await expect(accountPage.reconcilingBannerAllReconciled).toBeVisible();

    await accountPage.lockTransactions();
    await expect(accountPage.reconcilingBanner).not.toBeVisible();
  });
});
