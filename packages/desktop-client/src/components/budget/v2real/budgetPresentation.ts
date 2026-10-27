/**
 * Presentation identity for entities the data model does not describe visually.
 *
 * `CategoryEntity` carries no colour and no icon — checked against the model,
 * not assumed. The hue is therefore derived from the category's id: stable
 * across renders and reloads, identical wherever that category appears, and
 * never a claim about what the category *is*. Guessing a semantic icon from a
 * name would be exactly that claim, so every envelope gets a neutral glyph.
 */
import type { BudgetHue } from '#components/v2lab/budget/BudgetView';
import { hueForCategory } from '#components/v2lab/categoryHue';

/**
 * The Budget's name for the shared definition: the same category is the same
 * colour here as on Início and Relatórios, and no category is grey.
 */
export function hueForId(id: string | null | undefined): BudgetHue {
  return hueForCategory(id);
}
