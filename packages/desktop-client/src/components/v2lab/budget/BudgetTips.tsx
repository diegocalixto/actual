import React from 'react';

import { SvgCheveronRight } from '@actual-app/components/icons/v1';
import { Text } from '@actual-app/components/text';
import { View } from '@actual-app/components/view';

import { LabPanel } from '#components/v2lab/LabPanel';

import type { LabTip } from './budgetFixtures';
import { BudgetTile } from './BudgetTile';

type BudgetTipsProps = {
  tips: LabTip[];
};

/**
 * Standing advice, deliberately not analysis.
 *
 * These three lines say nothing about this month's numbers — no "your best
 * category", no score, no comparison. They are habits, and reading them as a
 * verdict is exactly the misunderstanding that keeps them static.
 */
export function BudgetTips({ tips }: BudgetTipsProps) {
  return (
    <LabPanel style={{ backgroundColor: 'var(--dfl-surface-raised)' }}>
      {tips.map((tip, index) => (
        <View
          key={tip.id}
          style={{
            flexDirection: 'row',
            alignItems: 'flex-start',
            gap: 16,
            padding: '13px 20px',
            borderBottom:
              index === tips.length - 1 ? 'none' : '1px solid var(--dfl-line)',
          }}
        >
          <BudgetTile Icon={tip.Icon} hue={tip.hue} size={48} round glow />

          <View style={{ flex: '1 1 0', gap: 5, minWidth: 0, paddingTop: 4 }}>
            <Text
              style={{
                fontSize: 14.5,
                fontWeight: 600,
                letterSpacing: -0.1,
                color: 'var(--dfl-text)',
              }}
            >
              {tip.title}
            </Text>
            <Text
              style={{
                fontSize: 12.5,
                lineHeight: 1.5,
                color: 'var(--dfl-text-2)',
              }}
            >
              {tip.body}
            </Text>
          </View>

          <SvgCheveronRight
            aria-hidden="true"
            width={16}
            height={16}
            style={{
              flexShrink: 0,
              marginTop: 14,
              color: 'var(--dfl-text-3)',
            }}
          />
        </View>
      ))}
    </LabPanel>
  );
}
