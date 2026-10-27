import React from 'react';
import type { ReactNode } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { Button } from '@actual-app/components/button';
import {
  SvgCheveronRight,
  SvgExclamationOutline,
} from '@actual-app/components/icons/v1';
import { Text } from '@actual-app/components/text';
import { View } from '@actual-app/components/view';
import type { IndicatorTotals } from '@actual-app/core/shared/month-indicators';
import * as monthUtils from '@actual-app/core/shared/months';
import { tsToRelativeTime } from '@actual-app/core/shared/util';
import { css } from '@emotion/css';

import type { SyncFreshness } from '#accounts/bankData';
import { MOBILE_TYPE } from '#components/v2lab/typeScale';
import { useBankSyncDoubts } from '#hooks/useBankSyncDoubts';
import { useLocale } from '#hooks/useLocale';
import { useNavigate } from '#hooks/useNavigate';
import { useOverspentCategories } from '#hooks/useOverspentCategories';

import type { CardInsightsByAccount, HomeAccount } from './homeData';
import { HomeMobileMoney } from './HomeMobileMoney';
import { HomeMobileSectionLabel } from './HomeMobileSectionLabel';

type HomeMobileAttentionProps = {
  /** `YYYY-MM`. */
  month: string;
  /** The month's figures, or `null` while they load. */
  details: IndicatorTotals | null;
  accounts: HomeAccount[];
  cards: CardInsightsByAccount;
  freshness: SyncFreshness;
  /**
   * Whether anything is budgeted in the month. Overspending is a statement
   * about a plan: with nothing planned, every category that spent would be
   * "over budget", which says nothing, so the row is kept for months that
   * have a plan.
   */
  hasPlan: boolean;
  /** Opens the month's outflows still without a category. */
  onOpenUncategorized: () => void;
  /** Opens the month's inflows still without a category. */
  onOpenPendingInflows: () => void;
};

type AttentionRow = {
  key: string;
  label: ReactNode;
  /** Integer minor units, or `null` when the row is a fact without a figure. */
  value: number | null;
  /** A failure, as opposed to something merely waiting. */
  isFailure?: boolean;
  onPress: () => void;
};

/**
 * What needs a decision or a look, in one place.
 *
 * The screen used to scatter this: inflows to review under the month figures,
 * uncategorized spending as a grey row in the spending list, overspent
 * categories only on the Budget, a sync failure only as a red dot on Contas.
 * Here each is one line with the figure it is about and the list it opens,
 * drawn only while it is true. The bank's side is stated too — purchases the
 * bank still lists as pending, manual entries not cleared yet, a read that is
 * stale or failed — because a figure built on them is not final, and the page
 * should say so where the figure is, not in a settings screen.
 *
 * Nothing here is computed: the month comes from the indicator rules, the
 * overspending from the budget engine's balance cells, the card and sync
 * facts from `accounts/bankData`.
 */
