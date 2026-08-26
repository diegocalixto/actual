import React from 'react';
import type { ReactNode } from 'react';

import { useResponsive } from '@actual-app/components/hooks/useResponsive';
import { View } from '@actual-app/components/view';

import { AppHeader } from './AppHeader';
import { AppRail } from './AppRail';
import { shellColors } from './shellTheme';

type AppShellProps = {
  children: ReactNode;
};

/**
 * The Diego Finance frame.
 *
 * Upstream, the frame was: a 240px resizable text sidebar on the left, and the
 * page filling everything else with a translucent utility strip floated over
 * its top edge. Two planes, one of which was mostly a list of links and account
 * balances.
 *
 * Here it is a narrow navigation rail on its own darker plane, a real header
 * that stays put while the page scrolls under it, and a content column that
 * owns the rest of the width. The header lives outside the scroll container,
 * which is why the brand and the workspace never scroll away.
 */
export function AppShell({ children }: AppShellProps) {
  const { isNarrowWidth } = useResponsive();

  return (
    <View
      style={{
        flexDirection: 'row',
        flex: 1,
        backgroundColor: shellColors.canvas,
      }}
    >
      {!isNarrowWidth && <AppRail />}

      <View
        style={{
          flex: 1,
          minWidth: 0,
          overflow: 'hidden',
          color: shellColors.textPrimary,
          backgroundColor: shellColors.canvas,
        }}
      >
        {!isNarrowWidth && <AppHeader />}
        {children}
      </View>
    </View>
  );
}
