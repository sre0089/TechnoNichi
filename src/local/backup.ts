import {
  assertEntry,
  manifest,
  type Book,
  type Entry,
  type PageRecord,
  type Preferences,
} from '../domain/model';

export const MAX_BACKUP_BYTES = 20 * 1024 * 1024;
export const MAX_BACKUP_ENTRIES = 50_000;

export interface PlannerBackup {
  format: 'daily-book-backup';
  version: 1;
  exportedAt: string;
  book: Book;
  pages: PageRecord[];
  entries: Entry[];
  preferences: Preferences;
}

function invalid(): never {
  throw new Error('This file is not a valid Daily Book backup.');
}

function record(value: unknown, keys: string[]): Record<string, unknown> {
  if (
    !value ||
    typeof value !== 'object' ||
    Array.isArray(value) ||
    Object.getPrototypeOf(value) !== Object.prototype ||
    Object.keys(value).some((key) => !keys.includes(key))
  )
    invalid();
  return value as Record<string, unknown>;
}

function identifier(value: unknown) {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    value.length <= 200 &&
    [...value].every(
      (character) =>
        character.charCodeAt(0) > 31 && character.charCodeAt(0) !== 127,
    )
  );
}

function timestamp(value: unknown) {
  return (
    typeof value === 'string' &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value) &&
    Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString() === value
  );
}

/** Validate the entire archive before any write; never interpret writing as HTML. */
export function validateBackup(value: unknown): PlannerBackup {
  const archive = record(value, [
    'format',
    'version',
    'exportedAt',
    'book',
    'pages',
    'entries',
    'preferences',
  ]);
  if (archive.format !== 'daily-book-backup') invalid();
  if (archive.version !== 1)
    throw new Error('This backup version is not supported.');
  if (!timestamp(archive.exportedAt)) invalid();
  const book = record(archive.book, [
    'id',
    'title',
    'year',
    'startDate',
    'endDate',
    'locale',
    'todayTimeZone',
    'templateVersion',
  ]);
  if (book.templateVersion !== 1)
    throw new Error('This backup uses an unsupported page template.');
  if (
    !identifier(book.id) ||
    String(book.id).length > 100 ||
    typeof book.title !== 'string' ||
    !book.title.trim() ||
    book.title.length > 200 ||
    !Number.isInteger(book.year) ||
    Number(book.year) < 1900 ||
    Number(book.year) > 2200 ||
    book.startDate !== `${book.year}-01-01` ||
    book.endDate !== `${book.year}-12-31` ||
    typeof book.locale !== 'string' ||
    !book.locale ||
    book.locale.length > 100 ||
    typeof book.todayTimeZone !== 'string' ||
    !book.todayTimeZone ||
    book.todayTimeZone.length > 100
  )
    invalid();
  try {
    new Intl.DateTimeFormat(book.locale, { timeZone: book.todayTimeZone });
  } catch {
    invalid();
  }

  const expected = manifest(book as unknown as Book);
  if (!Array.isArray(archive.pages) || archive.pages.length !== expected.length)
    invalid();
  const pageIds = new Set<string>();
  archive.pages.forEach((value, index) => {
    const page = record(value, ['id', 'bookId', 'date', 'kind', 'order']);
    if (
      Object.keys(expected[index]).some(
        (key) => page[key] !== expected[index][key as keyof PageRecord],
      )
    )
      invalid();
    pageIds.add(String(page.id));
  });
  const preferences = record(archive.preferences, [
    'id',
    'bookId',
    'pageIndex',
    'focusSide',
    'toolbarSide',
    'zoom',
  ]);
  if (
    preferences.id !== 'local' ||
    preferences.bookId !== book.id ||
    !Number.isInteger(preferences.pageIndex) ||
    Number(preferences.pageIndex) < 0 ||
    Number(preferences.pageIndex) >= expected.length ||
    Number(preferences.pageIndex) % 2 !== 0 ||
    ![0, 1].includes(Number(preferences.focusSide)) ||
    typeof preferences.focusSide !== 'number' ||
    !['left', 'right'].includes(String(preferences.toolbarSide)) ||
    ![0.85, 1, 1.15].includes(Number(preferences.zoom)) ||
    typeof preferences.zoom !== 'number' ||
    (preferences.focusSide === 1 &&
      Number(preferences.pageIndex) + 1 >= expected.length)
  )
    invalid();
  if (
    !Array.isArray(archive.entries) ||
    archive.entries.length > MAX_BACKUP_ENTRIES
  )
    invalid();
  const ids = new Set<string>();
  const taskSlots = new Set<string>();
  for (const value of archive.entries) {
    const baseKeys = [
      'id',
      'pageId',
      'text',
      'formatRuns',
      'revision',
      'deletedAt',
      'style',
      'type',
    ];
    const entry = record(value, [
      ...baseKeys,
      'minute',
      'dayOffset',
      'submitted',
      'completed',
      'x',
      'y',
      'width',
      'height',
      'slot',
    ]);
    const variantKeys =
      entry.type === 'task'
        ? ['slot', 'completed']
        : entry.type === 'scheduled-line'
          ? ['minute', 'dayOffset', 'submitted', 'completed']
          : entry.type === 'note'
            ? ['x', 'y', 'width', 'height']
            : [];
    if (
      Object.keys(entry).some(
        (key) => ![...baseKeys, ...variantKeys].includes(key),
      )
    )
      invalid();
    if (
      !identifier(entry.id) ||
      !pageIds.has(String(entry.pageId)) ||
      ids.has(String(entry.id)) ||
      typeof entry.text !== 'string' ||
      entry.text.length > 1_000_000 ||
      !Number.isSafeInteger(entry.revision) ||
      (entry.deletedAt !== null && !timestamp(entry.deletedAt))
    )
      invalid();
    record(entry.style, ['ink', 'emphasis', 'bold', 'italic', 'underline']);
    if (entry.formatRuns !== undefined) {
      if (!Array.isArray(entry.formatRuns) || entry.formatRuns.length > 20_000)
        invalid();
      entry.formatRuns.forEach((run) =>
        record(run, ['from', 'to', 'bold', 'italic', 'underline']),
      );
    }
    try {
      assertEntry(entry);
    } catch {
      invalid();
    }
    ids.add(entry.id);
    if (entry.type === 'task' && !entry.deletedAt) {
      const slot = `${entry.pageId}:task:${entry.slot}`;
      if (taskSlots.has(slot)) invalid();
      taskSlots.add(slot);
    }
  }
  return archive as unknown as PlannerBackup;
}

export function parseBackup(text: string): PlannerBackup {
  if (new TextEncoder().encode(text).byteLength > MAX_BACKUP_BYTES)
    throw new Error('Choose a backup smaller than 20 MB.');
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    invalid();
  }
  return validateBackup(value);
}

export function serializeBackup(archive: PlannerBackup): string {
  const text = JSON.stringify(validateBackup(archive), null, 2);
  if (new TextEncoder().encode(text).byteLength > MAX_BACKUP_BYTES)
    throw new Error('This book exceeds the 20 MB backup limit.');
  return text;
}
