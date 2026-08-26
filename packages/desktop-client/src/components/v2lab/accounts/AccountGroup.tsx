import React from 'react';
import type { ReactNode } from 'react';

import { SvgCheveronRight } from '@actual-app/components/icons/v1';
import { Text } from '@actual-app/components/text';
import { TextOneLine } from '@actual-app/components/text-one-line';
import { View } from '@actual-app/components/view';

import { FinancialText } from '#components/FinancialText';

import type { LabAccount } from './accountsFixtures';
import { formatPlain } from './accountsMoney';
import { ACCOUNT_HUE } from './accountsTokens';
import { AccountTile } from './AccountTile';

type AccountGroupProps = {
  label: ReactNode;
  /** The small square before the label, in the group's own colour. */
  markerColor: string;
  accounts: LabAccount[];
};

/**
 * One budget group: a marked heading, then a card per account.
 *
 * Separate cards rather than one panel with hairlines, as in the reference —
 * each account is a place you can open, and the gap between them is what makes
 * them read as five destinations instead of five rows of a table.
 */
export function AccountGroup({
  label,
  markerColor,
  accounts,
}: AccountGroupProps) {
  return (
    <View style={{ gap: 11 }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          paddingLeft: 4,
        }}
      >
        <View
          aria-hidden="true"
          style={{
            width: 9,
            height: 9,
            flexShrink: 0,
            borderRadius: 3,
            backgroundColor: markerColor,
            boxShadow: `0 0 10px -1px ${markerColor}`,
          }}
        />
        <Text
          style={{
            fontSize: 11.5,
            fontWeight: 700,
            letterSpacing: 1.3,
            textTransform: 'uppercase',
            color: 'var(--dfl-text-2)',
          }}
        >
          {label}
        </Text>
      </View>

      <View style={{ gap: 8 }}>
        {accounts.map(account => (
          <Row key={account.id} account={account} />
        ))}
      </View>
    </View>
  );
}

function Row({ account }: { account: LabAccount }) {
  const color = ACCOUNT_HUE[account.hue];

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        padding: '15px 18px',
        minHeight: 74,
        borderRadius: 15,
        backgroundColor: 'var(--dfl-surface-raised)',
        border: '1px solid var(--dfl-line)',
        boxShadow: 'var(--dfl-shadow), inset 0 1px 0 rgba(160, 195, 240, 0.05)',
      }}
    >
      <AccountTile Icon={account.Icon} hue={account.hue} />

      {/* Name above, filet below — the reference stacks them, and stacking is
          what lets the colour run the full width of the block instead of
          squeezing into whatever the name leaves over. */}
      <View style={{ flex: '1 1 0', minWidth: 0, gap: 9, paddingTop: 2 }}>
        <TextOneLine
          style={{
            fontSize: 15.5,
            fontWeight: 600,
            letterSpacing: -0.1,
            color: '#ffffff',
          }}
        >
          {account.name}
        </TextOneLine>

        {/* A connector, not a bar: every filet spans the same block, so its
            length says nothing about the balance. A length that varied would
            invite a comparison these numbers do not make. */}
        <View
          aria-hidden="true"
          style={{
            height: 3,
            maxWidth: 320,
            borderRadius: 999,
            backgroundImage: `linear-gradient(90deg, ${color} 0%, ${color} 72%, color-mix(in srgb, ${color} 30%, transparent) 100%)`,
            boxShadow: `0 0 12px -2px color-mix(in srgb, ${color} 80%, transparent)`,
          }}
        />
      </View>

      <View
        style={{
          flex: '0 0 auto',
          flexDirection: 'row',
          alignItems: 'baseline',
          gap: 5,
        }}
      >
        <Text
          style={{
            fontSize: 13.5,
            fontWeight: 500,
            color: 'var(--dfl-text-2)',
          }}
        >
          R$
        </Text>
        <FinancialText
          style={{
            fontSize: 16.5,
            fontWeight: 600,
            letterSpacing: -0.3,
            whiteSpace: 'nowrap',
            color: '#ffffff',
          }}
        >
          {formatPlain(account.balance)}
        </FinancialText>
      </View>

      <SvgCheveronRight
        aria-hidden="true"
        width={17}
        height={17}
        style={{ flexShrink: 0, color: 'var(--dfl-text-3)' }}
      />
    </View>
  );
}
