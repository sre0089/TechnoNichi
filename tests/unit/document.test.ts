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
  newHourlyEntry,
  type Book,
} from '../../src/domain/model';
import {
  dailyTemplate,
  hourlyRows,
  hourForTime,
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
  it('accepts old plain writing and boolean formats while rejecting invalid styles', () => {
    const entry = newEntry('page', {
      type: 'scheduled-line',
      minute: 720,
      dayOffset: 0,
    });
    expect(() => assertEntry(entry)).not.toThrow();
    expect(() =>
      assertEntry({
        ...entry,
        style: {
          ...entry.style,
          bold: true,
          italic: false,
          underline: true,
        },
      }),
    ).not.toThrow();
    for (const key of ['bold', 'italic', 'underline']) {
      for (const invalid of ['true', 1, null, {}]) {
        expect(() =>
          assertEntry({ ...entry, style: { ...entry.style, [key]: invalid } }),
        ).toThrow('Invalid writing format');
      }
    }
  });
  it('does not reuse a row ID after its writing moves to another hour', () => {
    const first = newHourlyEntry('page', 540, 0, []);
    const moved = { ...first, minute: 855, text: 'Keep this writing' };
    const second = newHourlyEntry('page', 540, 0, [moved]);
    expect(second.id).not.toBe(first.id);
    expect(newHourlyEntry('page', 540, 0, [moved]).id).toBe(second.id);
    expect(moved.text).toBe('Keep this writing');
  });
  it('maps every measured anchor including midnight to explicit offsets', () => {
    for (const anchor of dailyTemplate.timeline) {
      expect(timeToY(anchor.minute, anchor.dayOffset)).toBeCloseTo(anchor.y);
      expect(yToTime(anchor.y)).toEqual({
        minute: anchor.minute,
        dayOffset: anchor.dayOffset,
      });
    }
    expect(timeToY(90, 1)).toBeCloseTo(106.95);
    expect(() => timeToY(90, 0)).toThrow();
  });
  it('aligns hourly intersections to the grid and preserves exact-time row membership', () => {
    expect(hourlyRows).toHaveLength(22);
    expect(
      hourlyRows.filter((row) => row.label !== null).map((row) => row.label),
    ).toEqual(['6', '9', '12', '15', '18', '21', '0', '3']);
    for (const row of hourlyRows) {
      expect(
        (row.y - dailyTemplate.grid.y) / dailyTemplate.grid.pitch,
      ).toBeCloseTo(
        Math.round((row.y - dailyTemplate.grid.y) / dailyTemplate.grid.pitch),
      );
      expect(yToTime(row.y)).toEqual({
        minute: row.minute,
        dayOffset: row.dayOffset,
      });
    }
    expect(hourForTime(14 * 60 + 15, 0)).toBe(14 * 60);
    expect(hourForTime(45, 1)).toBe(1440);
    expect(dailyTemplate.memoY).toBe(hourlyRows.at(-1)!.y);
    expect(snapNote(40, 30).y).toBe(dailyTemplate.memoY);
    expect(snapNote(10, 113).x).toBe(dailyTemplate.grid.x);
    // Stored notes from the original template remain valid in the timetable area.
    expect(() =>
      assertEntry(newEntry('page', { type: 'note', x: 32.2, y: 44.4 })),
    ).not.toThrow();
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
