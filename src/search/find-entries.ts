import { isScheduled, type Entry, type PageRecord } from '../domain/model';
export interface SearchFilter {
  query: string;
  type: Entry['type'] | 'all';
  date: string;
}
export interface SearchResult {
  entry: Entry;
  date: string;
}
export function findEntries(
  entries: Entry[],
  pages: PageRecord[],
  filter: SearchFilter,
): SearchResult[] {
  const query = filter.query
    .trim()
    .normalize('NFKC')
    .toLocaleLowerCase('en-US');
  if (!query && !filter.date && filter.type === 'all') return [];
  const dates = new Map(pages.map((page) => [page.id, page.date]));
  const time = (entry: Entry) =>
    isScheduled(entry)
      ? entry.minute + entry.dayOffset * 1440
      : entry.type === 'task'
        ? -100 + entry.slot
        : 2000 + entry.y;
  return entries
    .filter(
      (entry) =>
        !entry.deletedAt &&
        dates.has(entry.pageId) &&
        (!filter.date || dates.get(entry.pageId) === filter.date) &&
        (filter.type === 'all' || entry.type === filter.type) &&
        (!query ||
          entry.text
            .normalize('NFKC')
            .toLocaleLowerCase('en-US')
            .includes(query)),
    )
    .map((entry) => ({ entry, date: dates.get(entry.pageId)! }))
    .sort(
      (a, b) =>
        a.date.localeCompare(b.date) ||
        time(a.entry) - time(b.entry) ||
        a.entry.id.localeCompare(b.entry.id),
    );
}
