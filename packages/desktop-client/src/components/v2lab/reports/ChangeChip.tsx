import React from 'react';

import {
  SvgArrowThinDown,
  SvgArrowThinUp,
} from '@actual-app/components/icons/v1';
import { Text } from '@actual-app/components/text';
import { View } from '@actual-app/components/view';

type ChangeChipProps = {
  /** Already formatted — the caller knows whether it is percent or points. */
  label: string;
  /** Direction of movement, independent of whether that movement is welcome. */
  isUp: boolean;
  /** Whether this direction is good news for this figure. */
  isGood: boolean;
};

/**
 * A movement against the previous period.
 *
 * Direction and sentiment are separate on purpose: expenses rising is an up
 * arrow in coral, because the arrow reports the number and the colour reports
 * what it means. Collapsing the two would paint growing spending green.
 */
export function ChangeChip({ label, isUp, isGood }: ChangeChipProps) {
  const color = isGood ? 'var(--dfl-positive)' : 'var(--dfl-negative)';
  const Icon = isUp ? SvgArrowThinUp : SvgArrowThinDown;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <Icon aria-hidden="true" width={11} height={11} style={{ color }} />
      <Text
        style={{
          fontSize: 12.5,
          fontWeight: 600,
          whiteSpace: 'nowrap',
          color,
        }}
      >
        {label}
      </Text>
    </View>
  );
}
