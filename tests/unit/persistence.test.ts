import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it } from 'vitest';
import { newEntry, type Entry } from '../../src/domain/model';
import { PlannerDB, RevisionConflict } from '../../src/local/repository';
import {
  readRecovery,
  RECOVERY_KEY,
  SaveQueue,
  type RecoveryStorage,
  type SaveState,
} from '../../src/local/save-queue';

class MemoryStorage implements RecoveryStorage {
  values = new Map<string, string>();
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
  const db = new PlannerDB(`test-${crypto.randomUUID()}`);
  databases.push(db);
  const { book } = await db.initialize();
  return { db, page: `${book.id}:daily:2026-10-06` };
}
afterEach(async () => {
  await Promise.all(databases.splice(0).map((db) => db.delete()));
});

describe('durable local writes', () => {
  it('persists text, geometry, time and completed wording across database reopening', async () => {
    const { db, page } = await database();
    const entries: Entry[] = [
      {
        ...newEntry(page, { type: 'scheduled-line', minute: 45, dayOffset: 1 }),
        text: 'Overnight reading',
      },
      {
        ...newEntry(page, { type: 'note', x: 28.5, y: 127.3 }),
        text: 'A free note\nSecond line',
      },
      {
        ...newEntry(page, { type: 'task', slot: 0 }),
        text: 'Review notes',
        completed: true,
      },
    ];
    for (const entry of entries) await db.save(entry, 0);
    db.close();
    await db.open();
    const restored = await db.readPages([page]);
    expect(restored).toHaveLength(3);
    for (const entry of entries)
      expect(restored.find((e) => e.id === entry.id)).toEqual({
        ...entry,
        revision: 1,
      });
  });
  it('atomically rejects a stale write from another database connection', async () => {
    const { db, page } = await database();
    const other = new PlannerDB(db.name);
    const original = {
      ...newEntry(page, { type: 'task', slot: 0 }),
      text: 'First tab',
    };
    await db.save(original, 0);
    await expect(
      other.save({ ...original, text: 'Stale tab' }, 0),
    ).rejects.toBeInstanceOf(RevisionConflict);
    expect((await db.entries.get(original.id))?.text).toBe('First tab');
    other.close();
  });
  it('refuses an entry for a nonexistent page and aborts the transaction', async () => {
    const { db } = await database();
    const entry = newEntry('missing', { type: 'task', slot: 0 });
    await expect(db.save(entry, 0)).rejects.toThrow('Unknown page');
    expect(await db.entries.count()).toBe(0);
  });
});

describe('draft serialization and recovery', () => {
  it('drains the newest text typed while a prior write is in flight', async () => {
    const { db, page } = await database();
    const storage = new MemoryStorage();
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    let writes = 0;
    const states: SaveState[] = [];
    const queue = new SaveQueue(
      async (entry, revision) => {
        writes += 1;
        if (writes === 1) await gate;
        return db.save(entry, revision);
      },
      (s) => states.push(s),
      storage,
    );
    const entry = {
      ...newEntry(page, { type: 'task', slot: 0 }),
      text: 'Draft',
    };
    queue.edit(entry);
    const flush = queue.flush();
    queue.edit({ ...entry, text: 'Latest draft before turning' });
    expect(readRecovery(storage)[0].text).toBe('Latest draft before turning');
    release();
    expect(await flush).toBe(true);
    expect((await db.entries.get(entry.id))?.text).toBe(
      'Latest draft before turning',
    );
    expect((await db.entries.get(entry.id))?.revision).toBe(2);
    expect(states.at(-1)?.kind).toBe('saved');
    expect(storage.getItem(RECOVERY_KEY)).toBeNull();
    queue.dispose();
  });
  it('retains failed writing, never confirms Saved, and can retry successfully', async () => {
    const { db, page } = await database();
    const storage = new MemoryStorage();
    const states: SaveState[] = [];
    let fail = true;
    const queue = new SaveQueue(
      async (entry, revision) => {
        if (fail) throw new Error('Denied');
        return db.save(entry, revision);
      },
      (s) => states.push(s),
      storage,
    );
    const entry = {
      ...newEntry(page, { type: 'note', x: 28.5, y: 127.3 }),
      text: 'Do not lose this',
    };
    queue.edit(entry);
    expect(await queue.flush()).toBe(false);
    expect(states.map((s) => s.kind)).toEqual(['saving', 'error']);
    expect(queue.unsaved()[0].text).toBe(entry.text);
    expect(readRecovery(storage)[0].text).toBe(entry.text);
    fail = false;
    expect(await queue.flush()).toBe(true);
    expect((await db.entries.get(entry.id))?.text).toBe(entry.text);
    queue.dispose();
  });
  it('validates recovery instead of accepting arbitrary shapes', () => {
    const storage = new MemoryStorage();
    storage.setItem(RECOVERY_KEY, '[{"text":"unsafe"}]');
    expect(() => readRecovery(storage)).toThrow();
  });
});
