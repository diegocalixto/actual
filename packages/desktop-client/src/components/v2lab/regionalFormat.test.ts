import {
  currencySymbol,
  decimalSeparator,
  formatDecimal,
  formatDigits,
  formatNumber,
  parseDigits,
  regionalSignature,
  setRegionalPrefsSource,
  toMajorUnits,
} from './regionalFormat';
import type { RegionalPrefs } from './regionalFormat';

// The narrow no-break space the application groups thousands with.
const NNBSP = '\u202F';

/** Stands in for the store: the file's preferences, as they are stored. */
function givenPrefs(prefs: RegionalPrefs) {
  setRegionalPrefsSource(() => prefs);
}

describe('regional format of the V2 pages', () => {
  afterEach(() => {
    givenPrefs({});
  });

  describe('a file that states no preference', () => {
    it('prints pt-BR separators and the real symbol', () => {
      givenPrefs({});

      expect(currencySymbol()).toBe('R$');
      expect(decimalSeparator()).toBe(',');
      expect(formatDigits(123456)).toBe('1.234,56');
      expect(formatDigits(-123456789)).toBe('-1.234.567,89');
      expect(formatDigits(0)).toBe('0,00');
    });

    it('treats an empty or unknown preference as absent', () => {
      givenPrefs({ numberFormat: '', currencyCode: '' });
      expect(formatDigits(123456)).toBe('1.234,56');
      expect(currencySymbol()).toBe('R$');

      givenPrefs({ numberFormat: 'roman', currencyCode: 'XXX' });
      expect(formatDigits(123456)).toBe('1.234,56');
      expect(currencySymbol()).toBe('R$');

      givenPrefs({ numberFormat: null, currencyCode: null });
      expect(formatDigits(123456)).toBe('1.234,56');
      expect(currencySymbol()).toBe('R$');
    });
  });

  describe('a file that chose a number format', () => {
    it.each([
      ['comma-dot', '1,234,567.89', '.'],
      ['dot-comma', '1.234.567,89', ','],
      ['space-comma', `1${NNBSP}234${NNBSP}567,89`, ','],
      ['apostrophe-dot', '1\u2019234\u2019567.89', '.'],
      ['comma-dot-in', '12,34,567.89', '.'],
    ])('writes %s as the application does', (numberFormat, text, mark) => {
      givenPrefs({ numberFormat });

      expect(formatDigits(123456789)).toBe(text);
      expect(decimalSeparator()).toBe(mark);
      // The symbol is a separate preference and keeps its fallback.
      expect(currencySymbol()).toBe('R$');
    });
  });

  describe('a file that chose a currency', () => {
    it('prints its symbol in place of the real', () => {
      givenPrefs({ currencyCode: 'EUR' });
      expect(currencySymbol()).toBe('€');
      // The separators are a separate preference and keep their fallback.
      expect(formatDigits(123456)).toBe('1.234,56');

      givenPrefs({ currencyCode: 'USD', numberFormat: 'comma-dot' });
      expect(currencySymbol()).toBe('$');
      expect(formatDigits(123456)).toBe('1,234.56');

      givenPrefs({ currencyCode: 'BRL' });
      expect(currencySymbol()).toBe('R$');
    });

    it('carries the decimal places the currency has', () => {
      givenPrefs({ currencyCode: 'JPY' });

      // The yen has no minor unit: 1234 stored is ¥ 1.234, not ¥ 12,34.
      expect(toMajorUnits(1234)).toBe(1234);
      expect(formatDigits(1234)).toBe('1.234');
      expect(parseDigits('1.234')).toBe(1234);
    });
  });

  describe('the signature', () => {
    it('changes exactly when a printed amount would', () => {
      const fallback = regionalSignature({});

      expect(regionalSignature({ numberFormat: '' })).toBe(fallback);
      expect(regionalSignature({ numberFormat: 'dot-comma' })).toBe(fallback);
      expect(regionalSignature({ currencyCode: 'BRL' })).toBe(fallback);

      expect(regionalSignature({ numberFormat: 'comma-dot' })).not.toBe(
        fallback,
      );
      expect(regionalSignature({ currencyCode: 'EUR' })).not.toBe(fallback);
      expect(regionalSignature({ currencyCode: 'JPY' })).not.toBe(fallback);
    });

    it('does not touch what the formatters print', () => {
      regionalSignature({ numberFormat: 'comma-dot', currencyCode: 'EUR' });

      expect(formatDigits(123456)).toBe('1.234,56');
      expect(currencySymbol()).toBe('R$');
    });
  });

  describe('the source of the preferences', () => {
    it('is read at every call, so a change needs no announcement', () => {
      const prefs: RegionalPrefs = {};
      setRegionalPrefsSource(() => prefs);

      expect(formatDigits(123456)).toBe('1.234,56');

      prefs.numberFormat = 'comma-dot';
      prefs.currencyCode = 'USD';
      expect(formatDigits(123456)).toBe('1,234.56');
      expect(currencySymbol()).toBe('$');

      prefs.numberFormat = undefined;
      prefs.currencyCode = undefined;
      expect(formatDigits(123456)).toBe('1.234,56');
      expect(currencySymbol()).toBe('R$');
    });
  });

  describe('formatNumber', () => {
    it('drops the decimals a round value does not need', () => {
      expect(formatNumber(3750, 2)).toBe('3.750');
      expect(formatNumber(12.5, 1)).toBe('12,5');
      expect(formatNumber(12.25, 2)).toBe('12,25');
      expect(formatNumber(12.5, 2)).toBe('12,5');
      expect(formatNumber(4, 1)).toBe('4');
      expect(formatNumber(2104.24, 0)).toBe('2.104');
    });

    it('follows the chosen format', () => {
      givenPrefs({ numberFormat: 'comma-dot' });

      expect(formatNumber(3750, 2)).toBe('3,750');
      expect(formatNumber(12.5, 1)).toBe('12.5');
    });
  });

  describe('formatDecimal', () => {
    it('keeps every decimal and does not group the digits', () => {
      expect(formatDecimal(57, 1)).toBe('57,0');
      expect(formatDecimal(4.156, 2)).toBe('4,16');
      expect(formatDecimal(2876.14, 1)).toBe('2876,1');
      expect(formatDecimal(-18.84, 1)).toBe('-18,8');
    });

    it('follows the chosen decimal mark', () => {
      givenPrefs({ numberFormat: 'comma-dot' });

      expect(formatDecimal(57, 1)).toBe('57.0');
    });
  });

  describe('parseDigits', () => {
    it('reads what the field shows, with or without grouping and symbol', () => {
      expect(parseDigits('1.234,56')).toBe(123456);
      expect(parseDigits('1234,56')).toBe(123456);
      expect(parseDigits('R$ 1.234,56')).toBe(123456);
      expect(parseDigits('1.234.567,89')).toBe(123456789);
      expect(parseDigits('400')).toBe(40000);
      expect(parseDigits('0,5')).toBe(50);
      expect(parseDigits('-12,30')).toBe(-1230);
    });

    it('takes an emptied field as zero and refuses what is not a number', () => {
      expect(parseDigits('')).toBe(0);
      expect(parseDigits('  ')).toBe(0);
      expect(parseDigits('abc')).toBeNull();
      expect(parseDigits('1,2,3')).toBeNull();
    });

    it.each([
      ['comma-dot', '1,234.56'],
      ['space-comma', `1${NNBSP}234,56`],
      ['space-comma', '1 234,56'],
      ['apostrophe-dot', '1\u2019234.56'],
      ['apostrophe-dot', "1'234.56"],
      ['comma-dot-in', '1,234.56'],
    ])('reads %s as it is written: %s', (numberFormat, text) => {
      givenPrefs({ numberFormat });

      expect(parseDigits(text)).toBe(123456);
    });

    it.each([
      'comma-dot',
      'dot-comma',
      'space-comma',
      'apostrophe-dot',
      'comma-dot-in',
    ])('reads back what %s printed', numberFormat => {
      givenPrefs({ numberFormat });

      for (const amount of [0, 5, 99, 100, 123456, 123456789, -4250]) {
        expect(parseDigits(formatDigits(amount))).toBe(amount);
      }
    });
  });
});
