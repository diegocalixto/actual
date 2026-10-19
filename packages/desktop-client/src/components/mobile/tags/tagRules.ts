/**
 * The rules the desktop Tags table applies before creating a tag
 * (`components/tags/TagCreationRow.tsx`), kept in one place so the phone
 * form accepts and refuses exactly the same input.
 */

/** Any character except whitespace and `#`. */
const TAG_NAME_PATTERN = /^[^#\s]+$/;
/** A six-digit hex colour, the only form the tag colour is stored in. */
const TAG_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

/** Whitespace is never part of a tag; the desktop strips it as you type. */
export function stripTagWhitespace(value: string) {
  return value.replace(/\s/g, '');
}

export function isValidTagColor(color: string | null) {
  return color === null || TAG_COLOR_PATTERN.test(color);
}

export type TagNameProblem = 'empty' | 'invalid' | 'duplicate';

export function getTagNameProblem(
  name: string,
  existingNames: readonly string[],
): TagNameProblem | null {
  if (name === '') {
    return 'empty';
  }
  if (!TAG_NAME_PATTERN.test(name)) {
    return 'invalid';
  }
  if (existingNames.includes(name)) {
    return 'duplicate';
  }
  return null;
}

/**
 * The filter the desktop "View Transactions" button sends to the
 * transactions register (`components/tags/TagRow.tsx`).
 */
export function getTagTransactionsFilter(tagName: string) {
  return [
    {
      field: 'notes',
      op: 'hasTags',
      value: `#${tagName}`,
      type: 'string',
    },
  ];
}
