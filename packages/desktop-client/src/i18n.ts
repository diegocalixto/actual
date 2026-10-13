import { initReactI18next } from 'react-i18next';

import * as Platform from '@actual-app/core/shared/platform';
import i18n from 'i18next';
import resourcesToBackend from 'i18next-resources-to-backend';

import { languages } from './languages';
import { localeOverrides } from './locale-overrides';

const catalogPath = (language: string) => `/locale/${language}.json`;

const hasCatalog = (language: string) =>
  Object.hasOwn(languages, catalogPath(language));

const catalogLanguages = Object.keys(languages).map(
  path => path.split('/')[2].split('.')[0],
);

// A language this fork translates itself (see `./locale-overrides`) is offered
// even where the upstream catalog was never downloaded: `locale/` is
// git-ignored and only a release build fetches it, so a fresh checkout has
// none. The fork's own screens are then fully translated from the overrides,
// and upstream text falls back to English until the catalog is there.
export const availableLanguages = Platform.isPlaywright
  ? []
  : [...new Set([...catalogLanguages, ...Object.keys(localeOverrides)])];

const isLanguageAvailable = (language: string) =>
  hasCatalog(language) || Object.hasOwn(localeOverrides, language);

const loadLanguage = async (language: string) => {
  if (!isLanguageAvailable(language)) {
    throw new Error(`Unknown locale ${language}`);
  }

  const resources = hasCatalog(language)
    ? (await languages[catalogPath(language)]()).default
    : {};

  const overrides = localeOverrides[language];
  return overrides ? { ...resources, ...overrides } : resources;
};

void i18n
  .use(initReactI18next)
  .use(resourcesToBackend(loadLanguage))
  .init({
    lng: 'en',

    // allow keys to be phrases having `:`, `.`
    nsSeparator: false,
    keySeparator: false,
    // do not load a fallback
    fallbackLng: false,
    interpolation: {
      escapeValue: false,
    },
    react: {
      transSupportBasicHtmlNodes: false,
    },
  });

// The document says which language its text is in. A screen reader picks its
// voice from this attribute, and left at the markup's "en" it reads Portuguese
// with English phonetics.
i18n.on('languageChanged', language => {
  document.documentElement.lang = language;
});

const resolveLanguage = (language: string) => {
  // English is always available since we use natural-language keys.
  if (language === 'en') return 'en';

  if (isLanguageAvailable(language)) return language;

  const lowercaseLanguage = language.toLowerCase();
  if (lowercaseLanguage !== language) {
    console.info(
      `Unknown locale ${language}, falling back to ${lowercaseLanguage}`,
    );
    return resolveLanguage(lowercaseLanguage);
  }

  if (language.includes('-')) {
    const fallback = language.split('-')[0];
    console.info(`Unknown locale ${language}, falling back to ${fallback}`);
    return resolveLanguage(fallback);
  }

  return undefined;
};

export const setI18NextLanguage = (language: string | null) => {
  const defaultLanguages = Array.isArray(navigator.languages)
    ? navigator.languages
    : [navigator.language || 'en'];
  const languagesToTry = language ? [language] : defaultLanguages;

  let resolved: string | undefined;

  for (const lang of languagesToTry) {
    resolved = resolveLanguage(lang);
    if (resolved) break;
  }

  if (!resolved) {
    // Fall back to English
    console.info(
      language
        ? `Unknown locale ${language}, falling back to en`
        : `Unknown locales [${languagesToTry.join(', ')}] falling back to en`,
    );
    resolved = 'en';
  }

  if (resolved === i18n.language) {
    return; // language is already set
  }

  void i18n.changeLanguage(resolved);
};
