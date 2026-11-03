'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';

type Choice = { outcome: 'accepted' | 'dismissed' };
interface InstallPrompt extends Event {
  prompt(): Promise<Choice | void>;
  userChoice?: Promise<Choice>;
}
function standalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}
function subscribeMode(listener: () => void) {
  const media = window.matchMedia('(display-mode: standalone)');
  media.addEventListener('change', listener);
  return () => media.removeEventListener('change', listener);
}

export function useInstallation() {
  const appMode = useSyncExternalStore(subscribeMode, standalone, () => false);
  const [available, setAvailable] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const deferred = useRef<InstallPrompt | null>(null);
  const lock = useRef(false);
  const installedHere = useRef(false);
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    const offered = (event: Event) => {
      const prompt = event as InstallPrompt;
      if (typeof prompt.prompt !== 'function') return;
      event.preventDefault();
      deferred.current = prompt;
      installedHere.current = false;
      setAvailable(true);
      setMessage('');
      setError('');
    };
    const installed = () => {
      deferred.current = null;
      installedHere.current = true;
      setAvailable(false);
      setMessage(
        'Daily Book was installed. Open it from your Home Screen or app menu.',
      );
      setError('');
    };
    window.addEventListener('beforeinstallprompt', offered);
    window.addEventListener('appinstalled', installed);
    return () => {
      window.removeEventListener('beforeinstallprompt', offered);
      window.removeEventListener('appinstalled', installed);
    };
  }, []);

  const install = async (prepare?: () => Promise<unknown>) => {
    const prompt = deferred.current;
    if (!prompt || lock.current || appMode) return;
    lock.current = true;
    setBusy(true);
    setError('');
    setMessage('');
    let consumed = false;
    try {
      // A failed save leaves the one-use browser offer available for retry.
      await prepare?.();
      if (deferred.current !== prompt)
        throw new Error(
          'The installation offer changed. Use your browser menu or try again when it offers installation.',
        );
      deferred.current = null;
      setAvailable(false);
      consumed = true;
      const result = await prompt.prompt();
      const choice = result ?? (await prompt.userChoice);
      if (installedHere.current) return;
      setMessage(
        choice?.outcome === 'accepted'
          ? 'Installation requested. Finish it in your browser, then open Daily Book from its icon.'
          : 'You can keep using your book here. Install later from your browser menu.',
      );
    } catch (error) {
      setError(
        !consumed && error instanceof Error
          ? error.message
          : 'Your browser could not start installation. Use its installation menu, or try again when it offers installation.',
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  return { appMode, available, busy, message, error, install };
}
export type Installation = ReturnType<typeof useInstallation>;
