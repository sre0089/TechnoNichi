import { test as base, expect } from '@playwright/test';
import { manifest } from '../../src/domain/model';
import { legacyBook, legacyPreferences } from './legacy-book';

// Most existing journeys exercise a returning pre-setup user. First-use tests
// import Playwright directly and exercise the real setup UI without this fixture.
export const test = base.extend<{ legacyStore: void }>({
  legacyStore: [
    async ({ context }, use) => {
      await context.addInitScript(
        ({ book, pages, preferences }) => {
          if (!location.href.startsWith('http')) return;
          const request = indexedDB.open('daily-book-v1', 10);
          request.onupgradeneeded = () => {
            const db = request.result;
            // Dexie schema 1 uses IndexedDB version 10.
            if (db.objectStoreNames.length) return;
            db.createObjectStore('books', { keyPath: 'id' }).add(book);
            const pageStore = db.createObjectStore('pages', { keyPath: 'id' });
            pageStore.createIndex('bookId', 'bookId');
            pageStore.createIndex('date', 'date');
            pageStore.createIndex('[bookId+order]', ['bookId', 'order']);
            pages.forEach((page) => pageStore.add(page));
            const entries = db.createObjectStore('entries', { keyPath: 'id' });
            entries.createIndex('pageId', 'pageId');
            db.createObjectStore('preferences', { keyPath: 'id' }).add(
              preferences,
            );
          };
          request.onsuccess = () => request.result.close();
        },
        {
          book: legacyBook,
          pages: manifest(legacyBook),
          preferences: legacyPreferences,
        },
      );
      await use();
    },
    { auto: true },
  ],
});
export { expect };
export type { Page, Locator, BrowserContext } from '@playwright/test';
