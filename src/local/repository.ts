import Dexie, { type Table } from 'dexie';
import {
  assertEntry,
  manifest,
  type Book,
  type Entry,
  type PageRecord,
  type Preferences,
} from '../domain/model';
import { validateBackup, type PlannerBackup } from './backup';
import { hourForTime } from '../templates/daily-v1';

export class RevisionConflict extends Error {
  constructor() {
    super('Another tab changed this item. Your draft is retained.');
  }
}

export class RestoreRefused extends Error {}
export class EntryRestoreRefused extends Error {}

export class PlannerDB extends Dexie {
  books!: Table<Book, string>;
  pages!: Table<PageRecord, string>;
  entries!: Table<Entry, string>;
  preferences!: Table<Preferences, string>;

  constructor(name = 'daily-book-v1') {
    super(name);
    this.version(1).stores({
      books: 'id',
      pages: 'id, bookId, date, [bookId+order]',
      entries: 'id, pageId',
      preferences: 'id',
    });
  }

  async initialize(): Promise<{ book: Book; preferences: Preferences }> {
    return this.transaction(
      'rw',
      this.books,
      this.pages,
      this.preferences,
      async () => {
        let preferences = await this.preferences.get('local');
        const id = preferences?.bookId ?? 'personal-2026';
        let book = await this.books.get(id);
        if (!book) {
          book = {
            id,
            title: 'Daily Book',
            year: 2026,
            startDate: '2026-01-01',
            endDate: '2026-12-31',
            locale: 'en-US',
            todayTimeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            templateVersion: 1,
          };
          await this.books.add(book);
          await this.pages.bulkAdd(manifest(book));
        }
        if (!preferences) {
          preferences = {
            id: 'local',
            bookId: id,
            pageIndex: 278,
            focusSide: 0,
            toolbarSide: 'right',
            zoom: 1,
          };
          await this.preferences.add(preferences);
        }
        return { book, preferences };
      },
    );
  }

  async readPages(pageIds: string[], includeDeleted = false): Promise<Entry[]> {
    const entries = await this.entries.where('pageId').anyOf(pageIds).toArray();
    entries.forEach(assertEntry);
    return includeDeleted ? entries : entries.filter((e) => !e.deletedAt);
  }

  async readDeleted(bookId: string): Promise<Entry[]> {
    return this.transaction('r', this.pages, this.entries, async () => {
      const pages = await this.pages.where('bookId').equals(bookId).toArray();
      if (!pages.length) return [];
      const entries = await this.readPages(
        pages.map((page) => page.id),
        true,
      );
      return entries
        .filter((entry) => entry.deletedAt)
        .sort(
          (a, b) =>
            b.deletedAt!.localeCompare(a.deletedAt!) ||
            a.id.localeCompare(b.id),
        );
    });
  }

  async deleteEntry(id: string, expectedRevision: number): Promise<Entry> {
    return this.transaction('rw', this.entries, async () => {
      const current = await this.entries.get(id);
      if (!current || current.revision !== expectedRevision)
        throw new RevisionConflict();
      if (current.deletedAt) throw new Error('This entry is already deleted.');
      assertEntry(current);
      const deleted = {
        ...current,
        deletedAt: new Date().toISOString(),
        revision: current.revision + 1,
      };
      await this.entries.put(deleted);
      return deleted;
    });
  }

