import type { CSSProperties } from '@actual-app/components/styles';
import { theme } from '@actual-app/components/theme';

/**
 * Diego Finance V2 design tokens.
 *
 * These live outside `component-library`'s global themes on purpose: promoting
 * them would restyle every screen at once, and only the shell and the Home have
 * been designed against them so far. The rest of the app keeps the global
 * tokens and therefore keeps working unchanged inside the new frame.
 *
 * Everything is a `color-mix()` over tokens the active theme already defines —
 * the technique the V1 sidebar already used. One declaration then works in
 * every theme: surfaces lift away from whatever the page background is, and the
 * accent leans towards whatever the text colour is. The dark themes get the
 * intended blue-on-near-black; the light theme degrades to a pale blue-on-white
 * instead of breaking.
 */

/**
 * The V2 accent. `pageTextPositive` and `buttonPrimaryBackground` were
 * re-pointed at the violet ramp in `dark.css`, so following the semantic tokens
 * keeps the shell, the pages and every stock control on one accent instead of
 * two competing ones.
 */
const ACCENT = theme.pageTextPositive;
const ACCENT_BOLD = theme.buttonPrimaryBackground;

/**
 * `color-mix(…, transparent)` resolves to the first colour at the given alpha,
 * which is what a hairline over an unknown surface needs.
 */
function alpha(color: string, percent: number) {
  return `color-mix(in srgb, ${color} ${percent}%, transparent)`;
}

/** Lifts a surface towards the page's own ink — works in every theme. */
function lift(percent: number, base: string = theme.cardBackground) {
  return `color-mix(in srgb, ${theme.pageText} ${percent}%, ${base})`;
}

export const shellColors = {
  /** The deepest plane: everything else sits on it. */
  canvas: theme.pageBackground,
  /**
   * The navigation plane. In the reference the nav sits on essentially the same
   * plane as the cards, separated by a hairline rather than by contrast.
   */
  rail: theme.cardBackground,
  railBorder: alpha(theme.pageText, 8),

  /** Panel surface: a few levels above the canvas, never a bright slab. */
  surface: theme.cardBackground,
  /** One step up: the hero, and tiles sitting on top of a panel. */
  surfaceElevated: lift(4),
  /** Recessed strip: progress tracks, icon chips, inline badges. */
  surfaceSunken: alpha(theme.pageText, 7),
  surfaceHover: lift(6),

  border: alpha(theme.pageText, 9),
  borderStrong: alpha(theme.pageText, 16),

  textPrimary: theme.pageText,
  textSecondary: theme.pageTextLight,
  textMuted: theme.pageTextSubdued,

  /** Text and icon accent. */
  accent: ACCENT,
  /** Filled accent — bars, active chips, the primary action. */
  accentBold: ACCENT_BOLD,
  accentSoft: alpha(ACCENT_BOLD, 16),
  /** Secondary data hue, for a second series in a chart. Never chrome. */
  accentSecondary: 'var(--color-chartQual2)',
  /** One diagonal sweep, used only for identity marks and the mobile action. */
  brandGradient: `linear-gradient(135deg, ${ACCENT_BOLD} 0%, ${ACCENT} 115%)`,

  positive: theme.numberPositive,
  negative: theme.numberNegative,
  neutral: theme.pageTextSubdued,
} as const;

export const shellRadius = {
  card: 18,
  tile: 14,
  chip: 10,
  pill: 999,
} as const;

export const shellLayout = {
  /** Desktop navigation rail. Wide enough for an icon and a micro-label. */
  railWidth: 88,
  /** Desktop header. */
  headerHeight: 64,
  /** Content is centred and capped so a 1440 screen does not stretch cards. */
  maxContentWidth: 1180,
  gutter: 16,
  desktopGutter: 28,
  stackGap: 18,
  desktopStackGap: 20,
  /** iOS Human Interface Guidelines minimum tappable size. */
  touchTarget: 48,
} as const;

/**
 * Kept shallow on purpose: a dark interface reads as layered through contrast,
 * not through drop shadows. This is only enough to detach a card from the page.
 */
export const shellShadow =
  '0 1px 2px rgba(0, 0, 0, 0.25), 0 14px 30px -20px rgba(0, 0, 0, 0.7)';

/** Small-caps label used above sections and inside tiles. */
export const shellEyebrowStyle: CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  // Tight enough that a three-word uppercase label such as "Monthly net" still
  // fits one line inside a third of a 375px screen.
  letterSpacing: 0.7,
  lineHeight: 1.25,
  textTransform: 'uppercase',
  color: shellColors.textMuted,
};

/**
 * Actual stores outflows as negative integers, so the sign alone picks the
 * tone. Zero stays neutral to keep the dashboard calm.
 */
export function amountColor(amount: number | null): string {
  if (amount === null) {
    return shellColors.textMuted;
  }
  if (amount > 0) {
    return shellColors.positive;
  }
  if (amount < 0) {
    return shellColors.negative;
  }
  return shellColors.neutral;
}
