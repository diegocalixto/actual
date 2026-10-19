import React from 'react';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';

import { renderHook } from '@testing-library/react';
import { createInstance } from 'i18next';
import { describe, expect, it } from 'vitest';

import { createTestAppStore, TestProviders } from '#mocks';
import { mergeGlobalPrefs } from '#prefs/prefsSlice';

import { useLanguage, useLocale } from './useLocale';

async function render(
  shownLanguage: string,
  savedLanguage: string | undefined,
) {
  const i18n = createInstance();
  await i18n.init({ lng: shownLanguage, resources: {} });
  const store = createTestAppStore();
  if (savedLanguage !== undefined) {
    store.dispatch(mergeGlobalPrefs({ language: savedLanguage }));
  }
  const wrapper = ({ children }: { children: ReactNode }) => (
    <TestProviders store={store}>
      <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
    </TestProviders>
  );
  return renderHook(() => ({ language: useLanguage(), locale: useLocale() }), {
    wrapper,
  }).result.current;
}

describe('useLanguage', () => {
  it('follows the language the text is shown in when none was chosen', async () => {
    // The browser here says en-US; the fork's default put pt-BR on screen.
    const { language, locale } = await render('pt-BR', undefined);
    expect(language).toBe('pt-BR');
    expect(locale.code).toBe('pt-BR');
  });

  it('keeps the language chosen on this device', async () => {
    const { language, locale } = await render('en', 'en');
    expect(language).toBe('en');
    expect(locale.code).toBe('en-US');
  });

  it('keeps a chosen pt-BR', async () => {
    const { locale } = await render('pt-BR', 'pt-BR');
    expect(locale.code).toBe('pt-BR');
  });
});
