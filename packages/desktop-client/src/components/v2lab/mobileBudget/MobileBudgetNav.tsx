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

import { MobileBudgetNavItem } from './MobileBudgetNavItem';
import { budgetLayout, MOBILE_BUDGET_ROOT_CLASS } from './MobileBudgetStyle';

/**
 * The bar, as the published shell draws it.
 *
 * A mock at the shell's own measurements — 62px tall, a 52px raised action —
 * so the laboratory reserves exactly what the real bar would and the
 * composition above it is judged against the real amount of room. It changes no
 * route and replaces nothing: `appshell/AppBottomNav` is the real one and is
 * untouched by this folder's existence.
 *
 * Fixed rather than absolute, and with no scroll listener anywhere: the bar
 * stays under the thumb through the whole page. There is no auto-hide here, by
 * construction.
 */
export function MobileBudgetNav() {
  return (
    <View
      // A picture of the published bar, not a landmark: nothing here navigates,
      // so announcing it as navigation would promise a control that is absent.
      data-lab-nav={MOBILE_BUDGET_ROOT_CLASS}
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000,
        flexDirection: 'row',
        alignItems: 'center',
        height: budgetLayout.navHeight,
        paddingLeft: 6,
        paddingRight: 6,
        borderTop: '1px solid var(--dfl-line)',
        backgroundColor: 'var(--dfmb-nav-bg)',
        backdropFilter: 'blur(14px)',
      }}
    >
      <MobileBudgetNavItem label={<Trans>Início</Trans>} Icon={SvgHome} />
      <MobileBudgetNavItem
        label={<Trans>Orçamento</Trans>}
        Icon={SvgChartPie}
        isActive
      />

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
            width: budgetLayout.actionSize,
            height: budgetLayout.actionSize,
            marginTop: -18,
            borderRadius: 999,
            backgroundColor: 'var(--dfl-violet)',
            boxShadow:
              '0 10px 22px -10px rgba(124, 77, 255, 0.75), 0 0 0 5px var(--dfl-canvas)',
          }}
        >
          <SvgAdd width={21} height={21} style={{ color: '#ffffff' }} />
        </View>
      </View>

      <MobileBudgetNavItem label={<Trans>Contas</Trans>} Icon={SvgWallet} />
      <MobileBudgetNavItem
        label={<Trans>Mais</Trans>}
        Icon={SvgDotsHorizontalTriple}
        // The icon is misnamed in the library: its path stacks the three dots
        // vertically. The quarter turn lays them out the way the bar wants them.
        iconRotation={90}
      />
    </View>
  );
}
