import React from 'react';

import { View } from '@actual-app/components/view';

import { ShellHeaderActions, ShellRouteControls } from '#components/Titlebar';

import { BrandWordmark } from './BrandMark';
import { shellColors, shellLayout } from './shellTheme';
import { WorkspaceChip } from './WorkspaceChip';

/**
 * The desktop header.
 *
 * Actual had no header — it had a 36px transparent strip floated over the top
 * of the scrolling content, holding only utility icons, while the product's
 * name was whatever the sidebar said the budget file was called. This is a real
 * header that sits outside the scroll container: it names the product, states
 * which budget file is open as secondary context, and carries the same
 * route-specific controls and utilities the old strip did.
 */
export function AppHeader() {
  return (
    <View
      style={{
        flexShrink: 0,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        height: shellLayout.headerHeight,
        padding: `0 ${shellLayout.desktopGutter}px`,
        borderBottom: `1px solid ${shellColors.railBorder}`,
        backgroundColor: shellColors.canvas,
        // Electron: the empty parts of the header drag the window; every
        // control inside opts back out (the Button primitive already does).
        WebkitAppRegion: 'drag',
        '& button, & a, & input': { WebkitAppRegion: 'no-drag' },
      }}
    >
      <BrandWordmark />

      <View
        aria-hidden="true"
        style={{
          width: 1,
          height: 20,
          flexShrink: 0,
          backgroundColor: shellColors.border,
        }}
      />

      <WorkspaceChip />

      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <ShellRouteControls />
      </View>

      <View style={{ flex: 1 }} />

      <ShellHeaderActions />
    </View>
  );
}
