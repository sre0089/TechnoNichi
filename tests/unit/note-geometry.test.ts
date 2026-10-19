import { describe, expect, it } from 'vitest';
import { moveNote, resizeNote } from '../../src/domain/note-geometry';
import { assertEntry, newEntry } from '../../src/domain/model';
import { screenToDocument } from '../../src/templates/daily-v1';

const note = newEntry('page', { type: 'note', x: 28.5, y: 127.3 });

describe('note movement and resizing', () => {
  it('moves by grid intersections without changing content, size or identity', () => {
    const written = {
      ...note,
      text: 'Keep every word',
      formatRuns: [{ from: 0, to: 4, bold: true }],
    };
    expect(moveNote(written, 7.3, -3.8)).toEqual({
      ...written,
      x: 35.9,
      y: 123.6,
    });
    expect(written).toEqual({
      ...note,
      text: 'Keep every word',
      formatRuns: [{ from: 0, to: 4, bold: true }],
    });
  });

  it('bounds a moved note using its actual size, including legacy upper-grid notes', () => {
    expect(moveNote(note, 999, 999)).toMatchObject({ x: 76.6, y: 171.7 });
    expect(moveNote(note, -999, -999)).toMatchObject({ x: 10, y: 27.4 });
    const legacy = { ...note, x: 32.2, y: 44.4, width: 61.1, height: 13.2 };
    const moved = moveNote(legacy, 999, 999);
    expect(moved.width).toBe(61.1);
    expect(moved.height).toBe(13.2);
    expect(() => assertEntry(moved)).not.toThrow();
  });

  it('resizes to grid units with a readable minimum, retaining all overflow text', () => {
    const written = { ...note, text: 'Long note '.repeat(100) };
    expect(resizeNote(written, 7.4, 3.7)).toEqual({
      ...written,
      width: 70.3,
      height: 18.5,
    });
    expect(resizeNote(written, -999, -999)).toEqual({
      ...written,
      width: 14.8,
      height: 7.4,
    });
    expect(resizeNote(written, 999, 999)).toEqual({
      ...written,
      width: 111,
      height: 59.2,
    });
  });

  it('keeps imported boxes near the bottom/right valid without moving them on resize', () => {
    const edge = { ...note, x: 140, y: 185, width: 2, height: 1.5 };
    expect(resizeNote(edge, 999, 999)).toEqual(edge);
    expect(() => assertEntry(resizeNote(edge, -999, -999))).not.toThrow();
  });

  it('uses the same document displacement across zoom, page side and scrolling', () => {
    for (const rect of [
      { left: 20, top: -120, width: 444, height: 630 },
      { left: 640, top: 80, width: 592, height: 840 },
      { left: -50, top: 10, width: 296, height: 420 },
    ]) {
      const start = screenToDocument(
        rect.left + rect.width / 2,
        rect.top + rect.height / 2,
        rect,
      );
      const end = screenToDocument(
        rect.left + rect.width / 2 + (7.4 * rect.width) / 148,
        rect.top + rect.height / 2 + (3.7 * rect.height) / 210,
        rect,
      );
      expect(moveNote(note, end.x - start.x, end.y - start.y)).toEqual({
        ...note,
        x: 35.9,
        y: 131,
      });
    }
  });

  it('keeps repeated movement/resizing valid without accumulating rounding errors', () => {
    let current = note;
    for (let index = 0; index < 100; index++) {
      current = {
        ...current,
        ...resizeNote(current, index % 2 ? -7.4 : 3.7, 3.7),
      };
      current = {
        ...current,
        ...moveNote(current, index % 3 ? -3.7 : 7.4, -3.7),
      };
      expect(() => assertEntry(current)).not.toThrow();
    }
  });
});
