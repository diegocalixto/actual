import React from 'react';

import { Text } from '@actual-app/components/text';
import { View } from '@actual-app/components/view';

import { FinancialText } from '#components/FinancialText';

import { MobileAccountRow } from './MobileAccountRow';
import type { MobileAccountGroupFixture } from './mobileHomeFixtures';
import { CURRENCY, formatAmount } from './mobileHomeMoney';

type MobileAccountGroupProps = {
  group: MobileAccountGroupFixture;
  /** The group's tile colour, shared by all of its rows. */
  hue: string;
};

/**
 * One group of accounts, as a single surface.
 *
 * Its header carries the group's own subtotal, set quieter than the section's
 * total above so the eye still finds the whole first. The reference puts a
 * collapse caret here; there is no collapse state in this laboratory, and a
 * caret that never moves is a promise the screen cannot keep, so it is absent.
 */
export function MobileAccountGroup({ group, hue }: MobileAccountGroupProps) {
  const dot =
    group.tone === 'positive' ? 'var(--dfl-positive)' : 'var(--dfl-negative)';

  return (
    <View
      style={{
        borderRadius: 'var(--dfm-radius)',
        // Finish, not furniture. The edge moves up one step on the hairline
        // ramp, the fill falls off very slightly from its top, and a single
        // dark pixel under the card seats it on the ground. Together they read
        // as a machined plane catching a little light; none of them changes a
        // measurement, and no shadow grows to say it.
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
              color: 'var(--dfl-text-2)',
            }}
          >
            {group.label}
          </Text>
        </View>

        <FinancialText
          style={{
            fontSize: 12.5,
            fontWeight: 600,
            whiteSpace: 'nowrap',
            color: 'var(--dfl-text-2)',
          }}
        >
          {`${CURRENCY} ${formatAmount(group.subtotal)}`}
        </FinancialText>
      </View>

      {group.accounts.map((account, index) => (
        <MobileAccountRow
          key={account.id}
          account={account}
          hue={hue}
          tone={group.tone}
          isLast={index === group.accounts.length - 1}
        />
      ))}
    </View>
  );
}
