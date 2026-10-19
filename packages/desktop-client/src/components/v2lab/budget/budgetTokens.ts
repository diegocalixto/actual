/**
 * Colour map for the Budget laboratory.
 *
 * Reuses the `--dfl-hue-*` ramp the approved Overview already defines under
 * `.df-v2lab` — the Budget route shares that class, so nothing new is injected
 * and the Overview's tokens are not modified. Two hues the Overview never
 * needed are declared here as literals rather than added to the shared ramp,
 * so this folder stays additive.
 */
export type BudgetHue =
  | 'green'
  | 'amber'
  | 'blue'
  | 'violet'
  | 'rose'
  | 'cyan'
  | 'yellow'
  | 'neutral';

export const BUDGET_HUE: Record<BudgetHue, string> = {
  green: 'var(--dfl-hue-green)',
  amber: 'var(--dfl-hue-amber)',
  blue: 'var(--dfl-hue-blue)',
  violet: 'var(--dfl-hue-violet)',
  rose: 'var(--dfl-hue-rose)',
  cyan: 'var(--dfl-hue-cyan)',
  yellow: '#e3c04a',
  neutral: '#8d9bb0',
};
