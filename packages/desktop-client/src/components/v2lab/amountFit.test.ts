import { amountWidthInEm, fittedFontSize } from './amountFit';

describe('amountWidthInEm', () => {
  it('counts every digit and the minus at one width', () => {
    expect(amountWidthInEm('0')).toBeCloseTo(0.65);
    expect(amountWidthInEm('1234567890')).toBeCloseTo(6.5);
    expect(amountWidthInEm('-1')).toBeCloseTo(1.3);
  });

  it('counts points, commas and spaces as the narrow characters they are', () => {
    // Nine digits and three separators, as measured on the app's face.
    expect(amountWidthInEm('1.234.567,89')).toBeCloseTo(6.66);
    expect(amountWidthInEm('-R$ 1.234.567,89')).toBeCloseTo(8.9, 1);
  });

  it('grows with the amount, which is the whole point', () => {
    expect(amountWidthInEm('R$ 1.234.567,89')).toBeGreaterThan(
      amountWidthInEm('R$ 9.850,00'),
    );
  });
});

describe('fittedFontSize', () => {
  const tile = {
    designSize: '14px',
    room: '100cqi',
    floor: '9px',
  };

  it('never asks for more than the size the design draws', () => {
    expect(fittedFontSize({ ...tile, figures: ['R$ 9.850,00'] })).toBe(
      'max(9px, min(14px, calc((100cqi) / 6.03)))',
    );
  });

  it('sizes a row of figures by the widest of them', () => {
    const alone = fittedFontSize({ ...tile, figures: ['-R$ 2.345.398,90'] });

    expect(
      fittedFontSize({
        ...tile,
        figures: ['R$ 135,00', '-R$ 2.345.398,90', 'R$ 280,00'],
      }),
    ).toBe(alone);
  });

  it('leaves the design size alone while nothing has arrived', () => {
    expect(fittedFontSize({ ...tile, figures: [null, null] })).toBe('14px');
    expect(fittedFontSize({ ...tile, figures: [] })).toBe('14px');
  });

  it('counts tight tracking as room given back, a step per character', () => {
    // Eleven characters at -1px each.
    expect(
      fittedFontSize({ ...tile, letterSpacing: -1, figures: ['R$ 9.850,00'] }),
    ).toBe('max(9px, min(14px, calc((100cqi - -11px) / 6.03)))');
  });

  it('ignores a figure that is still loading beside one that is not', () => {
    expect(fittedFontSize({ ...tile, figures: [null, 'R$ 9.850,00'] })).toBe(
      fittedFontSize({ ...tile, figures: ['R$ 9.850,00'] }),
    );
  });
});
