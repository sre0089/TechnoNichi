'use client';

import { useRef, useState } from 'react';
import { Button } from '../components/ui/button';
import { Input, NativeSelect } from '../components/ui/field';
import type { BookSetup as Setup } from '../local/book-setup';
import type { PlannerBackup } from '../local/backup';
import { hasRecoveryBuffers } from '../local/tab-recovery';
import { BackupsDialog } from './BackupsDialog';

export function BookSetup({
  create,
  restore,
}: {
  create: (input: Setup) => Promise<void>;
  restore: (backup: PlannerBackup) => Promise<void>;
}) {
  const [title, setTitle] = useState('My Daily Book');
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [zone, setZone] = useState(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
  );
  const [opening, setOpening] = useState<'today' | 'resume'>('today');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const lock = useRef(false);
  const retained = hasRecoveryBuffers();
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-center gap-5 px-6 py-10 text-ink">
      <div className="brand-mark" aria-hidden="true">
        ▤
      </div>
      <div>
        <p className="m-0 text-xs text-ui-muted">Daily Book</p>
        <h1 className="mb-2 mt-2 text-2xl font-semibold">Create your book</h1>
        <p className="m-0 text-sm leading-relaxed text-ui-muted">
          A quiet place for your days. Choose one year to start writing.
        </p>
      </div>
      {retained && (
        <p role="alert" className="text-sm leading-relaxed">
          Retained writing was found on this device. Restore its original book
          first. Your recovery copies have not been cleared.
        </p>
      )}
      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (lock.current) return;
          lock.current = true;
          setBusy(true);
          setError('');
          void create({ title, year, todayTimeZone: zone.trim(), opening })
            .catch((error: unknown) => {
              setError(
                error instanceof Error
                  ? error.message
                  : 'Your book could not be created. Try again.',
              );
            })
            .finally(() => {
              lock.current = false;
              setBusy(false);
            });
        }}
      >
        <fieldset
          disabled={busy || retained}
          className="m-0 flex min-w-0 flex-col gap-4 border-0 p-0"
        >
          <label className="flex flex-col gap-2 text-xs font-semibold">
            Book name
            <Input
              value={title}
              required
              maxLength={200}
              autoComplete="off"
              onChange={(event) => setTitle(event.target.value)}
            />
          </label>
          <label className="flex flex-col gap-2 text-xs font-semibold">
            Year
            <Input
              type="number"
              value={Number.isNaN(year) ? '' : year}
              required
              min={1900}
              max={2200}
              step={1}
              onChange={(event) => setYear(event.target.valueAsNumber)}
            />
          </label>
          <label className="flex flex-col gap-2 text-xs font-semibold">
            Today timezone
            <Input
              aria-label="Today timezone"
              value={zone}
              required
              maxLength={100}
              spellCheck={false}
              autoComplete="off"
              onChange={(event) => setZone(event.target.value)}
              aria-describedby="timezone-help"
            />
            <span
              id="timezone-help"
              className="font-normal leading-relaxed text-ui-muted"
            >
              Starts with your device timezone. For example: America/New_York or
              UTC. Your written times stay as you enter them.
            </span>
          </label>
          <label className="flex flex-col gap-2 text-xs font-semibold">
            Open book to
            <NativeSelect
              aria-label="Open book to"
              aria-describedby="opening-help"
              value={opening}
              onChange={(event) =>
                setOpening(event.target.value as 'today' | 'resume')
              }
            >
              <option value="today">Today</option>
              <option value="resume">Last page</option>
            </NativeSelect>
            <span
              id="opening-help"
              className="font-normal leading-relaxed text-ui-muted"
            >
              Outside this book's year, open the last page visited. A new book
              starts on January 1.
            </span>
          </label>
          <Button type="submit" variant="primary">
            {busy ? 'Creating your book…' : 'Create book'}
          </Button>
        </fieldset>
      </form>
      {error && (
        <div>
          <p role="alert" className="text-sm leading-relaxed">
            {error}
          </p>
          <Button onClick={() => location.reload()}>Try opening again</Button>
        </div>
      )}
      <div className="border-0 border-t border-solid border-line pt-4">
        <p className="mt-0 text-xs leading-relaxed text-ui-muted">
          Already have a book? Restore a Daily Book JSON backup.
        </p>
        <BackupsDialog disabled={busy} restoreBackup={restore} />
      </div>
      <p className="m-0 rounded-control bg-wash/60 p-3 text-xs leading-relaxed text-ui-muted">
        Your book is saved in this browser on this device. There is no account
        or cloud copy. Download backups from the book's Backups menu to keep a
        portable copy.
      </p>
    </main>
  );
}
