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
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-center gap-7 px-6 py-12 text-ink">
      <div className="flex items-center gap-3">
        <span className="brand-mark" aria-hidden="true">
          ▤
        </span>
        <p className="m-0 font-caption text-[11px] tracking-[0.08em] text-ui-muted">
          Daily Book
        </p>
      </div>
      <div>
        <h1 className="mb-3 mt-0 font-display text-[clamp(2rem,5vw,2.75rem)] font-normal leading-[1.15] tracking-[-0.04em]">
          Create your book
        </h1>
        <p className="m-0 max-w-sm font-display text-lg font-normal leading-relaxed text-ui-muted">
          For plans, passing thoughts, and the days in between.
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
          <label className="flex flex-col gap-2 text-xs font-medium">
            Book name
            <Input
              value={title}
              required
              maxLength={200}
              autoComplete="off"
              onChange={(event) => setTitle(event.target.value)}
            />
          </label>
          <label className="flex flex-col gap-2 text-xs font-medium">
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
          <label className="flex flex-col gap-2 text-xs font-medium">
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
              Used for Today. Your written times stay as entered. Examples:
              America/New_York or UTC.
            </span>
          </label>
          <label className="flex flex-col gap-2 text-xs font-medium">
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
              When Today falls outside this year, open your last page. New books
              start on January 1.
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
      <aside
        aria-label="About your book"
        className="border-0 border-t border-solid border-line pt-5"
      >
        <h2 className="mb-2 mt-0 font-display text-lg font-normal">
          Kept on this device.
        </h2>
        <p className="m-0 text-xs leading-relaxed text-ui-muted">
          Your book lives in this browser, without a cloud copy. Download a
          backup from the book's Backups menu to keep a copy of your own.
        </p>
      </aside>
    </main>
  );
}
