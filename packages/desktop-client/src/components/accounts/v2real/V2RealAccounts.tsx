import React from 'react';
import { useTranslation } from 'react-i18next';

import { SvgViewList } from '@actual-app/components/icons/v1';
import { Text } from '@actual-app/components/text';
import { View } from '@actual-app/components/view';

import { AccountsView } from '#components/v2lab/accounts/AccountsView';
import { useNavigate } from '#hooks/useNavigate';

import { ACCOUNTS_ROOT_CLASS, AccountsStyle } from './AccountsStyle';
import { useRealAccountsData } from './useRealAccountsData';

/** A person's name. Not copy, so never a translation key. */
const AUTHOR = 'Diego Calixto';

/**
 * The real Accounts.
 *
 * It contributes no layout of its own: `AccountsView` is the approved
 * composition, shared with `/v2-lab/accounts`, and this file only supplies real
 * data, the token scope and the one destination the laboratory has no use for.
 * Anything that looks different between the two routes is a difference in the
 * data, never in the design.
 *
 * That destination matters: upstream, `/accounts` *was* the combined register.
 * This page answers a different question, so the register keeps its own address
 * at `/accounts/all`, and the control the reference reserved beside "Add
 * account" is how you reach it — a real action in the slot that would
 * otherwise hold an inert menu.
 */
export function V2RealAccounts() {
  const { t } = useTranslation();
  const data = useRealAccountsData();
  const navigate = useNavigate();

  return (
    <View
      className={ACCOUNTS_ROOT_CLASS}
      style={{
        flex: 1,
        minHeight: 0,
        backgroundColor: 'var(--dfl-canvas)',
        color: 'var(--dfl-text)',
      }}
    >
      <AccountsStyle />
      <AccountsView
        data={{
          ...data,
          headerAction: {
            Icon: SvgViewList,
            label: t('All transactions'),
            onPress: () => {
              void navigate('/accounts/all');
            },
          },
          // Authorship, not a panel. The breathing room lives on the text
          // rather than on the shared footer row, so the laboratory's own
          // footnotes keep the spacing they were approved with.
          footerRight: (
            <Text
              style={{
                paddingTop: 20,
                fontSize: 11.5,
                letterSpacing: 0.5,
                whiteSpace: 'nowrap',
                color: 'var(--dfl-text-3)',
              }}
            >
              {AUTHOR}
            </Text>
          ),
        }}
      />
    </View>
  );
}
