import { manifest, type Book, type Preferences } from '../../src/domain/model';
import type { PlannerDB } from '../../src/local/repository';

// Synthetic pre-setup app data: compatibility tests keep the original IDs and position.
export const legacyBook: Book = {
  id: 'personal-2026',
  title: 'Daily Book',
  year: 2026,
  startDate: '2026-01-01',
  endDate: '2026-12-31',
  locale: 'en-US',
  todayTimeZone: 'UTC',
  templateVersion: 1,
};
export const legacyPreferences: Preferences = {
  id: 'local',
  bookId: legacyBook.id,
  pageIndex: 278,
  focusSide: 0,
  toolbarSide: 'right',
  zoom: 1,
};
export async function seedLegacyBook(db: PlannerDB) {
  await db.transaction('rw', [db.books, db.pages, db.preferences], async () => {
    await db.books.add(legacyBook);
    await db.pages.bulkAdd(manifest(legacyBook));
    await db.preferences.add(legacyPreferences);
  });
  return { book: legacyBook, preferences: legacyPreferences };
}
