'use client';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Button } from '../components/ui/button';
import { restoreUnclaimedFocus } from '../editor/restore-focus';

function subscribeNetwork(listener: () => void) {
  window.addEventListener('online', listener);
  window.addEventListener('offline', listener);
  return () => {
    window.removeEventListener('online', listener);
    window.removeEventListener('offline', listener);
  };
}
export function workerMessage(
  worker: ServiceWorker,
  type: string,
): Promise<{ ready?: boolean; accepted?: boolean; error?: string }> {
  return new Promise((resolve, reject) => {
    const channel = new MessageChannel();
    const timeout = setTimeout(() => {
      channel.port1.close();
      reject(
        new Error('Offline setup did not respond. Please retry while online.'),
      );
    }, 10_000);
    channel.port1.onmessage = (event) => {
      clearTimeout(timeout);
      channel.port1.close();
      resolve(event.data);
    };
    worker.postMessage({ type }, [channel.port2]);
  });
}
export function OfflineStatus({
  disabled,
  saveAndUpdate,
}: {
  disabled: boolean;
  saveAndUpdate: (apply: () => Promise<void>) => Promise<void>;
}) {
  const online = useSyncExternalStore(
    subscribeNetwork,
    () => navigator.onLine,
    () => true,
  );
  const [ready, setReady] = useState(false);
  const [registration, setRegistration] =
    useState<ServiceWorkerRegistration | null>(null);
  const [waiting, setWaiting] = useState(false);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [updating, setUpdating] = useState(false);
  const updateButton = useRef<HTMLButtonElement>(null);
  const [protectedStorage, setProtectedStorage] = useState<boolean | null>(
    null,
  );
  const [protectionMessage, setProtectionMessage] = useState('');
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    let active = true;
    let current: ServiceWorkerRegistration | undefined;
    const updated = () => {
      if (active && current) setWaiting(!!current.waiting);
    };
    const changed = () => {
      const installing = current?.installing;
      installing?.addEventListener('statechange', () => {
        updated();
        if (active && installing.state === 'redundant')
          setError(
            'Offline opening could not be prepared. Retry while online.',
          );
      });
    };
    void (async () => {
      try {
        if (!('serviceWorker' in navigator))
          throw new Error('Offline opening is unavailable in this browser.');
        current = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
          updateViaCache: 'none',
        });
        if (!active) return;
        setRegistration(current);
        updated();
        current.addEventListener('updatefound', changed);
        changed();
        const installed = await navigator.serviceWorker.ready;
        if (!installed.active) return;
        let status = await workerMessage(installed.active, 'CACHE_STATUS');
        if (!status.ready)
          status = await workerMessage(installed.active, 'REPAIR_CACHE');
        if (active) {
          setReady(!!status.ready);
          if (!status.ready)
            setError('Offline files are incomplete. Retry while online.');
        }
      } catch (error) {
        if (active)
          setError(
            error instanceof Error
              ? error.message
              : 'Offline opening could not be prepared.',
          );
      }
      if (
        typeof navigator.storage?.persisted === 'function' &&
        typeof navigator.storage?.persist === 'function'
      ) {
        try {
          const protectedValue = await navigator.storage.persisted();
          if (active) setProtectedStorage(protectedValue);
        } catch {
          /* Storage protection is optional; cached opening still works. */
        }
      }
    })();
    return () => {
      active = false;
      current?.removeEventListener('updatefound', changed);
    };
  }, [attempt]);
  if (process.env.NODE_ENV !== 'production') return null;
  const apply = async () => {
    if (!registration?.waiting || disabled || updating) return;
    setError('');
    setUpdating(true);
    try {
      await saveAndUpdate(async () => {
        const worker = registration.waiting;
        if (!worker)
          throw new Error(
            'The update is no longer waiting. Reopen the app after saving.',
          );
        const controllerChanged = new Promise<void>((resolve, reject) => {
          const finish = () => {
            clearTimeout(timeout);
            navigator.serviceWorker.removeEventListener(
              'controllerchange',
              finish,
            );
            resolve();
          };
          const timeout = setTimeout(() => {
            navigator.serviceWorker.removeEventListener(
              'controllerchange',
              finish,
            );
            reject(
              new Error(
                'The update did not activate. Your writing is saved; retry while online.',
              ),
            );
          }, 10_000);
          navigator.serviceWorker.addEventListener('controllerchange', finish);
        });
        // Attach rejection handling immediately while the worker checks other tabs.
        void controllerChanged.catch(() => undefined);
        const result = await workerMessage(worker, 'APPLY_UPDATE');
        if (result.error) throw new Error(result.error);
        await controllerChanged;
        location.reload();
      });
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'The update could not finish.',
      );
      restoreUnclaimedFocus(() => updateButton.current);
    } finally {
      setUpdating(false);
    }
  };
  return (
    <aside
      aria-label="Offline opening"
      aria-live="polite"
      className="mx-auto mb-4 flex max-w-[1040px] flex-wrap items-center gap-3 text-xs text-ui-muted"
    >
      <span>
        {online
          ? ready
            ? 'Available offline'
            : error
              ? 'Offline opening unavailable'
              : 'Preparing offline opening…'
          : 'Offline — writing saves on this device'}
      </span>
      {waiting && (
        <Button
          ref={updateButton}
          size="small"
          aria-disabled={disabled || updating}
          aria-busy={updating}
          className="aria-disabled:opacity-40"
          onClick={() => void apply()}
        >
          Save and update
        </Button>
      )}
      {ready && protectedStorage === false && (
        <Button
          size="small"
          disabled={disabled || updating}
          onClick={() => {
            void (async () => {
              try {
                const granted = await navigator.storage.persist();
                setProtectedStorage(granted);
                setProtectionMessage(
                  granted
                    ? 'Browser storage protection granted.'
                    : 'The browser did not grant storage protection. Keep regular backups.',
                );
              } catch {
                setProtectionMessage(
                  'Storage protection is unavailable. Keep regular backups.',
                );
              }
            })();
          }}
        >
          Protect local storage
        </Button>
      )}
      {protectionMessage && <span>{protectionMessage}</span>}
      {error && (
        <>
          <p role="alert">{error}</p>
          <Button
            size="small"
            disabled={disabled || updating}
            onClick={() => {
              setError('');
              setAttempt((value) => value + 1);
            }}
          >
            Retry offline setup
          </Button>
        </>
      )}
    </aside>
  );
}
