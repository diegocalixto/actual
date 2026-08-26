import React from 'react';
import type { ReactNode } from 'react';

import type { CSSProperties } from '@actual-app/components/styles';
import { Text } from '@actual-app/components/text';
import { View } from '@actual-app/components/view';

type LabCardProps = {
  children: ReactNode;
  style?: CSSProperties;
};

/**
 * The surface every Reports panel sits on.
 *
 * Local to this route rather than borrowed from the approved Overview's
 * `LabPanel`: Reports needs a slightly lifted fill and a top highlight that the
 * Overview deliberately does not have, and changing the shared panel would
 * restyle two approved screens.
 */
export function LabCard({ children, style }: LabCardProps) {
  return (
    <View
      style={{
        backgroundColor: 'var(--dfl-surface-raised)',
        border: '1px solid var(--dfl-line)',
        borderRadius: 'var(--dfl-radius)',
        boxShadow:
          'var(--dfl-shadow), inset 0 1px 0 rgba(160, 195, 240, 0.055)',
        overflow: 'hidden',
        ...style,
      }}
    >
      {children}
    </View>
  );
}

type CardHeadingProps = {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
};

/** Title row shared by the side panels. */
export function CardHeading({ title, subtitle, action }: CardHeadingProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: subtitle ? 'flex-start' : 'center',
        justifyContent: 'space-between',
        gap: 14,
      }}
    >
      <View style={{ gap: 3, minWidth: 0 }}>
        <Text
          style={{
            fontSize: 15,
            fontWeight: 600,
            letterSpacing: -0.2,
            color: 'var(--dfl-text)',
          }}
        >
          {title}
        </Text>
        {subtitle && (
          <Text style={{ fontSize: 12.5, color: 'var(--dfl-text-3)' }}>
            {subtitle}
          </Text>
        )}
      </View>
      {action}
    </View>
  );
}
