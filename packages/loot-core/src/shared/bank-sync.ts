/**
 * The mark a bank sync leaves on an entry it added next to an existing one of
 * the same amount and date that the provider had identified under another id
 * and did not deliver again. The two may be one entry re-identified, or two
 * distinct ones; the sync cannot tell, so it keeps both and says so.
 */
export const BANK_SYNC_DOUBT_TAG = '#conferir-duplicata';

export function withBankSyncDoubtTag(notes: string | null | undefined): string {
  if (notes && notes.includes(BANK_SYNC_DOUBT_TAG)) return notes;
  return notes ? `${notes} ${BANK_SYNC_DOUBT_TAG}` : BANK_SYNC_DOUBT_TAG;
}
