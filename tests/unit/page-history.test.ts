import 'fake-indexeddb/auto';
import { afterEach, expect, it } from 'vitest';
import { newTaskEntry } from '../../src/domain/model';
import { PageHistory } from '../../src/local/page-history';
import {
  PlannerDB,
  RevisionConflict,
  EntryRestoreRefused,
} from '../../src/local/repository';
const databases: PlannerDB[] = [];
async function setup() {
  const db = new PlannerDB(`history-${crypto.randomUUID()}`);
  databases.push(db);
  const { book } = await db.initialize();
  const entry = await db.save(
    {
      ...newTaskEntry(`${book.id}:daily:2026-10-06`, 0, []),
      text: 'Keep words',
    },
    0,
  );
  return { db, entry, history: new PageHistory() };
}
afterEach(async () => {
  await Promise.all(databases.splice(0).map((db) => db.delete()));
});
it('undoes completion as a new revision while retaining later words and marks', async () => {
  const { db, entry, history } = await setup();
  const complete = await db.save({ ...entry, completed: true }, 1);
  history.edit(entry, complete);
  const written = await db.save(
    {
      ...complete,
      text: 'New words',
      formatRuns: [{ from: 0, to: 3, bold: true }],
    },
    2,
  );
  history.edit(complete, written);
  history.observe(written);
  const request = history.request('undo')!;
  const undone = await db.applyHistory(request.expected, request.target);
  history.complete('undo', undone);
  expect(undone).toMatchObject({
    completed: false,
    text: 'New words',
    revision: 4,
    formatRuns: written.formatRuns,
  });
  const redo = history.request('redo')!;
  const redone = await db.applyHistory(redo.expected, redo.target);
  history.complete('redo', redone);
  expect(redone).toMatchObject({
    completed: true,
    text: 'New words',
    revision: 5,
  });
});
it('undoes creation to a recoverable tombstone and redoes the same identity', async () => {
  const { db, entry, history } = await setup();
  history.record(null, entry);
  const request = history.request('undo')!;
  const deleted = await db.applyHistory(request.expected, request.target);
  history.complete('undo', deleted);
  expect(deleted.deletedAt).toBeTruthy();
  expect(deleted.text).toBe(entry.text);
  const redo = history.request('redo')!;
  const restored = await db.applyHistory(redo.expected, redo.target);
  expect(restored).toMatchObject({
    id: entry.id,
    deletedAt: null,
    text: entry.text,
    revision: 3,
  });
});
it('refuses stale undo without overwriting another tab or consuming history', async () => {
  const { db, entry, history } = await setup();
  history.record(null, entry);
  const newer = await db.save({ ...entry, text: 'Other tab' }, 1);
  const request = history.request('undo')!;
  await expect(
    db.applyHistory(request.expected, request.target),
  ).rejects.toBeInstanceOf(RevisionConflict);
  expect(await db.entries.get(entry.id)).toEqual(newer);
  expect(history.info().undoCount).toBe(1);
});
it('refuses restoration into occupied space and rolls back failed writes', async () => {
  const { db, entry, history } = await setup();
  const deleted = await db.deleteEntry(entry.id, 1);
  history.record(entry, deleted);
  await db.save(
    { ...newTaskEntry(entry.pageId, 0, [deleted]), text: 'Replacement' },
    0,
  );
  const request = history.request('undo')!;
  await expect(
    db.applyHistory(request.expected, request.target),
  ).rejects.toBeInstanceOf(EntryRestoreRefused);
  expect(await db.entries.get(entry.id)).toEqual(deleted);
  const fail = () => {
    throw new Error('Quota');
  };
  db.entries.hook('updating', fail);
  await expect(db.applyHistory(deleted, null)).rejects.toThrow('Quota');
  db.entries.hook('updating').unsubscribe(fail);
  expect(await db.entries.get(entry.id)).toEqual(deleted);
});
it('bounds history, clears redo after new edits and resets on explicit replacement', () => {
  const history = new PageHistory(2);
  const entry = newTaskEntry('page', 0, []);
  for (let i = 0; i < 3; i++) history.record(null, { ...entry, id: `id${i}` });
  expect(history.info().undoCount).toBe(2);
  history.complete('undo', { ...entry, id: 'id2' });
  history.edit(entry, { ...entry, text: 'Typed' });
  expect(history.info().redoCount).toBe(0);
  history.reset();
  expect(history.info().undoCount).toBe(0);
});
