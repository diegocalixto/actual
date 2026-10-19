import React from 'react';
import type { ReactNode } from 'react';

import type { CSSProperties } from '@actual-app/components/styles';
import { Text } from '@actual-app/components/text';
import { View } from '@actual-app/components/view';

import { amountColor, shellColors } from '#components/appshell/shellTheme';

import { Money } from './Money';

type MetricProps = {
  label: ReactNode;
  value: number | null;
  /** `lead` is the one figure a summary is built around. */
  size?: 'lead' | 'md' | 'sm';
  /**
   * `plain` for figures whose sign is not a verdict — money out is always
   * negative, so painting it red says nothing and turns the page into an alert.
   */
  tone?: 'semantic' | 'plain' | 'accent';
  /** Optional line under the value: a caption, a bar, a secondary figure. */
  footer?: ReactNode;
  style?: CSSProperties;
};

const VALUE_SIZE = { lead: 30, md: 19, sm: 15.5 } as const;

/** Label over amount. The unit of every summary on the V2 pages. */
export function Metric({
  label,
  value,
  size = 'md',
  tone = 'semantic',
  footer,
  style,
}: MetricProps) {
  const color =
    tone === 'accent'
      ? shellColors.accent
      : tone === 'plain' && value !== null
        ? shellColors.textPrimary
        : amountColor(value);

  return (
    <View style={{ gap: size === 'lead' ? 7 : 5, minWidth: 0, ...style }}>
      <Text
        style={{
          fontSize: size === 'lead' ? 13 : 12.5,
          fontWeight: 500,
          color: shellColors.textMuted,
        }}
      >
        {label}
      </Text>
      <Money
        value={value}
        style={{
          fontSize: VALUE_SIZE[size],
          fontWeight: size === 'lead' ? 700 : 600,
          lineHeight: 1.15,
          letterSpacing: size === 'lead' ? -0.8 : -0.2,
          color,
        }}
      />
      {footer}
    </View>
  );
}
