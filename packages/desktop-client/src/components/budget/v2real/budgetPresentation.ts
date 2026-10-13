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

const HUES: BudgetHue[] = [
  'green',
  'blue',
  'amber',
  'violet',
  'rose',
  'cyan',
  'yellow',
  'neutral',
];

/** FNV-1a. Small, stable, not trying to be a cryptographic hash. */
function hashId(id: string): number {
  let hash = 2166136261;

  for (let index = 0; index < id.length; index++) {
    hash ^= id.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

export function hueForId(id: string): BudgetHue {
  return HUES[hashId(id) % HUES.length];
}
