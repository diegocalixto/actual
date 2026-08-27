import type { CategoryHue } from '#components/v2lab/reports/ReportsView';

/**
 * Presentation identity for categories the data model does not describe
 * visually.
 *
 * `CategoryEntity` carries no colour, so the hue comes from its id: stable
 * across renders, identical wherever that category appears, and never a claim
 * about what the category is.
 */
const HUES: CategoryHue[] = [
  'blue',
  'green',
  'amber',
  'coral',
  'rose',
  'violet',
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

export function hueForId(id: string): CategoryHue {
  return HUES[hashId(id) % HUES.length];
}
