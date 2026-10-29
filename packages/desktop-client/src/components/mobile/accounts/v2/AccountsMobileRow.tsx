import React from 'react';
import type { ReactNode } from 'react';
import type { ListBoxItemRenderProps } from 'react-aria-components';
import { useTranslation } from 'react-i18next';

import { Button } from '@actual-app/components/button';
import { SvgCheveronRight } from '@actual-app/components/icons/v1';
import { Text } from '@actual-app/components/text';
import { TextOneLine } from '@actual-app/components/text-one-line';
import { View } from '@actual-app/components/view';
import { tsToRelativeTime } from '@actual-app/core/shared/util';
import type { AccountEntity } from '@actual-app/core/types/models';
import { css } from '@emotion/css';

import { cardBrandForAccount } from '#accounts/accountCardBrand';
import { parseSyncTimestamp } from '#accounts/bankData';
import { AccountCardThumbnail } from '#components/accounts/cardThumbnail/AccountCardThumbnail';
import { iconForAccount } from '#components/v2lab/LabStyle';
import { useLocale } from '#hooks/useLocale';

import { AccountsMobileMoney } from './AccountsMobileMoney';
import { currencyWithSign, magnitude } from './accountsMoneyFormat';

type SyncState = 'idle' | 'pending' | 'failed';

type AccountsMobileRowProps = {
  account: AccountEntity;
  /** The account's own balance cell, or `null` while it loads. */
  balance: number | null;
  /** The group's tile colour, shared by every row inside it. */
  hue: string;
  /** Only a linked account shows a dot at all. */
  isConnected: boolean;
  syncState: SyncState;
  /** The account received transactions on the last sync. */
  isUpdated: boolean;
  /** The last row closes its group, so it draws no divider. */
  isLast: boolean;
  /** Props react-aria's `ListBoxItem` hands its child. */
  itemProps: ListBoxItemRenderProps & { defaultChildren: ReactNode };
  onPress: () => void;
};

/**
 * One account.
 *
 * A row inside a grouped surface rather than a card of its own, exactly as the
 * mobile Home already draws its account list: a column of cards would turn a
 * file's accounts into eight competing objects, and the approved composition
 * reads them as one list per group.
 *
 * The second line is the account's real detail — the bank name and masked
 * number a sync provider supplied — and is simply absent when there is none.
 * Nothing about the account is synthesised: Actual carries no account type, so
 * a row never claims to know one.
 *
 * The balance takes the negative tone when it is negative and stays in the
 * page's own ink otherwise. It is deliberately not painted green when positive:
 * on this screen every row is a balance, so a column of green would be decoration
 * rather than information, and would leave nothing louder for a real overdraft.
 */
export function AccountsMobileRow({
  account,
  balance,
  hue,
  isConnected,
  syncState,
  isUpdated,
  isLast,
  itemProps,
  onPress,
}: AccountsMobileRowProps) {
  const { t } = useTranslation();
  const locale = useLocale();
  const Icon = iconForAccount(account.name);
  const cardBrand = cardBrandForAccount(account.name);

  // When the bank was last read, for a linked account: the dot says whether
  // the last attempt worked, this says how old the figures are.
  const lastSync = isConnected ? parseSyncTimestamp(account.last_sync) : null;
  const freshness = !isConnected
    ? null
    : lastSync === null
      ? t('Not read from the bank yet')
      : t('updated {{when}}', {
          when: tsToRelativeTime(String(lastSync), locale),
        });

  const detailParts = [
    account.bankName,
    account.mask ? `•••• ${account.mask}` : null,
    freshness,
  ].filter(Boolean);
  const detail = detailParts.length > 0 ? detailParts.join(' · ') : null;

  const dotColor =
    syncState === 'pending'
      ? 'var(--dfl-hue-amber)'
      : syncState === 'failed'
        ? 'var(--dfl-negative)'
        : 'var(--dfl-positive)';

  return (
    <Button
      {...itemProps}
      variant="bare"
      data-testid="account-list-item"
      aria-label={t('Ver transações de {{name}}', { name: account.name })}
      onPress={onPress}
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
        <View
          aria-hidden="true"
          style={{
            position: 'relative',
            flexShrink: 0,
            alignItems: 'center',
            justifyContent: 'center',
            width: 38,
            height: 38,
            ...(cardBrand
              ? null
              : {
                  borderRadius: 'var(--dfma-radius-tile)',
                  backgroundColor: `color-mix(in srgb, ${hue} 13%, transparent)`,
                  border: `1px solid color-mix(in srgb, ${hue} 22%, transparent)`,
                }),
          }}
        >
          {cardBrand ? (
            <AccountCardThumbnail brand={cardBrand} size={38} />
          ) : (
            <Icon width={18} height={18} style={{ color: hue }} />
          )}

          {/* The bank-sync state the previous page showed as a dot beside the
              name. It keeps that meaning and moves onto the tile, where it
              reads as a badge on the account rather than as a bullet in the
              text. An account with no bank link shows nothing at all. */}
          {isConnected && (
            <View
              style={{
                position: 'absolute',
                // On a card the badge sits on the card's own corner, which is
                // lower than the square tile's: the card is 24 px tall,
                // centred in the same 38 px slot.
                top: cardBrand ? 4 : -3,
                right: -3,
                width: 9,
                height: 9,
                borderRadius: 999,
                backgroundColor: dotColor,
                border: '2px solid var(--dfl-surface)',
              }}
            />
          )}
        </View>

        <View
          style={{ flex: 1, minWidth: 0, gap: 1, alignItems: 'flex-start' }}
        >
          {/* An account the last sync brought transactions into keeps the
              highlight the previous page gave it, in this screen's accent. */}
          <TextOneLine
            data-testid="account-name"
            style={{
              fontSize: 15,
              fontWeight: 600,
              letterSpacing: -0.2,
              color: isUpdated ? 'var(--dfl-blue)' : 'var(--dfl-text)',
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
          {/* The symbol sits at its own size beside the digits, so it carries
              the testid with them: the balance is one fact, and a locator that
              found only half of it would report half a number. */}
          <View
            data-testid="account-balance"
            style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
          >
            {balance !== null && (
              <Text
                style={{
                  fontSize: 12.5,
                  fontWeight: 600,
                  color:
                    balance < 0 ? 'var(--dfl-negative)' : 'var(--dfl-text-2)',
                }}
              >
                {currencyWithSign(balance)}
              </Text>
            )}
            <AccountsMobileMoney
              value={magnitude(balance)}
              style={{
                fontSize: 15,
                fontWeight: 600,
                letterSpacing: -0.2,
                color:
                  balance !== null && balance < 0
                    ? 'var(--dfl-negative)'
                    : 'var(--dfl-text)',
              }}
            />
          </View>
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
