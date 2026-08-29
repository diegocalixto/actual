import React from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@actual-app/components/button';
import { SvgCheveronRight } from '@actual-app/components/icons/v1';
import { Text } from '@actual-app/components/text';
import { TextOneLine } from '@actual-app/components/text-one-line';
import { View } from '@actual-app/components/view';
import { css } from '@emotion/css';

import { iconForAccount } from '#components/v2lab/LabStyle';
import { useNavigate } from '#hooks/useNavigate';

import type { HomeAccount } from './homeData';
import { useAccountBalance } from './homeData';
import { HomeMobileIconTile } from './HomeMobileIconTile';
import { HomeMobileMoney } from './HomeMobileMoney';
import { CURRENCY } from './mobileMoneyFormat';

type HomeMobileAccountRowProps = {
  homeAccount: HomeAccount;
  hue: string;
  /** The last row closes its group, so it draws no divider. */
  isLast: boolean;
};

/**
 * One account.
 *
 * A row inside a grouped surface rather than a card of its own: five cards
 * would turn the accounts into five competing objects, and the approved
 * composition reads them as one list. Depth comes from the tile and the
 * hairline between rows, which is enough to make the row feel touchable
 * without drawing a button around it — and it *is* touchable: the whole row
 * opens the account, the same destination the previous Home used.
 *
 * The second line is the account's real detail — the bank name and masked
 * number a sync provider supplied — and is simply absent when there is none.
 * Nothing about the account is synthesised: Actual carries no account type, so
 * a row never claims to know one.
 */
export function HomeMobileAccountRow({
  homeAccount,
  hue,
  isLast,
}: HomeMobileAccountRowProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { account, kind, detail } = homeAccount;
  const balance = useAccountBalance(account.id);
  const Icon = iconForAccount(account.name);

  // On-budget money is spendable and reads in the positive colour; off-budget
  // money is not, so it reads in plain text — painting it green too would tell
  // the reader it is available when the group header has just said it is not.
  const balanceColor =
    kind === 'onBudget' ? 'var(--dfl-positive)' : 'var(--dfl-text)';

  return (
    <Button
      variant="bare"
      aria-label={t('Ver transações de {{name}}', { name: account.name })}
      onPress={() => void navigate(`/accounts/${account.id}`)}
      className={css({
        width: '100%',
        padding: '10px 14px',
        borderRadius: 0,
        borderBottom: isLast ? 'none' : '1px solid var(--dfl-line)',
        '&[data-hovered]': { backgroundColor: 'var(--dfl-surface-raised)' },
        '&[data-pressed]': { backgroundColor: 'var(--dfl-inset)' },
      })}
    >
      <View
        style={{
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          minWidth: 0,
        }}
      >
        <HomeMobileIconTile Icon={Icon} hue={hue} />

        <View
          style={{ flex: 1, minWidth: 0, gap: 1, alignItems: 'flex-start' }}
        >
          <TextOneLine
            style={{
              fontSize: 15,
              fontWeight: 600,
              letterSpacing: -0.2,
              color: 'var(--dfl-text)',
            }}
          >
            {account.name}
          </TextOneLine>
          {detail !== null && (
            <TextOneLine style={{ fontSize: 12, color: 'var(--dfl-text-3)' }}>
              {detail}
            </TextOneLine>
          )}
        </View>

        <View
          style={{
            flexShrink: 0,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
          }}
        >
          {balance !== null && (
            <Text
              style={{ fontSize: 12.5, fontWeight: 600, color: balanceColor }}
            >
              {CURRENCY}
            </Text>
          )}
          <HomeMobileMoney
            value={balance}
            style={{
              fontSize: 15,
              fontWeight: 600,
              letterSpacing: -0.2,
              color: balanceColor,
            }}
          />
          <SvgCheveronRight
            aria-hidden="true"
            width={15}
            height={15}
            style={{ color: 'var(--dfl-text-3)' }}
          />
        </View>
      </View>
    </Button>
  );
}
