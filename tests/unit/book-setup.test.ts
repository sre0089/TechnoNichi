import 'fake-indexeddb/auto';
import { afterEach, expect, it, vi } from 'vitest';
import { PlannerDB, BookSetupRequired } from '../../src/local/repository';
import { openingPreferences, prepareBook } from '../../src/local/book-setup';
import { validateBackup } from '../../src/local/backup';
import { newEntry } from '../../src/domain/model';
import { seedLegacyBook } from '../fixtures/legacy-book';

const databases: PlannerDB[] = [];
function database() {
  const db = new PlannerDB(`setup-${crypto.randomUUID()}`);
  databases.push(db);
  return db;
}
const input = {
  title: ' My book ',
  year: 2026,
  todayTimeZone: 'UTC',
  opening: 'today' as const,
};
const now = new Date('2026-10-07T01:00:00Z');
afterEach(async () => {
  vi.restoreAllMocks();
  await Promise.all(databases.splice(0).map((db) => db.delete()));
});
it('detects a completely fresh store without creating metadata', async () => {
  const db = database();
  await expect(db.initialize()).rejects.toBeInstanceOf(BookSetupRequired);
  expect(await db.books.count()).toBe(0);
  expect(await db.pages.count()).toBe(0);
  expect(await db.preferences.count()).toBe(0);
});
it.each([2026, 2027, 2028])(
  'atomically creates and reopens a chosen %i book',
  async (year) => {
    const db = database();
    const created = await db.createBook({ ...input, year }, now);
    expect(created.book.title).toBe('My book');
    expect(created.book.id).not.toBe('personal-2026');
    expect(await db.pages.count()).toBe(year === 2028 ? 366 : 365);
    expect(await db.entries.count()).toBe(0);
    expect(await db.initialize()).toEqual(created);
    await expect(db.createBook(input)).rejects.toThrow(
      'already contains a book',
    );
  },
);
it('opens Today on the correct side in the stored timezone and falls back outside the year', () => {
  const archive = prepareBook(input, now);
  expect(archive.preferences).toMatchObject({ pageIndex: 278, focusSide: 1 });
  expect(
    openingPreferences(
      { ...archive.book, todayTimeZone: 'America/Los_Angeles' },
      archive.preferences,
      now,
    ),
  ).toMatchObject({ pageIndex: 278, focusSide: 0 });
  expect(
    openingPreferences(
      archive.book,
      archive.preferences,
      new Date('2027-01-01T12:00:00Z'),
    ),
  ).toEqual(archive.preferences);
  expect(prepareBook({ ...input, year: 2028 }, now).preferences).toMatchObject({
    pageIndex: 0,
    focusSide: 0,
  });
});
it('preserves old books and resumes when the new preference is absent', async () => {
  const db = database();
  const old = await seedLegacyBook(db);
  expect(await db.initialize()).toEqual(old);
  expect(openingPreferences(old.book, old.preferences, now)).toEqual(
    old.preferences,
  );
  await expect(db.restoreBackup(prepareBook(input, now))).rejects.toThrow(
    'already contains a book',
  );
  expect(await db.initialize()).toEqual(old);
});
it('preserves an empty imported book even when it looks exactly like the old bootstrap', async () => {
  const source = database();
  await seedLegacyBook(source);
  const archive = await source.exportBackup('personal-2026');
  const target = database();
  await target.restoreBackup(archive);
  await expect(target.restoreBackup(prepareBook(input, now))).rejects.toThrow(
    'already contains a book',
  );
  expect((await target.initialize()).book).toEqual(archive.book);
});
it('refuses incomplete metadata without repairing or discarding it', async () => {
  const db = database();
  const prepared = prepareBook(input, now);
  await db.books.add(prepared.book);
  await expect(db.initialize()).rejects.toThrow('metadata is incomplete');
  await expect(db.createBook(input)).rejects.toThrow('already contains a book');
  expect(await db.books.toArray()).toEqual([prepared.book]);
});
it('rolls back setup when the last write fails and allows retry', async () => {
  const db = database();
  vi.spyOn(db.preferences, 'add').mockRejectedValueOnce(
    new Error('Synthetic quota'),
  );
  await expect(db.createBook(input, now)).rejects.toThrow('could not be saved');
  await expect(db.initialize()).rejects.toBeInstanceOf(BookSetupRequired);
  await db.createBook(input, now);
  expect(await db.books.count()).toBe(1);
});
it('serializes competing create and import operations without replacing the winner', async () => {
  const db = database();
  const other = new PlannerDB(db.name);
  try {
    const results = await Promise.allSettled([
      db.createBook(input, now),
      other.restoreBackup(prepareBook({ ...input, title: 'Imported' }, now)),
    ]);
    expect(
      results.filter((result) => result.status === 'fulfilled'),
    ).toHaveLength(1);
    expect(await db.books.count()).toBe(1);
    expect(await db.pages.count()).toBe(365);
  } finally {
    other.close();
  }
});
it.each([
  { year: 1899 },
  { year: 2201 },
  { year: 2026.5 },
  { title: '   ' },
  { todayTimeZone: 'Made/Up' },
])('rejects invalid setup before touching storage: %j', async (invalid) => {
  const db = database();
  await expect(db.createBook({ ...input, ...invalid }, now)).rejects.toThrow();
  expect(await db.books.count()).toBe(0);
});
it('round trips opening choice and accepts v1/v2 archives with no choice', () => {
  const archive = prepareBook(input, now);
  expect(validateBackup(archive).preferences.opening).toBe('today');
  delete archive.preferences.opening;
  expect(
    validateBackup({ ...archive, version: 1 }).preferences.opening,
  ).toBeUndefined();
  expect(validateBackup(archive).preferences.opening).toBeUndefined();
  expect(() =>
    validateBackup({
      ...archive,
      preferences: { ...archive.preferences, opening: 'invalid' },
    }),
  ).toThrow();
});

it('does not classify orphaned writing as a fresh store', async () => {
  const db = database();
  const draft = {
    ...newEntry('missing-page', { type: 'task', slot: 0 }),
    text: 'Keep orphaned writing',
  };
  await db.entries.add(draft);
  await expect(db.initialize()).rejects.toThrow('metadata is incomplete');
  await expect(db.createBook(input, now)).rejects.toThrow('saved entries');
  expect(await db.entries.toArray()).toEqual([draft]);
});
