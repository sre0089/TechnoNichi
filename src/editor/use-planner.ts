'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  manifest,
  sameContent,
  type Book,
  type Entry,
  type PageRecord,
  type Preferences,
} from '../domain/model';
import { spreadIndex } from '../domain/calendar';
import { PlannerDB, RestoreRefused } from '../local/repository';
import { readRecovery, SaveQueue, type SaveState } from '../local/save-queue';
import { serializeBackup, type PlannerBackup } from '../local/backup';

interface View {
  book: Book;
  pages: PageRecord[];
  preferences: Preferences;
}

export function usePlanner() {
  const [view, setView] = useState<View | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [saveState, setSaveState] = useState<SaveState>({ kind: 'saving' });
  const [openingError, setOpeningError] = useState(false);
  const [moving, setMoving] = useState(false);
  const db = useRef<PlannerDB | null>(null);
  const writer = useRef<SaveQueue | null>(null);
  const moveLock = useRef(false);

  useEffect(() => {
    let active = true;
    const database = new PlannerDB();
    db.current = database;
    let queue: SaveQueue | undefined;
    void (async () => {
      try {
        const { book, preferences: savedPreferences } =
          await database.initialize();
        const pages = manifest(book);
        let recovery: Entry[] = [];
        let storage: Storage | undefined;
        try {
          storage = window.localStorage;
          recovery = readRecovery(storage);
        } catch {
          /* The durable store can still open when localStorage is denied. */
        }
        const recoveryIndex = recovery.length
          ? pages.findIndex((p) => p.id === recovery[0].pageId)
          : -1;
        const pageIndex = spreadIndex(
          recoveryIndex >= 0
            ? recoveryIndex
            : Math.max(
                0,
                Math.min(pages.length - 1, savedPreferences.pageIndex),
              ),
        );
        const preferences = { ...savedPreferences, pageIndex };
        const loaded = await database.readPages(
          pages.slice(pageIndex, pageIndex + 2).map((p) => p.id),
        );
        if (!active) {
          database.close();
          return;
        }
        queue = new SaveQueue(
          (e, revision) => database.save(e, revision),
          (state) => {
            if (active) setSaveState(state);
          },
          storage,
        );
        queue.seed(loaded);
        writer.current = queue;
        const visible = new Map(loaded.map((entry) => [entry.id, entry]));
        for (const draft of recovery) {
          const current = await database.entries.get(draft.id);
          if (!current || !sameContent(current, draft)) {
            // A recovered stale draft uses its original revision, so CAS detects conflict.
            queue.seed([draft]);
            queue.edit(draft);
            if (
              pages
                .slice(pageIndex, pageIndex + 2)
                .some((p) => p.id === draft.pageId)
            )
              visible.set(draft.id, draft);
          }
        }
        if (!active) return;
        setEntries([...visible.values()]);
        setView({ book, pages, preferences });
        if (!queue.unsaved().length) setSaveState({ kind: 'saved' });
      } catch {
        if (active) {
          setOpeningError(true);
          setSaveState({
            kind: 'error',
            message:
              'This book could not open. Browser storage may be unavailable.',
          });
        }
      }
    })();
    return () => {
      active = false;
      queue?.dispose();
      if (queue) void queue.flush().finally(() => database.close());
      else database.close();
    };
  }, []);

  const edit = useCallback((entry: Entry) => {
    if (!writer.current || moveLock.current) return;
    setEntries((current) => [
      ...current.filter((e) => e.id !== entry.id),
      entry,
    ]);
    writer.current.edit(entry);
  }, []);

  const navigate = async (index: number) => {
    if (!view || !db.current || !writer.current || moveLock.current)
      return false;
    const nextIndex = spreadIndex(
      Math.max(0, Math.min(view.pages.length - 1, index)),
    );
    if (nextIndex === view.preferences.pageIndex) return false;
    moveLock.current = true;
    setMoving(true);
    try {
      if (!(await writer.current.flush())) return false;
      const loaded = await db.current.readPages(
        view.pages.slice(nextIndex, nextIndex + 2).map((p) => p.id),
      );
      const preferences = {
        ...view.preferences,
        pageIndex: nextIndex,
        focusSide: 0 as const,
      };
      await db.current.preferences.put(preferences);
      writer.current.seed(loaded);
      setEntries(loaded);
      setView({ ...view, preferences });
      return true;
    } catch {
      setSaveState({
        kind: 'error',
        message: 'Could not turn the page. Your current writing is retained.',
      });
      return false;
    } finally {
      moveLock.current = false;
      setMoving(false);
    }
  };

  const updatePreferences = async (
    changes: Partial<Pick<Preferences, 'focusSide' | 'toolbarSide' | 'zoom'>>,
  ) => {
    if (!view || !db.current || moveLock.current) return;
    const preferences = { ...view.preferences, ...changes };
    setView({ ...view, preferences });
    try {
      await db.current.preferences.put(preferences);
    } catch {
      setSaveState({
        kind: 'error',
        message: 'Your display preference could not be saved.',
      });
    }
  };

  const withBackupLock = async <T>(
    operation: (database: PlannerDB, queue: SaveQueue) => Promise<T>,
  ): Promise<T> => {
    if (!db.current || !writer.current || moveLock.current)
      throw new Error('Please finish the current operation and try again.');
    moveLock.current = true;
    setMoving(true);
    try {
      if (!(await writer.current.flush()))
        throw new Error(
          'Your latest writing could not save. Retry saving before making a backup or restoring.',
        );
      return await operation(db.current, writer.current);
    } finally {
      moveLock.current = false;
      setMoving(false);
    }
  };

  const exportBackup = () =>
    withBackupLock(async (database) => {
      if (!view) throw new Error('Please wait for the book to open.');
      let archive: PlannerBackup;
      try {
        archive = await database.exportBackup(view.book.id);
      } catch {
        throw new Error(
          'The complete book could not be read. No backup was created.',
        );
      }
      return { text: serializeBackup(archive), year: archive.book.year };
    });

  const restoreBackup = (archive: PlannerBackup) =>
    withBackupLock(async (database, queue) => {
      let restored: PlannerBackup;
      try {
        restored = await database.restoreBackup(archive);
      } catch (error) {
        if (error instanceof RestoreRefused) throw error;
        throw new Error(
          'Restore could not finish. Your existing planner has not been changed.',
          { cause: error },
        );
      }
      const { book, pages, preferences } = restored;
      const visibleIds = new Set(
        pages
          .slice(preferences.pageIndex, preferences.pageIndex + 2)
          .map((page) => page.id),
      );
      const loaded = restored.entries.filter(
        (entry) => !entry.deletedAt && visibleIds.has(entry.pageId),
      );
      queue.seed(loaded);
      setEntries(loaded);
      setView({ book, pages, preferences });
      setSaveState({ kind: 'saved' });
    });

  return {
    view,
    entries,
    saveState,
    openingError,
    moving,
    edit,
    navigate,
    updatePreferences,
    exportBackup,
    restoreBackup,
    retry: () => writer.current?.flush(),
    unsaved: () => writer.current?.unsaved() ?? [],
  };
}
