import { expect, it } from 'vitest';
import {
  newTaskEntry,
  type Entry,
  type PageRecord,
} from '../../src/domain/model';
import { findEntries } from '../../src/search/find-entries';
const pages: PageRecord[] = [
  { id: 'page', bookId: 'book', date: '2026-10-06', kind: 'daily', order: 0 },
  { id: 'later', bookId: 'book', date: '2026-12-31', kind: 'daily', order: 1 },
];
const entries: Entry[] = [
  { ...newTaskEntry('page', 0, []), text: 'Read CAFÉ notes' },
  { ...newTaskEntry('later', 0, []), text: 'Café plan' },
  { ...newTaskEntry('elsewhere', 0, []), text: 'Café other book' },
  {
    ...newTaskEntry('page', 1, []),
    text: 'Café deleted',
    deletedAt: '2026-10-06T12:00:00.000Z',
  },
];
it('searches only active entries in this book, case-insensitively and chronologically', () => {
  const found = findEntries(entries, pages, {
    query: ' café ',
    type: 'all',
    date: '',
  });
  expect(found.map((result) => result.entry.text)).toEqual([
    'Read CAFÉ notes',
    'Café plan',
  ]);
});
it('filters exact civil date/type and normalizes equivalent Unicode', () => {
  expect(
    findEntries(entries, pages, {
      query: 'cafe\u0301',
      type: 'task',
      date: '2026-12-31',
    }).map((result) => result.entry.text),
  ).toEqual(['Café plan']);
  expect(
    findEntries(entries, pages, { query: 'café', type: 'note', date: '' }),
  ).toEqual([]);
});
it('supports date/type-only browsing without treating an empty query as the whole year', () => {
  expect(
    findEntries(entries, pages, { query: '', type: 'all', date: '' }),
  ).toEqual([]);
  expect(
    findEntries(entries, pages, {
      query: '',
      type: 'task',
      date: '2026-10-06',
    }),
  ).toHaveLength(1);
});
it('returns original identities without changing document records', () => {
  const before = structuredClone(entries);
  const found = findEntries(entries, pages, {
    query: 'notes',
    type: 'all',
    date: '',
  });
  expect(found[0].entry).toBe(entries[0]);
  expect(entries).toEqual(before);
});
