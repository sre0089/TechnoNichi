import Dexie, { type Table } from 'dexie';
import {
  assertEntry,
  manifest,
  type Book,
  type Entry,
  type PageRecord,
  type Preferences,
} from '../domain/model';

export class RevisionConflict extends Error {
  constructor() {
    super('Another tab changed this item. Your draft is retained.');
  }
}

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
        const id = 'personal-2026';
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
        let preferences = await this.preferences.get('local');
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

  async readPages(pageIds: string[]): Promise<Entry[]> {
    const entries = await this.entries.where('pageId').anyOf(pageIds).toArray();
    entries.forEach(assertEntry);
    return entries.filter((e) => !e.deletedAt);
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
