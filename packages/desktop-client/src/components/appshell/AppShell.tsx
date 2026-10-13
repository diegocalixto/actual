import React from 'react';
import type { ReactNode } from 'react';
import { useLocation } from 'react-router';

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
  const location = useLocation();

  // One laboratory route carries its own full-height navigation, because the
  // design it is being judged against has no rail and no header. It opts out of
  // the frame rather than reshaping it, so every other route — Overview and
  // Budget included — keeps the approved rail exactly as published.
  const providesOwnFrame = location.pathname === '/v2-lab/accounts';

  if (providesOwnFrame && !isNarrowWidth) {
    return (
      <View
        style={{
          flex: 1,
          minWidth: 0,
          overflow: 'hidden',
          color: shellColors.textPrimary,
          backgroundColor: shellColors.canvas,
        }}
      >
        {children}
      </View>
    );
  }

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
