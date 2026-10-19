import { useTranslation } from 'react-i18next';

import { getLocale } from '@actual-app/core/shared/locale';

import { useGlobalPref } from './useGlobalPref';

/**
 * The user's language code (BCP 47). Without a choice saved on this device,
 * the language the text was shown in — `setI18NextLanguage` puts the fork's
 * default first — so dates and month names match the words around them;
 * the browser's language only when i18n has none.
 */
export function useLanguage() {
  const [language] = useGlobalPref('language');
  const { i18n } = useTranslation();
  return language || i18n.language || navigator.language || 'en-US';
}

export function useLocale() {
  return getLocale(useLanguage());
}
