/**
 * The mobile navigation moved into the app shell, where it shares its model
 * with the desktop rail (see `appshell/AppBottomNav`).
 *
 * This module stays as the public name because a dozen mobile pages reserve
 * bottom padding with `MOBILE_NAV_SPACER`; re-exporting keeps that contract
 * pointing at whatever the current bar actually measures.
 */
export {
  AppBottomNav as MobileNavTabs,
  MOBILE_NAV_HEIGHT,
  MOBILE_NAV_SPACER,
} from '#components/appshell/AppBottomNav';
