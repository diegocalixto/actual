import React from 'react';
import type { ComponentProps, ReactNode } from 'react';

import { Text } from '@actual-app/components/text';
import { View } from '@actual-app/components/view';

import { shellColors } from '#components/appshell/shellTheme';

type SectionTitleProps = {
  children: ReactNode;
  /** Trailing element: a total, a link, a control. */
  action?: ReactNode;
  /** Smaller variant, for a title nested inside a panel. */
  size?: 'md' | 'sm';
  style?: ComponentProps<typeof View>['style'];
};

/**
 * A section heading in sentence case.
 *
 * Deliberately not the uppercase, letterspaced micro-label the V2.1 dashboard
 * used: the reference titles its sections in plain sentence case at reading
 * size, which is what makes the surfaces feel like parts of a document rather
 * than cells of a table.
 */
export function SectionTitle({
  children,
  action,
  size = 'md',
  style,
}: SectionTitleProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        minHeight: 24,
        ...style,
      }}
    >
      <Text
        style={{
          fontSize: size === 'md' ? 16 : 14,
          fontWeight: 600,
          letterSpacing: -0.1,
          color: shellColors.textPrimary,
        }}
      >
        {children}
      </Text>
      {action}
    </View>
  );
}
