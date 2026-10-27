import { categoryHueVar } from '#components/v2lab/categoryHue';

/**
 * Tile colours for the category lists.
 *
 * A category's own hue, from the definition every screen shares — so a
 * category is the same colour in this list as on Início and Relatórios —
 * rather than a rotation by position, which gave one category a different
 * colour whenever the list above it changed. The shared palette leaves amber
 * out, so the one colour that means something on this screen stays the
 * alerts'.
 */
export function hueForCategoryRow(categoryId: string): string {
  return categoryHueVar(categoryId);
}
