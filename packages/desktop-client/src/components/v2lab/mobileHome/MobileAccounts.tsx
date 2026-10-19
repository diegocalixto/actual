import React from 'react';
import { Trans } from 'react-i18next';

import { Text } from '@actual-app/components/text';
import { View } from '@actual-app/components/view';

import { FinancialText } from '#components/FinancialText';

import { MobileAccountGroup } from './MobileAccountGroup';
import type { MobileAccountGroupFixture } from './mobileHomeFixtures';
import { CURRENCY, formatAmount } from './mobileHomeMoney';
import { MobileSectionLabel } from './MobileSectionLabel';

type MobileAccountsProps = {
  total: number;
  groups: MobileAccountGroupFixture[];
};

/**
 * Where the money sits.
 *
 * Two grouped surfaces under one section label, with the whole on the label's
 * line: the reader asks "how much do I have" before "how is it split", and the
 * page answers in that order.
 *
 * Each group gets one hue, shared by every tile inside it. A ramp across the
 * rows would give five accounts five colours and imply a difference between
 * them that the data does not contain; a hue per group says only what the
 * header already says, and keeps the screen the cold, restrained thing the
 * proposal draws rather than a row of competing badges.
 */
const GROUP_HUES: Record<string, string> = {
  'on-budget': 'var(--dfl-hue-violet)',
  'off-budget': 'var(--dfl-hue-blue)',
};

export function MobileAccounts({ total, groups }: MobileAccountsProps) {
  return (
    <View style={{ gap: 10 }}>
      <MobileSectionLabel
        label={<Trans>Contas</Trans>}
        trailing={
          <View
            style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}
          >
            <Text
              style={{
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: 1,
                textTransform: 'uppercase',
                color: 'var(--dfl-text-3)',
              }}
            >
              <Trans>Total</Trans>
            </Text>
            <FinancialText
              style={{
                fontSize: 14.5,
                fontWeight: 700,
                letterSpacing: -0.2,
                whiteSpace: 'nowrap',
                color: 'var(--dfl-text)',
              }}
            >
              {`${CURRENCY} ${formatAmount(total)}`}
            </FinancialText>
          </View>
        }
      />

      {groups.map(group => (
        <MobileAccountGroup
          key={group.id}
          group={group}
          hue={GROUP_HUES[group.id] ?? 'var(--dfl-hue-violet)'}
        />
      ))}
    </View>
  );
}
