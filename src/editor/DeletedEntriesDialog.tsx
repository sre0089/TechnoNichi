'use client';

import { useRef, useState } from 'react';
import { RotateCcw, Trash2 } from 'lucide-react';
import type { Entry } from '../domain/model';
import { timeLabel } from '../templates/daily-v1';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '../components/ui/dialog';
import { FormattedText } from './RichWriting';

function location(entry: Entry) {
  const date = entry.pageId.split(':').at(-1);
  const place =
    entry.type === 'task'
      ? `Checklist task ${entry.slot + 1}`
      : entry.type === 'note'
        ? 'Free note'
        : `Timed task ${timeLabel(entry.minute, entry.dayOffset)}`;
  return `${date} · ${place}`;
}

export function DeleteEntryButton({
  entry,
  disabled,
  deleteEntry,
}: {
  entry: Entry;
  disabled: boolean;
  deleteEntry: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const lock = useRef(false);
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (lock.current) return;
        setOpen(next);
        setError('');
      }}
    >
      <DialogTrigger asChild>
        <Button variant="ghost" disabled={disabled}>
          <Trash2 size={15} aria-hidden="true" /> Delete entry
        </Button>
      </DialogTrigger>
      <DialogContent
        title="Delete entry?"
        description="Your writing will leave the page. You can restore it from Deleted entries."
        closeDisabled={busy}
      >
        <p className="text-xs text-ui-muted">{location(entry)}</p>
        <p className="max-h-28 overflow-auto whitespace-pre-wrap break-words text-sm">
          {entry.text ? <FormattedText entry={entry} /> : 'Empty entry'}
        </p>
        {error && (
          <p role="alert" className="text-xs leading-relaxed">
            {error}
          </p>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <Button disabled={busy} onClick={() => setOpen(false)}>
            Keep entry
          </Button>
          <Button
            variant="primary"
            disabled={busy}
            onClick={() => {
              if (lock.current) return;
              lock.current = true;
              setBusy(true);
              setError('');
              void deleteEntry()
                .then(() => setOpen(false))
                .catch((error: unknown) => {
                  setError(
                    error instanceof Error
                      ? error.message
                      : 'Could not delete this entry. Your writing is retained.',
                  );
                })
                .finally(() => {
                  lock.current = false;
                  setBusy(false);
                });
            }}
          >
            {busy ? 'Deleting…' : 'Delete entry'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function DeletedEntriesDialog({
  disabled,
  listEntries,
  restoreEntry,
}: {
  disabled: boolean;
  listEntries: () => Promise<Entry[]>;
  restoreEntry: (entry: Entry) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [index, setIndex] = useState(0);
  const pageCount = Math.max(1, Math.ceil(entries.length / 20));
  const currentIndex = Math.min(index, pageCount - 1);
  const shown = entries.slice(currentIndex * 20, (currentIndex + 1) * 20);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const lock = useRef(false);
  const run = (operation: () => Promise<void>) => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError('');
    setMessage('');
    void operation()
      .catch((error: unknown) => {
        setError(error instanceof Error ? error.message : 'Please try again.');
      })
      .finally(() => {
        lock.current = false;
        setBusy(false);
      });
  };
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (lock.current) return;
        setOpen(next);
        setEntries([]);
        setIndex(0);
        setError('');
        setMessage('');
        if (next) run(async () => setEntries(await listEntries()));
      }}
    >
      <DialogTrigger asChild>
        <Button variant="ghost" disabled={disabled}>
          <RotateCcw size={16} aria-hidden="true" /> Deleted entries
        </Button>
      </DialogTrigger>
      <DialogContent
        title="Deleted entries"
        description="Deleted writing from every page of this book. Restore returns it to its original place when that space is free."
        closeDisabled={busy}
      >
        <div aria-busy={busy} className="space-y-4">
          {!busy && !entries.length && !error && (
            <p className="text-sm">No deleted entries.</p>
          )}
          {shown.map((entry) => (
            <section
              key={entry.id}
              aria-label={location(entry)}
              className="rounded-control border border-solid border-line p-3"
            >
              <h2 className="m-0 text-xs font-semibold">{location(entry)}</h2>
              <p className="max-h-28 overflow-auto whitespace-pre-wrap break-words text-sm">
                {entry.text ? <FormattedText entry={entry} /> : 'Empty entry'}
              </p>
              {'completed' in entry && entry.completed && (
                <p className="text-xs text-ui-muted">Completed</p>
              )}
              <Button
                disabled={busy}
                onClick={() =>
                  run(async () => {
                    await restoreEntry(entry);
                    setEntries((current) =>
                      current.filter((item) => item.id !== entry.id),
                    );
                    setMessage('Entry restored to its original page.');
                  })
                }
              >
                <RotateCcw size={15} aria-hidden="true" /> Restore entry
              </Button>
            </section>
          ))}
          {entries.length > 20 && (
            <nav
              aria-label="Deleted entry pages"
              className="flex items-center justify-between gap-2"
            >
              <Button
                disabled={busy || currentIndex === 0}
                aria-label="Previous deleted entries"
                onClick={() => setIndex(currentIndex - 1)}
              >
                Previous
              </Button>
              <span className="text-xs">
                {currentIndex * 20 + 1}–
                {Math.min((currentIndex + 1) * 20, entries.length)} of{' '}
                {entries.length}
              </span>
              <Button
                disabled={busy || currentIndex + 1 === pageCount}
                aria-label="Next deleted entries"
                onClick={() => setIndex(currentIndex + 1)}
              >
                Next
              </Button>
            </nav>
          )}
          {busy && (
            <p role="status" className="text-xs">
              Working on deleted entries…
            </p>
          )}
          {message && (
            <p role="status" className="text-xs">
              {message}
            </p>
          )}
          {error && (
            <p role="alert" className="text-xs leading-relaxed">
              {error}
            </p>
          )}
          {error && (
            <Button
              disabled={busy}
              onClick={() => run(async () => setEntries(await listEntries()))}
            >
              Refresh deleted entries
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
