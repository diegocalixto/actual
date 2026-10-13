import type { CSSProperties, PropsWithChildren } from 'react';

import { theme } from '@actual-app/components/theme';
import { View } from '@actual-app/components/view';

type FloatingActionBarProps = PropsWithChildren & {
  style: CSSProperties;
};

export function FloatingActionBar({ style, children }: FloatingActionBarProps) {
  return (
    <View
      style={{
        backgroundColor: theme.floatingActionBarBackground,
        color: theme.floatingActionBarText,
        position: 'fixed',
        // Sits on its own above the page — the nav bar is not rendered on the
        // screens that use it — so it has to clear the iOS home indicator by
        // itself. The other fixed/pinned mobile bars already do.
        bottom: 'calc(10px + env(safe-area-inset-bottom, 0px))',
        margin: '0 10px',
        width: '95vw',
        height: 60,
        zIndex: 100,
        borderRadius: 8,
        border: `1px solid ${theme.floatingActionBarBorder}`,
        ...style,
      }}
    >
      {children}
    </View>
  );
}
