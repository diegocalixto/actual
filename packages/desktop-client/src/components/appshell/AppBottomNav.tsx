import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { NavLink, useLocation } from 'react-router';

import { Button } from '@actual-app/components/button';
import { useResponsive } from '@actual-app/components/hooks/useResponsive';
import {
  SvgAdd,
  SvgDotsHorizontalTriple,
} from '@actual-app/components/icons/v1';
import { Text } from '@actual-app/components/text';
import { View } from '@actual-app/components/view';
import { css } from '@emotion/css';

import { useNavigate } from '#hooks/useNavigate';

import { MoreMenu } from './MoreMenu';
import type { NavItem } from './navigation';
import { isNavItemActive, usePrimaryNav } from './navigation';
import { shellColors, shellRadius } from './shellTheme';

/**
 * The iOS home indicator occupies the bottom strip of the screen, and the app
 * opts into `viewport-fit=cover`, so the bar is laid out underneath it. The
 * inset is reserved below the row rather than inside it, so the row keeps its
 * full height and the targets clear the indicator. Collapses to nothing
 * wherever the inset resolves to 0.
 */
const SAFE_AREA_BOTTOM = 'env(safe-area-inset-bottom, 0px)';

const ROW_HEIGHT = 62;

/**
 * The bar's own labels, in the product's Portuguese.
 *
 * They are keyed by the nav model's stable ids rather than written into
 * `usePrimaryNav`, because that model is shared with the desktop rail: renaming
 * a label there would rewrite four published desktop screens. Anything not
 * listed keeps the model's label, so a destination added later still appears.
 */
function useBarLabels(): Record<string, string> {
  const { t } = useTranslation();

  return {
    overview: t('Início'),
    budget: t('Orçamento'),
    accounts: t('Contas'),
    reports: t('Relatórios'),
  };
}

/** Height of the bar itself, excluding the safe-area inset below it. */
export const MOBILE_NAV_HEIGHT = ROW_HEIGHT;

/**
 * What a page must leave free at its bottom to clear the bar. Pages reserve
 * this rather than `MOBILE_NAV_HEIGHT` so their last row also clears the home
 * indicator.
 */
export const MOBILE_NAV_SPACER = `calc(${MOBILE_NAV_HEIGHT}px + ${SAFE_AREA_BOTTOM})`;

/**
 * The mobile navigation.
 *
 * Actual's version was a drag-to-expand sheet: three columns of tabs at rest,
 * pulled up to reveal the rest, with a grab handle above it. It exposed every
 * destination in the product and needed a gesture to do so.
 *
 * This is a fixed bar of four destinations around one raised action. The action
 * is the thing a phone is actually for — recording a transaction — so it gets
 * the accent, the largest target and the centre. Everything the sheet used to
 * reveal is in "More", one tap away.
 */
export function AppBottomNav() {
  const { t } = useTranslation();
  const { isNarrowWidth } = useResponsive();
  const navigate = useNavigate();
  const location = useLocation();
  const primary = usePrimaryNav();
  const barLabels = useBarLabels();

  if (!isNarrowWidth) {
    return null;
  }

  // Overview, Budget | + | Accounts, More. Reports lives in "More" on a phone:
  // reading a report is a desk activity, and the centre slot is worth more to
  // the action a person opens the app on the bus to perform.
  const [overview, budget, accounts, reports] = primary;

  return (
    <View
      role="navigation"
      aria-label={t('Main')}
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000,
        flexDirection: 'row',
        alignItems: 'flex-start',
        height: `calc(${ROW_HEIGHT}px + ${SAFE_AREA_BOTTOM})`,
        paddingBottom: SAFE_AREA_BOTTOM,
        backgroundColor: shellColors.rail,
        borderTop: `1px solid ${shellColors.railBorder}`,
      }}
    >
      <TabLink
        item={overview}
        label={barLabels[overview.id]}
        pathname={location.pathname}
      />
      <TabLink
        item={budget}
        label={barLabels[budget.id]}
        pathname={location.pathname}
      />

      <View
        style={{
          flex: '1 1 0',
          alignItems: 'center',
          justifyContent: 'center',
          height: ROW_HEIGHT,
        }}
      >
        <Button
          variant="bare"
          aria-label={t('New transaction')}
          onPress={() => void navigate('/transactions/new')}
          className={css({
            width: 52,
            height: 52,
            // Lifted out of the bar so the action reads as the primary one
            // without needing a label to say so.
            marginTop: -18,
            borderRadius: shellRadius.pill,
            backgroundImage: shellColors.brandGradient,
            color: '#08121c',
            boxShadow:
              '0 8px 20px -6px rgba(0, 0, 0, 0.7), inset 0 0 0 1px rgba(255, 255, 255, 0.12)',
            '&[data-pressed]': { transform: 'scale(0.94)' },
          })}
        >
          <SvgAdd width={22} height={22} />
        </Button>
      </View>

      <TabLink
        item={accounts}
        label={barLabels[accounts.id]}
        pathname={location.pathname}
      />

      <MoreMenu placement="top" extraItems={[reports]}>
        {({ ref, onPress, isOpen }) => (
          <Button
            ref={ref}
            variant="bare"
            aria-label={t('Mais')}
            aria-expanded={isOpen}
            onPress={onPress}
            className={tabClass(isOpen)}
          >
            <View style={{ alignItems: 'center', gap: 4 }}>
              <SvgDotsHorizontalTriple width={20} height={20} />
              <Text style={TAB_LABEL}>
                <Trans>Mais</Trans>
              </Text>
            </View>
          </Button>
        )}
      </MoreMenu>
    </View>
  );
}

function TabLink({
  item,
  label,
  pathname,
}: {
  item: NavItem;
  /** Overrides the shared model's label. Falls back to it when absent. */
  label?: string;
  pathname: string;
}) {
  const isActive = isNavItemActive(item, pathname);
  const { Icon, to } = item;

  return (
    <NavLink
      to={to}
      aria-current={isActive ? 'page' : undefined}
      className={tabClass(isActive)}
    >
      <View style={{ alignItems: 'center', gap: 4 }}>
        <Icon width={20} height={20} />
        <Text style={TAB_LABEL}>{label ?? item.label}</Text>
      </View>
    </NavLink>
  );
}

const TAB_LABEL = {
  fontSize: 10,
  fontWeight: 600,
  lineHeight: 1.2,
  textAlign: 'center',
} as const;

function tabClass(isActive: boolean) {
  return css({
    flex: '1 1 0',
    minWidth: 0,
    height: ROW_HEIGHT,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 0,
    backgroundColor: 'transparent',
    textDecoration: 'none',
    userSelect: 'none',
    WebkitTapHighlightColor: 'transparent',
    color: isActive ? shellColors.accent : shellColors.textSecondary,
    '&[data-pressed]': { backgroundColor: shellColors.surfaceSunken },
  });
}
