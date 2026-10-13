import { forwardRef, useCallback, useRef } from 'react';
import type { DragItem } from 'react-aria';
import {
  DropIndicator,
  ListBox,
  ListBoxItem,
  useDragAndDrop,
} from 'react-aria-components';
import { Trans, useTranslation } from 'react-i18next';

import { Button } from '@actual-app/components/button';
import { SvgAdd } from '@actual-app/components/icons/v1';
import { View } from '@actual-app/components/view';
import type { AccountEntity } from '@actual-app/core/types/models';
import { css } from '@emotion/css';

import { useMoveAccountMutation, useSyncAndDownloadMutation } from '#accounts';
import { isAccountFailedSync } from '#accounts/syncStatus';
import { MOBILE_NAV_SPACER } from '#components/mobile/MobileNavTabs';
import { MobilePrivacyToggle } from '#components/mobile/MobilePrivacyToggle';
import { PullToRefresh } from '#components/mobile/PullToRefresh';
import {
  mobileHeaderIconButtonStyle,
  MobilePageHeader,
  Page,
} from '#components/Page';
import { useRegionalFormatKey } from '#components/v2lab/LabStyle';
import { useAccountBalances } from '#hooks/useAccountBalances';
import { useAccounts } from '#hooks/useAccounts';
import { useLocalPref } from '#hooks/useLocalPref';
import { useNavigate } from '#hooks/useNavigate';
import { useSheetValue } from '#hooks/useSheetValue';
import { replaceModal } from '#modals/modalsSlice';
import { useDispatch, useSelector } from '#redux';
import * as bindings from '#spreadsheet/bindings';

import { AccountsMobileAddPanel } from './v2/AccountsMobileAddPanel';
import { AccountsMobileEmpty } from './v2/AccountsMobileEmpty';
import { AccountsMobileGroup } from './v2/AccountsMobileGroup';
import { AccountsMobileHero } from './v2/AccountsMobileHero';
import { AccountsMobileLoading } from './v2/AccountsMobileLoading';
import { AccountsMobileRow } from './v2/AccountsMobileRow';
import {
  ACCOUNTS_MOBILE_ROOT_CLASS,
  accountsLayout,
  AccountsMobileStyle,
  chromeAccent,
  chromeCanvas,
  chromeInk,
  chromeLine,
} from './v2/AccountsMobileStyle';

/**
 * Each group's tile colour, one hue for every row inside it.
 *
 * A ramp across the rows would give eight accounts eight colours and imply a
 * difference between them the data does not contain. These are the hues the
 * mobile Home already gives the same two groups, so the accounts a reader sees
 * on the Home and the accounts they see here are never a different colour.
 */
const ON_BUDGET_HUE = 'var(--dfl-hue-violet)';
const OFF_BUDGET_HUE = 'var(--dfl-hue-blue)';
/** A closed account keeps a tile, in the screen's own grey rather than a hue. */
const CLOSED_HUE = 'var(--dfma-hue-closed)';

/**
 * The Accounts, on a phone.
 *
 * Composition and presentation only. Every figure arrives from a cell the
 * budget engine publishes — `accounts-balance` for the hero, the three group
 * cells for the group headers, one `balance` cell per row — so no two lines on
 * the screen can disagree and nothing here adds a number up. Every destination,
 * preference and gesture the previous page had is still here: the four
 * registers, the closed-accounts toggle, drag-to-reorder, pull-to-refresh, the
 * bank-sync state and the highlight on a freshly synced account.
 */
