import type { ComponentType, SVGProps } from 'react';
import { useTranslation } from 'react-i18next';

import {
  SvgCog,
  SvgCreditCard,
  SvgHome,
  SvgPiggyBank,
  SvgReports,
  SvgStoreFront,
  SvgTag,
  SvgTuning,
  SvgWallet,
} from '@actual-app/components/icons/v1';
import { SvgCalendar3 } from '@actual-app/components/icons/v2';

import { useIsTestEnv } from '#hooks/useIsTestEnv';
import { useSyncServerStatus } from '#hooks/useSyncServerStatus';

export type NavIcon = ComponentType<SVGProps<SVGSVGElement>>;

export type NavItem = {
  /** Stable key, also used as the React key. */
  id: string;
  label: string;
  /** An existing route. Nothing here is a placeholder. */
  to: string;
  Icon: NavIcon;
};

/**
 * The product's navigation model.
 *
 * Actual exposes every destination at once in one vertical list. Diego Finance
 * splits them: four destinations carry the day-to-day money questions and live
 * permanently in the rail; everything else is real, reachable and one click
 * away behind "More", instead of competing for attention on every screen.
 *
 * The eventual product architecture also wants Gastos, Cartões and Estratégia.
 * They are deliberately absent: no page exists behind them yet, and a rail item
 * pointing at a placeholder would be a dead route. They join this list when
 * they become real screens.
 */
export function usePrimaryNav(): NavItem[] {
  const { t } = useTranslation();

  return [
    { id: 'overview', label: t('Overview'), to: '/home', Icon: SvgHome },
    { id: 'budget', label: t('Budget'), to: '/budget', Icon: SvgWallet },
    {
      id: 'accounts',
      label: t('Accounts'),
      to: '/accounts',
      Icon: SvgPiggyBank,
    },
    { id: 'reports', label: t('Reports'), to: '/reports', Icon: SvgReports },
  ];
}

/** Everything else the app can do, grouped behind one entry point. */
export function useSecondaryNav(): NavItem[] {
  const { t } = useTranslation();
  const syncServerStatus = useSyncServerStatus();
  const isTestEnv = useIsTestEnv();
  const isUsingServer = syncServerStatus !== 'no-server' || isTestEnv;

  return [
    {
      id: 'schedules',
      label: t('Schedules'),
      to: '/schedules',
      Icon: SvgCalendar3,
    },
    { id: 'payees', label: t('Payees'), to: '/payees', Icon: SvgStoreFront },
    { id: 'rules', label: t('Rules'), to: '/rules', Icon: SvgTuning },
    { id: 'tags', label: t('Tags'), to: '/tags', Icon: SvgTag },
    ...(isUsingServer
      ? [
          {
            id: 'bank-sync',
            label: t('Bank Sync'),
            to: '/bank-sync',
            Icon: SvgCreditCard,
          },
        ]
      : []),
    { id: 'settings', label: t('Settings'), to: '/settings', Icon: SvgCog },
  ];
}

/**
 * Whether a nav entry owns the current location. Prefix matching so that
 * `/accounts/:id` keeps Accounts lit and `/reports/:dashboardId` keeps Reports
 * lit, which is what a rail indicator is for.
 */
export function isNavItemActive(item: NavItem, pathname: string): boolean {
  return pathname === item.to || pathname.startsWith(`${item.to}/`);
}
