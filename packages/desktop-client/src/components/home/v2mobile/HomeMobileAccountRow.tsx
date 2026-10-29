import React from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@actual-app/components/button';
import { SvgCheveronRight } from '@actual-app/components/icons/v1';
import { Text } from '@actual-app/components/text';
import { TextOneLine } from '@actual-app/components/text-one-line';
import { View } from '@actual-app/components/view';
import * as monthUtils from '@actual-app/core/shared/months';
import { css } from '@emotion/css';

import { cardBrandForAccount } from '#accounts/accountCardBrand';
import type { CardBill, CardInsights } from '#accounts/bankData';
import { AccountCardThumbnail } from '#components/accounts/cardThumbnail/AccountCardThumbnail';
import { iconForAccount } from '#components/v2lab/LabStyle';
import { MOBILE_TYPE } from '#components/v2lab/typeScale';
import { useLocale } from '#hooks/useLocale';
import { useNavigate } from '#hooks/useNavigate';

import type { HomeAccount } from './homeData';
import { useAccountBalance } from './homeData';
import { HomeMobileIconTile } from './HomeMobileIconTile';
import { HomeMobileMoney } from './HomeMobileMoney';
import { currencySymbol } from './mobileMoneyFormat';

type HomeMobileAccountRowProps = {
  homeAccount: HomeAccount;
  hue: string;
  /** The last row closes its group, so it draws no divider. */
  isLast: boolean;
  /**
   * What the bank's entries say about this account. With an open bill the
   * row's second line is the bill — what has posted and what the bank has not
   * confirmed — instead of the bank name, because for a card that is the
   * question the balance raises.
   */
  card?: CardInsights;
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
  card,
}: HomeMobileAccountRowProps) {
  const { t } = useTranslation();
  const locale = useLocale();
  const navigate = useNavigate();
  const { account, kind, detail } = homeAccount;
  const bill = card?.current ?? null;
  const balance = useAccountBalance(account.id);
  const Icon = iconForAccount(account.name);
  const cardBrand = cardBrandForAccount(account.name);

  // On-budget money is spendable and reads in the positive colour; off-budget
  // money is not, so it reads in plain text — painting it green too would tell
  // the reader it is available when the group header has just said it is not.
  // A balance below zero is neither: an overdrawn account drawn in green said
  // the opposite of what it meant, so it takes the negative tone in both
  // groups, as the same account does on the Accounts page.
  const isNegative = balance !== null && balance < 0;
  const balanceColor = isNegative
    ? 'var(--dfl-negative)'
    : kind === 'onBudget'
      ? 'var(--dfl-positive)'
      : 'var(--dfl-text)';

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
        {cardBrand ? (
          <AccountCardThumbnail brand={cardBrand} size={38} />
        ) : (
          <HomeMobileIconTile Icon={Icon} hue={hue} />
        )}

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
          {bill ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'baseline',
                flexWrap: 'wrap',
                gap: '0 4px',
              }}
            >
              <Text
                style={{
                  fontSize: MOBILE_TYPE.label,
                  color: 'var(--dfl-text-3)',
                }}
              >
                {t('Bill of {{month}}', {
                  month: monthUtils.format(`${bill.month}-01`, 'MMM', locale),
                })}
              </Text>
              <HomeMobileMoney
                value={Math.abs(bill.figure)}
                withCurrency
                style={{
                  fontSize: MOBILE_TYPE.label,
                  fontWeight: 600,
                  color: 'var(--dfl-text-2)',
                }}
              />
              <BillState bill={bill} />
            </View>
          ) : (
            detail !== null && (
              <TextOneLine style={{ fontSize: 12, color: 'var(--dfl-text-3)' }}>
                {detail}
              </TextOneLine>
            )
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
          {/* The minus leads, ahead of the symbol — "-R$ 312.500,00" — as it
              does on every other figure of this page and on the Accounts
              page. Left with the digits it read "R$ -312.500,00". */}
          {balance !== null && (
            <Text
              style={{
                fontSize: 12.5,
                fontWeight: 600,
                whiteSpace: 'nowrap',
                color: balanceColor,
              }}
            >
              {isNegative ? `-${currencySymbol()}` : currencySymbol()}
            </Text>
          )}
          <HomeMobileMoney
            value={balance === null ? null : Math.abs(balance)}
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

type BillStateProps = {
  bill: CardBill;
};

/**
 * Where the bill stands, after its figure, in the words the bank's own
 * entries justify: open, closed and to pay, paid on a date, paid in part, or
 * a payment that fits nothing — the last two sending the reader to the bank.
 */
function BillState({ bill }: BillStateProps) {
  const { t } = useTranslation();
  const locale = useLocale();
  const label = { fontSize: MOBILE_TYPE.label };
  const money = { fontSize: MOBILE_TYPE.label, fontWeight: 600 };
  const paidAmount = Math.abs(bill.paid?.amount ?? 0);

  // Open, closed and paid are read off the entries and the payments, not
  // stated by the bank: each says so.
  const estimated = ` (${t('estimated')})`;
  switch (bill.state) {
    case 'open':
      return (
        <Text style={{ ...label, color: 'var(--dfl-hue-amber)' }}>
          {`· ${t('still open')}${estimated}`}
        </Text>
      );
    case 'closed':
      return (
        <Text style={{ ...label, color: 'var(--dfl-negative)' }}>
          {`· ${t('closed, to pay')}${estimated}`}
        </Text>
      );
    case 'paid':
      return (
        <Text style={{ ...label, color: 'var(--dfl-positive)' }}>
          {`· ${t('paid on {{date}}', {
            date: bill.paid
              ? monthUtils.format(bill.paid.on, 'd MMM', locale)
              : '',
          })}${estimated}`}
        </Text>
      );
    case 'partial':
      return (
        <>
          <Text style={{ ...label, color: 'var(--dfl-hue-amber)' }}>
            {`· ${t('partly paid:')}`}
          </Text>
          <HomeMobileMoney
            value={paidAmount}
            withCurrency
            style={{ ...money, color: 'var(--dfl-hue-amber)' }}
          />
          <Text style={{ ...label, color: 'var(--dfl-text-3)' }}>
            {`· ${t('check at the bank')}`}
          </Text>
        </>
      );
    case 'uncertain':
      if (!bill.paid) {
        return (
          <Text style={{ ...label, color: 'var(--dfl-hue-amber)' }}>
            {`· ${t('cannot tell if it was paid')} · ${t('check at the bank')}`}
          </Text>
        );
      }
      return (
        <>
          <Text style={{ ...label, color: 'var(--dfl-hue-amber)' }}>
            {`· ${t('a payment of')}`}
          </Text>
          <HomeMobileMoney
            value={paidAmount}
            withCurrency
            style={{ ...money, color: 'var(--dfl-hue-amber)' }}
          />
          <Text style={{ ...label, color: 'var(--dfl-text-3)' }}>
            {`${t('does not match it')} · ${t('check at the bank')}`}
          </Text>
        </>
      );
    default:
      return null;
  }
}
