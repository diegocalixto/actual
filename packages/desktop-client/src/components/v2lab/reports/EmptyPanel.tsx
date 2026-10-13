import React from 'react';
import type { ReactNode } from 'react';

import { Text } from '@actual-app/components/text';
import { View } from '@actual-app/components/view';

type EmptyPanelProps = {
  children: ReactNode;
  minHeight?: number;
};

/** What a panel shows when it has nothing to show. */
export function EmptyPanel({ children, minHeight = 120 }: EmptyPanelProps) {
  return (
    <View
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        minHeight,
        padding: '22px 24px',
        backgroundColor: 'var(--dfl-surface-raised)',
        border: '1px solid var(--dfl-line)',
        borderRadius: 'var(--dfl-radius)',
        boxShadow: 'var(--dfl-shadow)',
      }}
    >
      <Text
        style={{
          fontSize: 13,
          textAlign: 'center',
          color: 'var(--dfl-text-3)',
        }}
      >
        {children}
      </Text>
    </View>
  );
}
