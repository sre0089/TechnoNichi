'use client';

import { Download } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '../components/ui/dialog';
import type { Installation } from './use-installation';

export function InstallationDialog({
  installation,
  disabled = false,
  prepare,
}: {
  installation: Installation;
  disabled?: boolean;
  prepare?: () => Promise<unknown>;
}) {
  if (process.env.NODE_ENV !== 'production') return null;
  const { appMode, available, busy, message, error, install } = installation;
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="small" disabled={disabled || busy}>
          <Download size={15} aria-hidden="true" />
          {appMode ? 'App info' : 'App setup'}
        </Button>
      </DialogTrigger>
      <DialogContent
        title="Keep your book close"
        description="Give Daily Book its own window or Home Screen icon."
        closeDisabled={busy}
      >
        <div className="space-y-5 text-xs leading-relaxed">
          {appMode && (
            <p className="m-0 rounded-control bg-wash p-3">
              You are using Daily Book in app mode.
            </p>
          )}
          <section aria-label="Bring your book">
            <h2 className="mb-2 mt-0 font-display text-lg font-normal">
              Bring your book with you
            </h2>
            <p>
              Safari’s Home Screen and Dock apps use separate storage from
              browser tabs. Your browser book does not move automatically.
            </p>
            <ol className="m-0 space-y-2 pl-5">
              <li>Download your book first: Backups → Download backup.</li>
              <li>Install and open the app from its icon.</li>
              <li>
                If it opens to Create your book, choose Backups → Restore backup
                before creating a new book.
              </li>
            </ol>
            <p className="mb-0 text-ui-muted">
              Keep the original book and backup. Other browsers may share the
              book within the same profile; there is no cloud sync between
              separate stores.
            </p>
          </section>
          {!appMode && available && (
            <Button
              variant="primary"
              disabled={disabled || busy}
              aria-busy={busy}
              onClick={() => void install(prepare)}
            >
              {busy ? 'Opening installation…' : 'Install Daily Book'}
            </Button>
          )}
          {!appMode && (
            <section
              aria-label="Browser installation instructions"
              className="space-y-3 border-0 border-t border-solid border-line pt-4"
            >
              <h2 className="m-0 font-display text-lg font-normal">
                Use your browser’s menu
              </h2>
              <p className="m-0 text-ui-muted">
                Installation options depend on your browser and device.
              </p>
              <details>
                <summary className="cursor-pointer font-medium">
                  iPhone or iPad
                </summary>
                <p>
                  In Safari, open Share, choose Add to Home Screen, then Add.
                  Open the new icon while online and restore your backup if the
                  book is empty.
                </p>
              </details>
              <details>
                <summary className="cursor-pointer font-medium">
                  Safari on Mac
                </summary>
                <p>
                  Choose File → Add to Dock, then Add. Open the Dock app while
                  online and restore your backup if needed.
                </p>
              </details>
              <details>
                <summary className="cursor-pointer font-medium">
                  Chrome, Edge and other browsers
                </summary>
                <p>
                  Look for Install app or Add to Home Screen in the address bar
                  or browser menu. Some browsers do not offer a separate app
                  window; you can keep using your book in the browser.
                </p>
              </details>
            </section>
          )}
          <p className="m-0 border-0 border-t border-solid border-line pt-4 text-ui-muted">
            Installation and offline readiness are separate. After creating or
            restoring your book, wait for Available offline before
            disconnecting. Removing the app or clearing its data can remove the
            book. Keep regular backups separately.
          </p>
          {message && (
            <p role="status" className="m-0">
              {message}
            </p>
          )}
          {error && (
            <p role="alert" className="m-0">
              {error}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
