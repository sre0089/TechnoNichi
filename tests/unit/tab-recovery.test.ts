import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it } from 'vitest';
import {
  newEntry,
  newHourlyEntry,
  sameContent,
  type Entry,
} from '../../src/domain/model';
import {
  PlannerDB,
  RevisionConflict,
  EntryRestoreRefused,
  type ConflictChoice,
} from '../../src/local/repository';
import {
  SaveQueue,
  RECOVERY_KEY,
  readRecovery,
  type RecoveryStorage,
} from '../../src/local/save-queue';
import { TabRecovery, SESSION_DRAFT_KEY } from '../../src/local/tab-recovery';

class MemoryStorage implements RecoveryStorage {
  values = new Map<string, string>();
  get length() {
    return this.values.size;
  }
  key(index: number) {
    return [...this.values.keys()][index] ?? null;
  }
  getItem(key: string) {
    return this.values.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
  removeItem(key: string) {
    this.values.delete(key);
  }
}
const databases: PlannerDB[] = [];
async function database() {
  const db = new PlannerDB(`tab-safety-${crypto.randomUUID()}`);
  databases.push(db);
  const { book } = await db.initialize();
  return { db, book, page: `${book.id}:daily:2026-10-06` };
}
afterEach(async () => {
  await Promise.all(databases.splice(0).map((db) => db.delete()));
});

describe('reviewed conflict decisions', () => {
  for (const type of ['task', 'scheduled-line', 'note'] as const) {
    it.each(['mine', 'saved', 'both'] as const)(
      `${type}: applies %s atomically and retains full copy fields`,
      async (choice) => {
        const { db, book, page } = await database();
        const variant =
          type === 'task'
            ? newEntry(page, { type, slot: 1 })
            : type === 'note'
              ? newEntry(page, { type, x: 28.5, y: 127.3 })
              : newHourlyEntry(page, 45, 1, []);
        const original = await db.save(
          { ...variant, text: 'Original writing' },
          0,
        );
        const draft: Entry = {
          ...original,
          text: 'Local writing',
          formatRuns: [
            { from: 0, to: 5, bold: true, italic: true, underline: true },
          ],
        };
        const current = await db.save(
          { ...original, text: 'Saved writing' },
          1,
        );
        const result = await db.resolveConflict(
          draft,
          current.revision,
          choice,
        );
        const saved = await db.entries.get(original.id);
        expect(saved).toEqual(
          choice === 'mine' ? { ...draft, revision: 3 } : current,
        );
        const copies = await db.readDeleted(book.id);
        expect(copies).toHaveLength(choice === 'saved' ? 0 : 1);
        if (copies.length) {
          const retained = choice === 'mine' ? current : draft;
          expect(copies[0]).toEqual({
            ...retained,
            id: expect.any(String),
            revision: 1,
            deletedAt: expect.any(String),
          });
          expect(copies[0].id).not.toBe(original.id);
          expect((await db.exportBackup(book.id)).entries).toContainEqual(
            copies[0],
          );
        }
        expect(result.entry).toEqual(saved);
      },
    );
  }

  it.each(['mine', 'saved', 'both'] as const)(
    'refuses %s if another connection changes the reviewed saved revision',
    async (choice: ConflictChoice) => {
      const { db, page } = await database();
      const original = await db.save(
        { ...newEntry(page, { type: 'task', slot: 0 }), text: 'Original' },
        0,
      );
      const current = await db.save({ ...original, text: 'Review this' }, 1);
      const other = new PlannerDB(db.name);
      try {
        await other.save({ ...current, text: 'Changed again' }, 2);
        await expect(
          db.resolveConflict({ ...original, text: 'My draft' }, 2, choice),
        ).rejects.toBeInstanceOf(RevisionConflict);
        expect(await db.entries.count()).toBe(1);
        expect((await db.entries.get(original.id))?.text).toBe('Changed again');
      } finally {
        other.close();
      }
    },
  );

  it('protects a replacement slot after another tab deleted the entry', async () => {
    const { db, book, page } = await database();
    const original = await db.save(
      { ...newEntry(page, { type: 'task', slot: 0 }), text: 'Original' },
      0,
    );
    await db.deleteEntry(original.id, 1);
    await db.save(
      { ...original, id: 'replacement', revision: 0, text: 'New task' },
      0,
    );
    const draft = { ...original, text: 'Retain this draft' };
    await expect(db.resolveConflict(draft, 2, 'mine')).rejects.toBeInstanceOf(
      EntryRestoreRefused,
    );
    await db.resolveConflict(draft, 2, 'both');
    expect((await db.readPages([page])).map((entry) => entry.text)).toEqual([
      'New task',
    ]);
    expect(
      (await db.readDeleted(book.id)).map((entry) => entry.text),
    ).toContain('Retain this draft');
  });

  it('keeps geometry/completion and the other version when explicitly restoring edited writing', async () => {
    const { db, book, page } = await database();
    const original = await db.save(
      {
        ...newHourlyEntry(page, 45, 1, []),
        text: 'Night task',
        submitted: true,
        completed: true,
      },
      0,
    );
    await db.deleteEntry(original.id, 1);
    const result = await db.resolveConflict(
      { ...original, text: 'Edited night task' },
      2,
      'mine',
    );
    expect(result.entry).toEqual({
      ...original,
      text: 'Edited night task',
      revision: 3,
    });
    const copy = (await db.readDeleted(book.id))[0];
    expect(copy.type === 'scheduled-line' && copy.completed).toBe(true);
  });

  it('rolls back the recovery copy when replacing writing fails', async () => {
    const { db, page } = await database();
    const original = await db.save(
      {
        ...newEntry(page, { type: 'note', x: 28.5, y: 127.3 }),
        text: 'Stored',
      },
      0,
    );
    const fail = () => {
      throw new Error('Synthetic failure');
    };
    db.entries.hook('updating', fail);
    await expect(
      db.resolveConflict({ ...original, text: 'Draft' }, 1, 'mine'),
    ).rejects.toThrow('Synthetic failure');
    db.entries.hook('updating').unsubscribe(fail);
    expect(await db.entries.toArray()).toEqual([original]);
  });

  it('archives a retained draft without modifying the current entry', async () => {
    const { db, page } = await database();
    const current = await db.save(
      { ...newEntry(page, { type: 'task', slot: 0 }), text: 'Current' },
      0,
    );
    const draft = { ...current, text: 'Other retained draft' };
    const copy = await db.retainDraftCopy(draft);
    expect(await db.entries.get(current.id)).toEqual(current);
    expect(sameContent({ ...copy, id: draft.id, deletedAt: null }, draft)).toBe(
      true,
    );
    await expect(
      db.retainDraftCopy({ ...draft, pageId: 'missing' }),
    ).rejects.toThrow('original page');
  });
});

describe('queue review and isolated recovery', () => {
  it('persists the actual expected revision after an earlier save, even when React keeps revision zero', async () => {
    const { db, page } = await database();
    const storage = new MemoryStorage();
    const queue = new SaveQueue(
      (entry, revision) => db.save(entry, revision),
      () => {},
      storage,
    );
    const entry = newEntry(page, { type: 'task', slot: 0 });
    queue.edit({ ...entry, text: 'Saved' });
    await queue.flush();
    queue.edit({ ...entry, text: 'Newest draft' });
    expect(readRecovery(storage)[0].revision).toBe(1);
    expect(queue.unsaved()[0].revision).toBe(1);
    queue.dispose();
  });

  it('clears only the reviewed draft after a committed decision and rejects changed drafts', async () => {
    const storage = new MemoryStorage();
    const queue = new SaveQueue(
      async () => {
        throw new Error('Hold writing');
      },
      () => {},
      storage,
    );
    const first = {
      ...newEntry('page', { type: 'task', slot: 0 }),
      text: 'First',
    };
    const second = {
      ...newEntry('page', { type: 'task', slot: 1 }),
      text: 'Second',
    };
    queue.edit(first);
    queue.edit(second);
    await queue.pause();
    queue.accept(first, { ...first, revision: 5 });
    expect(queue.revision(first.id)).toBe(5);
    expect(queue.unsaved()).toEqual([second]);
    queue.edit({ ...second, text: 'Changed after review' });
    expect(() => queue.accept(second, second)).toThrow('draft changed');
    expect(readRecovery(storage)[0].text).toBe('Changed after review');
    queue.dispose();
  });

  it('successful saves in one tab cannot clear another tab’s recovery buffer', () => {
    const local = new MemoryStorage();
    const first = new TabRecovery(local, new MemoryStorage());
    const second = new TabRecovery(local, new MemoryStorage());
    const a = { ...newEntry('page', { type: 'task', slot: 0 }), text: 'Tab A' };
    const b = { ...a, text: 'Tab B' };
    first.setItem(RECOVERY_KEY, JSON.stringify([a]));
    second.setItem(RECOVERY_KEY, JSON.stringify([b]));
    first.removeItem();
    expect(local.getItem(first.key)).toBeNull();
    expect(local.getItem(second.key)).toContain('Tab B');
    expect(first.retained()[0].entry.text).toBe('Tab B');
  });

  it('reloads a tab’s session copy independently and guards cleanup by editor ownership', () => {
    const local = new MemoryStorage();
    const session = new MemoryStorage();
    const original = new TabRecovery(local, session);
    const entry = {
      ...newEntry('page', { type: 'task', slot: 0 }),
      text: 'Reload me',
    };
    original.setItem(RECOVERY_KEY, JSON.stringify([entry]));
    const reopened = new TabRecovery(local, session);
    expect(readRecovery(reopened)).toEqual([entry]);
    reopened.setItem(
      RECOVERY_KEY,
      JSON.stringify([{ ...entry, text: 'New document' }]),
    );
    original.removeItem();
    expect(session.getItem(SESSION_DRAFT_KEY)).toContain('New document');
    expect(local.getItem(reopened.key)).toContain('New document');
  });

  it('retains legacy buffers and never clears an updated retained snapshot', () => {
    const local = new MemoryStorage();
    const entry = {
      ...newEntry('page', { type: 'task', slot: 0 }),
      text: 'Legacy writing',
    };
    local.setItem(RECOVERY_KEY, JSON.stringify([entry]));
    const recovery = new TabRecovery(local, new MemoryStorage());
    expect(readRecovery(recovery)).toEqual([entry]);
    const retained = recovery.retained()[0];
    local.setItem(
      RECOVERY_KEY,
      JSON.stringify([{ ...entry, text: 'Newer writing' }]),
    );
    recovery.release(retained);
    expect(local.getItem(RECOVERY_KEY)).toContain('Newer writing');
    recovery.release(recovery.retained()[0]);
    expect(local.getItem(RECOVERY_KEY)).toContain('Newer writing');
  });

  it('uses immutable emergency snapshots so releasing an old review cannot erase a newer checkpoint', () => {
    const local = new MemoryStorage();
    const writer = new TabRecovery(local, new MemoryStorage());
    const reviewer = new TabRecovery(local, new MemoryStorage());
    const entry = {
      ...newEntry('page', { type: 'task', slot: 0 }),
      text: 'Reviewed draft',
    };
    writer.setItem(RECOVERY_KEY, JSON.stringify([entry]));
    const oldKey = writer.key;
    const reviewed = reviewer.retained()[0];
    writer.setItem(
      RECOVERY_KEY,
      JSON.stringify([{ ...entry, text: 'Newer draft' }]),
    );
    expect(writer.key).not.toBe(oldKey);
    reviewer.release(reviewed);
    expect(local.getItem(writer.key)).toContain('Newer draft');
  });

  it('keeps memory usable when optional recovery stores are denied and leaves invalid legacy data untouched', () => {
    const denied = {
      get length(): number {
        throw new Error('Denied');
      },
      key(): string | null {
        throw new Error('Denied');
      },
      getItem(): string | null {
        throw new Error('Denied');
      },
      setItem() {
        throw new Error('Denied');
      },
      removeItem() {
        throw new Error('Denied');
      },
    };
    const recovery = new TabRecovery(denied, denied);
    const entry = newEntry('page', { type: 'task', slot: 0 });
    recovery.setItem(RECOVERY_KEY, JSON.stringify([entry]));
    expect(readRecovery(recovery)).toEqual([entry]);
    expect(recovery.retained()).toEqual([]);
    const local = new MemoryStorage();
    local.setItem(RECOVERY_KEY, 'not-json');
    expect(new TabRecovery(local).retained()).toEqual([]);
    expect(local.getItem(RECOVERY_KEY)).toBe('not-json');
  });
});
