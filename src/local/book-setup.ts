import { dateDestination, todayInZone } from '../domain/calendar';
import { manifest, type Book, type Preferences } from '../domain/model';
import { validateBackup } from './backup';

export interface BookSetup {
  title: string;
  year: number;
  todayTimeZone: string;
  opening: 'today' | 'resume';
}

export function openingPreferences(
  book: Book,
  preferences: Preferences,
  now = new Date(),
): Preferences {
  if (preferences.opening !== 'today') return preferences;
  const today = todayInZone(book.todayTimeZone, now);
  const pages = manifest(book);
  if (!pages.some((page) => page.date === today)) return preferences;
  const { pageIndex, focusSide } = dateDestination(pages, today);
  return { ...preferences, pageIndex, focusSide };
}

export function prepareBook(input: BookSetup, now = new Date()) {
  if (!Number.isInteger(input.year) || input.year < 1900 || input.year > 2200)
    throw new Error('Choose a year from 1900 through 2200.');
  if (!input.title.trim() || input.title.trim().length > 200)
    throw new Error('Give your book a name of up to 200 characters.');
  if (!['today', 'resume'].includes(input.opening))
    throw new Error('Choose Today or Resume for opening your book.');
  try {
    todayInZone(input.todayTimeZone, now);
  } catch {
    throw new Error(
      'Choose a valid timezone, such as America/New_York or UTC.',
    );
  }
  const book: Book = {
    id: crypto.randomUUID(),
    title: input.title.trim(),
    year: input.year,
    startDate: `${input.year}-01-01`,
    endDate: `${input.year}-12-31`,
    locale: 'en-US',
    todayTimeZone: input.todayTimeZone,
    templateVersion: 1,
  };
  const preferences = openingPreferences(
    book,
    {
      id: 'local',
      bookId: book.id,
      pageIndex: 0,
      focusSide: 0,
      toolbarSide: 'right',
      zoom: 1,
      opening: input.opening,
    },
    now,
  );
  return validateBackup({
    format: 'daily-book-backup',
    version: 2,
    exportedAt: now.toISOString(),
    book,
    pages: manifest(book),
    entries: [],
    preferences,
  });
}