  async restoreEntry(id: string, expectedRevision: number): Promise<Entry> {
    return this.transaction('rw', this.entries, this.pages, async () => {
      const current = await this.entries.get(id);
      if (!current || current.revision !== expectedRevision)
        throw new RevisionConflict();
      if (!current.deletedAt)
        throw new Error('This entry is already restored.');
      assertEntry(current);
      if (!(await this.pages.get(current.pageId)))
        throw new Error('Unknown page');
      const active = await this.readPages([current.pageId]);
      const occupied = active.some((entry) => {
        if (current.type === 'task')
          return entry.type === 'task' && entry.slot === current.slot;
        if (current.type === 'scheduled-line')
          return (
            entry.type === 'scheduled-line' &&
            hourForTime(entry.minute, entry.dayOffset) ===
              hourForTime(current.minute, current.dayOffset)
          );
        return (
          entry.type === 'note' &&
          entry.x < current.x + current.width &&
          entry.x + entry.width > current.x &&
          entry.y < current.y + current.height &&
          entry.y + entry.height > current.y
        );
      });
      if (occupied)
        throw new EntryRestoreRefused(
          'The original space is occupied. Delete the entry there before restoring. Your deleted writing is still retained.',
        );
      const restored = {
        ...current,
        deletedAt: null,
        revision: current.revision + 1,
      };
      await this.entries.put(restored);
      return restored;
    });
  }

  async exportBackup(bookId: string): Promise<PlannerBackup> {
    return this.transaction(
      'r',
      [this.books, this.pages, this.entries, this.preferences],
      async () => {
        const book = await this.books.get(bookId);
        const pages = await this.pages
          .where('bookId')
          .equals(bookId)
          .sortBy('order');
        const pageIds = new Set(pages.map((page) => page.id));
        const entries = (await this.entries.toArray()).filter((entry) =>
          pageIds.has(entry.pageId),
        );
        const preferences = await this.preferences.get('local');
        return validateBackup({
          format: 'daily-book-backup',
          version: 1,
          exportedAt: new Date().toISOString(),
          book,
          pages,
          entries,
          preferences,
        });
      },
    );
  }

  async restoreBackup(value: unknown): Promise<PlannerBackup> {
    // Copy before awaiting, so callers cannot mutate the validated payload mid-transaction.
    const backup = validateBackup(structuredClone(value));
    await this.transaction(
      'rw',
      [this.books, this.pages, this.entries, this.preferences],
      async () => {
        if (await this.entries.count())
          throw new RestoreRefused(
            'This planner has saved entries. Restore in a fresh browser profile to keep your current writing safe.',
          );
        // Only discard an empty bootstrap book, never unrelated metadata/books.
        const books = await this.books.toArray();
        const preferences = await this.preferences.get('local');
        const pages = await this.pages.orderBy('id').toArray();
        const expectedPages = books.length === 1 ? manifest(books[0]) : [];
        const bootstrap =
          books.length === 1 &&
          books[0].id === 'personal-2026' &&
          books[0].year === 2026 &&
          books[0].title === 'Daily Book' &&
          books[0].startDate === '2026-01-01' &&
          books[0].endDate === '2026-12-31' &&
          books[0].templateVersion === 1 &&
          preferences?.bookId === books[0].id &&
          (await this.preferences.count()) === 1 &&
          pages.length === 365 &&
          pages.every((page, index) => {
            const expected = expectedPages[index];
            return (
              page.id === expected.id &&
              page.bookId === expected.bookId &&
              page.date === expected.date &&
              page.kind === expected.kind &&
              page.order === expected.order
            );
          });
        if (
          (books.length || pages.length || (await this.preferences.count())) &&
          !bootstrap
        )
          throw new RestoreRefused(
            'This planner already contains a book. Restore in a fresh browser profile.',
          );
        await this.books.clear();
        await this.pages.clear();
        await this.preferences.clear();
        await this.books.add(backup.book);
        await this.pages.bulkAdd(backup.pages);
        await this.entries.bulkAdd(backup.entries);
        await this.preferences.add(backup.preferences);
        // Do not catch a request failure here: it must abort the complete restore.
      },
    );
    return backup;
  }

  async save(entry: Entry, expectedRevision: number): Promise<Entry> {
    assertEntry(entry);
    return this.transaction('rw', this.entries, this.pages, async () => {
      if (!(await this.pages.get(entry.pageId)))
        throw new Error('Unknown page');
      const current = await this.entries.get(entry.id);
      if ((current?.revision ?? 0) !== expectedRevision)
        throw new RevisionConflict();
      const saved = { ...entry, revision: expectedRevision + 1 };
      await this.entries.put(saved);
      return saved;
    });
  }
}
