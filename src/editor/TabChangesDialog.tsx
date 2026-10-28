'use client';

import { useEffect, useRef, useState } from 'react';
import type { Entry } from '../domain/model';
import type { ConflictChoice } from '../local/repository';
import type {
  DraftConflict,
  RetainedDraftGroup,
  TabReview,
} from '../local/tab-review';
import { dailyTemplate } from '../templates/daily-v1';
import { scheduledLabel } from '../domain/durations';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent } from '../components/ui/dialog';
import { FormattedText } from './RichWriting';
import { restoreUnclaimedFocus } from './restore-focus';

function place(entry: Entry) {
  return `${entry.pageId.split(':').at(-1)} · ${entry.type === 'task' ? `Checklist task ${entry.slot + 1}` : entry.type === 'note' ? 'Free note' : `${entry.type === 'scheduled-block' ? 'Duration task' : 'Timed task'} ${scheduledLabel(entry)}`}`;
}
function Version({ entry, label }: { entry?: Entry; label: string }) {
  return (
    <section
      aria-label={label}
      className="min-w-0 rounded-control border border-solid border-line p-3"
    >
      <h3 className="m-0 text-xs font-semibold">{label}</h3>
      {entry ? (
        <>
          <p className="text-xs text-ui-muted">
            {place(entry)}
            {entry.deletedAt ? ' · Deleted' : ''}
          </p>
          <p className="max-h-32 overflow-auto whitespace-pre-wrap break-words text-sm">
            {entry.text ? <FormattedText entry={entry} /> : 'Empty writing'}
          </p>
          {'completed' in entry && (
            <p className="text-xs text-ui-muted">
              {entry.completed ? 'Completed' : 'Not completed'}
            </p>
          )}
          {entry.type === 'note' && (
            <p className="text-xs text-ui-muted">
              Column{' '}
              {Math.round(
                (entry.x - dailyTemplate.grid.x) / dailyTemplate.grid.pitch,
              ) + 1}
              , row{' '}
              {Math.round(
                (entry.y - dailyTemplate.grid.y) / dailyTemplate.grid.pitch,
              ) + 1}{' '}
              · {Math.round(entry.width / dailyTemplate.grid.pitch)} ×{' '}
              {Math.round(entry.height / dailyTemplate.grid.pitch)} squares
            </p>
          )}
        </>
      ) : (
        <p className="text-xs">The saved entry is no longer available.</p>
      )}
    </section>
  );
}

