import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it } from 'vitest';
import {
  assertEntry,
  newEntry,
  type DurationEntry,
} from '../../src/domain/model';
import {
  absoluteEnd,
  durationLanes,
  scheduledLabel,
  timeParts,
  withDuration,
  withoutDuration,
} from '../../src/domain/durations';
import { dailyTemplate, timeToY } from '../../src/templates/daily-v1';
import { PlannerDB, RevisionConflict } from '../../src/local/repository';
import {
  parseBackup,
  serializeBackup,
  validateBackup,
} from '../../src/local/backup';

const block = (start = 720, end = 810, pageId = 'page'): DurationEntry => ({
  ...newEntry(pageId, {
    type: 'scheduled-block',
    minute: start % 1440,
    dayOffset: Math.floor(start / 1440),
    endMinute: end % 1440,
    endDayOffset: Math.floor(end / 1440),
  }),
  text: 'Study notes',
  submitted: true,
  completed: true,
  formatRuns: [{ from: 0, to: 5, bold: true, italic: true, underline: true }],
});

describe('duration semantics and projections', () => {
  it.each([
    [360, 420],
    [720, 810],
    [1380, 1500],
    [1440, 1620],
    [1619, 1620],
  ])(
    'retains exact ordered endpoints %s–%s including midnight',
    (start, end) => {
      const entry = block(start, end);
      expect(() => assertEntry(entry)).not.toThrow();
      expect(absoluteEnd(entry)).toBe(end);
      const [span] = durationLanes([entry]);
      expect(span.y).toBeCloseTo(
        timeToY(entry.minute, entry.dayOffset) - dailyTemplate.grid.pitch,
      );
      expect(span.height).toBeCloseTo(
        ((end - start) / 60) * dailyTemplate.grid.pitch,
      );
    },
  );
  it.each([
    [720, 720],
    [810, 720],
    [359, 600],
    [1620, 1680],
    [720, 1621],
    [720, 3000],
  ])('rejects reversed, zero or out-of-timetable range %s–%s', (start, end) => {
    expect(() => assertEntry(block(start, end))).toThrow();
  });
  it('rejects fractional/invalid endpoint components and false completion', () => {
    for (const change of [
      { endMinute: 60.5 },
      { endMinute: 1440 },
      { endDayOffset: -1 },
      { endDayOffset: 2 },
      { completed: true, submitted: false },
    ])
      expect(() => assertEntry({ ...block(), ...change })).toThrow();
  });
  it('converts line and block without changing identity, marks, completion or exact start', () => {
    const { endMinute, endDayOffset, ...base } = block(1500, 1590);
    const line = { ...base, type: 'scheduled-line' as const };
    expect(withoutDuration(withDuration(line))).toEqual(line);
    expect(withDuration(line)).toEqual({
      ...line,
      type: 'scheduled-block',
      endMinute: 120,
      endDayOffset: 1,
    });
    expect(withDuration({ ...block(1500, 1590), id: line.id })).toEqual({
      ...line,
      type: 'scheduled-block',
      endMinute,
      endDayOffset,
    });
    expect(() => withDuration({ ...line, minute: 180 })).toThrow();
    expect(scheduledLabel(block(1380, 1500))).toBe('23:00–01:00 +1');
  });
  it('keeps day selection explicit and validates time input', () => {
    expect(timeParts('00:45', 1)).toEqual({ minute: 45, dayOffset: 1 });
    expect(timeParts('12:30', 0)).toEqual({ minute: 750, dayOffset: 0 });
    for (const value of ['', '3:00', '24:00', '12:60', 'NaN:00'])
      expect(() => timeParts(value, 0)).toThrow();
    expect(() => timeParts('12:00', 2)).toThrow();
  });
  it('separates nested/identical overlaps, reuses touching lanes, filters deletion and never mutates records', () => {
    const a = { ...block(720, 900), id: 'a' };
    const b = { ...block(720, 810), id: 'b' };
    const c = { ...block(780, 840), id: 'c' };
    const d = { ...block(810, 900), id: 'd' };
    const entries = [
      d,
      c,
      a,
      b,
      { ...block(), deletedAt: '2026-10-28T12:00:00.000Z' },
    ];
    const before = structuredClone(entries);
    expect(
      durationLanes(entries).map(({ entry, lane }) => [entry.id, lane]),
    ).toEqual([
      ['b', 0],
      ['a', 1],
      ['c', 2],
      ['d', 0],
    ]);
    expect(entries).toEqual(before);
    expect(durationLanes(entries.toReversed())).toEqual(durationLanes(entries));
  });
});

