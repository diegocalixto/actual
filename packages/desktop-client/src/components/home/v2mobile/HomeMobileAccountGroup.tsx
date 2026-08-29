import React from 'react';
import type { ReactNode } from 'react';

import { Text } from '@actual-app/components/text';
import { View } from '@actual-app/components/view';

import type { HomeAccount } from './homeData';
import { HomeMobileAccountRow } from './HomeMobileAccountRow';
import { HomeMobileMoney } from './HomeMobileMoney';

type HomeMobileAccountGroupProps = {
  label: ReactNode;
  /** The group's own balance cell — never a sum of the rows below it. */
  subtotal: number | null;
  tone: 'positive' | 'negative';
  /** The group's tile colour, shared by all of its rows. */
  hue: string;
  accounts: HomeAccount[];
};

/**
 * One group of accounts, as a single surface.
 *
 * Its header carries the group's own subtotal, set quieter than the section's
 * total above so the eye still finds the whole first. The figure is the
 * budget engine's `onbudget-accounts-balance` or `offbudget-accounts-balance`
 * cell, so it stays right even when a row is still loading.
 *
 * The finish is the card's only depth: a hairline a step up the ramp, a fill
 * that falls off from its lit top edge, and one dark pixel underneath seating
 * it on the ground.
 */
export function HomeMobileAccountGroup({
  label,
  subtotal,
  tone,
  hue,
  accounts,
}: HomeMobileAccountGroupProps) {
  const dot =
    tone === 'positive' ? 'var(--dfl-positive)' : 'var(--dfl-negative)';

  return (
    <View
      style={{
        borderRadius: 'var(--dfm-radius)',
        border: '1px solid var(--dfl-line-strong)',
        backgroundColor: 'var(--dfl-surface)',
        backgroundImage:
          'linear-gradient(180deg, rgba(150, 185, 225, 0.035), rgba(150, 185, 225, 0) 46%)',
        boxShadow: 'var(--dfl-shadow), 0 1px 0 rgba(0, 0, 0, 0.5)',
        overflow: 'hidden',
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          padding: '11px 14px',
          borderBottom: '1px solid var(--dfl-line)',
          backgroundColor: 'var(--dfl-surface-raised)',
          // The card's lit top edge. It has to live on the header rather than
          // on the card, because the header's own fill would paint over an
          // inset highlight set on the container behind it.
          backgroundImage:
            'linear-gradient(180deg, rgba(150, 185, 225, 0.055), rgba(150, 185, 225, 0.006))',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View
            aria-hidden="true"
            style={{
              width: 7,
              height: 7,
              flexShrink: 0,
              borderRadius: 999,
              backgroundColor: dot,
            }}
          />
          <Text
            style={{
              fontSize: 10.5,
              fontWeight: 600,
              letterSpacing: 1.2,
              textTransform: 'uppercase',
              color: 'var(--dfl-text-2)',
            }}
          >
            {label}
          </Text>
        </View>

        <HomeMobileMoney
          value={subtotal}
          withCurrency
          style={{
            fontSize: 12.5,
            fontWeight: 600,
            color: 'var(--dfl-text-2)',
          }}
        />
      </View>

      {accounts.map((homeAccount, index) => (
        <HomeMobileAccountRow
          key={homeAccount.account.id}
          homeAccount={homeAccount}
          hue={hue}
          isLast={index === accounts.length - 1}
        />
      ))}
    </View>
  );
}
