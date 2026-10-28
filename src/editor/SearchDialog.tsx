'use client';
import { useState } from 'react';
import { Search } from 'lucide-react';
import type { Book, Entry, PageRecord } from '../domain/model';
import { scheduledLabel } from '../domain/durations';
import { isScheduled } from '../domain/model';
import { findEntries, type SearchFilter } from '../search/find-entries';
import { Button } from '../components/ui/button';
import { Input, NativeSelect } from '../components/ui/field';
import { Dialog, DialogContent } from '../components/ui/dialog';
import { restoreUnclaimedFocus } from './restore-focus';

export function SearchDialog({
  book,
  pages,
  disabled,
  readEntries,
  openEntry,
}: {
  book: Book;
  pages: PageRecord[];
  disabled: boolean;
  readEntries: () => Promise<Entry[]>;
  openEntry: (entry: Entry) => Promise<boolean>;
}) {
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [filter, setFilter] = useState<SearchFilter>({
    query: '',
    type: 'all',
    date: '',
  });
  const [offset, setOffset] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [opened, setOpened] = useState<string | null>(null);
  const load = async () => {
    setBusy(true);
    setError('');
    try {
      setEntries(await readEntries());
      setOffset(0);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Your book could not be read. Please retry.',
      );
    } finally {
      setBusy(false);
    }
  };
  const update = (changes: Partial<SearchFilter>) => {
    setFilter((current) => ({ ...current, ...changes }));
    setOffset(0);
  };
  const results = findEntries(entries, pages, filter);
  return (
    <>
      <Button
        variant="ghost"
        disabled={disabled}
        onClick={() => {
          setOpened(null);
          setOpen(true);
          void load();
        }}
      >
        <Search size={16} aria-hidden="true" />
        Search book
      </Button>
      <Dialog
        open={open}
        onOpenChange={(value) => {
          if (!busy) setOpen(value);
        }}
      >
        <DialogContent
          title="Search your book"
          description="Find writing saved in this book on this browser. Search stays on your device."
          closeDisabled={busy}
          onCloseAutoFocus={(event) => {
            if (opened) {
              event.preventDefault();
              restoreUnclaimedFocus(() => document.getElementById(opened));
            }
          }}
        >
          <div className="mb-4 flex flex-col gap-3">
            <label className="flex flex-col gap-2 text-xs">
              Search writing
              <Input
                type="search"
                maxLength={200}
                value={filter.query}
                disabled={busy}
                onChange={(event) => update({ query: event.target.value })}
              />
            </label>
            <div className="flex flex-wrap gap-3">
              <label className="flex flex-1 flex-col gap-2 text-xs">
                Entry type
                <NativeSelect
                  value={filter.type}
                  disabled={busy}
                  onChange={(event) =>
                    update({ type: event.target.value as SearchFilter['type'] })
                  }
                >
                  <option value="all">All entries</option>
                  <option value="scheduled-line">Timed writing</option>
                  <option value="scheduled-block">Duration tasks</option>
                  <option value="task">Checklist tasks</option>
                  <option value="note">Free notes</option>
                </NativeSelect>
              </label>
              <label className="flex flex-1 flex-col gap-2 text-xs">
                On date
                <Input
                  type="date"
                  min={book.startDate}
                  max={book.endDate}
                  value={filter.date}
                  disabled={busy}
                  onChange={(event) => update({ date: event.target.value })}
                />
              </label>
            </div>
          </div>
          <p className="text-xs text-ui-muted" aria-live="polite">
            {busy
              ? 'Reading your book…'
              : `${results.length} ${results.length === 1 ? 'result' : 'results'}`}
          </p>
          {error && (
            <p role="alert" className="text-xs">
              {error}
            </p>
          )}
          <ul
            className="m-0 flex max-h-[40dvh] list-none flex-col gap-2 overflow-y-auto p-0"
            aria-label="Search results"
          >
            {results.slice(offset, offset + 20).map(({ entry, date }) => (
              <li key={entry.id}>
                <Button
                  className="h-auto min-h-11 w-full flex-col items-start whitespace-normal py-3 text-left"
                  disabled={busy}
                  onClick={() => {
                    void (async () => {
                      setBusy(true);
                      setError('');
                      try {
                        if (!(await openEntry(entry)))
                          throw new Error(
                            'This entry could not open. Refresh results or retry saving.',
                          );
                        setOpened(entry.id);
                        setOpen(false);
                      } catch (error) {
                        setError(
                          error instanceof Error
                            ? error.message
                            : 'This entry could not open.',
                        );
                      } finally {
                        setBusy(false);
                      }
                    })();
                  }}
                >
                  <span className="text-[10px] font-normal text-ui-muted">
                    {date} ·{' '}
                    {isScheduled(entry)
                      ? scheduledLabel(entry)
                      : entry.type === 'task'
                        ? 'Checklist task'
                        : 'Free note'}
                  </span>
                  <span className="line-clamp-3 break-words">
                    {entry.text || 'Empty entry'}
                  </span>
                </Button>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
            <Button
              variant="ghost"
              size="small"
              disabled={busy}
              onClick={() => void load()}
            >
              Refresh results
            </Button>
            <div className="flex gap-2">
              <Button
                size="small"
                aria-label="Previous search results"
                disabled={busy || offset === 0}
                onClick={() => setOffset(Math.max(0, offset - 20))}
              >
                Previous
              </Button>
              <Button
                size="small"
                aria-label="Next search results"
                disabled={busy || offset + 20 >= results.length}
                onClick={() => setOffset(offset + 20)}
              >
                Next
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