export function AccountsPage() {
  // Redrawn whole when the file's number format or currency changes.
  const regionalFormat = useRegionalFormatKey();
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  // `placeholderData: []` means the query never reports `isLoading`, so an
  // empty array is what a loading file and a genuinely empty one both look
  // like. `isPlaceholderData` is the real signal, exactly as the mobile Home
  // already reads it.
  const { data: accounts = [], isPlaceholderData } = useAccounts();

  const onBudgetAccounts = accounts.filter(
    account => account.offbudget === 0 && account.closed === 0,
  );
  const offBudgetAccounts = accounts.filter(
    account => account.offbudget === 1 && account.closed === 0,
  );
  const closedAccounts = accounts.filter(account => account.closed === 1);

  // One bind per account, in a single hook, rather than a hook inside a list
  // whose length changes.
  const balances = useAccountBalances(accounts.map(account => account.id));

  const total = useSheetValue<'account', 'accounts-balance'>(
    bindings.allAccountBalance(),
  );
  const onBudgetTotal = useSheetValue<'account', 'onbudget-accounts-balance'>(
    bindings.onBudgetAccountBalance(),
  );
  const offBudgetTotal = useSheetValue<'account', 'offbudget-accounts-balance'>(
    bindings.offBudgetAccountBalance(),
  );
  const closedTotal = useSheetValue<'account', 'closed-accounts-balance'>(
    bindings.closedAccountBalance(),
  );

  const closedAccountsRef = useRef<HTMLDivElement | null>(null);
  const [showClosedAccounts, setShowClosedAccountsPref] = useLocalPref(
    'ui.showClosedAccounts',
  );

  const onToggleClosedAccounts = () => {
    const toggledState = !showClosedAccounts;
    setShowClosedAccountsPref(toggledState);
    if (toggledState) {
      // Make sure to scroll to the closed accounts when the user presses
      // on the account header, otherwise it's not clear that the accounts are there.
      // Delay the scroll until the component is rendered, otherwise the scroll
      // won't work.
      setTimeout(() => {
        closedAccountsRef.current?.scrollIntoView({ behavior: 'smooth' });
      });
    }
  };

  const onOpenAccount = useCallback(
    (account: AccountEntity) => {
      void navigate(`/accounts/${account.id}`);
    },
    [navigate],
  );

  const onAddAccount = useCallback(() => {
    dispatch(replaceModal({ modal: { name: 'add-account', options: {} } }));
  }, [dispatch]);

  const syncAndDownload = useSyncAndDownloadMutation();
  const onSync = useCallback(async () => {
    syncAndDownload.mutate({});
  }, [syncAndDownload]);

  const openRegister = (id: string) => () => {
    void navigate(`/accounts/${id}`);
  };

  return (
    <Page
      header={
        <MobilePageHeader
          title={<Trans>Contas</Trans>}
          // The header is portalled into the shell's slot, outside this page's
          // class, so it is painted with the scope's literals rather than its
          // tokens. Without this it keeps the shell's lighter grey and draws a
          // band across the top of the design.
          style={{
            backgroundColor: chromeCanvas,
            borderBottom: `1px solid ${chromeLine}`,
          }}
          // The ground is this page's own, so the ink has to be too.
          ink={chromeInk}
          rightContent={
            <>
              <Button
                variant="bare"
                aria-label={t('Adicionar conta')}
                style={mobileHeaderIconButtonStyle}
                onPress={onAddAccount}
              >
                <SvgAdd width={20} height={20} />
              </Button>
              {/* Last, as on every other top bar: the eye is found in the
                  same corner whichever page is open. */}
              <MobilePrivacyToggle
                style={mobileHeaderIconButtonStyle}
                accent={chromeAccent}
              />
            </>
          }
        />
      }
      padding={0}
      style={{ backgroundColor: chromeCanvas }}
    >
      <View
        key={regionalFormat}
        className={ACCOUNTS_MOBILE_ROOT_CLASS}
        style={{
          flex: 1,
          minHeight: 0,
          backgroundColor: 'var(--dfl-canvas)',
          color: 'var(--dfl-text)',
        }}
      >
        <AccountsMobileStyle />

        {accounts.length === 0 && isPlaceholderData ? (
          <View
            style={{
              padding: `14px ${accountsLayout.gutter}px`,
            }}
          >
            <AccountsMobileLoading />
          </View>
        ) : accounts.length === 0 ? (
          <AccountsMobileEmpty onAddAccount={onAddAccount} />
        ) : (
          <PullToRefresh onRefresh={onSync}>
            <View
              aria-label={t('Account list')}
              style={{
                width: '100%',
                flexShrink: 0,
                padding: `14px ${accountsLayout.gutter}px`,
                // The bar is fixed and overlays the page, so the bottom padding
                // has to clear it — and, on an iPhone, the home indicator under
                // it. The extra room is the Budget's: without it the last
                // control ended exactly at the bar's edge, under the raised
                // action button, which took the lower strip of its target.
                paddingBottom: `calc(${MOBILE_NAV_SPACER} + 14px)`,
                gap: accountsLayout.stackGap,
              }}
            >
              <AccountsMobileHero
                total={total}
                accountCount={
                  onBudgetAccounts.length + offBudgetAccounts.length
                }
                onOpenAllTransactions={openRegister('all')}
              />

              {onBudgetAccounts.length > 0 && (
                <AccountsMobileGroup
                  label={<Trans>No orçamento</Trans>}
                  subtotal={onBudgetTotal}
                  dotColor={ON_BUDGET_HUE}
                  actionLabel={t('Ver as transações das contas no orçamento')}
                  onPress={openRegister('onbudget')}
                >
                  <AccountList
                    aria-label={t('On budget accounts')}
                    accounts={onBudgetAccounts}
                    balances={balances}
                    hue={ON_BUDGET_HUE}
                    onOpenAccount={onOpenAccount}
                  />
                </AccountsMobileGroup>
              )}

              {offBudgetAccounts.length > 0 && (
                <AccountsMobileGroup
                  label={<Trans>Fora do orçamento</Trans>}
                  subtotal={offBudgetTotal}
                  dotColor={OFF_BUDGET_HUE}
                  actionLabel={t(
                    'Ver as transações das contas fora do orçamento',
                  )}
                  onPress={openRegister('offbudget')}
                >
                  <AccountList
                    aria-label={t('Off budget accounts')}
                    accounts={offBudgetAccounts}
                    balances={balances}
                    hue={OFF_BUDGET_HUE}
                    onOpenAccount={onOpenAccount}
                  />
                </AccountsMobileGroup>
              )}

              {closedAccounts.length > 0 && (
                <AccountsMobileGroup
                  label={<Trans>Encerradas</Trans>}
                  subtotal={closedTotal}
                  dotColor="var(--dfl-text-3)"
                  actionLabel={t('Mostrar ou ocultar as contas encerradas')}
                  onPress={onToggleClosedAccounts}
                  isExpanded={!!showClosedAccounts}
                >
                  {showClosedAccounts && (
                    <AccountList
                      aria-label={t('Closed accounts')}
                      accounts={closedAccounts}
                      balances={balances}
                      hue={CLOSED_HUE}
                      onOpenAccount={onOpenAccount}
                      ref={el => {
                        if (el) closedAccountsRef.current = el;
                      }}
                    />
                  )}
                </AccountsMobileGroup>
              )}

              <AccountsMobileAddPanel onPress={onAddAccount} />
            </View>
          </PullToRefresh>
        )}
      </View>
    </Page>
  );
}

