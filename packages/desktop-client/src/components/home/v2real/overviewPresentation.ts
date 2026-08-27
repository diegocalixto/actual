/**
 * Presentation identity for entities the data model does not describe visually.
 *
 * `CategoryEntity` and `AccountEntity` carry no colour and no icon — verified
 * against the models, not assumed. So the hue is derived from the entity's id:
 * stable across renders and reloads, identical wherever the same id appears, and
 * never a claim about what the entity *is*. Guessing a semantic icon from a
 * name would be exactly that claim, so accounts and categories get a generic
 * glyph instead.
 */

/** The laboratory's accent ramp, in a fixed order so the mapping is stable. */
export const OVERVIEW_HUES = [
  'blue',
  'green',
  'teal',
  'violet',
  'amber',
  'cyan',
  'rose',
  'crimson',
] as const;

export type OverviewHue = (typeof OVERVIEW_HUES)[number];

/** FNV-1a. Small, stable, and not trying to be a cryptographic hash. */
function hashId(id: string): number {
  let hash = 2166136261;

  for (let index = 0; index < id.length; index++) {
    hash ^= id.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

export function hueForId(id: string): OverviewHue {
  return OVERVIEW_HUES[hashId(id) % OVERVIEW_HUES.length];
}
