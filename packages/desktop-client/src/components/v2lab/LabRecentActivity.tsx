import React from 'react';

import { TextOneLine } from '@actual-app/components/text-one-line';
import { View } from '@actual-app/components/view';

import { FinancialText } from '#components/FinancialText';

import { DatePill } from './DatePill';
import { formatSignedMoney } from './labMoney';
import { LabPanel } from './LabPanel';
import { LabTile } from './LabTile';
import { LeaderLine } from './LeaderLine';
import type { LabMovement } from './overviewFixtures';

type LabRecentActivityProps = {
  movements: LabMovement[];
};

/**
 * The last movements: tile · name · connector · date · connector · amount.
 *
 * The date sits in a fixed-width column between two connectors, so it lands on
 * the same vertical in every row instead of floating wherever the name happens
 * to end. The tile hue is shared with the matching spending category, which is
 * what makes "Mercado" and "Mercado Zona Sul" read as the same thing across the
 * two panels.
 */
export function LabRecentActivity({ movements }: LabRecentActivityProps) {
  return (
    <LabPanel>
      <View style={{ padding: '10px 22px' }}>
        {movements.map((movement, index) => {
          const isInflow = movement.amount > 0;

          return (
            <View
              key={movement.id}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                minHeight: 54,
                borderBottom:
                  index === movements.length - 1
                    ? 'none'
                    : '1px solid var(--dfl-line)',
              }}
            >
              <LabTile Icon={movement.Icon} hue={movement.hue} />

              <TextOneLine
                style={{
                  flex: '0 0 152px',
                  fontSize: 14.5,
                  fontWeight: 500,
                  color: 'var(--dfl-text)',
                }}
              >
                {movement.name}
              </TextOneLine>

              <LeaderLine variant="muted" />

              <DatePill>{movement.when}</DatePill>

              <LeaderLine variant="muted" withEndDot />

              <FinancialText
                style={{
                  flex: '0 0 auto',
                  fontSize: 15,
                  fontWeight: 600,
                  letterSpacing: -0.2,
                  // Direction is the point of this list, so both signs carry
                  // their meaning here.
                  color: isInflow
                    ? 'var(--dfl-positive)'
                    : 'var(--dfl-negative)',
                  whiteSpace: 'nowrap',
                  textAlign: 'right',
                  minWidth: 96,
                }}
              >
                {formatSignedMoney(movement.amount)}
              </FinancialText>
            </View>
          );
        })}
      </View>
    </LabPanel>
  );
}
