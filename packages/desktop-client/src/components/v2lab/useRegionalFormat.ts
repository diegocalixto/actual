import { useSyncedPref } from '#hooks/useSyncedPref';
import type { AppStore } from '#redux/store';

import { regionalSignature, setRegionalPrefsSource } from './regionalFormat';

/**
 * Points the V2 formatters at the application's store. Called once, where the
 * store is created, so no page has to hand its preferences over while it
 * renders.
 */
export function bindRegionalFormatToStore(store: AppStore): void {
  setRegionalPrefsSource(() => {
    const { numberFormat, defaultCurrencyCode } = store.getState().prefs.synced;

    return { numberFormat, currencyCode: defaultCurrencyCode };
  });
}

/**
 * A key for what a V2 page draws, which changes when the file's number format
 * or currency does.
 *
 * The page is redrawn whole on that change, and deliberately so. The amounts
 * on it are formatted where they are printed, and a page left half in one
 * convention and half in the other would misstate them: "1.234" is a thousand
 * in one and barely more than one in the other. The same goes for a plan being
 * typed into the Budget's field — read under the convention that arrived
 * mid-edit it would be written as a different amount, so the field starts
 * over from the stored value. The change comes from another device, rarely,
 * and costs this one its scroll position.
 */
export function useRegionalFormatKey(): string {
  const [numberFormat] = useSyncedPref('numberFormat');
  const [currencyCode] = useSyncedPref('defaultCurrencyCode');

  return regionalSignature({ numberFormat, currencyCode });
}
