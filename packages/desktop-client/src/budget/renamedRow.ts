/**
 * The row a rename writes back, or `null` when there is nothing to write.
 *
 * It only changes `name`: the id, the group and every other field go back
 * exactly as they came, so a transaction filed under the category keeps it —
 * transactions point at the id, never at the name.
 *
 * The row is the one the screen shows, so a category the file shipped with
 * arrives here under its translation. Typing that same translation back is no
 * change at all, and returns `null`; any other name is the person's own and is
 * kept. Turning the shown row back into the stored one is the update mutation's
 * job (`withStoredStarterCategoryName`), not this function's.
 */
export function renamedRow<T extends { name: string }>(
  row: T,
  typed: string,
): T | null {
  const name = typed.trim();

  if (name === '' || name === row.name) {
    return null;
  }

  return { ...row, name };
}
