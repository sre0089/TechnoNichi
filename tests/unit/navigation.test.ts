import { expect, it } from 'vitest';
import {
  dateDestination,
  datesInYear,
  todayInZone,
} from '../../src/domain/calendar';
it('uses civil dates in the stored timezone across midnight and DST', () => {
  expect(
    todayInZone('America/New_York', new Date('2026-10-28T02:00:00Z')),
  ).toBe('2026-10-27');
  expect(todayInZone('Asia/Tokyo', new Date('2026-10-28T16:00:00Z'))).toBe(
    '2026-10-29',
  );
  expect(
    todayInZone('America/New_York', new Date('2026-03-08T07:00:00Z')),
  ).toBe('2026-03-08');
});
it('finds leap days and final single pages through manifest order', () => {
  const leap = datesInYear(2028).map((date) => ({ date }));
  expect(dateDestination(leap, '2028-02-29')).toEqual({
    index: 59,
    pageIndex: 58,
    focusSide: 1,
  });
  const normal = datesInYear(2026).map((date) => ({ date }));
  expect(dateDestination(normal, '2026-12-31')).toEqual({
    index: 364,
    pageIndex: 364,
    focusSide: 0,
  });
  expect(() => dateDestination(normal, '2027-01-01')).toThrow(
    'outside this book',
  );
  expect(() => dateDestination(normal, '2026-02-29')).toThrow(
    'Invalid calendar date',
  );
});
it('uses manifest position rather than date parity for spread sides', () => {
  expect(
    dateDestination(
      [{ date: '2026-01-02' }, { date: '2026-01-03' }],
      '2026-01-03',
    ),
  ).toEqual({ index: 1, pageIndex: 0, focusSide: 1 });
});
