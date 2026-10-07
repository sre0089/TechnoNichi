import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  manifest,
  newEntry,
  type Book,
  type Entry,
} from '../../src/domain/model';
import {
  MAX_BACKUP_BYTES,
  parseBackup,
  serializeBackup,
  validateBackup,
  type PlannerBackup,
} from '../../src/local/backup';
import { PlannerDB } from '../../src/local/repository';

const databases: PlannerDB[] = [];
function database() {
  const db = new PlannerDB(`backup-test-${crypto.randomUUID()}`);
  databases.push(db);
  return db;
}
afterEach(async () => {
  vi.restoreAllMocks();
  await Promise.all(databases.splice(0).map((db) => db.delete()));
});

function fixture(): PlannerBackup {
  const book: Book = {
    id: 'restored-2028',
    title: 'My book',
    year: 2028,
    startDate: '2028-01-01',
    endDate: '2028-12-31',
    locale: 'en-US',
    todayTimeZone: 'America/New_York',
    templateVersion: 1,
  };
  const pages = manifest(book);
  const entries: Entry[] = [
    {
      ...newEntry(pages[0].id, {
        type: 'scheduled-line',
        minute: 45,
        dayOffset: 1,
      }),
      text: 'Read 🎉 notes',
      formatRuns: [
        { from: 0, to: 4, bold: true },
        { from: 8, to: 13, italic: true, underline: true },
      ],
      revision: 12,
      submitted: true,
      completed: true,
    },
    {
      ...newEntry(pages[365].id, { type: 'note', x: 28.5, y: 127.3 }),
      text: 'Year end\nSecond line',
      revision: 4,
    },
    {
      ...newEntry(pages[59].id, { type: 'task', slot: 0 }),
      text: 'Leap day',
      completed: true,
      revision: 1,
    },
    {
      ...newEntry(pages[0].id, {
        type: 'scheduled-line',
        minute: 720,
        dayOffset: 0,
      }),
      submitted: undefined,
      completed: undefined,
      text: 'Legacy plain writing',
      revision: 2,
    },
    {
      ...newEntry(pages[90].id, { type: 'task', slot: 1 }),
      text: 'Deleted record',
      revision: 3,
      deletedAt: '2026-10-06T12:00:00.000Z',
    },
  ];
  // JSON records omit flags that did not exist in earlier versions.
  return JSON.parse(
    JSON.stringify({
      format: 'daily-book-backup',
      version: 1,
      exportedAt: '2026-10-06T12:00:00.000Z',
      book,
      pages,
      entries,
      preferences: {
        id: 'local',
        bookId: book.id,
        pageIndex: 0,
        focusSide: 1,
        toolbarSide: 'left',
        zoom: 0.85,
      },
    }),
  );
}

async function snapshot(db: PlannerDB) {
  return {
    books: await db.books.toArray(),
    pages: await db.pages.toArray(),
    entries: await db.entries.toArray(),
    preferences: await db.preferences.toArray(),
  };
}

describe('versioned backup validation', () => {
  it('preserves a leap-year manifest, all dates, UTF-16 word ranges, legacy flags and deleted records', () => {
    const backup = fixture();
    expect(parseBackup(serializeBackup(backup))).toEqual(backup);
    expect(backup.pages).toHaveLength(366);
  });
  it.each([
    [
      'unknown version',
      (b: PlannerBackup) => {
        b.version = 2 as 1;
      },
    ],
    [
      'unknown template',
      (b: PlannerBackup) => {
        b.book.templateVersion = 2;
      },
    ],
    [
      'missing date',
      (b: PlannerBackup) => {
        b.pages.pop();
      },
    ],
    [
      'duplicate page',
      (b: PlannerBackup) => {
        b.pages[1] = b.pages[0];
      },
    ],
    [
      'duplicate entry',
      (b: PlannerBackup) => {
        b.entries.push(b.entries[0]);
      },
    ],
    [
      'missing page reference',
      (b: PlannerBackup) => {
        b.entries[0].pageId = 'missing';
      },
    ],
    [
      'invalid formatting',
      (b: PlannerBackup) => {
        b.entries[0].formatRuns![0].to = 999;
      },
    ],
    [
      'invalid time',
      (b: PlannerBackup) => {
        if (b.entries[0].type === 'scheduled-line') b.entries[0].minute = 300;
      },
    ],
    [
      'invalid preference',
      (b: PlannerBackup) => {
        b.preferences.pageIndex = 999;
      },
    ],
    [
      'invalid geometry',
      (b: PlannerBackup) => {
        if (b.entries[1].type === 'note') b.entries[1].width = 900;
      },
    ],
    [
      'unsafe revision',
      (b: PlannerBackup) => {
        b.entries[0].revision = Number.MAX_SAFE_INTEGER + 1;
      },
    ],
    [
      'invalid deletion date',
      (b: PlannerBackup) => {
        b.entries[4].deletedAt = 'invalid';
      },
    ],
    [
      'duplicate active checklist slot',
      (b: PlannerBackup) => {
        b.entries.push({ ...b.entries[2], id: 'another-id' });
      },
    ],
    [
      'unknown embedded field',
      (b: PlannerBackup) => {
        Object.assign(b.entries[0].style, { html: '<script>' });
      },
    ],
  ])('rejects %s', (_name, mutate) => {
    const backup = fixture();
    mutate(backup);
    expect(() => validateBackup(backup)).toThrow();
  });
  it('rejects malformed JSON, extra/prototype fields and oversized UTF-8 input', () => {
    expect(() => parseBackup('{')).toThrow('valid Daily Book');
    const text = serializeBackup(fixture()).replace(
      '"version": 1',
      '"version": 1, "__proto__": {}',
    );
    expect(() => parseBackup(text)).toThrow();
    expect(() => parseBackup('🎉'.repeat(MAX_BACKUP_BYTES / 4 + 1))).toThrow(
      '20 MB',
    );
  });
});

