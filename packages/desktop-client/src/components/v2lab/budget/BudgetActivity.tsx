import React from 'react';

import { TextOneLine } from '@actual-app/components/text-one-line';
import { View } from '@actual-app/components/view';

import { FinancialText } from '#components/FinancialText';
import { DatePill } from '#components/v2lab/DatePill';
import { LabPanel } from '#components/v2lab/LabPanel';

import type { LabMovement } from './budgetFixtures';
import { formatSignedBRL } from './budgetMoney';
import { BudgetTile } from './BudgetTile';

type BudgetActivityProps = {
  movements: LabMovement[];
};

/**
 * The last few movements, tied to the envelopes above them.
 *
 * The second line is the envelope, not a free-form category: on this page the
 * only useful thing to know about a charge is which bar it just moved.
 */
export function BudgetActivity({ movements }: BudgetActivityProps) {
  return (
    <LabPanel style={{ backgroundColor: 'var(--dfl-surface-raised)' }}>
      {movements.map((movement, index) => (
        <View
          key={movement.id}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 14,
            padding: '11px 20px',
            minHeight: 60,
            borderBottom:
              index === movements.length - 1
                ? 'none'
                : '1px solid var(--dfl-line)',
          }}
        >
          <BudgetTile Icon={movement.Icon} hue={movement.hue} size={36} />

          <TextOneLine
            style={{
              flex: '1 1 0',
              minWidth: 0,
              fontSize: 14.5,
              fontWeight: 600,
              letterSpacing: -0.1,
              color: 'var(--dfl-text)',
            }}
          >
            {movement.name}
          </TextOneLine>

          {/* Its own column, as in the reference. Stacked under the name it
              read as a caption and disappeared; beside it, the envelope a
              charge belongs to is the second thing the row says. */}
          <TextOneLine
            style={{
              flex: '0 0 94px',
              fontSize: 13,
              color: 'var(--dfl-text-2)',
            }}
          >
            {movement.envelope}
          </TextOneLine>

          <DatePill>{movement.date}</DatePill>

          <FinancialText
            style={{
              flex: '0 0 auto',
              minWidth: 94,
              fontSize: 14.5,
              fontWeight: 600,
              letterSpacing: -0.2,
              textAlign: 'right',
              whiteSpace: 'nowrap',
              color:
                movement.amount < 0
                  ? 'var(--dfl-negative)'
                  : 'var(--dfl-positive)',
            }}
          >
            {formatSignedBRL(movement.amount)}
          </FinancialText>
        </View>
      ))}
    </LabPanel>
  );
}
