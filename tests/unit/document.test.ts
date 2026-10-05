import { describe, expect, it } from 'vitest';
import {
  datesInYear,
  isLeapYear,
  parseDate,
  spreadIndex,
} from '../../src/domain/calendar';
import {
  assertEntry,
  manifest,
  newEntry,
  type Book,
} from '../../src/domain/model';
import {
  dailyTemplate,
  screenToDocument,
  snapNote,
  timeToY,
  yToTime,
} from '../../src/templates/daily-v1';

describe('civil calendar and stable pages', () => {
  it('includes leap days and rejects impossible civil dates', () => {
    expect(datesInYear(2024)).toHaveLength(366);
    expect(datesInYear(2026)).toHaveLength(365);
    expect(datesInYear(2024)).toContain('2024-02-29');
    expect(isLeapYear(2000)).toBe(true);
    expect(isLeapYear(2100)).toBe(false);
    expect(() => parseDate('2026-02-29')).toThrow();
    expect(() => parseDate('2026-00-01')).toThrow();
    expect(() => parseDate('2026-13-01')).toThrow();
  });
  it('crosses month/year boundaries without instant arithmetic', () => {
    const dates = datesInYear(2026);
    expect(dates.slice(30, 33)).toEqual([
      '2026-01-31',
      '2026-02-01',
      '2026-02-02',
    ]);
    expect(dates.at(-1)).toBe('2026-12-31');
    expect(spreadIndex(dates.indexOf('2026-02-01'))).toBe(30);
    expect(spreadIndex(dates.indexOf('2026-03-01'))).toBe(58);
  });
  it('keeps dated IDs independent of manifest ordering', () => {
    const book: Book = {
      id: 'book',
      title: 'Test',
      year: 2026,
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      locale: 'en-US',
      todayTimeZone: 'America/New_York',
      templateVersion: 1,
    };
    const pages = manifest(book);
    expect(pages[278].id).toBe('book:daily:2026-10-06');
    expect(pages[279].id).toBe('book:daily:2026-10-07');
  });
});

describe('time and document geometry', () => {
  it('maps every measured anchor including midnight to explicit offsets', () => {
    for (const anchor of dailyTemplate.timeline) {
      expect(timeToY(anchor.minute, anchor.dayOffset)).toBeCloseTo(anchor.y);
      expect(yToTime(anchor.y)).toEqual({
        minute: anchor.minute,
        dayOffset: anchor.dayOffset,
      });
    }
    expect(timeToY(90, 1)).toBeCloseTo(105.45);
    expect(() => timeToY(90, 0)).toThrow();
  });
  it('preserves a grid point under translations and nonuniform screen scaling', () => {
    const point = { x: 54.4, y: 138.4 };
    for (const rect of [
      { left: 20, top: 60, width: 444, height: 630 },
      { left: 100, top: 10, width: 350, height: 700 },
    ]) {
      const result = screenToDocument(
        rect.left + (point.x / 148) * rect.width,
        rect.top + (point.y / 210) * rect.height,
        rect,
      );
      expect(result.x).toBeCloseTo(point.x);
      expect(result.y).toBeCloseTo(point.y);
    }
  });
  it('bounds notes and rejects unsafe or unknown records without dropping overflow text', () => {
    const note = newEntry('page', { type: 'note', ...snapNote(999, 999) });
    note.text = '<script>alert(1)</script>\n' + 'long writing '.repeat(300);
    expect(() => assertEntry(note)).not.toThrow();
    expect(note.text).toContain('<script>');
    expect(() => assertEntry({ ...note, x: NaN })).toThrow();
    expect(() => assertEntry({ ...note, type: 'html' })).toThrow();
    expect(() => assertEntry({ ...note, width: 300 })).toThrow();
  });
});
