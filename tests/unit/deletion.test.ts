import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it } from 'vitest';
import {
  newEntry,
  newHourlyEntry,
  newTaskEntry,
  type Entry,
} from '../../src/domain/model';
import {
  EntryRestoreRefused,
  PlannerDB,
  RevisionConflict,
} from '../../src/local/repository';

const databases: PlannerDB[] = [];
async function database() {
  const db = new PlannerDB(`deletion-${crypto.randomUUID()}`);
  databases.push(db);
  const { book } = await db.initialize();
  return { db, book, page: `${book.id}:daily:2026-10-06` };
}
afterEach(async () => {
  await Promise.all(databases.splice(0).map((db) => db.delete()));
});

describe('recoverable deletion', () => {
  it('keeps deleted history recoverable after importing a complete-book backup', async () => {
    const { db, book, page } = await database();
    const entry = await db.save(
      { ...newTaskEntry(page, 0, []), text: 'Archived writing' },
      0,
    );
    const deleted = await db.deleteEntry(entry.id, 1);
    const copy = new PlannerDB(`deletion-copy-${crypto.randomUUID()}`);
    databases.push(copy);
    await copy.restoreBackup(await db.exportBackup(book.id));
    expect(await copy.readDeleted(book.id)).toEqual([deleted]);
    expect((await copy.restoreEntry(deleted.id, deleted.revision)).text).toBe(
      'Archived writing',
    );
  });
  it.each(['scheduled-line', 'task', 'note'] as const)(
    'retains and restores every field of a %s, including backup and reload',
    async (type) => {
      const { db, book, page } = await database();
      const original: Entry =
        type === 'note'
          ? {
              ...newEntry(page, { type, x: 28.5, y: 127.3 }),
              text: 'Formatted writing',
            }
          : type === 'task'
            ? {
                ...newEntry(page, { type, slot: 2 }),
                text: 'Formatted writing',
                completed: true,
              }
            : {
                ...newHourlyEntry(page, 45, 1, []),
                text: 'Formatted writing',
                submitted: true,
                completed: true,
              };
      original.formatRuns = [
        { from: 0, to: 9, bold: true, italic: true, underline: true },
      ];
      const saved = await db.save(original, 0);
      const deleted = await db.deleteEntry(original.id, saved.revision);
      expect(deleted).toEqual({
        ...saved,
        revision: 2,
        deletedAt: expect.any(String),
      });
      expect(await db.readPages([page])).toEqual([]);
      expect((await db.exportBackup(book.id)).entries).toEqual([deleted]);
      db.close();
      await db.open();
      expect(await db.readDeleted(book.id)).toEqual([deleted]);
      const restored = await db.restoreEntry(deleted.id, deleted.revision);
      expect(restored).toEqual({ ...original, revision: 3, deletedAt: null });
      expect(await db.readPages([page])).toEqual([restored]);
      expect(await db.readDeleted(book.id)).toEqual([]);
    },
  );

  it('finds deleted entries outside the visible spread and excludes unrelated books', async () => {
    const { db, book, page } = await database();
    const entry = await db.save(
      newEntry(page.replace('10-06', '12-31'), { type: 'task', slot: 0 }),
      0,
    );
    const deleted = await db.deleteEntry(entry.id, 1);
    expect(await db.readDeleted(book.id)).toEqual([deleted]);
    expect(await db.readDeleted('unrelated')).toEqual([]);
  });

  it('uses fresh identities when rewriting deleted hourly and checklist slots', async () => {
    const { db, page } = await database();
    const hour = await db.save(
      { ...newHourlyEntry(page, 720, 0, []), text: 'Old timed task' },
      0,
    );
    const task = await db.save(
      { ...newTaskEntry(page, 0, []), text: 'Old checklist' },
      0,
    );
    await db.deleteEntry(hour.id, 1);
    await db.deleteEntry(task.id, 1);
    const records = await db.readPages([page], true);
    const nextHour = newHourlyEntry(page, 720, 0, records);
    const nextTask = newTaskEntry(page, 0, records);
    expect(nextHour.id).not.toBe(hour.id);
    expect(nextTask.id).not.toBe(task.id);
    await db.save({ ...nextHour, text: 'New timed task' }, 0);
    await db.save({ ...nextTask, text: 'New checklist' }, 0);
    expect(
      (await db.readDeleted('personal-2026')).map((entry) => entry.text).sort(),
    ).toEqual(['Old checklist', 'Old timed task']);
  });

  it.each(['task', 'scheduled-line', 'note'] as const)(
    'refuses an occupied %s placement without changing either entry',
    async (type) => {
      const { db, page } = await database();
      const original =
        type === 'task'
          ? newTaskEntry(page, 0, [])
          : type === 'scheduled-line'
            ? newHourlyEntry(page, 720, 0, [])
            : newEntry(page, { type: 'note', x: 28.5, y: 127.3 });
      const saved = await db.save({ ...original, text: 'Retain me' }, 0);
      const deleted = await db.deleteEntry(saved.id, 1);
      const replacement = {
        ...original,
        id: crypto.randomUUID(),
        text: 'New writing',
        revision: 0,
      };
      if (replacement.type === 'scheduled-line') replacement.minute = 735;
      const other = await db.save(replacement, 0);
      await expect(db.restoreEntry(deleted.id, 2)).rejects.toBeInstanceOf(
        EntryRestoreRefused,
      );
      expect(await db.entries.get(deleted.id)).toEqual(deleted);
      expect(await db.entries.get(other.id)).toEqual(other);
      await db.deleteEntry(other.id, 1);
      expect((await db.restoreEntry(deleted.id, 2)).text).toBe('Retain me');
    },
  );

  it('allows adjacent notes that do not overlap', async () => {
    const { db, page } = await database();
    const first = await db.save(
      newEntry(page, { type: 'note', x: 28.5, y: 127.3 }),
      0,
    );
    const deleted = await db.deleteEntry(first.id, 1);
    if (first.type !== 'note') throw new Error('Expected a note');
    await db.save(
      newEntry(page, { type: 'note', x: first.x, y: first.y + first.height }),
      0,
    );
    expect((await db.restoreEntry(deleted.id, 2)).deletedAt).toBeNull();
  });

  it('rejects stale deletion and restoration from another connection', async () => {
    const { db, page } = await database();
    const other = new PlannerDB(db.name);
    try {
      const entry = await db.save(
        { ...newTaskEntry(page, 0, []), text: 'Original' },
        0,
      );
      const changed = await other.save(
        { ...entry, text: 'Other tab writing' },
        1,
      );
      await expect(db.deleteEntry(entry.id, 1)).rejects.toBeInstanceOf(
        RevisionConflict,
      );
      const deleted = await db.deleteEntry(entry.id, changed.revision);
      await other.restoreEntry(entry.id, deleted.revision);
      await expect(
        db.restoreEntry(entry.id, deleted.revision),
      ).rejects.toBeInstanceOf(RevisionConflict);
      expect((await db.entries.get(entry.id))?.text).toBe('Other tab writing');
    } finally {
      other.close();
    }
  });

  it('serializes two connections restoring different deleted entries into one slot', async () => {
    const { db, page } = await database();
    const first = await db.save(newTaskEntry(page, 0, []), 0);
    const firstDeleted = await db.deleteEntry(first.id, 1);
    const second = await db.save(newTaskEntry(page, 0, [firstDeleted]), 0);
    const secondDeleted = await db.deleteEntry(second.id, 1);
    const other = new PlannerDB(db.name);
    try {
      const results = await Promise.allSettled([
        db.restoreEntry(firstDeleted.id, 2),
        other.restoreEntry(secondDeleted.id, 2),
      ]);
      expect(
        results.filter((result) => result.status === 'fulfilled'),
      ).toHaveLength(1);
      const refused = results.find((result) => result.status === 'rejected');
      expect(refused?.status === 'rejected' && refused.reason).toBeInstanceOf(
        EntryRestoreRefused,
      );
      expect(await db.readPages([page])).toHaveLength(1);
      expect(await db.readDeleted('personal-2026')).toHaveLength(1);
    } finally {
      other.close();
    }
  });

  it('rolls back failed deletion and failed restoration', async () => {
    const { db, page } = await database();
    const entry = await db.save(
      { ...newTaskEntry(page, 0, []), text: 'Keep this' },
      0,
    );
    const fail = () => {
      throw new Error('Storage denied');
    };
    db.entries.hook('updating', fail);
    await expect(db.deleteEntry(entry.id, 1)).rejects.toThrow('Storage denied');
    expect(await db.entries.get(entry.id)).toEqual(entry);
    db.entries.hook('updating').unsubscribe(fail);
    const deleted = await db.deleteEntry(entry.id, 1);
    db.entries.hook('updating', fail);
    await expect(db.restoreEntry(entry.id, 2)).rejects.toThrow(
      'Storage denied',
    );
    expect(await db.entries.get(entry.id)).toEqual(deleted);
    db.entries.hook('updating').unsubscribe(fail);
  });
});
