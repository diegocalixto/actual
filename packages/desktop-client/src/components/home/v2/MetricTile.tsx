import React from 'react';
import type { ReactNode } from 'react';

import type { CSSProperties } from '@actual-app/components/styles';
import { Text } from '@actual-app/components/text';
import { View } from '@actual-app/components/view';

import {
  amountColor,
  shellColors,
  shellEyebrowStyle,
} from '#components/appshell/shellTheme';
import { Money } from '#components/v2/Money';

type MetricTileProps = {
  label: ReactNode;
  value: number | null;
  /** Adds an accent rule on the leading edge and a heavier figure. */
  emphasized?: boolean;
  /**
   * Set for figures whose sign is not a verdict — money out is always negative,
   * so painting it red says nothing and makes the whole card read as an alert.
   */
  tone?: 'semantic' | 'plain';
  style?: CSSProperties;
};

/** Label over amount. The dashboard's unit of secondary information. */
export function MetricTile({
  label,
  value,
  emphasized = false,
  tone = 'semantic',
  style,
}: MetricTileProps) {
  return (
    <View style={{ gap: 6, minWidth: 0, ...style }}>
      <Text style={shellEyebrowStyle}>{label}</Text>
      <Money
        value={value}
        style={{
          fontSize: emphasized ? 20 : 17,
          fontWeight: emphasized ? 700 : 600,
          lineHeight: 1.2,
          letterSpacing: -0.2,
          color:
            tone === 'plain' && value !== null
              ? shellColors.textPrimary
              : amountColor(value),
        }}
      />
    </View>
  );
}
