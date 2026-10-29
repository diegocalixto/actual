import React from 'react';
import { Trans } from 'react-i18next';

import { useResponsive } from '@actual-app/components/hooks/useResponsive';
import { Text } from '@actual-app/components/text';
import { View } from '@actual-app/components/view';

import {
  shellColors,
  shellEyebrowStyle,
} from '#components/appshell/shellTheme';
import type { HomeBudgetType } from '#components/home/useHomeMonth';
import { Money } from '#components/v2/Money';

import { DashboardCard } from './DashboardCard';
import { useHomeBalances } from './useHomeBalances';

type AvailableHeroCardProps = {
  sheetName: string;
  budgetType: HomeBudgetType;
};

/**
 * The one number the dashboard leads with.
 *
 * It is the sum of the on-budget account balances — the money that exists and
 * is inside the budget. It is deliberately **not** relabelled "available to
 * spend": under an envelope budget that phrase means the unspent part of the
 * category balances, which is a different figure. The caption states the
 * definition so the headline can stay short without over-claiming.
 *
 * The envelope budget's "to budget" cell no longer hangs under it: it is a
 * planning figure, not a balance, and beside a balance it was read as one. The
 * Budget prints it as "A planejar", with the explanation.
 */
export function AvailableHeroCard({
  sheetName,
  budgetType,
}: AvailableHeroCardProps) {
  const { isNarrowWidth } = useResponsive();
  const { onBudget } = useHomeBalances(sheetName, budgetType);

  return (
    <DashboardCard emphasized>
      <View
        style={{
          padding: isNarrowWidth ? '20px 20px 18px' : '26px 28px 22px',
          gap: 6,
        }}
      >
        <Text style={shellEyebrowStyle}>
          <Trans>Available balance</Trans>
        </Text>

        <Money
          value={onBudget}
          style={{
            fontSize: isNarrowWidth ? 38 : 46,
            fontWeight: 700,
            lineHeight: 1.15,
            letterSpacing: -1,
            // A positive balance is the ordinary state, so it is left in the
            // page's own ink; painting the headline green every month would
            // spend the accent on a non-event. Only an overdrawn budget — a
            // real alert — takes the negative tone.
            color:
              onBudget !== null && onBudget < 0
                ? shellColors.negative
                : shellColors.textPrimary,
          }}
        />

        <Text
          style={{
            fontSize: 12.5,
            lineHeight: 1.4,
            color: shellColors.textSecondary,
          }}
        >
          <Trans>Sum of on-budget accounts</Trans>
        </Text>
      </View>
    </DashboardCard>
  );
}
