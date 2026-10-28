import { describe, expect, it } from 'vitest';
import { assertEntry, newEntry } from '../../src/domain/model';
import {
  adjustDuration,
  absoluteStart,
  absoluteEnd,
  sameRange,
} from '../../src/domain/durations';
const entry = () => ({
  ...newEntry('page', {
    type: 'scheduled-block',
    minute: 727,
    dayOffset: 0,
    endMinute: 802,
    endDayOffset: 0,
  }),
  text: 'Study',
  submitted: true,
  completed: true,
  formatRuns: [{ from: 0, to: 5, bold: true }],
});
describe('duration placement', () => {
  it('moves by quarter-hour deltas while preserving exact minutes, length and content', () => {
    const original = entry();
    const next = adjustDuration(original, 'move', 53);
    expect(next).toEqual({ ...original, minute: 787, endMinute: 862 });
    expect(original.minute).toBe(727);
    expect(absoluteEnd(next) - absoluteStart(next)).toBe(75);
    expect(sameRange(original, adjustDuration(original, 'move', 0))).toBe(true);
  });
  it('bounds movement by the whole range and preserves midnight offsets', () => {
    const earlier = adjustDuration(entry(), 'move', -5000);
    const later = adjustDuration(entry(), 'move', 5000);
    expect([absoluteStart(earlier), absoluteEnd(earlier)]).toEqual([360, 435]);
    expect([absoluteStart(later), absoluteEnd(later)]).toEqual([1545, 1620]);
    expect(() => assertEntry(later)).not.toThrow();
    expect(
      adjustDuration(
        { ...entry(), minute: 1387, endMinute: 22, endDayOffset: 1 },
        'move',
        60,
      ),
    ).toMatchObject({
      minute: 7,
      dayOffset: 1,
      endMinute: 82,
      endDayOffset: 1,
    });
  });
  it('resizes only the end and keeps short imported intervals valid', () => {
    expect(adjustDuration(entry(), 'end', 30)).toEqual({
      ...entry(),
      id: expect.any(String),
      endMinute: 832,
    });
    expect(absoluteEnd(adjustDuration(entry(), 'end', -5000))).toBe(728);
    expect(absoluteEnd(adjustDuration(entry(), 'end', 5000))).toBe(1620);
    const short = { ...entry(), endMinute: 728 };
    expect(sameRange(short, adjustDuration(short, 'end', 0))).toBe(true);
  });
  it('rejects nonfinite deltas instead of corrupting an entry', () => {
    for (const value of [NaN, Infinity, -Infinity])
      expect(() => adjustDuration(entry(), 'move', value)).toThrow();
  });
});