export function HomeMobileAttention({
  month,
  details,
  accounts,
  cards,
  freshness,
  hasPlan,
  onOpenUncategorized,
  onOpenPendingInflows,
}: HomeMobileAttentionProps) {
  const { t } = useTranslation();
  const locale = useLocale();
  const navigate = useNavigate();
  const { categories: overspent, totalAmount: overspentTotal } =
    useOverspentCategories({ month });
  const doubts = useBankSyncDoubts();

  const rows: AttentionRow[] = [];

  if (details && details.uncategorizedSpending !== 0) {
    rows.push({
      key: 'uncategorized',
      label: <Trans>Uncategorized spending this month</Trans>,
      value: details.uncategorizedSpending,
      onPress: onOpenUncategorized,
    });
  }
  if (details && details.pendingInflows !== 0) {
    rows.push({
      key: 'pending-inflows',
      label: <Trans>Inflows to review</Trans>,
      value: details.pendingInflows,
      onPress: onOpenPendingInflows,
    });
  }
  if (hasPlan && overspent.length > 0) {
    rows.push({
      key: 'overspent',
      label: t('{{count}} categories over budget', {
        count: overspent.length,
      }),
      // The engine reports overspending as a negative balance; the row states
      // the shortfall as the magnitude it is.
      value: Math.abs(overspentTotal),
      onPress: () => void navigate('/budget'),
    });
  }
  if (freshness.failed.length > 0) {
    rows.push({
      key: 'sync-failed',
      label: t('Bank sync failed: {{names}}', {
        names: freshness.failed.map(account => account.name).join(', '),
      }),
      value: null,
      isFailure: true,
      onPress: () => void navigate('/bank-sync'),
    });
  } else if (freshness.stale.length > 0 && freshness.oldestSync !== null) {
    rows.push({
      key: 'sync-stale',
      label: t('Bank data last read {{when}}', {
        when: tsToRelativeTime(String(freshness.oldestSync), locale),
      }),
      value: null,
      onPress: () => void navigate('/bank-sync'),
    });
  }
  for (const { account } of accounts) {
    const openAccount = () => void navigate(`/accounts/${account.id}`);
    const card = cards.byAccount[account.id];
    for (const bill of card?.bills ?? []) {
      const month = monthUtils.format(`${bill.month}-01`, 'MMM', locale);
      const name = account.name;
      if (bill.state === 'closed') {
        rows.push({
          key: `bill-${account.id}-${bill.month}`,
          label: t('Bill of {{month}} closed (estimated), to pay · {{name}}', {
            month,
            name,
          }),
          value: Math.abs(bill.figure),
          onPress: openAccount,
        });
      } else if (bill.state === 'partial') {
        rows.push({
          key: `bill-${account.id}-${bill.month}`,
          label: t(
            'Bill of {{month}} partly paid · check at the bank · {{name}}',
            {
              month,
              name,
            },
          ),
          // What the payments seen leave of the bill.
          value: Math.abs(bill.figure + (bill.paid?.amount ?? 0)),
          onPress: openAccount,
        });
      } else if (bill.state === 'uncertain') {
        rows.push({
          key: `bill-${account.id}-${bill.month}`,
          label: bill.paid
            ? t(
                'Bill of {{month}}: a payment does not match it · check at the bank · {{name}}',
                { month, name },
              )
            : t(
                'Bill of {{month}}: cannot tell if it was paid · check at the bank · {{name}}',
                { month, name },
              ),
          value: Math.abs(bill.figure),
          onPress: openAccount,
        });
      }
    }
    if (card && card.manualUncleared.count > 0) {
      rows.push({
        key: `manual-${account.id}`,
        label: t('{{count}} manual entries not cleared yet · {{name}}', {
          count: card.manualUncleared.count,
          name: account.name,
        }),
        value: Math.abs(card.manualUncleared.total),
        onPress: openAccount,
      });
    }
    const doubt = doubts.byAccount[account.id];
    if (doubt) {
      rows.push({
        key: `doubt-${account.id}`,
        label: t('{{count}} bank entries to check for a duplicate · {{name}}', {
          count: doubt.count,
          name: account.name,
        }),
        value: Math.abs(doubt.total),
        onPress: openAccount,
      });
    }
  }

  const hasBank = freshness.linked.length > 0;
  if (rows.length === 0 && !hasBank) {
    return null;
  }

  return (
    <View style={{ gap: 10 }}>
      <HomeMobileSectionLabel
        label={<Trans>Needs attention</Trans>}
        trailing={
          rows.length > 0 ? (
            <Text
              aria-hidden="true"
              style={{
                minWidth: 22,
                textAlign: 'center',
                fontSize: MOBILE_TYPE.caption,
                fontWeight: 700,
                lineHeight: '22px',
                borderRadius: 999,
                color: '#1b1405',
                backgroundColor: 'var(--dfl-hue-amber)',
                padding: '0 7px',
              }}
            >
              {rows.length}
            </Text>
          ) : null
        }
      />

      <View
        style={{
          borderRadius: 'var(--dfm-radius)',
          border: '1px solid var(--dfl-line-strong)',
          backgroundColor: 'var(--dfl-surface)',
          boxShadow: 'var(--dfl-shadow), 0 1px 0 rgba(0, 0, 0, 0.5)',
          overflow: 'hidden',
        }}
      >
        {rows.length === 0 ? (
          <View style={{ padding: '12px 14px' }}>
            <Text
              style={{ fontSize: MOBILE_TYPE.note, color: 'var(--dfl-text-2)' }}
            >
              <Trans>Nothing to review</Trans>
              {freshness.latestSync !== null && (
                <>
                  {' · '}
                  {t('Bank data updated {{when}}', {
                    when: tsToRelativeTime(
                      String(freshness.latestSync),
                      locale,
                    ),
                  })}
                </>
              )}
            </Text>
          </View>
        ) : (
          rows.map((row, index) => (
            <Button
              key={row.key}
              variant="bare"
              onPress={row.onPress}
              className={css({
                width: '100%',
                minHeight: 46,
                padding: '10px 14px',
                borderRadius: 0,
                justifyContent: 'flex-start',
                textAlign: 'left',
                borderBottom:
                  index === rows.length - 1
                    ? 'none'
                    : '1px solid var(--dfl-line)',
                '&[data-pressed]': { backgroundColor: 'var(--dfl-inset)' },
              })}
            >
              <View
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  minWidth: 0,
                }}
              >
                <SvgExclamationOutline
                  aria-hidden="true"
                  width={15}
                  height={15}
                  style={{
                    flexShrink: 0,
                    color: row.isFailure
                      ? 'var(--dfl-negative)'
                      : 'var(--dfl-hue-amber)',
                  }}
                />
                <Text
                  style={{
                    flex: 1,
                    minWidth: 0,
                    fontSize: MOBILE_TYPE.note,
                    lineHeight: 1.3,
                    color: 'var(--dfl-text)',
                  }}
                >
                  {row.label}
                </Text>
                {row.value !== null && (
                  <HomeMobileMoney
                    value={row.value}
                    withCurrency
                    style={{
                      fontSize: MOBILE_TYPE.note,
                      fontWeight: 600,
                      color: 'var(--dfl-text)',
                    }}
                  />
                )}
                <SvgCheveronRight
                  aria-hidden="true"
                  width={14}
                  height={14}
                  style={{ flexShrink: 0, color: 'var(--dfl-text-3)' }}
                />
              </View>
            </Button>
          ))
        )}
      </View>
    </View>
  );
}
