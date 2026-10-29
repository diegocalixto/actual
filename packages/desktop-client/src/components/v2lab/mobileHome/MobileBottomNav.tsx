import React from 'react';
import { Trans } from 'react-i18next';

import {
  SvgAdd,
  SvgChartPie,
  SvgDotsHorizontalTriple,
  SvgHome,
  SvgWallet,
} from '@actual-app/components/icons/v1';
import { View } from '@actual-app/components/view';

import { mobileLayout } from './MobileHomeStyle';
import { MobileNavItem } from './MobileNavItem';

/**
 * The bar, as the proposal draws it.
 *
 * A mock: it changes no route and replaces nothing. The real bar is
 * `appshell/AppBottomNav`, already published and shared with the desktop rail;
 * this exists so the composition can be judged whole, and it lives only under
 * the laboratory's own class.
 *
 * The central action is smaller than the reference's. There it is the largest
 * object on the screen and pulls the eye off the balance; at 48px it still
 * reads first among the five controls without out-shouting the money above it.
 */
export function MobileBottomNav() {
  return (
    <View
      aria-hidden="true"
      style={{
        // Fixed rather than absolute: the page scrolls inside an ancestor, so
        // an absolute bar would ride to the bottom of the content and scroll
        // away with it instead of staying under the thumb.
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        flexDirection: 'row',
        alignItems: 'center',
        height: mobileLayout.navHeight,
        paddingLeft: 6,
        paddingRight: 6,
        borderTop: '1px solid var(--dfl-line)',
        backgroundColor: 'var(--dfm-nav-bg)',
        backdropFilter: 'blur(14px)',
      }}
    >
      <MobileNavItem label={<Trans>Início</Trans>} Icon={SvgHome} isActive />
      <MobileNavItem label={<Trans>Orçamento</Trans>} Icon={SvgChartPie} />

      <View
        style={{
          flex: '1 1 0',
          minWidth: 0,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View
          style={{
            alignItems: 'center',
            justifyContent: 'center',
            width: mobileLayout.actionSize,
            height: mobileLayout.actionSize,
            // Raised just enough to sit on the bar's edge rather than float
            // over the content: a lift, not a hovering object.
            marginTop: -mobileLayout.actionSize / 2,
            borderRadius: 999,
            backgroundColor: 'var(--dfl-violet)',
            boxShadow:
              '0 10px 22px -10px rgba(124, 77, 255, 0.75), 0 0 0 5px var(--dfl-canvas)',
          }}
        >
          <SvgAdd width={20} height={20} style={{ color: '#ffffff' }} />
        </View>
      </View>

      <MobileNavItem label={<Trans>Contas</Trans>} Icon={SvgWallet} />
      <MobileNavItem
        label={<Trans>Mais</Trans>}
        Icon={SvgDotsHorizontalTriple}
        // The icon is misnamed in the library: its path stacks the three dots
        // vertically. The quarter turn lays them out the way both its own name
        // and the proposal's bar want them.
        iconRotation={90}
      />
    </View>
  );
}
