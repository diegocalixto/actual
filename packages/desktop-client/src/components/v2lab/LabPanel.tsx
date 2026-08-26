import React from 'react';
import type { ReactNode } from 'react';

import type { CSSProperties } from '@actual-app/components/styles';
import { Text } from '@actual-app/components/text';
import { View } from '@actual-app/components/view';

type LabPanelProps = {
  children: ReactNode;
  style?: CSSProperties;
};

/**
 * A secondary surface: machined charcoal, a blue-grey hairline, a shadow deep
 * enough to lift it off the ground and no brighter than that. The hero is the
 * only panel allowed to catch light.
 */
export function LabPanel({ children, style }: LabPanelProps) {
  return (
    <View
      style={{
        backgroundColor: 'var(--dfl-surface)',
        border: '1px solid var(--dfl-line)',
        borderRadius: 'var(--dfl-radius)',
        boxShadow: 'var(--dfl-shadow)',
        overflow: 'hidden',
        ...style,
      }}
    >
      {children}
    </View>
  );
}

type LabSectionProps = {
  /** Small caps label above the panel, as in the approved reference. */
  label: ReactNode;
  action?: ReactNode;
  children: ReactNode;
};

/** Label row above a panel. */
export function LabSection({ label, action, children }: LabSectionProps) {
  return (
    <View style={{ gap: 12 }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          minHeight: 18,
          paddingLeft: 2,
        }}
      >
        <Text
          style={{
            fontSize: 11.5,
            fontWeight: 600,
            letterSpacing: 1.1,
            textTransform: 'uppercase',
            color: 'var(--dfl-text-3)',
          }}
        >
          {label}
        </Text>
        {action}
      </View>
      {children}
    </View>
  );
}
