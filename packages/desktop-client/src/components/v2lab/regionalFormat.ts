/**
 * How the V2 pages write money: the separators, the decimals and the symbol.
 *
 * These pages were drawn in pt-BR with `R$`, and that is still what they print
 * for a budget file that states nothing else. A file that does state it is
 * obeyed: the number format chosen under Settings → Formatting decides the
 * separators, and the default currency decides the symbol and how many decimal
 * places an amount carries. A page that kept printing `R$ 1.234,56` over a
 * file kept in euros, or in yen, would be showing the wrong money.
 *
 * Nothing here computes a financial figure. Amounts arrive as the integer
 * minor units the application stores and leave as text; the separators come
 * from the application's own `getNumberFormat`, and the currency from its own
 * table.
 *
 * The formatters stay plain functions — they are called from some forty places
 * that have no business knowing where a preference lives — and read the
 * preferences each time they are called, from a source the application points
 * at its store once (`bindRegionalFormatToStore`). Nothing is written while a
 * page renders, so what is printed never depends on which render ran last.
 */
import { getCurrency } from '@actual-app/core/shared/currencies';
import { getNumberFormat, numberFormats } from '@actual-app/core/shared/util';
import type { NumberFormats } from '@actual-app/core/shared/util';

/** What the pages print for a file that states no preference. */
const FALLBACK: RegionalFormat = {
  numberFormat: 'dot-comma',
  symbol: 'R$',
  decimalPlaces: 2,
};

export type RegionalPrefs = {
  /** The `numberFormat` synced preference, as stored. */
  numberFormat?: string | null;
  /** The `defaultCurrencyCode` synced preference, as stored. */
  currencyCode?: string | null;
};

type RegionalFormat = {
  numberFormat: NumberFormats;
  symbol: string;
  decimalPlaces: number;
};

/**
 * Where the preferences are read from. Unbound — a test, a story — it yields
 * none, and the pages print their fallback.
 */
let readPrefs: () => RegionalPrefs = () => ({});

/** Points the formatters at the preferences of the open file. */
export function setRegionalPrefsSource(source: () => RegionalPrefs): void {
  readPrefs = source;
}

function isNumberFormat(value: string): value is NumberFormats {
  return numberFormats.some(format => format.value === value);
}

/**
 * What a set of preferences comes to.
 *
 * A preference that is absent, empty or not one the application knows falls
 * back on its own: a file can name a currency and leave the separators alone.
 */
function resolve({
  numberFormat,
  currencyCode,
}: RegionalPrefs): RegionalFormat {
  const currency = currencyCode ? getCurrency(currencyCode) : null;
  const hasCurrency = currency !== null && currency.code !== '';

  return {
    numberFormat:
      numberFormat && isNumberFormat(numberFormat)
        ? numberFormat
        : FALLBACK.numberFormat,
    symbol: hasCurrency ? currency.symbol : FALLBACK.symbol,
    decimalPlaces: hasCurrency
      ? currency.decimalPlaces
      : FALLBACK.decimalPlaces,
  };
}

/** The last preferences read, and what they came to: resolving is not free. */
let resolved: { prefs: RegionalPrefs; format: RegionalFormat } | null = null;

function current(): RegionalFormat {
  const { numberFormat, currencyCode } = readPrefs();

  if (
    resolved === null ||
    resolved.prefs.numberFormat !== numberFormat ||
    resolved.prefs.currencyCode !== currencyCode
  ) {
    resolved = {
      prefs: { numberFormat, currencyCode },
      format: resolve({ numberFormat, currencyCode }),
    };
  }

  return resolved.format;
}

/**
 * A signature of what a set of preferences comes to, which changes exactly
 * when a printed amount would.
 */
export function regionalSignature(prefs: RegionalPrefs): string {
  const format = resolve(prefs);

  return `${format.numberFormat}|${format.symbol}|${format.decimalPlaces}`;
}

/** The symbol amounts are printed with: "R$", unless the file names another. */
export function currencySymbol(): string {
  return current().symbol;
}

type Separators = { thousandsSeparator: string; decimalSeparator: string };

const separators = new Map<NumberFormats, Separators>();

/** The marks of the current number format, looked up once per format. */
function currentSeparators(): Separators {
  const { numberFormat } = current();
  let marks = separators.get(numberFormat);

  if (!marks) {
    const { thousandsSeparator, decimalSeparator } = getNumberFormat({
      format: numberFormat,
    });
    marks = { thousandsSeparator, decimalSeparator };
    separators.set(numberFormat, marks);
  }

  return marks;
}

/** The mark between units and cents: "," in pt-BR. */
export function decimalSeparator(): string {
  return currentSeparators().decimalSeparator;
}

/** Minor units as the amount they stand for: 123456 is 1234.56 in reais. */
export function toMajorUnits(minorUnits: number): number {
  return minorUnits / 10 ** current().decimalPlaces;
}

const formatters = new Map<string, { format: (value: number) => string }>();

function formatterFor(fractionDigits: number) {
  const key = `${current().numberFormat}|${fractionDigits}`;
  let formatter = formatters.get(key);

  if (!formatter) {
    formatter = getNumberFormat({
      format: current().numberFormat,
      decimalPlaces: fractionDigits,
    }).formatter;
    formatters.set(key, formatter);
  }

  return formatter;
}

/** Minor units as digits, to the currency's own precision: "1.234,56". */
export function formatDigits(minorUnits: number): string {
  return formatterFor(current().decimalPlaces).format(toMajorUnits(minorUnits));
}

/**
 * A plain number with at most this many decimals: "3.750", "12,5".
 *
 * For what is derived from amounts rather than being one — an axis tick in
 * thousands, the whole units inside a ring. Trailing zeros are dropped, so a
 * tick at a round value is not printed as "4,0".
 */
export function formatNumber(
  value: number,
  maximumFractionDigits: number,
): string {
  const text = formatterFor(maximumFractionDigits).format(value);
  const mark = decimalSeparator();
  const markAt = maximumFractionDigits > 0 ? text.lastIndexOf(mark) : -1;

  if (markAt === -1) {
    return text;
  }

  const whole = text.slice(0, markAt);
  const fraction = text.slice(markAt + 1).replace(/0+$/, '');

  return fraction === '' ? whole : `${whole}${mark}${fraction}`;
}

/**
 * A percentage's digits: "57,0", "4,16".
 *
 * Only the decimal mark follows the file. The digits are not grouped, which is
 * how these pages have always written a share and what keeps a four-digit
 * change the width the layout expects.
 */
export function formatDecimal(value: number, fractionDigits: number): string {
  return value.toFixed(fractionDigits).replace('.', decimalSeparator());
}

/**
 * What a person typed into a money field, as minor units — `null` when it is
 * not a number.
 *
 * It reads the same convention the field shows its value in: the grouping mark
 * is dropped wherever it appears and the decimal mark is the only one that
 * counts, so "1.234,56" and "1234,56" are the same amount in pt-BR.
 */
export function parseDigits(text: string): number | null {
  const { thousandsSeparator } = currentSeparators();

  let digits = text
    .replace(/\s/g, '')
    .split(current().symbol)
    .join('')
    .split(thousandsSeparator)
    .join('');

  if (current().numberFormat === 'apostrophe-dot') {
    // An apostrophe is typed straight; the format prints the curly one.
    digits = digits.replace(/'/g, '');
  }

  const parsed = Number(digits.replace(decimalSeparator(), '.'));

  return Number.isFinite(parsed)
    ? Math.round(parsed * 10 ** current().decimalPlaces)
    : null;
}
