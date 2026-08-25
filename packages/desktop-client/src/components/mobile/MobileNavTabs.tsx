import React, { useCallback, useState } from 'react';
import type { ComponentProps, ComponentType, CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router';
import { animated, config, useSpring } from 'react-spring';

import { useResponsive } from '@actual-app/components/hooks/useResponsive';
import {
  SvgAdd,
  SvgCog,
  SvgCreditCard,
  SvgHome,
  SvgPiggyBank,
  SvgReports,
  SvgStoreFront,
  SvgTuning,
  SvgWallet,
} from '@actual-app/components/icons/v1';
import { SvgCalendar3 } from '@actual-app/components/icons/v2';
import { styles } from '@actual-app/components/styles';
import { theme } from '@actual-app/components/theme';
import { View } from '@actual-app/components/view';
import { useDrag } from '@use-gesture/react';

import { useIsTestEnv } from '#hooks/useIsTestEnv';
import { useSyncServerStatus } from '#hooks/useSyncServerStatus';

const COLUMN_COUNT = 3;
const PILL_HEIGHT = 15;
const ROW_HEIGHT = 70;
const OPEN_FULL_Y = 1;

/**
 * The iOS home indicator occupies the bottom strip of the screen, and the app
 * opts into `viewport-fit=cover`, so the sheet is laid out underneath it.
 * Reserve the strip *below* the tab rows rather than inside them: the padding
 * lifts the icons and labels clear of the indicator, and the matching extra
 * height keeps each row exactly ROW_HEIGHT tall. Collapses to the current
 * layout wherever the inset resolves to 0.
 */
const SAFE_AREA_BOTTOM = 'env(safe-area-inset-bottom, 0px)';

/** Height of the sheet at rest: the drag handle plus the first row of tabs. */
export const MOBILE_NAV_HEIGHT = ROW_HEIGHT + PILL_HEIGHT;

/**
 * What a page has to leave free at its bottom to clear the resting nav. Pages
 * reserve this instead of `MOBILE_NAV_HEIGHT` so their last row also clears
 * the home indicator.
 */
export const MOBILE_NAV_SPACER = `calc(${MOBILE_NAV_HEIGHT}px + ${SAFE_AREA_BOTTOM})`;

export function MobileNavTabs() {
  const { t } = useTranslation();
  const { isNarrowWidth } = useResponsive();
  const syncServerStatus = useSyncServerStatus();
  const isTestEnv = useIsTestEnv();
  const isUsingServer = syncServerStatus !== 'no-server' || isTestEnv;
  const [navbarState, setNavbarState] = useState<'default' | 'open'>('default');

  const navTabStyle = {
    flex: `1 1 ${100 / COLUMN_COUNT}%`,
    height: ROW_HEIGHT,
    padding: 10,
    maxWidth: `${100 / COLUMN_COUNT}%`,
  };

  const tabs = [
    {
      name: t('Budget'),
      path: '/budget',
      style: navTabStyle,
      Icon: SvgWallet,
    },
    {
      name: t('Transaction'),
      path: '/transactions/new',
      style: navTabStyle,
      Icon: SvgAdd,
    },
    {
      name: t('Accounts'),
      path: '/accounts',
      style: navTabStyle,
      Icon: SvgPiggyBank,
    },
    {
      name: t('Overview'),
      path: '/home',
      style: navTabStyle,
      Icon: SvgHome,
    },
    {
      name: t('Reports'),
      path: '/reports',
      style: navTabStyle,
      Icon: SvgReports,
    },
    {
      name: t('Schedules'),
      path: '/schedules',
      style: navTabStyle,
      Icon: SvgCalendar3,
    },
    {
      name: t('Payees'),
      path: '/payees',
      style: navTabStyle,
      Icon: SvgStoreFront,
    },
    {
      name: t('Rules'),
      path: '/rules',
      style: navTabStyle,
      Icon: SvgTuning,
    },
    ...(isUsingServer
      ? [
          {
            name: t('Bank Sync'),
            path: '/bank-sync',
            style: navTabStyle,
            Icon: SvgCreditCard,
          },
        ]
      : []),
    {
      name: t('Settings'),
      path: '/settings',
      style: navTabStyle,
      Icon: SvgCog,
    },
  ];

  // Size the sheet to the rows it actually has. Assuming COLUMN_COUNT rows left
  // the last row outside the sheet whenever the tab count crossed a multiple of
  // the column count — which it does as soon as a sync server adds Bank Sync.
  const rowCount = Math.ceil(tabs.length / COLUMN_COUNT);
  const totalHeight = ROW_HEIGHT * rowCount;
  const openDefaultY = totalHeight - ROW_HEIGHT;

  const [{ y }, api] = useSpring(() => ({ from: { y: openDefaultY } }), []);

  const openFull = useCallback(
    ({ canceled }: { canceled?: boolean }) => {
      // when cancel is true, it means that the user passed the upwards threshold
      // so we change the spring config to create a nice wobbly effect
      setNavbarState('open');
      void api.start({
        to: { y: OPEN_FULL_Y },
        immediate: isTestEnv,
        config: canceled ? config.wobbly : config.stiff,
      });
    },
    [api, isTestEnv],
  );

  const openDefault = useCallback(
    (velocity = 0) => {
      setNavbarState('default');
      void api.start({
        to: { y: openDefaultY },
        immediate: isTestEnv,
        config: { ...config.stiff, velocity },
      });
    },
    [api, isTestEnv, openDefaultY],
  );

  const navTabs = tabs.map(tab => (
    <NavTab key={tab.path} onClick={() => openDefault()} {...tab} />
  ));

  const bufferTabsCount =
    (COLUMN_COUNT - (navTabs.length % COLUMN_COUNT)) % COLUMN_COUNT;
  const bufferTabs = Array.from({ length: bufferTabsCount }).map((_, idx) => (
    <div key={idx} style={navTabStyle} />
  ));

  const bind = useDrag(
    ({
      last,
      velocity: [, vy],
      direction: [, dy],
      offset: [, oy],
      cancel,
      canceled,
    }) => {
      // if the user drags up passed a threshold, then we cancel
      // the drag so that the sheet resets to its open position
      if (oy < 0) {
        cancel();
      }

      // when the user releases the sheet, we check whether it passed
      // the threshold for it to close, or if we reset it to its open position
      if (last) {
        if (oy > ROW_HEIGHT * 0.5 || (vy > 0.5 && dy > 0)) {
          openDefault(vy);
        } else {
          openFull({ canceled });
        }
      } else {
        // when the user keeps dragging, we just move the sheet according to
        // the cursor position
        void api.start({ to: { y: oy }, immediate: true });
      }
    },
    {
      from: () => [0, y.get()],
      filterTaps: true,
      bounds: { top: -totalHeight, bottom: openDefaultY },
      axis: 'y',
      rubberband: true,
    },
  );

  return (
    <animated.div
      role="navigation"
      {...bind()}
      style={{
        y,
        touchAction: 'pan-x',
        backgroundColor: theme.mobileNavBackground,
        borderTop: `1px solid ${theme.menuBorder}`,
        ...styles.shadow,
        height: `calc(${totalHeight + PILL_HEIGHT}px + ${SAFE_AREA_BOTTOM})`,
        paddingBottom: SAFE_AREA_BOTTOM,
        width: '100%',
        position: 'fixed',
        zIndex: 100,
        bottom: 0,
        ...(!isNarrowWidth && { display: 'none' }),
      }}
      data-navbar-state={navbarState}
    >
      <View>
        {/* The handle was decoration: the sheet could only be opened by
            dragging it up, and on an iPhone that drag starts inside the strip
            iOS reserves for its own home-indicator swipe. Making the handle a
            button gives the same gesture a tap equivalent — the drag below is
            untouched, and `filterTaps` already lets the click through. It
            spans the full width so the 15px-tall strip is still easy to hit. */}
        <button
          type="button"
          aria-label={
            navbarState === 'open'
              ? t('Collapse navigation')
              : t('Expand navigation')
          }
          aria-expanded={navbarState === 'open'}
          onClick={() =>
            navbarState === 'open' ? openDefault() : openFull({})
          }
          style={{
            ...styles.noTapHighlight,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: PILL_HEIGHT,
            padding: 0,
            border: 0,
            background: 'none',
            cursor: 'pointer',
          }}
        >
          <div
            style={{
              backgroundColor: theme.pillBorder,
              borderRadius: 10,
              width: 30,
              padding: 2,
            }}
          />
        </button>
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            height: totalHeight,
            width: '100%',
          }}
        >
          {[navTabs, bufferTabs]}
        </View>
      </View>
    </animated.div>
  );
}

type NavTabIconProps = {
  width: number;
  height: number;
  style?: CSSProperties;
};

type NavTabProps = {
  name: string;
  path: string;
  Icon: ComponentType<NavTabIconProps>;
  style?: CSSProperties;
  onClick: ComponentProps<typeof NavLink>['onClick'];
};

function NavTab({ Icon: TabIcon, name, path, style, onClick }: NavTabProps) {
  return (
    <NavLink
      to={path}
      style={({ isActive }) => ({
        ...styles.noTapHighlight,
        alignItems: 'center',
        color: isActive ? theme.mobileNavItemSelected : theme.mobileNavItem,
        display: 'flex',
        flexDirection: 'column',
        textDecoration: 'none',
        textAlign: 'center',
        textWrap: 'balance',
        userSelect: 'none',
        ...style,
      })}
      onClick={onClick}
    >
      <TabIcon width={22} height={22} style={{ minHeight: '22px' }} />
      {name}
    </NavLink>
  );
}
