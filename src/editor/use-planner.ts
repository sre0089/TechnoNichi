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
import { spreadIndex, dateDestination } from '../domain/calendar';
import {
  PlannerDB,
  RestoreRefused,
  RevisionConflict,
  EntryRestoreRefused,
  type ConflictChoice,
} from '../local/repository';
import { readRecovery, SaveQueue, type SaveState } from '../local/save-queue';
import { serializeBackup, type PlannerBackup } from '../local/backup';
import { TabRecovery } from '../local/tab-recovery';
import { TabChanges } from '../local/tab-changes';
import { PageHistory, type HistoryDirection } from '../local/page-history';
import {
  readTabReview,
  type DraftConflict,
  type RetainedDraftGroup,
} from '../local/tab-review';

interface View {
  book: Book;
  pages: PageRecord[];
  preferences: Preferences;
}

export function usePlanner() {
  const [view, setView] = useState<View | null>(null);
  const [entries, setEntryState] = useState<Entry[]>([]);
  const currentEntries = useRef<Entry[]>([]);
  const setEntries = useCallback(
    (value: Entry[] | ((current: Entry[]) => Entry[])) => {
      const next =
        typeof value === 'function' ? value(currentEntries.current) : value;
      currentEntries.current = next;
      setEntryState(next);
    },
    [],
  );
  const history = useRef(new PageHistory());
  const [historyInfo, setHistoryInfo] = useState(() =>
    new PageHistory().info(),
  );
  const [historyMessage, setHistoryMessage] = useState('');
  const [historyError, setHistoryError] = useState('');
  const publishHistory = useCallback(
    () => setHistoryInfo(history.current.info()),
    [],
  );
  const resetHistory = useCallback(() => {
    history.current.reset();
    publishHistory();
    setHistoryMessage('');
    setHistoryError('');
  }, [publishHistory]);
  const [saveState, setSaveState] = useState<SaveState>({ kind: 'saving' });
  const [openingError, setOpeningError] = useState(false);
  const [moving, setMoving] = useState(false);
  const [adjustingNote, setAdjustingNote] = useState(false);
  const [otherTabChanged, setOtherTabChanged] = useState(false);
  const db = useRef<PlannerDB | null>(null);
  const writer = useRef<SaveQueue | null>(null);
  const moveLock = useRef(false);
  const noteGestureLock = useRef(false);
  const reviewLock = useRef(false);
  const currentView = useRef<View | null>(null);
  const recoveryStore = useRef<TabRecovery | null>(null);
  const changes = useRef<TabChanges | null>(null);
  const changeVersion = useRef(0);
  useEffect(() => {
    currentView.current = view;
  }, [view]);

  const beginNoteGesture = useCallback(() => {
    if (moveLock.current || noteGestureLock.current) return false;
    noteGestureLock.current = true;
    setAdjustingNote(true);
    return true;
  }, []);
  const endNoteGesture = useCallback(() => {
    noteGestureLock.current = false;
    setAdjustingNote(false);
  }, []);

  useEffect(() => {
    let active = true;
    const database = new PlannerDB();
    db.current = database;
    let queue: SaveQueue | undefined;
    const bus = new TabChanges((bookId) => {
      if (active && bookId === currentView.current?.book.id) {
        changeVersion.current += 1;
        setOtherTabChanged(true);
      }
    });
    changes.current = bus;
    const checkChanges = async () => {
      const current = currentView.current;
      if (!active || !current || !queue) return;
      try {
        const stored = await database.readPages(
          current.pages
            .slice(
              current.preferences.pageIndex,
              current.preferences.pageIndex + 2,
            )
            .map((page) => page.id),
          true,
        );
        if (
          !(await database.books.get(current.book.id)) ||
          stored.some((entry) => entry.revision !== queue!.revision(entry.id))
        ) {
          if (active) {
            changeVersion.current += 1;
            setOtherTabChanged(true);
          }
        }
      } catch {
        /* Review still reads fresh data when explicitly opened. */
      }
    };
    const onFocus = () => {
      void checkChanges();
    };
    const onVisible = () => {
      if (document.visibilityState === 'visible') void checkChanges();
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisible);
    void (async () => {
      try {
        const { book, preferences: savedPreferences } =
          await database.initialize();
        const pages = manifest(book);
        let recovery: Entry[] = [];
        let local: Storage | undefined;
        let session: Storage | undefined;
        try {
          local = window.localStorage;
        } catch {
          /* Optional recovery storage. */
        }
        try {
          session = window.sessionStorage;
        } catch {
          /* Optional recovery storage. */
        }
        const storage = new TabRecovery(local, session);
        let recoveryReadable = true;
        try {
          recovery = readRecovery(storage);
        } catch {
          recoveryReadable = false;
          /* Preserve invalid buffers for manual recovery. */
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
          true,
        );
        if (!active) {
          database.close();
          return;
        }
        queue = new SaveQueue(
          async (e, revision) => {
            const saved = await database.save(e, revision);
            history.current.observe(saved);
            bus.publish(currentView.current?.book.id ?? book.id);
            return saved;
          },
          (state) => {
            if (active) setSaveState(state);
          },
          storage,
        );
        queue.seed(loaded);
        writer.current = queue;
        recoveryStore.current = storage;
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
        currentView.current = { book, pages, preferences };
        if (!queue.unsaved().length) {
          if (recoveryReadable) storage.removeItem();
          setSaveState({ kind: 'saved' });
        }
        try {
          const review = await readTabReview(
            database,
            queue,
            storage,
            pages.map((page) => page.id),
          );
          if (active && review.retained.length) setOtherTabChanged(true);
        } catch {
          /* Explicit review can retry; opening the saved book remains useful. */
        }
        void checkChanges();
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
      bus.close();
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisible);
      queue?.dispose();
      if (queue) void queue.flush().finally(() => database.close());
      else database.close();
    };
  }, [setEntries]);

  const edit = useCallback(
    (entry: Entry) => {
      if (!writer.current || moveLock.current) return;
      history.current.edit(
        currentEntries.current.find((item) => item.id === entry.id),
        entry,
      );
      publishHistory();
      setEntries((current) => [
        ...current.filter((e) => e.id !== entry.id),
        entry,
      ]);
      writer.current.edit(entry);
    },
    [setEntries, publishHistory],
  );

  const navigate = async (
    index: number,
    focusSide: 0 | 1 = 0,
    entryId?: string,
  ) => {
    if (
      !view ||
      !db.current ||
      !writer.current ||
      moveLock.current ||
      noteGestureLock.current
    )
      return false;
    const nextIndex = spreadIndex(
      Math.max(0, Math.min(view.pages.length - 1, index)),
    );
    if (
      nextIndex === view.preferences.pageIndex &&
      focusSide === view.preferences.focusSide &&
      !entryId
    )
      return true;
    moveLock.current = true;
    setMoving(true);
    try {
      if (!(await writer.current.flush())) return false;
      const loaded = await db.current.readPages(
        view.pages.slice(nextIndex, nextIndex + 2).map((p) => p.id),
        true,
      );
      const preferences = {
        ...view.preferences,
        pageIndex: nextIndex,
        focusSide,
      };
      if (
        entryId &&
        !loaded.some((entry) => entry.id === entryId && !entry.deletedAt)
      )
        return false;
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
    changes: Partial<
      Pick<Preferences, 'focusSide' | 'toolbarSide' | 'zoom' | 'motion'>
    >,
  ) => {
    if (!view || !db.current || moveLock.current || noteGestureLock.current)
      return;
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

  const withOperationLock = async <T>(
    operation: (database: PlannerDB, queue: SaveQueue) => Promise<T>,
  ): Promise<T> => {
    if (
      !db.current ||
      !writer.current ||
      moveLock.current ||
      noteGestureLock.current
    )
      throw new Error('Please finish the current operation and try again.');
    moveLock.current = true;
    setMoving(true);
    try {
      if (!(await writer.current.flush()))
        throw new Error(
          'Your latest writing could not save. Retry saving before continuing.',
        );
      return await operation(db.current, writer.current);
    } finally {
      moveLock.current = false;
      setMoving(false);
    }
  };

  const exportBackup = () =>
    withOperationLock(async (database) => {
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
    withOperationLock(async (database, queue) => {
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
      if (view?.book.id !== book.id && view)
        changes.current?.publish(view.book.id);
      changes.current?.publish(book.id);
      const visibleIds = new Set(
        pages
          .slice(preferences.pageIndex, preferences.pageIndex + 2)
          .map((page) => page.id),
      );
      const loaded = restored.entries.filter((entry) =>
        visibleIds.has(entry.pageId),
      );
      queue.seed(loaded);
      resetHistory();
      setEntries(loaded);
      setView({ book, pages, preferences });
      setSaveState({ kind: 'saved' });
    });

  const listDeletedEntries = () =>
    withOperationLock(async (database) => {
      if (!view) throw new Error('Please wait for the book to open.');
      return database.readDeleted(view.book.id);
    });

  const deleteEntry = (id: string) =>
    withOperationLock(async (database, queue) => {
      const revision = queue.revision(id);
      if (revision === undefined)
        throw new Error('Please select a saved entry.');
      let deleted: Entry;
      const before = await database.entries.get(id);
      try {
        deleted = await database.deleteEntry(id, revision);
      } catch (error) {
        if (error instanceof RevisionConflict) throw error;
        throw new Error(
          'Could not delete this entry. Your writing is still on the page.',
          { cause: error },
        );
      }
      queue.seed([deleted]);
      history.current.record(before ?? null, deleted, 'Delete entry');
      publishHistory();
      if (view) changes.current?.publish(view.book.id);
      setEntries((current) =>
        current.map((entry) => (entry.id === id ? deleted : entry)),
      );
    });

  const restoreEntry = (entry: Entry) =>
    withOperationLock(async (database, queue) => {
      let restored: Entry;
      try {
        restored = await database.restoreEntry(entry.id, entry.revision);
      } catch (error) {
        if (
          error instanceof RevisionConflict ||
          error instanceof EntryRestoreRefused
        )
          throw error;
        throw new Error(
          'Could not restore this entry. Your deleted writing is still retained.',
          { cause: error },
        );
      }
      queue.seed([restored]);
      history.current.record(entry, restored, 'Restore entry');
      publishHistory();
      if (view) changes.current?.publish(view.book.id);
      if (
        view?.pages
          .slice(view.preferences.pageIndex, view.preferences.pageIndex + 2)
          .some((page) => page.id === restored.pageId)
      )
        setEntries((current) => [
          ...current.filter((item) => item.id !== restored.id),
          restored,
        ]);
    });

  const reviewSnapshot = useCallback(async () => {
    const current = currentView.current;
    if (!reviewLock.current || !current || !db.current || !writer.current)
      throw new Error('Open the tab review before continuing.');
    return readTabReview(
      db.current,
      writer.current,
      recoveryStore.current,
      current.pages.map((page) => page.id),
    );
  }, []);

  const beginTabReview = useCallback(async () => {
    if (
      !db.current ||
      !writer.current ||
      moveLock.current ||
      noteGestureLock.current
    )
      throw new Error('Please finish the current operation first.');
    moveLock.current = true;
    reviewLock.current = true;
    setMoving(true);
    await writer.current.pause();
    return reviewSnapshot();
  }, [reviewSnapshot]);

  const endTabReview = useCallback(() => {
    if (!reviewLock.current) return;
    reviewLock.current = false;
    moveLock.current = false;
    setMoving(false);
    writer.current?.resume();
    if (writer.current?.unsaved().length) void writer.current.flush();
  }, []);

  const refreshVisible = useCallback(async () => {
    const observedVersion = changeVersion.current;
    const current = currentView.current;
    const database = db.current;
    const queue = writer.current;
    if (!current || !database || !queue)
      throw new Error('Please wait for the book.');
    if (!(await database.books.get(current.book.id)))
      throw new Error(
        'The book was replaced in another tab. Save or recover your drafts before reopening.',
      );
    const loaded = await database.readPages(
      current.pages
        .slice(current.preferences.pageIndex, current.preferences.pageIndex + 2)
        .map((page) => page.id),
      true,
    );
    const pending = queue.unsaved();
    const pendingIds = new Set(pending.map((entry) => entry.id));
    queue.seed(loaded.filter((entry) => !pendingIds.has(entry.id)));
    const combined = new Map(loaded.map((entry) => [entry.id, entry]));
    for (const entry of pending)
      if (
        current.pages
          .slice(
            current.preferences.pageIndex,
            current.preferences.pageIndex + 2,
          )
          .some((page) => page.id === entry.pageId)
      )
        combined.set(entry.id, entry);
    setEntries([...combined.values()]);
    setOtherTabChanged(changeVersion.current !== observedVersion);
  }, [setEntries]);

  const resolveTabConflict = useCallback(
    async (conflict: DraftConflict, choice: ConflictChoice) => {
      if (!reviewLock.current || !db.current || !writer.current)
        throw new Error('Please open the review.');
      const queue = writer.current;
      const draft = queue
        .unsaved()
        .find((entry) => entry.id === conflict.draft.id);
      if (
        !draft ||
        draft.revision !== conflict.draft.revision ||
        !sameContent(draft, conflict.draft)
      )
        throw new Error('Your draft changed. Refresh this review.');
      const result = await db.current.resolveConflict(
        draft,
        conflict.saved?.revision,
        choice,
      );
      queue.accept(conflict.draft, result.entry);
      resetHistory();
      if (result.changed && currentView.current)
        changes.current?.publish(currentView.current.book.id);
      await refreshVisible();
      return reviewSnapshot();
    },
    [refreshVisible, reviewSnapshot, resetHistory],
  );

  const retainTabDraft = useCallback(
    async (retained: RetainedDraftGroup) => {
      if (!reviewLock.current || !db.current)
        throw new Error('Please open the review.');
      await db.current.retainDraftCopy(retained.entry);
      resetHistory();
      for (const source of retained.sources)
        recoveryStore.current?.release(source);
      if (currentView.current)
        changes.current?.publish(currentView.current.book.id);
      await refreshVisible();
      return reviewSnapshot();
    },
    [refreshVisible, reviewSnapshot, resetHistory],
  );

  const loadTabChanges = useCallback(async () => {
    if (!reviewLock.current || !writer.current || !db.current)
      throw new Error('Please open the review.');
    if (!(await writer.current.flush()))
      throw new Error(
        'Your writing could not save. Resolve conflicts or retry saving before loading changes.',
      );
    const current = currentView.current;
    if (current && !(await db.current.books.get(current.book.id))) {
      const { book, preferences } = await db.current.initialize();
      const pages = manifest(book);
      const loaded = await db.current.readPages(
        pages
          .slice(preferences.pageIndex, preferences.pageIndex + 2)
          .map((page) => page.id),
        true,
      );
      writer.current.seed(loaded);
      currentView.current = { book, pages, preferences };
      setView(currentView.current);
      setEntries(loaded);
      setOtherTabChanged(false);
    } else await refreshVisible();
    resetHistory();
    return reviewSnapshot();
  }, [refreshVisible, reviewSnapshot, resetHistory, setEntries]);

  const applyPageHistory = async (direction: HistoryDirection) => {
    setHistoryError('');
    try {
      return await withOperationLock(async (database, queue) => {
        const request = history.current.request(direction);
        if (!request) return undefined;
        const saved = await database.applyHistory(
          request.expected,
          request.target,
        );
        history.current.complete(direction, saved);
        publishHistory();
        queue.seed([saved]);
        if (view) changes.current?.publish(view.book.id);
        if (
          view?.pages
            .slice(view.preferences.pageIndex, view.preferences.pageIndex + 2)
            .some((page) => page.id === saved.pageId)
        )
          setEntries((current) => [
            ...current.filter((entry) => entry.id !== saved.id),
            saved,
          ]);
        setHistoryMessage(
          `${direction === 'undo' ? 'Undid' : 'Redid'} ${request.label.toLowerCase()}.`,
        );
        return saved;
      });
    } catch (error) {
      setHistoryError(
        error instanceof Error
          ? error.message
          : 'This action could not be undone. Your writing is retained.',
      );
      return undefined;
    }
  };

  return {
    view,
    entries,
    historyInfo,
    historyMessage,
    historyError,
    undoPage: () => applyPageHistory('undo'),
    redoPage: () => applyPageHistory('redo'),
    saveState,
    openingError,
    moving,
    adjustingNote,
    beginNoteGesture,
    endNoteGesture,
    otherTabChanged,
    beginTabReview,
    endTabReview,
    reviewSnapshot,
    resolveTabConflict,
    retainTabDraft,
    loadTabChanges,
    edit,
    navigate,
    jumpToDate: async (date: string) => {
      if (!view) return false;
      const destination = dateDestination(view.pages, date);
      return navigate(destination.index, destination.focusSide);
    },
    updatePreferences,
    exportBackup,
    prepareBookClose: () => withOperationLock(async () => true),
    saveAndUpdate: (apply: () => Promise<void>) =>
      withOperationLock(async () => apply()),
    readSearchEntries: () =>
      withOperationLock(async (database) => {
        if (!view) throw new Error('Please wait for the book.');
        return database.readPages(view.pages.map((page) => page.id));
      }),
    openSearchEntry: async (entry: Entry) => {
      if (!view) return false;
      const index = view.pages.findIndex((page) => page.id === entry.pageId);
      return index >= 0
        ? navigate(index, (index % 2) as 0 | 1, entry.id)
        : false;
    },
    restoreBackup,
    listDeletedEntries,
    deleteEntry,
    restoreEntry,
    retry: () => writer.current?.flush(),
    unsaved: () => writer.current?.unsaved() ?? [],
  };
}
