import React from 'react';
import type { ReactNode } from 'react';

import { useResponsive } from '@actual-app/components/hooks/useResponsive';
import { View } from '@actual-app/components/view';

import { MOBILE_NAV_SPACER } from '#components/appshell/AppBottomNav';
import { shellLayout } from '#components/appshell/shellTheme';

type PageBodyProps = {
  children: ReactNode;
  /** Pages that own a full-bleed table opt out of the centred column. */
  fullBleed?: boolean;
};

/**
 * The scroll column every V2 page shares: one max width, one gutter, one
 * rhythm, and the bottom clearance the phone's fixed bar needs.
 */
export function PageBody({ children, fullBleed = false }: PageBodyProps) {
  const { isNarrowWidth } = useResponsive();

  return (
    <View
      style={{
        width: '100%',
        maxWidth: fullBleed ? undefined : shellLayout.maxContentWidth,
        alignSelf: 'center',
        flex: fullBleed ? 1 : undefined,
        flexShrink: 0,
        minHeight: 0,
        padding: isNarrowWidth
          ? `14px ${shellLayout.gutter}px`
          : `20px ${shellLayout.desktopGutter}px`,
        paddingBottom: isNarrowWidth ? MOBILE_NAV_SPACER : 44,
        gap: isNarrowWidth ? shellLayout.stackGap : shellLayout.desktopStackGap,
      }}
    >
      {children}
    </View>
  );
}