export function TabChangesDialog({
  beginReview,
  endReview,
  refreshReview,
  resolveConflict,
  retainDraft,
  loadChanges,
  close,
}: {
  beginReview: () => Promise<TabReview>;
  endReview: () => void;
  refreshReview: () => Promise<TabReview>;
  resolveConflict: (
    conflict: DraftConflict,
    choice: ConflictChoice,
  ) => Promise<TabReview>;
  retainDraft: (draft: RetainedDraftGroup) => Promise<TabReview>;
  loadChanges: () => Promise<TabReview>;
  close: () => void;
}) {
  const [review, setReview] = useState<TabReview | null>(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [index, setIndex] = useState(0);
  const lock = useRef(true);
  useEffect(() => {
    let active = true;
    void beginReview()
      .then((next) => {
        if (active) setReview(next);
      })
      .catch((error: unknown) => {
        if (active)
          setError(
            error instanceof Error
              ? error.message
              : 'Could not read tab changes.',
          );
      })
      .finally(() => {
        if (active) {
          lock.current = false;
          setBusy(false);
        }
      });
    return () => {
      active = false;
      endReview();
    };
  }, [beginReview, endReview]);
  const run = (operation: () => Promise<TabReview>, success = '') => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError('');
    setMessage('');
    void operation()
      .then((next) => {
        setReview(next);
        setMessage(success);
      })
      .catch((error: unknown) => {
        setError(
          error instanceof Error
            ? error.message
            : 'Could not finish. Your writing is retained.',
        );
      })
      .finally(() => {
        lock.current = false;
        setBusy(false);
      });
  };
  const rows = [
    ...(review?.conflicts.map((conflict) => ({
      kind: 'conflict' as const,
      conflict,
    })) ?? []),
    ...(review?.retained.map((retained) => ({
      kind: 'retained' as const,
      retained,
    })) ?? []),
  ];
  const pageCount = Math.max(1, Math.ceil(rows.length / 20));
  const page = Math.min(index, pageCount - 1);
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !lock.current) close();
      }}
    >
      <DialogContent
        title="Review tab changes"
        description="Compare your writing with what is saved. The page stays steady until you choose what to keep or load."
        className="max-w-2xl"
        closeDisabled={busy}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          restoreUnclaimedFocus(() => document.getElementById('tab-changes'));
        }}
      >
        <div className="space-y-4" aria-busy={busy}>
          <p className="text-xs leading-relaxed text-ui-muted">
            Keep my writing puts your version on the page and retains the
            replaced version in Deleted entries. Keep both leaves saved writing
            on the page and stores your draft in Deleted entries. Use saved
            writing replaces this tab’s draft.
          </p>
          {error && (
            <p role="alert" className="text-xs leading-relaxed">
              {error} Your draft remains available. Refresh the review if
              another tab changed it again.
            </p>
          )}
          {message && (
            <p role="status" className="text-xs leading-relaxed">
              {message}
            </p>
          )}
          {busy && (
            <p role="status" className="text-xs">
              Reading or saving tab changes…
            </p>
          )}
          {!busy && review && !rows.length && (
            <p className="text-sm">
              No conflicting or retained writing to review.
              {review.unsavedCount
                ? ' Close to retry saving your pending writing, or load saved changes after it saves.'
                : ' You can load the latest saved changes.'}
            </p>
          )}
          {rows.slice(page * 20, (page + 1) * 20).map((row, offset) =>
            row.kind === 'conflict' ? (
              <section
                key={`conflict:${row.conflict.draft.id}`}
                aria-label={`Conflict ${place(row.conflict.draft)}`}
                className="space-y-3 border-0 border-t border-solid border-line pt-4"
              >
                <h2 className="m-0 text-sm font-semibold">
                  {place(row.conflict.draft)}
                </h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Version
                    label="Your writing in this tab"
                    entry={row.conflict.draft}
                  />
                  <Version label="Saved writing" entry={row.conflict.saved} />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    disabled={busy}
                    onClick={() =>
                      run(
                        () => resolveConflict(row.conflict, 'mine'),
                        'Your writing is on the page. The replaced version is in Deleted entries.',
                      )
                    }
                  >
                    Keep my writing
                  </Button>
                  <Button
                    disabled={busy || !row.conflict.saved}
                    onClick={() =>
                      run(
                        () => resolveConflict(row.conflict, 'saved'),
                        'This tab now uses the saved writing.',
                      )
                    }
                  >
                    Use saved writing
                  </Button>
                  <Button
                    variant="primary"
                    disabled={busy}
                    onClick={() =>
                      run(
                        () => resolveConflict(row.conflict, 'both'),
                        'Both versions are retained. Your draft is in Deleted entries.',
                      )
                    }
                  >
                    Keep both
                  </Button>
                </div>
              </section>
            ) : (
              <section
                key={`retained:${page * 20 + offset}`}
                aria-label={`Retained draft ${place(row.retained.entry)}`}
                className="space-y-3 border-0 border-t border-solid border-line pt-4"
              >
                <h2 className="m-0 text-sm font-semibold">
                  Other retained writing
                </h2>
                <Version label="Retained draft" entry={row.retained.entry} />
                <Button
                  disabled={busy}
                  onClick={() =>
                    run(
                      () => retainDraft(row.retained),
                      'Recovery copy saved in Deleted entries. Saved writing on the page was not replaced.',
                    )
                  }
                >
                  Save recovery copy
                </Button>
              </section>
            ),
          )}
          {rows.length > 20 && (
            <nav
              aria-label="Tab review pages"
              className="flex items-center justify-between gap-2"
            >
              <Button
                aria-label="Previous review entries"
                disabled={busy || page === 0}
                onClick={() => setIndex(page - 1)}
              >
                Previous
              </Button>
              <span className="text-xs">
                {page * 20 + 1}–{Math.min((page + 1) * 20, rows.length)} of{' '}
                {rows.length}
              </span>
              <Button
                aria-label="Next review entries"
                disabled={busy || page + 1 === pageCount}
                onClick={() => setIndex(page + 1)}
              >
                Next
              </Button>
            </nav>
          )}
          <div className="flex flex-wrap justify-end gap-2 border-0 border-t border-solid border-line pt-4">
            <Button disabled={busy} onClick={() => run(refreshReview)}>
              Refresh review
            </Button>
            <Button
              variant="primary"
              disabled={busy || !review || !!review.conflicts.length}
              onClick={() => run(loadChanges, 'Latest saved changes loaded.')}
            >
              Load saved changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
