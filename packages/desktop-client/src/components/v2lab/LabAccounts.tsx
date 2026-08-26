import React from 'react';
import { Trans } from 'react-i18next';

import { Text } from '@actual-app/components/text';
import { TextOneLine } from '@actual-app/components/text-one-line';
import { View } from '@actual-app/components/view';

import { FinancialText } from '#components/FinancialText';

import { formatMoney } from './labMoney';
import { LabPanel } from './LabPanel';
import { LabTile } from './LabTile';
import { LeaderLine } from './LeaderLine';
import type { LabAccount } from './overviewFixtures';

type LabAccountsProps = {
  accounts: LabAccount[];
};

/** One panel, hairlines between rows — not one card per account. */
export function LabAccounts({ accounts }: LabAccountsProps) {
  return (
    <LabPanel>
      {accounts.map((account, index) => (
        <Row
          key={account.id}
          account={account}
          isLast={index === accounts.length - 1}
        />
      ))}
    </LabPanel>
  );
}

function Row({ account, isLast }: { account: LabAccount; isLast: boolean }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        padding: '13px 22px',
        minHeight: 70,
        borderBottom: isLast ? 'none' : '1px solid var(--dfl-line)',
      }}
    >
      <LabTile Icon={account.Icon} hue={account.hue} size={42} />

      <View style={{ flex: '0 0 auto', maxWidth: 190, gap: 3 }}>
        <TextOneLine
          style={{
            fontSize: 15.5,
            fontWeight: 600,
            letterSpacing: -0.1,
            color: 'var(--dfl-text)',
          }}
        >
          {account.name}
        </TextOneLine>
        <TextOneLine style={{ fontSize: 12.5, color: 'var(--dfl-text-3)' }}>
          {account.detail}
        </TextOneLine>
      </View>

      {/* Neutral by design. A balance is not a share of anything, so encoding
          its magnitude in the run's length would invent a comparison the
          numbers do not make; the connector only carries the eye across. */}
      <LeaderLine withEndDot />

      <FinancialText
        style={{
          flex: '0 0 auto',
          fontSize: 16,
          fontWeight: 600,
          letterSpacing: -0.2,
          color: 'var(--dfl-text)',
          whiteSpace: 'nowrap',
          textAlign: 'right',
          minWidth: 104,
        }}
      >
        {formatMoney(account.balance)}
      </FinancialText>
    </View>
  );
}

/** Total across the listed accounts, for the section's trailing label. */
export function LabAccountsTotal({ accounts }: LabAccountsProps) {
  const total = accounts.reduce((sum, account) => sum + account.balance, 0);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
      <Text
        style={{
          fontSize: 11.5,
          fontWeight: 600,
          letterSpacing: 1.1,
          textTransform: 'uppercase',
          color: 'var(--dfl-text-3)',
        }}
      >
        <Trans>Total</Trans>
      </Text>
      <FinancialText
        style={{
          fontSize: 13.5,
          fontWeight: 600,
          color: 'var(--dfl-text)',
          whiteSpace: 'nowrap',
        }}
      >
        {formatMoney(total)}
      </FinancialText>
    </View>
  );
}
