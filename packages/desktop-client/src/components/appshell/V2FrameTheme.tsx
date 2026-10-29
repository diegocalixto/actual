import React, { useEffect, useLayoutEffect, useState } from 'react';
import { useLocation } from 'react-router';

import darkThemeCss from '@actual-app/components/themes/dark.css?inline';

import { useTheme } from '#style/theme';

/** The pages that are dark whatever the theme: the V2 screens. */
const ALWAYS_DARK_PAGES = new Set([
  '/home',
  '/budget',
  '/accounts',
  '/reports',
]);

/** Set on `<html>` while one of those pages is shown under a light theme. */
const FRAME_CLASS = 'df-v2-dark-frame';

/**
 * The fork's dark theme, scoped to the root while it carries the class. One
 * class over `:root` outranks the plain `:root` every theme is written to, so
 * nothing has to be loaded in a particular order.
 */
const FRAME_CSS = darkThemeCss.replaceAll(':root', `:root.${FRAME_CLASS}`);

function usePrefersDark() {
  const [prefersDark, setPrefersDark] = useState(
    () => window.matchMedia('(prefers-color-scheme: dark)').matches,
  );

  useEffect(() => {
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (event: MediaQueryListEvent) =>
      setPrefersDark(event.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  return prefersDark;
}

/**
 * The frame around a V2 page takes the page's own appearance.
 *
 * Início, Orçamento, Contas and Relatórios are drawn dark in every theme. Under
 * a light theme — chosen, or "Automático" on a device set to light — the frame
 * around them stayed light: a white bar under a dark page on the phone, a white
 * menu over it, a white rail and header around it on the desktop. While one of
 * those pages is shown, the whole screen — frame, menus, sheets — takes the
 * fork's dark theme instead.
 *
 * Every other screen keeps following the saved preference, which this never
 * changes: a light theme still gives light registers, settings and forms. Under
 * a dark theme nothing here applies; the frame is already dark.
 */
export function V2FrameTheme() {
  const location = useLocation();
  const [theme] = useTheme();
  const prefersDark = usePrefersDark();

  const isDark =
    theme === 'dark' ||
    theme === 'midnight' ||
    (theme === 'auto' && prefersDark);
  const isActive = ALWAYS_DARK_PAGES.has(location.pathname) && !isDark;

  useLayoutEffect(() => {
    document.documentElement.classList.toggle(FRAME_CLASS, isActive);
    return () => document.documentElement.classList.remove(FRAME_CLASS);
  }, [isActive]);

  return <style>{FRAME_CSS}</style>;
}
