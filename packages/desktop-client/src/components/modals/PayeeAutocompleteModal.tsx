import React from 'react';
import { useTranslation } from 'react-i18next';

import { useResponsive } from '@actual-app/components/hooks/useResponsive';
import { theme } from '@actual-app/components/theme';

import { PayeeAutocomplete } from '#components/autocomplete/PayeeAutocomplete';
import {
  Modal,
  ModalCloseButton,
  ModalHeader,
  ModalTitle,
} from '#components/common/Modal';
import { useAccounts } from '#hooks/useAccounts';
import { useNavigate } from '#hooks/useNavigate';
import { usePayees } from '#hooks/usePayees';
import type { Modal as ModalType } from '#modals/modalsSlice';

type PayeeAutocompleteModalProps = Extract<
  ModalType,
  { name: 'payee-autocomplete' }
>['options'];

export function PayeeAutocompleteModal({
  onSelect,
  transactionAccountId,
  onClose,
}: PayeeAutocompleteModalProps) {
  const { t } = useTranslation();
  const { data: allPayees = [] } = usePayees();
  const { data: allAccounts = [] } = useAccounts();
  // Filter out the account the transaction is in as it is not a valid
  // transfer: the register does the same for its payee cell.
  const accounts = allAccounts.filter(
    account => account.id !== transactionAccountId,
  );
  const payees = allPayees.filter(
    payee =>
      !payee.transfer_acct || payee.transfer_acct !== transactionAccountId,
  );
  const navigate = useNavigate();

  const { isNarrowWidth } = useResponsive();
  const defaultAutocompleteProps = {
    containerProps: { style: { height: isNarrowWidth ? '90vh' : 275 } },
  };

  const onManagePayees = () => navigate('/payees');

  return (
    <Modal
      name="payee-autocomplete"
      noAnimation={!isNarrowWidth}
      onClose={onClose}
      containerProps={{
        style: {
          height: isNarrowWidth
            ? 'calc(var(--visual-viewport-height) * 0.85)'
            : 275,
          backgroundColor: theme.menuAutoCompleteBackground,
        },
      }}
    >
      {({ state }) => (
        <>
          {isNarrowWidth && (
            <ModalHeader
              title={
                <ModalTitle
                  title={t('Payee')}
                  getStyle={() => ({ color: theme.menuAutoCompleteText })}
                />
              }
              rightContent={
                <ModalCloseButton
                  onPress={() => state.close()}
                  style={{ color: theme.menuAutoCompleteText }}
                />
              }
            />
          )}
          <PayeeAutocomplete
            payees={payees}
            accounts={accounts}
            focused
            embedded
            closeOnBlur={false}
            onClose={() => state.close()}
            onManagePayees={onManagePayees}
            showManagePayees={!isNarrowWidth}
            // On a phone the picker draws the switch as a choice of two
            // above the search field; see `PayeeTransferTabs`.
            showMakeTransfer
            {...defaultAutocompleteProps}
            onSelect={onSelect}
            value={null}
          />
        </>
      )}
    </Modal>
  );
}
