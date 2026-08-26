import React from 'react';
import type { ComponentType, ReactNode, SVGProps } from 'react';

import { Text } from '@actual-app/components/text';
import { View } from '@actual-app/components/view';

type LabPillProps = {
  children: ReactNode;
  Icon?: ComponentType<SVGProps<SVGSVGElement>>;
};

/**
 * Period and scope, stated rather than offered.
 *
 * The reference draws these as dropdowns. The laboratory has one period of
 * fixtures, so a chevron here would be an affordance that does nothing — these
 * read as informative pills instead, and gain their control when they gain
 * something to switch to.
 */
export function LabPill({ children, Icon }: LabPillProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: '9px 15px',
        borderRadius: 999,
        backgroundColor: 'var(--dfl-surface-raised)',
        border: '1px solid var(--dfl-line-strong)',
        boxShadow: 'var(--dfl-shadow)',
      }}
    >
      {Icon && (
        <Icon
          aria-hidden="true"
          width={14}
          height={14}
          style={{ color: 'var(--dfl-blue)' }}
        />
      )}
      <Text
        style={{
          fontSize: 13,
          fontWeight: 500,
          whiteSpace: 'nowrap',
          color: 'var(--dfl-text)',
        }}
      >
        {children}
      </Text>
    </View>
  );
}
