import {
  canStepBack,
  canStepForward,
  periodMenuMonths,
  resolveReportsMonth,
} from './reportsPeriod';

const BOUNDS = { earliest: '2016-08', latest: '2017-01' };
const UNKNOWN = { earliest: null, latest: '2017-01' };

describe('resolveReportsMonth', () => {
  it('shows the current month when the address asks for nothing', () => {
    expect(resolveReportsMonth(null, BOUNDS)).toBe('2017-01');
    expect(resolveReportsMonth('', BOUNDS)).toBe('2017-01');
  });

  it('shows the month the address asks for', () => {
    expect(resolveReportsMonth('2016-12', BOUNDS)).toBe('2016-12');
    expect(resolveReportsMonth('2016-08', BOUNDS)).toBe('2016-08');
    expect(resolveReportsMonth('2017-01', BOUNDS)).toBe('2017-01');
  });

  it('takes anything that is not a month for the current month', () => {
    for (const requested of [
      'last-month',
      '2016-13',
      '2016-00',
      '2016-1',
      '2016-12-01',
      '16-12',
      '2016-12; drop',
    ]) {
      expect(resolveReportsMonth(requested, BOUNDS)).toBe('2017-01');
    }
  });

  it('does not show a month that has not begun', () => {
    expect(resolveReportsMonth('2017-02', BOUNDS)).toBe('2017-01');
    expect(resolveReportsMonth('2031-06', BOUNDS)).toBe('2017-01');
  });

  it('stops at the month of the first transaction', () => {
    expect(resolveReportsMonth('2016-07', BOUNDS)).toBe('2016-08');
    expect(resolveReportsMonth('1999-01', BOUNDS)).toBe('2016-08');
  });

  it('lets the request stand while the first month is not known', () => {
    expect(resolveReportsMonth('2015-03', UNKNOWN)).toBe('2015-03');
  });

  it('keeps the current month when every transaction is dated ahead', () => {
    const ahead = { earliest: '2017-03', latest: '2017-01' };
    expect(resolveReportsMonth('2016-12', ahead)).toBe('2017-01');
    expect(resolveReportsMonth(null, ahead)).toBe('2017-01');
  });
});

describe('stepping', () => {
  it('goes back as far as the first transaction and forward to today', () => {
    expect(canStepBack('2017-01', BOUNDS)).toBe(true);
    expect(canStepBack('2016-09', BOUNDS)).toBe(true);
    expect(canStepBack('2016-08', BOUNDS)).toBe(false);

    expect(canStepForward('2016-12', BOUNDS)).toBe(true);
    expect(canStepForward('2017-01', BOUNDS)).toBe(false);
  });

  it('has nowhere to go back to in a file without transactions', () => {
    expect(canStepBack('2017-01', UNKNOWN)).toBe(false);
  });

  it('has nowhere to go back to when every transaction is dated ahead', () => {
    expect(
      canStepBack('2017-01', { earliest: '2017-03', latest: '2017-01' }),
    ).toBe(false);
  });
});

describe('periodMenuMonths', () => {
  it('lists the months from today back to the first transaction', () => {
    expect(periodMenuMonths('2017-01', BOUNDS)).toEqual([
      '2017-01',
      '2016-12',
      '2016-11',
      '2016-10',
      '2016-09',
      '2016-08',
    ]);
  });

  it('lists no more than a year', () => {
    const months = periodMenuMonths('2017-01', {
      earliest: '2010-01',
      latest: '2017-01',
    });
    expect(months).toHaveLength(12);
    expect(months[0]).toBe('2017-01');
    expect(months[11]).toBe('2016-02');
  });

  it('always lists the month on screen', () => {
    const months = periodMenuMonths('2012-05', {
      earliest: '2010-01',
      latest: '2017-01',
    });
    expect(months).toHaveLength(13);
    expect(months[12]).toBe('2012-05');
  });

  it('lists the current month alone in a file without transactions', () => {
    expect(periodMenuMonths('2017-01', UNKNOWN)).toEqual(['2017-01']);
  });
});
