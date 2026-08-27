import React from 'react';

import { View } from '@actual-app/components/view';

import { BudgetView } from '#components/v2lab/budget/BudgetView';

import { BUDGET_ROOT_CLASS, BudgetStyle } from './BudgetStyle';
import { EnvelopeActionsPopover } from './EnvelopeActionsPopover';
import { useRealBudgetData } from './useRealBudgetData';

/**
 * The real Budget.
 *
 * It contributes no layout of its own: `BudgetView` is the approved
 * composition, shared with `/v2-lab/budget`, and this file only supplies real
 * data and the token scope. Anything that looks different between the two
 * routes is a difference in the data, never in the design.
 *
 * The one thing it adds is the surface behind each row's chevron, which the
 * laboratory has no categories to act on.
 */
export function V2RealBudget() {
  const data = useRealBudgetData();

  return (
    <View className={BUDGET_ROOT_CLASS} style={{ flex: 1, minHeight: 0 }}>
      <BudgetStyle />
      <BudgetView
        data={{
          ...data,
          envelopeActions: ({ envelopeId, triggerRef, isOpen, onClose }) => (
            <EnvelopeActionsPopover
              categoryId={envelopeId}
              month={data.month}
              sheetName={data.sheetName}
              triggerRef={triggerRef}
              isOpen={isOpen}
              onClose={onClose}
              onBudgetAction={data.onBudgetAction}
            />
          ),
        }}
      />
    </View>
  );
}
