'use client';
import { useEffect } from 'react';
import { Undo2, Redo2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import type { HistoryInfo, HistoryDirection } from '../local/page-history';
export function PageHistoryControls({
  info,
  disabled,
  apply,
}: {
  info: HistoryInfo;
  disabled: boolean;
  apply: (direction: HistoryDirection) => void;
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (
        disabled ||
        event.defaultPrevented ||
        event.altKey ||
        !(event.metaKey || event.ctrlKey)
      )
        return;
      if (
        (event.target as Element | null)?.closest(
          'input, textarea, select, [contenteditable="true"], [role="dialog"]',
        )
      )
        return;
      const key = event.key.toLowerCase();
      const direction =
        key === 'z'
          ? event.shiftKey
            ? 'redo'
            : 'undo'
          : key === 'y' && event.ctrlKey
            ? 'redo'
            : null;
      if (
        !direction ||
        !(direction === 'undo' ? info.undoCount : info.redoCount)
      )
        return;
      event.preventDefault();
      apply(direction);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [info, disabled, apply]);
  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Undo page action"
        title={
          info.undoLabel ? `Undo: ${info.undoLabel}` : 'No page action to undo'
        }
        disabled={disabled || !info.undoCount}
        onClick={() => apply('undo')}
      >
        <Undo2 size={18} aria-hidden="true" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Redo page action"
        title={
          info.redoLabel ? `Redo: ${info.redoLabel}` : 'No page action to redo'
        }
        disabled={disabled || !info.redoCount}
        onClick={() => apply('redo')}
      >
        <Redo2 size={18} aria-hidden="true" />
      </Button>
    </>
  );
}
