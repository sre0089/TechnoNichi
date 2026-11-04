import 'fake-indexeddb/auto';
import { afterEach, expect, it } from 'vitest';
import {
  assertEntry,
  newEntry,
  type Entry,
  type NoteLine,
} from '../../src/domain/model';
import { noteNumbers } from '../../src/domain/note-lines';
import {
  documentFor,
  contentForDocument,
} from '../../src/editor/rich-document';
import { PlannerDB } from '../../src/local/repository';
import { PageHistory } from '../../src/local/page-history';
import {
  parseBackup,
  serializeBackup,
  validateBackup,
} from '../../src/local/backup';
import { seedLegacyBook } from '../fixtures/legacy-book';

const databases: PlannerDB[] = [];
afterEach(async () => {
  await Promise.all(databases.splice(0).map((db) => db.delete()));
});
const note = () =>
  newEntry('page', { type: 'note', x: 28.5, y: 127.3 }) as Extract<
    Entry,
    { type: 'note' }
  >;

it('round trips mixed lists, Unicode, blank lines, completion, depths and word marks including newline marks', () => {
  const entry = {
    ...note(),
    text: 'Plan 🐱\nBuy milk\nDetails\n\nNext',
    noteLines: [
      { kind: 'plain', indent: 0 },
      { kind: 'todo', indent: 0, checked: true },
      { kind: 'bullet', indent: 1 },
      { kind: 'plain', indent: 0 },
      { kind: 'number', indent: 0 },
    ] as NoteLine[],
    formatRuns: [
      { from: 0, to: 15, bold: true },
      { from: 15, to: 26, italic: true, underline: true },
    ],
  };
  assertEntry(entry);
  expect(contentForDocument(documentFor(entry), true)).toEqual({
    text: entry.text,
    formatRuns: entry.formatRuns,
    noteLines: entry.noteLines,
  });
});

it('does not infer lists from legacy punctuation or change existing notes on conversion', () => {
  const entry = {
    ...note(),
    text: '- keep this\n\t old spaces\n/ not a command\n',
    formatRuns: [{ from: 0, to: 17, bold: true }],
  };
  expect(contentForDocument(documentFor(entry), true)).toEqual({
    text: entry.text,
    formatRuns: entry.formatRuns,
    noteLines: undefined,
  });
  expect(entry).not.toHaveProperty('noteLines');
});

it('numbers siblings independently and restarts after a plain line or a new list', () => {
  const lines = (
    [
      'number:0',
      'number:1',
      'number:1',
      'bullet:2',
      'number:1',
      'number:0',
      'plain:0',
      'number:0',
      'todo:0',
      'number:0',
    ] as const
  ).map((value) => {
    const [kind, indent] = value.split(':');
    return { kind, indent: Number(indent) } as NoteLine;
  });
  expect(noteNumbers(lines)).toEqual([1, 1, 2, 0, 3, 2, 0, 1, 0, 1]);
});

it('rejects malformed metadata before saving or importing it', () => {
  for (const noteLines of [
    null,
    {},
    [],
    [{ kind: 'todo', indent: 0, checked: 'yes' }],
    [{ kind: 'todo', indent: -1 }],
    [{ kind: 'todo', indent: 7 }],
    [{ kind: 'html', indent: 0 }],
    [{ kind: 'bullet', indent: 0, checked: true }],
    [{ kind: 'plain', indent: 0, html: '<script>' }],
    [
      { kind: 'plain', indent: 0 },
      { kind: 'plain', indent: 0 },
    ],
  ])
    expect(() => assertEntry({ ...note(), text: 'One', noteLines })).toThrow(
      'Invalid note lines',
    );
  expect(() =>
    assertEntry({
      ...newEntry('page', { type: 'task', slot: 0 }),
      noteLines: [{ kind: 'plain', indent: 0 }],
    }),
  ).toThrow('Invalid note lines');
});

it('restores v3 metadata exactly, keeps v1/v2 readers safe and retains newer list edits through geometry undo', async () => {
  const db = new PlannerDB(`lists-${crypto.randomUUID()}`);
  databases.push(db);
  const { book } = await seedLegacyBook(db);
  const original = await db.save(
    {
      ...note(),
      pageId: `${book.id}:daily:2026-10-06`,
      text: 'Plan\nSubtask',
      noteLines: [
        { kind: 'todo', indent: 0, checked: false },
        { kind: 'todo', indent: 1, checked: true },
      ],
    },
    0,
  );
  const history = new PageHistory();
  if (original.type !== 'note') throw new Error('Expected note');
  const moved = await db.save(
    { ...original, x: original.x + 3.7 },
    original.revision,
  );
  if (moved.type !== 'note') throw new Error('Expected note');
  history.edit(original, moved);
  const written = await db.save(
    {
      ...moved,
      noteLines: [
        { kind: 'todo', indent: 0, checked: true },
        { kind: 'bullet', indent: 2 },
      ],
    },
    moved.revision,
  );
  if (written.type !== 'note') throw new Error('Expected note');
  history.edit(moved, written);
  expect(history.info().undoCount).toBe(1);
  const undo = history.request('undo')!;
  const undone = await db.applyHistory(undo.expected, undo.target);
  if (undone.type !== 'note') throw new Error('Expected note');
  expect(undone).toMatchObject({
    x: original.x,
    text: written.text,
    noteLines: written.noteLines,
  });
  const archive = parseBackup(serializeBackup(await db.exportBackup(book.id)));
  expect(archive.version).toBe(3);
  for (const version of [1, 2])
    expect(() => validateBackup({ ...archive, version })).toThrow();
  const target = new PlannerDB(`lists-target-${crypto.randomUUID()}`);
  databases.push(target);
  await target.restoreBackup(archive);
  target.close();
  await target.open();
  await expect(target.initialize()).resolves.toMatchObject({ book });
  expect(await target.entries.get(undone.id)).toEqual(undone);
  const legacy = {
    ...archive,
    version: 2 as const,
    entries: archive.entries.map(({ ...entry }) => {
      if (entry.type === 'note') delete entry.noteLines;
      return entry;
    }),
  };
  expect(validateBackup(legacy).version).toBe(2);
  expect(validateBackup({ ...legacy, version: 1 }).version).toBe(1);
  // An optional undefined field may exist on in-memory/IndexedDB records before
  // JSON serialization removes it. It must not block an ordinary v2 export.
  const ordinary = await db.save(
    { ...undone, noteLines: undefined },
    undone.revision,
  );
  const ordinaryArchive = await db.exportBackup(book.id);
  expect(ordinaryArchive.version).toBe(2);
  expect(parseBackup(serializeBackup(ordinaryArchive)).entries[0]).toEqual(
    JSON.parse(JSON.stringify(ordinary)),
  );
});
