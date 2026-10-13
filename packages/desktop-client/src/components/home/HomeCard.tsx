import React from 'react';
import type { ReactNode } from 'react';

import type { CSSProperties } from '@actual-app/components/styles';
import { View } from '@actual-app/components/view';

import { homeCardStyle } from './homeStyles';

type HomeCardProps = {
  children: ReactNode;
  style?: CSSProperties;
};

export function HomeCard({ children, style }: HomeCardProps) {
  return <View style={{ ...homeCardStyle, ...style }}>{children}</View>;
}
