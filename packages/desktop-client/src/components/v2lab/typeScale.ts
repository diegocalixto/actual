/**
 * The type steps of the V2 screens on a phone.
 *
 * Measured before this module, the Início alone set its words at eighteen
 * sizes, from 9.5px to 36px, several of them half a pixel apart, and the
 * Orçamento put forty-odd of them under 11px — below the smallest size iOS
 * itself sets text at. Words that name, caption or explain a figure now use
 * one of these four steps. The figures keep the sizes their cards fit them
 * to, and the hero keeps its own: those are measured against the room they
 * have, not chosen from a scale.
 */
export const MOBILE_TYPE = {
  /** A caption under a figure — "Saldo", "Orçado". The floor. */
  caption: 11,
  /** The label of a figure, a section's heading, a legend. */
  label: 12,
  /** A secondary line: a detail, a note, an explanation. */
  note: 13,
  /** A row's title. */
  row: 15,
} as const;
