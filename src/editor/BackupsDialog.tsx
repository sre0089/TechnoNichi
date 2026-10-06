'use client';

import { useRef, useState } from 'react';
import { Archive, Download, Upload } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '../components/ui/dialog';
import {
  MAX_BACKUP_BYTES,
  parseBackup,
  type PlannerBackup,
} from '../local/backup';

export function BackupsDialog({
  disabled,
  exportBackup,
  restoreBackup,
}: {
  disabled: boolean;
  exportBackup: () => Promise<{ text: string; year: number }>;
  restoreBackup: (archive: PlannerBackup) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<PlannerBackup | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const lock = useRef(false);
  const input = useRef<HTMLInputElement>(null);

  const run = async (action: () => Promise<void>) => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await action();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Please try again.');
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (lock.current) return;
        setOpen(next);
        setPreview(null);
        setError('');
        setMessage('');
      }}
    >
      <DialogTrigger asChild>
        <Button variant="ghost" disabled={disabled}>
          <Archive size={16} aria-hidden="true" />
          Backups
        </Button>
      </DialogTrigger>
      <DialogContent
        title="Backups"
        description="Keep a copy of your complete book, or restore a copy in an empty planner."
        closeDisabled={busy}
      >
        <div aria-busy={busy} className="space-y-6">
          <section aria-label="Export backup">
            <h2 className="m-0 text-sm font-semibold">Save a copy</h2>
            <p className="text-xs leading-relaxed text-ui-muted">
              Includes every date, tasks, notes, completion, word formatting and
              view preferences. The JSON file contains your writing in plain
              text and stays on your device.
            </p>
            <Button
              variant="primary"
              disabled={busy}
              onClick={() =>
                void run(async () => {
                  const { text, year } = await exportBackup();
                  const url = URL.createObjectURL(
                    new Blob([text], { type: 'application/json' }),
                  );
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = `daily-book-${year}-${new Date().toISOString().slice(0, 10)}.json`;
                  document.body.append(link);
                  try {
                    link.click();
                  } finally {
                    link.remove();
                    setTimeout(() => URL.revokeObjectURL(url), 30_000);
                  }
                  setMessage(
                    'Backup download started. Keep the file somewhere you can find it again.',
                  );
                })
              }
            >
              <Download size={16} aria-hidden="true" /> Download backup
            </Button>
          </section>
          <section
            aria-label="Import backup"
            className="border-0 border-t border-solid border-line pt-5"
          >
            <h2 className="m-0 text-sm font-semibold">Restore a copy</h2>
            <p className="text-xs leading-relaxed text-ui-muted">
              Restore requires a planner with no saved entries. To keep using
              your current book, open the app in a fresh browser profile. Choose
              a Daily Book JSON backup up to 20 MB to review it first.
            </p>
            <label
              htmlFor="backup-file"
              className="mb-2 block text-xs font-semibold"
            >
              Backup file
            </label>
            <input
              ref={input}
              id="backup-file"
              type="file"
              accept=".json,application/json"
              disabled={busy}
              className="block w-full rounded-control text-xs file:mr-3 file:rounded-control file:border file:border-solid file:border-line file:bg-wash file:px-3 file:py-2 file:text-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
              onChange={(event) => {
                const file = event.currentTarget.files?.[0];
                setPreview(null);
                if (!file) return;
                void run(async () => {
                  if (file.size > MAX_BACKUP_BYTES)
                    throw new Error('Choose a backup smaller than 20 MB.');
                  let text: string;
                  try {
                    text = await file.text();
                  } catch {
                    throw new Error(
                      'This file could not be read. Choose the file again.',
                    );
                  }
                  setPreview(parseBackup(text));
                });
              }}
            />
            {preview && (
              <div
                className="mt-4 rounded-control border border-solid border-line bg-wash p-4"
                aria-label="Backup preview"
              >
                <p className="m-0 break-words text-sm font-semibold">
                  {preview.book.title} · {preview.book.year}
                </p>
                <p className="my-2 text-xs leading-relaxed text-ui-muted">
                  {preview.pages.length} daily pages ·{' '}
                  {preview.entries.filter((entry) => !entry.deletedAt).length}{' '}
                  saved entries
                  <br />
                  {preview.book.startDate} through {preview.book.endDate}
                  <br />
                  Exported {preview.exportedAt.slice(0, 10)}
                </p>
                <Button
                  variant="primary"
                  disabled={busy}
                  onClick={() =>
                    void run(async () => {
                      await restoreBackup(preview);
                      setPreview(null);
                      if (input.current) input.current.value = '';
                      setMessage('Backup restored. Your book is ready.');
                    })
                  }
                >
                  <Upload size={16} aria-hidden="true" /> Restore backup
                </Button>
              </div>
            )}
          </section>
          {busy && (
            <p role="status" className="text-xs text-ui-muted">
              Working on your backup…
            </p>
          )}
          {message && (
            <p role="status" className="text-xs leading-relaxed">
              {message}
            </p>
          )}
          {error && (
            <p role="alert" className="text-xs leading-relaxed">
              {error}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