describe('transactional book restoration', () => {
  it('round trips all records into a blank initialized planner and reopens the restored book', async () => {
    const original = fixture();
    const source = database();
    await source.restoreBackup(original);
    const exported = await source.exportBackup(original.book.id);
    const target = database();
    await target.initialize();
    await target.restoreBackup(parseBackup(serializeBackup(exported)));
    target.close();
    await target.open();
    expect(await target.initialize()).toEqual({
      book: original.book,
      preferences: original.preferences,
    });
    const result = await target.exportBackup(original.book.id);
    expect({
      ...result,
      exportedAt: original.exportedAt,
      entries: [...result.entries].sort((a, b) => a.id.localeCompare(b.id)),
    }).toEqual({
      ...original,
      entries: [...original.entries].sort((a, b) => a.id.localeCompare(b.id)),
    });
    expect(await target.books.count()).toBe(1);
    const saved = await target.save(
      { ...original.entries[0], text: original.entries[0].text + '!' },
      12,
    );
    expect(saved.revision).toBe(13);
  });
  it('refuses existing entries, including empty saved slots, without altering any table', async () => {
    const target = database();
    const { book } = await target.initialize();
    await target.save(
      newEntry(manifest(book)[0].id, { type: 'task', slot: 0 }),
      0,
    );
    const before = await snapshot(target);
    await expect(target.restoreBackup(fixture())).rejects.toThrow(
      'saved entries',
    );
    expect(await snapshot(target)).toEqual(before);
  });
  it('rolls back metadata and records when writing fails partway through a valid restore', async () => {
    const target = database();
    await target.initialize();
    const before = await snapshot(target);
    vi.spyOn(target.preferences, 'add').mockRejectedValueOnce(
      new DOMException('Synthetic quota failure', 'QuotaExceededError'),
    );
    await expect(target.restoreBackup(fixture())).rejects.toThrow(
      'Synthetic quota failure',
    );
    expect(await snapshot(target)).toEqual(before);
  });
  it('rejects invalid archives before mutation and preserves an unrelated empty book', async () => {
    const target = database();
    await target.restoreBackup(fixture());
    await target.entries.clear();
    const before = await snapshot(target);
    const invalid = fixture();
    invalid.entries.push(invalid.entries[0]);
    await expect(target.restoreBackup(invalid)).rejects.toThrow();
    await expect(target.restoreBackup(fixture())).rejects.toThrow(
      'already contains a book',
    );
    expect(await snapshot(target)).toEqual(before);
  });
  it('serializes two restore attempts so the second cannot overwrite the first', async () => {
    const target = database();
    await target.initialize();
    const other = new PlannerDB(target.name);
    try {
      const results = await Promise.allSettled([
        target.restoreBackup(fixture()),
        other.restoreBackup(fixture()),
      ]);
      expect(results.map((result) => result.status).sort()).toEqual([
        'fulfilled',
        'rejected',
      ]);
      expect(await target.entries.count()).toBe(fixture().entries.length);
    } finally {
      other.close();
    }
  });
});