type AccountListProps = {
  'aria-label': string;
  accounts: AccountEntity[];
  /** Live balances for every account on the page, keyed by id. */
  balances: Record<string, number | null>;
  hue: string;
  onOpenAccount: (account: AccountEntity) => void;
};

/**
 * The rows of one group.
 *
 * Still a react-aria `ListBox` with the same drag-and-drop hooks the previous
 * page used, because reordering accounts is a real feature and restyling a
 * screen is no reason to drop one. Only its chrome moved: the card around it
 * now draws the border and the radius, so the list itself is a plain column.
 */
const AccountList = forwardRef<HTMLDivElement, AccountListProps>(
  (
    {
      'aria-label': ariaLabel,
      accounts,
      balances,
      hue,
      onOpenAccount,
    }: AccountListProps,
    ref,
  ) => {
    const syncingAccountIds = useSelector(
      state => state.account.accountsSyncing,
    );
    const updatedAccounts = useSelector(state => state.account.updatedAccounts);

    const moveAccount = useMoveAccountMutation();

    const { dragAndDropHooks } = useDragAndDrop({
      getItems: keys =>
        [...keys].map(
          key =>
            ({
              'text/plain': key as AccountEntity['id'],
            }) as DragItem,
        ),
      renderDropIndicator: target => {
        return (
          <DropIndicator
            target={target}
            className={css({
              '&[data-drop-target]': {
                height: 4,
                backgroundColor: 'var(--dfl-blue)',
                opacity: 1,
                borderRadius: 4,
              },
            })}
          />
        );
      },
      onReorder: e => {
        const [key] = e.keys;
        const accountIdToMove = key as AccountEntity['id'];
        const targetAccountId = e.target.key as AccountEntity['id'];

        if (e.target.dropPosition === 'before') {
          moveAccount.mutate({
            id: accountIdToMove,
            targetId: targetAccountId,
          });
        } else if (e.target.dropPosition === 'after') {
          const targetAccountIndex = accounts.findIndex(
            account => account.id === e.target.key,
          );
          if (targetAccountIndex === -1) {
            throw new Error(
              `Internal error: account with ID ${targetAccountId} not found.`,
            );
          }

          const nextToTargetAccount = accounts[targetAccountIndex + 1];

          moveAccount.mutate({
            id: accountIdToMove,
            // Due to the way `moveAccount` works, we use the account next to the
            // actual target account here because `moveAccount` always shoves the
            // account *before* the target account.
            // On the other hand, using `null` as `targetId`moves the account
            // to the end of the list.
            targetId: nextToTargetAccount?.id || null,
          });
        }
      },
    });

    return (
      <ListBox
        aria-label={ariaLabel}
        items={accounts}
        dependencies={[syncingAccountIds, updatedAccounts, balances]}
        dragAndDropHooks={dragAndDropHooks}
        ref={ref}
        style={{ display: 'flex', flexDirection: 'column' }}
      >
        {account => (
          <ListBoxItem
            key={account.id}
            id={account.id}
            value={account}
            textValue={account.name}
          >
            {itemProps => (
              <AccountsMobileRow
                account={account}
                balance={balances[account.id] ?? null}
                hue={hue}
                isConnected={!!account.bank}
                syncState={
                  syncingAccountIds.includes(account.id)
                    ? 'pending'
                    : isAccountFailedSync(account)
                      ? 'failed'
                      : 'idle'
                }
                isUpdated={
                  !!updatedAccounts && updatedAccounts.includes(account.id)
                }
                isLast={account.id === accounts[accounts.length - 1]?.id}
                itemProps={itemProps}
                onPress={() => onOpenAccount(account)}
              />
            )}
          </ListBoxItem>
        )}
      </ListBox>
    );
  },
);

AccountList.displayName = 'AccountList';