const databases: PlannerDB[] = [];
async function database() {
  const db = new PlannerDB(`durations-${crypto.randomUUID()}`);
  databases.push(db);
  const { book } = await db.initialize();
  return { db, book, pageId: `${book.id}:daily:2026-10-06` };
}
afterEach(async () => {
  await Promise.all(databases.splice(0).map((db) => db.delete()));
});

describe('duration storage and recovery', () => {
  it('round trips v2 archives, rejects duration records in v1 and retains old v1 support', async () => {
    const { db, book, pageId } = await database();
    const saved = await db.save(block(1380, 1500, pageId), 0);
    const archive = parseBackup(
      serializeBackup(await db.exportBackup(book.id)),
    );
    expect(archive.version).toBe(2);
    expect(archive.entries).toEqual([saved]);
    expect(() => validateBackup({ ...archive, version: 1 })).toThrow();
    const legacy = {
      ...archive,
      version: 1 as const,
      entries: [withoutDuration(saved as DurationEntry)],
    };
    expect(parseBackup(serializeBackup(legacy))).toEqual(legacy);
    const { db: target } = await database();
    await target.restoreBackup(archive);
    expect(await target.entries.get(saved.id)).toEqual(saved);
    target.close();
    await target.open();
    expect((await target.readPages([pageId]))[0]).toEqual(saved);
  });
  it('preserves duration through deletion/restore even with overlapping tasks', async () => {
    const { db, pageId } = await database();
    const original = await db.save(block(720, 840, pageId), 0);
    const deleted = await db.deleteEntry(original.id, original.revision);
    const overlap = await db.save(block(750, 900, pageId), 0);
    const restored = await db.restoreEntry(deleted.id, deleted.revision);
    expect(restored).toEqual({ ...original, revision: 3 });
    expect(await db.entries.get(overlap.id)).toEqual(overlap);
  });
  it.each(['mine', 'saved', 'both'] as const)(
    'resolves %s with complete duration/range recovery copies',
    async (choice) => {
      const { db, book, pageId } = await database();
      const original = await db.save(block(720, 810, pageId), 0);
      const draft = {
        ...original,
        text: 'Study books',
        endMinute: 900,
      } as DurationEntry;
      const current = await db.save(
        { ...original, text: 'Study plans', endMinute: 840 } as DurationEntry,
        1,
      );
      const result = await db.resolveConflict(draft, current.revision, choice);
      expect(result.entry).toEqual(
        choice === 'mine' ? { ...draft, revision: 3 } : current,
      );
      const copies = await db.readDeleted(book.id);
      expect(copies).toHaveLength(choice === 'saved' ? 0 : 1);
      if (copies.length)
        expect(copies[0]).toEqual({
          ...(choice === 'mine' ? current : draft),
          id: expect.any(String),
          deletedAt: expect.any(String),
          revision: 1,
        });
      await expect(db.resolveConflict(draft, 1, choice)).rejects.toBeInstanceOf(
        RevisionConflict,
      );
    },
  );
  it('permits reviewed line-to-duration conflicts without changing the entry identity', async () => {
    const { db, book, pageId } = await database();
    const original = await db.save(withoutDuration(block(720, 810, pageId)), 0);
    const draft = withDuration(original as Parameters<typeof withDuration>[0]);
    const current = await db.save({ ...original, text: 'Study plans' }, 1);
    await db.resolveConflict(draft, current.revision, 'mine');
    expect(await db.entries.get(original.id)).toEqual({
      ...draft,
      revision: 3,
    });
    expect((await db.readDeleted(book.id))[0]).toMatchObject({
      type: 'scheduled-line',
      text: 'Study plans',
    });
  });
});
