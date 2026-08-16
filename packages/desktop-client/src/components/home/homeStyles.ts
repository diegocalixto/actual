import type { CSSProperties } from '@actual-app/components/styles';
import { theme } from '@actual-app/components/theme';

/**
 * Layout constants for the personal Home dashboard. Kept in one place so the
 * look can be retuned — or swapped for a dedicated theme — without touching
 * the individual sections.
 */
export const homeLayout = {
  /** Keeps the dashboard readable on wide screens without stretching cards. */
  maxContentWidth: 760,
  cardRadius: 20,
  tileRadius: 14,
  gutter: 16,
  sectionGap: 26,
  /** iOS Human Interface Guidelines minimum tappable size. */
  touchTarget: 48,
} as const;

export const homeCardStyle: CSSProperties = {
  backgroundColor: theme.cardBackground,
  border: `1px solid ${theme.tableBorder}`,
  borderRadius: homeLayout.cardRadius,
  overflow: 'hidden',
};

export const homeSectionTitleStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  letterSpacing: 0.8,
  textTransform: 'uppercase',
  color: theme.pageTextLight,
};

export const homeLabelStyle: CSSProperties = {
  fontSize: 13,
  fontWeight: 500,
  color: theme.pageTextLight,
};

export const homeTitleStyle: CSSProperties = {
  fontSize: 16,
  fontWeight: 600,
  color: theme.pageText,
};

/**
 * Actual stores outflows as negative integers, so the sign alone picks the
 * tone. Zero stays neutral to keep the dashboard calm.
 */
export function homeAmountColor(amount: number): string {
  if (amount > 0) {
    return theme.numberPositive;
  }
  if (amount < 0) {
    return theme.numberNegative;
  }
  return theme.pageTextLight;
}
