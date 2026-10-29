import React from 'react';

import { SvgCheveronRight } from '@actual-app/components/icons/v1';
import { Text } from '@actual-app/components/text';
import { TextOneLine } from '@actual-app/components/text-one-line';
import { View } from '@actual-app/components/view';

import { FinancialText } from '#components/FinancialText';
import { iconForAccount } from '#components/v2lab/LabStyle';

import type {
  MobileAccountFixture,
  MobileAccountGroupFixture,
} from './mobileHomeFixtures';
import { CURRENCY, formatAmount } from './mobileHomeMoney';
import { MobileIconTile } from './MobileIconTile';

type MobileAccountRowProps = {
  account: MobileAccountFixture;
  hue: string;
  /**
   * The group's tone, which decides the ink on the balance. On-budget money is
   * spendable and reads in the positive colour; off-budget money is not, so it
   * reads in plain text — painting it green too would tell the reader it is
   * available when the group header has just said it is not.
   */
  tone: MobileAccountGroupFixture['tone'];
  /** The last row closes its group, so it draws no divider. */
  isLast: boolean;
};

/**
 * One account.
 *
 * A row inside a grouped surface rather than a card of its own: five cards
 * would turn the accounts into five competing objects, and the reference reads
 * them as one list. Depth comes from the tile and the hairline between rows,
 * which is enough to make the row feel touchable without drawing a button.
 *
 * The glyph comes from the application's own name-to-icon mapping rather than
 * from a table invented here, so the laboratory shows what a promoted screen
 * would actually render.
 */
export function MobileAccountRow({
  account,
  hue,
  tone,
  isLast,
}: MobileAccountRowProps) {
  const Icon = iconForAccount(account.name);
  const balanceColor =
    tone === 'positive' ? 'var(--dfl-positive)' : 'var(--dfl-text)';

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: '10px 14px',
        borderBottom: isLast ? 'none' : '1px solid var(--dfl-line)',
      }}
    >
      <MobileIconTile Icon={Icon} hue={hue} />

      <View style={{ flex: 1, minWidth: 0, gap: 1 }}>
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
        <TextOneLine style={{ fontSize: 12, color: 'var(--dfl-text-3)' }}>
          {account.kind}
        </TextOneLine>
      </View>

      <View
        style={{
          flexShrink: 0,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
        }}
      >
        <Text
          style={{
            fontSize: 12.5,
            fontWeight: 600,
            color: balanceColor,
          }}
        >
          {CURRENCY}
        </Text>
        <FinancialText
          style={{
            fontSize: 15,
            fontWeight: 600,
            letterSpacing: -0.2,
            whiteSpace: 'nowrap',
            color: balanceColor,
          }}
        >
          {formatAmount(account.balance)}
        </FinancialText>
        <SvgCheveronRight
          aria-hidden="true"
          width={15}
          height={15}
          style={{ color: 'var(--dfl-text-3)' }}
        />
      </View>
    </View>
  );
}
