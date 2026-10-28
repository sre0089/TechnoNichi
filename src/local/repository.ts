import Dexie, { type Table } from 'dexie';
import {
  assertEntry,
  isScheduled,
  manifest,
  sameContent,
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
export type ConflictChoice = 'mine' | 'saved' | 'both';

function occupiesPlace(target: Entry, entry: Entry) {
  // Duration tasks permit overlap and do not reserve a single writing slot.
  if (target.type === 'scheduled-block') return false;
  if (target.type === 'task')
    return entry.type === 'task' && target.slot === entry.slot;
  if (target.type === 'scheduled-line')
    return (
      entry.type === 'scheduled-line' &&
      hourForTime(target.minute, target.dayOffset) ===
        hourForTime(entry.minute, entry.dayOffset)
    );
  return (
    entry.type === 'note' &&
    entry.x < target.x + target.width &&
    entry.x + entry.width > target.x &&
    entry.y < target.y + target.height &&
    entry.y + entry.height > target.y
  );
}

function samePlacement(a: Entry, b: Entry) {
  if (a.type === 'scheduled-block')
    return (
      b.type === 'scheduled-block' &&
      a.minute === b.minute &&
      a.dayOffset === b.dayOffset &&
      a.endMinute === b.endMinute &&
      a.endDayOffset === b.endDayOffset
    );
  if (a.type === 'task') return b.type === 'task' && a.slot === b.slot;
  if (a.type === 'scheduled-line')
    return (
      b.type === 'scheduled-line' &&
      a.minute === b.minute &&
      a.dayOffset === b.dayOffset
    );
  return (
    b.type === 'note' &&
    a.x === b.x &&
    a.y === b.y &&
    a.width === b.width &&
    a.height === b.height
  );
}

function recoveryCopy(entry: Entry): Entry {
  return {
    ...entry,
    id: crypto.randomUUID(),
    revision: 1,
    deletedAt: new Date().toISOString(),
  };
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
      const occupied = active.some((entry) => occupiesPlace(current, entry));
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
          version: 2,
          exportedAt: new Date().toISOString(),
          book,
          pages,
          entries,
          preferences,
        });
      },
    );
  }

  async resolveConflict(
    value: Entry,
    savedRevision: number | undefined,
    choice: ConflictChoice,
  ) {
    const draft = structuredClone(value);
    assertEntry(draft);
    return this.transaction('rw', this.entries, this.pages, async () => {
      const current = await this.entries.get(draft.id);
      if (current?.revision !== savedRevision) throw new RevisionConflict();
      if (current) {
        assertEntry(current);
        if (
          current.pageId !== draft.pageId ||
          (current.type !== draft.type &&
            !(isScheduled(current) && isScheduled(draft)))
        )
          throw new Error(
            'The saved entry changed kind or page. Your draft is retained.',
          );
      }
      if (choice === 'saved') return { entry: current, changed: false };
      if (!(await this.pages.get(draft.pageId)))
        throw new Error(
          'The original page is no longer available. Your draft is retained.',
        );
      if (choice === 'both') {
        await this.entries.add(recoveryCopy(draft));
        return { entry: current, changed: true };
      }
      if (!current || current.deletedAt || !samePlacement(current, draft)) {
        const active = await this.readPages([draft.pageId]);
        if (
          active.some(
            (entry) => entry.id !== draft.id && occupiesPlace(draft, entry),
          )
        )
          throw new EntryRestoreRefused(
            'The original space is occupied. Choose Keep both to retain your draft as a recovery copy.',
          );
      }
      // Preserve the version explicitly being replaced in the same transaction.
      if (current) await this.entries.add(recoveryCopy(current));
      const saved = {
        ...draft,
        revision: (current?.revision ?? 0) + 1,
        deletedAt: null,
      };
      await this.entries.put(saved);
      return { entry: saved, changed: true };
    });
  }

  async retainDraftCopy(value: Entry) {
    const draft = structuredClone(value);
    assertEntry(draft);
    return this.transaction('rw', this.entries, this.pages, async () => {
      if (!(await this.pages.get(draft.pageId)))
        throw new Error(
          'The original page is no longer available. Your retained writing has not been cleared.',
        );
      const copy = recoveryCopy(draft);
      await this.entries.add(copy);
      return copy;
    });
  }

  async applyHistory(
    expectedValue: Entry,
    targetValue: Entry | null,
  ): Promise<Entry> {
    const expected = structuredClone(expectedValue);
    const target = targetValue ? structuredClone(targetValue) : null;
    assertEntry(expected);
    if (target) assertEntry(target);
    return this.transaction('rw', this.entries, this.pages, async () => {
      const current = await this.entries.get(expected.id);
      if (
        !current ||
        current.revision !== expected.revision ||
        !sameContent(current, expected)
      )
        throw new RevisionConflict();
      if (
        target &&
        (target.id !== current.id ||
          target.pageId !== current.pageId ||
          (target.type !== current.type &&
            !(isScheduled(target) && isScheduled(current))))
      )
        throw new Error('History changed entry identity.');
      const saved: Entry = target
        ? {
            ...target,
            text: current.text,
            formatRuns: current.formatRuns,
            style: current.style,
            revision: current.revision + 1,
            deletedAt: target.deletedAt ? new Date().toISOString() : null,
          }
        : {
            ...current,
            deletedAt: new Date().toISOString(),
            revision: current.revision + 1,
          };
      assertEntry(saved);
      if (!(await this.pages.get(saved.pageId)))
        throw new Error('The original page is no longer available.');
      if (
        !saved.deletedAt &&
        (current.deletedAt || !samePlacement(current, saved))
      ) {
        const occupied = (await this.readPages([saved.pageId])).some(
          (entry) => entry.id !== saved.id && occupiesPlace(saved, entry),
        );
        if (occupied)
          throw new EntryRestoreRefused(
            'The original space is occupied. Your writing and history are retained.',
          );
      }
      await this.entries.put(saved);
      return saved;
    });
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
