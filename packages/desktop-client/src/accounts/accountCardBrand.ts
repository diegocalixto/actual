/**
 * Which card a thumbnail draws for an account, read from the account's name.
 *
 * Presentation only: Actual stores no issuer for an account, so the name is
 * the one hint there is. The matcher is deliberately narrow — an account it
 * does not recognise keeps the generic glyph, and a wrong card is worse than
 * no card at all.
 */
export type AccountCardBrand = 'itau-personnalite' | 'itau' | 'nubank';

/**
 * Lowercase, accents stripped, every run of non-letters and non-digits
 * collapsed into one space: "  ITAÚ   Personnalité-Crédito " becomes
 * "itau personnalite credito".
 */
export function normalizeAccountName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/**
 * Words that, beside a standalone "nu", say the name is about a bank account
 * rather than something else that happens to be called "Nu" ("Nu Skin").
 */
const NU_ACCOUNT_WORDS = new Set([
  'conta',
  'cartao',
  'credito',
  'debito',
  'card',
  'credit',
  'debit',
  'account',
  'invest',
  'roxinho',
  'ultravioleta',
]);

function isNubank(words: string[]): boolean {
  if (words.some(word => word.startsWith('nubank'))) {
    return true;
  }
  // Nubank's own product names, written as one word.
  if (words.some(word => word === 'nuconta' || word === 'nuinvest')) {
    return true;
  }
  if (!words.includes('nu')) {
    return false;
  }
  // "Nu" alone is the bank; "Nu" beside an account word is too. "Nu" beside
  // anything else is not claimed.
  return words.length === 1 || words.some(word => NU_ACCOUNT_WORDS.has(word));
}

/**
 * Personnalité wins over plain Itaú — it is the Itaú segment, so a name with
 * both ("Itaú Personnalité Crédito") is the Personnalité card. "Personnalité"
 * alone is enough: the word belongs to no other bank. A one-letter slip
 * ("Personalité") is still recognised.
 */
export function cardBrandForAccount(name: string): AccountCardBrand | null {
  const words = normalizeAccountName(name).split(' ').filter(Boolean);

  if (words.some(word => /^personn?alite/.test(word))) {
    return 'itau-personnalite';
  }
  if (words.some(word => word.startsWith('itau'))) {
    return 'itau';
  }
  if (isNubank(words)) {
    return 'nubank';
  }
  return null;
}
