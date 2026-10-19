import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { NavLink, useLocation } from 'react-router';

import { Button } from '@actual-app/components/button';
import { SvgDotsHorizontalTriple } from '@actual-app/components/icons/v1';
import { Text } from '@actual-app/components/text';
import { View } from '@actual-app/components/view';
import * as Platform from '@actual-app/core/shared/platform';
import { css } from '@emotion/css';

import { BrandMark } from './BrandMark';
import { MoreMenu } from './MoreMenu';
import type { NavItem } from './navigation';
import { isNavItemActive, usePrimaryNav } from './navigation';
import { shellColors, shellLayout, shellRadius } from './shellTheme';

/**
 * The desktop navigation.
 *
 * This replaces Actual's 240px resizable text sidebar outright. That sidebar
 * held the budget name styled as a logo, a vertical list of text links, and the
 * full account list with balances — roughly a third of the window spent on
 * chrome, and the single strongest visual signature of the upstream app.
 *
 * The rail is 88px of pure navigation: the product mark, four destinations as
 * icon-and-label targets, and everything else behind "More". The accounts moved
 * to the Accounts page and to the Home's account tiles, where they have room to
 * be read rather than squeezed into a nav column.
 */
export function AppRail() {
  const { t } = useTranslation();
  const location = useLocation();
  const items = usePrimaryNav();

  // On macOS the window buttons are drawn over the top-left of the frame, which
  // is exactly where the brand mark sits.
  const hasWindowButtons = !Platform.isBrowser && Platform.OS === 'mac';

  return (
    <View
      style={{
        width: shellLayout.railWidth,
        flexShrink: 0,
        alignItems: 'center',
        backgroundColor: shellColors.rail,
        borderRight: `1px solid ${shellColors.railBorder}`,
        paddingTop: hasWindowButtons ? 40 : 14,
        paddingBottom: 14,
        // Electron: let the empty parts of the rail drag the window.
        WebkitAppRegion: 'drag',
        '& button, & a': { WebkitAppRegion: 'no-drag' },
      }}
    >
      {/* The app mark alone: the wordmark lives once, in the header. */}
      <View style={{ paddingBottom: 20 }}>
        <BrandMark size={36} />
      </View>

      <View
        role="navigation"
        aria-label={t('Main')}
        style={{ gap: 4, alignItems: 'center', flexShrink: 0 }}
      >
        {items.map(item => (
          <RailItem
            key={item.id}
            item={item}
            isActive={isNavItemActive(item, location.pathname)}
          />
        ))}
      </View>

      <View style={{ flex: 1 }} />

      <MoreMenu placement="right bottom">
        {({ ref, onPress, isOpen }) => (
          <Button
            ref={ref}
            variant="bare"
            aria-label={t('More')}
            aria-expanded={isOpen}
            onPress={onPress}
            className={railTargetClass(isOpen)}
          >
            <View style={{ alignItems: 'center', gap: 5 }}>
              <SvgDotsHorizontalTriple width={19} height={19} />
              <Text style={RAIL_LABEL}>
                <Trans>More</Trans>
              </Text>
            </View>
          </Button>
        )}
      </MoreMenu>
    </View>
  );
}

function RailItem({ item, isActive }: { item: NavItem; isActive: boolean }) {
  const { Icon, label, to } = item;

  return (
    <NavLink
      to={to}
      aria-current={isActive ? 'page' : undefined}
      className={railTargetClass(isActive)}
    >
      <View style={{ alignItems: 'center', gap: 5 }}>
        <Icon width={19} height={19} />
        <Text style={RAIL_LABEL}>{label}</Text>
      </View>
    </NavLink>
  );
}

const RAIL_LABEL = {
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: 0.1,
  lineHeight: 1.2,
  textAlign: 'center',
} as const;

/**
 * One target style for links and for the More button, so the rail cannot end up
 * with two slightly different hit areas.
 */
function railTargetClass(isActive: boolean) {
  return css({
    display: 'flex',
    width: 64,
    minHeight: 58,
    padding: '9px 4px',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: shellRadius.tile,
    border: '1px solid transparent',
    textDecoration: 'none',
    userSelect: 'none',
    transition: 'background-color .15s ease, color .15s ease',
    backgroundColor: isActive ? shellColors.accentSoft : 'transparent',
    borderColor: isActive ? shellColors.border : 'transparent',
    color: isActive ? shellColors.accent : shellColors.textSecondary,
    '&:hover, &[data-hovered]': {
      backgroundColor: isActive
        ? shellColors.accentSoft
        : shellColors.surfaceSunken,
      color: isActive ? shellColors.accent : shellColors.textPrimary,
    },
  });
}
