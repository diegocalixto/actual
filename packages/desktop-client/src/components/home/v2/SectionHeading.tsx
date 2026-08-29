import React from 'react';
import type { ReactNode } from 'react';

import { Text } from '@actual-app/components/text';
import { View } from '@actual-app/components/view';

import { shellEyebrowStyle } from '#components/appshell/shellTheme';

type SectionHeadingProps = {
  title: ReactNode;
  /** Trailing element: a total, a month, or a "see all" link. */
  action?: ReactNode;
  children: ReactNode;
};

/** A titled block: small caps eyebrow, optional trailing action, content. */
export function SectionHeading({
  title,
  action,
  children,
}: SectionHeadingProps) {
  return (
    <View style={{ gap: 10 }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          minHeight: 22,
          paddingLeft: 2,
          paddingRight: 2,
        }}
      >
        <Text style={shellEyebrowStyle}>{title}</Text>
        {action}
      </View>
      {children}
    </View>
  );
}
