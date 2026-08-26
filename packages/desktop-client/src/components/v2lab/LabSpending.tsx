import React from 'react';

import { TextOneLine } from '@actual-app/components/text-one-line';
import { View } from '@actual-app/components/view';

import { FinancialText } from '#components/FinancialText';

import { formatMoney } from './labMoney';
import { LabPanel } from './LabPanel';
import { LabTile } from './LabTile';
import { MagnitudeLine } from './LeaderLine';
import type { LabCategory } from './overviewFixtures';

type LabSpendingProps = {
  categories: LabCategory[];
};

/**
 * Where the month went, as a ranked list.
 *
 * The row reads tile · name · run · amount. The run's filled length is the
 * category's share of the largest one — a real ratio computed here from the
 * same numbers the row prints, never a decorative length that merely looks
 * like data. The name sits in a fixed column so every run starts on the same
 * vertical, which is what lets the lengths be compared at a glance.
 */
export function LabSpending({ categories }: LabSpendingProps) {
  const largest = categories.reduce(
    (max, category) => Math.max(max, Math.abs(category.amount)),
    0,
  );

  return (
    <LabPanel>
      <View style={{ padding: '10px 22px' }}>
        {categories.map((category, index) => (
          <View
            key={category.id}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 14,
              minHeight: 54,
              borderBottom:
                index === categories.length - 1
                  ? 'none'
                  : '1px solid var(--dfl-line)',
            }}
          >
            <LabTile Icon={category.Icon} hue={category.hue} />

            <TextOneLine
              style={{
                flex: '0 0 128px',
                fontSize: 14.5,
                fontWeight: 500,
                color: 'var(--dfl-text)',
              }}
            >
              {category.name}
            </TextOneLine>

            <MagnitudeLine
              ratio={largest === 0 ? 0 : Math.abs(category.amount) / largest}
              hueVar={`var(--dfl-hue-${category.hue})`}
            />

            <FinancialText
              style={{
                flex: '0 0 auto',
                fontSize: 15,
                fontWeight: 600,
                letterSpacing: -0.2,
                color: 'var(--dfl-text)',
                whiteSpace: 'nowrap',
                textAlign: 'right',
                minWidth: 92,
              }}
            >
              {formatMoney(Math.abs(category.amount))}
            </FinancialText>
          </View>
        ))}
      </View>
    </LabPanel>
  );
}
