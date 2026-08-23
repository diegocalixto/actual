import type { useTranslation } from 'react-i18next';

import type {
  AccountEntity,
  PayeeEntity,
  TransactionEntity,
} from '@actual-app/core/types/models';

type GetPrettyPayeeProps = {
  t: ReturnType<typeof useTranslation>['t'];
  transaction?: TransactionEntity;
  payee?: PayeeEntity;
  transferAccount?: AccountEntity;
};

export function getPrettyPayee({
  t,
  transaction,
  payee,
  transferAccount,
}: GetPrettyPayeeProps) {
  if (!transaction) {
    return '';
  }

  if (transferAccount) {
    return transaction?.amount > 0
      ? t('Transfer from {{accountName}}', {
          accountName: transferAccount.name,
        })
      : t('Transfer to {{accountName}}', { accountName: transferAccount.name });
  } else if (transaction.is_parent) {
    return t('Split');
  } else if (payee) {
    return payee.name;
  }

  return '';
}
