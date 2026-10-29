import { UNCATEGORIZED_ID } from '@actual-app/core/shared/month-indicators';

/**
 * The colour a category is drawn in — one definition for every screen.
 *
 * `CategoryEntity` stores no colour, so it is derived from the category's id:
 * stable across reloads, and the same on Início, Orçamento and Relatórios, on
 * the desktop and on the phone. Each screen used to hash the id into a palette
 * of its own, so one category came out orange on one screen and blue on the
 * next.
 *
 * The palette leaves out every hue that already means something here. Green,
 * coral and blue are the money's own colours — receitas, gastos and resultado
 * in the indicators and in the charts — and amber is the colour of what needs
 * attention; a category painted in any of them would read as one of those
 * things. What is left is violet, cyan and rose, from the ramp the screens
 * already share. Three hues repeat across a long list, so a category is never
 * identified by its colour alone: the name is always printed, and the glyph
 * comes from the name.
 *
 * "Sem categoria" is not a category, and is drawn in the neutral grey.
 */
export const CATEGORY_HUES = ['violet', 'cyan', 'rose'] as const;

export type CategoryHueName = (typeof CATEGORY_HUES)[number] | 'neutral';

/**
 * The same hues as literals, for SVG paint that cannot resolve a CSS variable.
 * They are the values of `--dfl-hue-*` in `labTokens.ts`.
 */
export const CATEGORY_HUE_HEX: Record<CategoryHueName, string> = {
  violet: '#9b7bff',
  cyan: '#3fd0dc',
  rose: '#f2648c',
  neutral: '#8d9bb0',
};

/** FNV-1a. Small, stable, and not trying to be a cryptographic hash. */
function hashId(id: string): number {
  let hash = 2166136261;

  for (let index = 0; index < id.length; index++) {
    hash ^= id.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

/** The hue for a category id; the neutral grey for no category at all. */
export function hueForCategory(
  categoryId: string | null | undefined,
): CategoryHueName {
  if (!categoryId || categoryId === UNCATEGORIZED_ID) {
    return 'neutral';
  }
  return CATEGORY_HUES[hashId(categoryId) % CATEGORY_HUES.length];
}

/** The hue as the CSS variable the V2 scopes declare. */
export function categoryHueVar(categoryId: string | null | undefined): string {
  return `var(--dfl-hue-${hueForCategory(categoryId)})`;
}
