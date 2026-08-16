import React from 'react';
import type { ReactNode } from 'react';

import { Text } from '@actual-app/components/text';
import { View } from '@actual-app/components/view';

import { homeLayout, homeSectionTitleStyle } from './homeStyles';

type HomeSectionProps = {
  title: ReactNode;
  /** Optional trailing element, e.g. a "see all" link. */
  action?: ReactNode;
  children: ReactNode;
};

export function HomeSection({ title, action, children }: HomeSectionProps) {
  return (
    <View style={{ gap: 10 }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          minHeight: 20,
          paddingLeft: 4,
          paddingRight: 4,
        }}
      >
        <Text style={homeSectionTitleStyle}>{title}</Text>
        {action}
      </View>
      <View style={{ gap: homeLayout.gutter - 4 }}>{children}</View>
    </View>
  );
}
