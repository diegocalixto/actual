import React from 'react';
import type { ReactNode } from 'react';

import { useResponsive } from '@actual-app/components/hooks/useResponsive';
import { Text } from '@actual-app/components/text';
import { View } from '@actual-app/components/view';

import { shellColors } from '#components/appshell/shellTheme';

type PageIntroProps = {
  title: ReactNode;
  /** One line of context under the title: a period, a count, a total. */
  subtitle?: ReactNode;
  /** Controls that belong to the page as a whole. */
  actions?: ReactNode;
};

/**
 * The opening of a V2 page: a real title, one line of context, and the page's
 * own controls on the right.
 *
 * Upstream pages had no title at all — a screen announced itself only through
 * whatever table happened to be on it. Giving each page a heading is what makes
 * Budget, Accounts and Reports read as parts of one product.
 */
export function PageIntro({ title, subtitle, actions }: PageIntroProps) {
  const { isNarrowWidth } = useResponsive();

  return (
    <View
      style={{
        flexDirection: isNarrowWidth ? 'column' : 'row',
        alignItems: isNarrowWidth ? 'stretch' : 'flex-end',
        justifyContent: 'space-between',
        gap: isNarrowWidth ? 14 : 20,
        flexShrink: 0,
      }}
    >
      <View style={{ gap: 4, minWidth: 0 }}>
        <Text
          style={{
            fontSize: isNarrowWidth ? 22 : 26,
            fontWeight: 700,
            letterSpacing: -0.6,
            color: shellColors.textPrimary,
          }}
        >
          {title}
        </Text>
        {subtitle && (
          <Text style={{ fontSize: 13.5, color: shellColors.textMuted }}>
            {subtitle}
          </Text>
        )}
      </View>

      {actions && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            flexShrink: 0,
          }}
        >
          {actions}
        </View>
      )}
    </View>
  );
}
