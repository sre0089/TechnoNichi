import type { SaveState } from '../../local/save-queue';
import { cn } from './utils';

export function SaveStatus({ state }: { state: SaveState }) {
  return (
    <div
      className={cn(
        'save-state flex items-center gap-2 rounded-full border border-solid border-line/70 bg-surface/70 px-3 py-2 text-[11px] text-ui-muted',
        state.kind,
      )}
      role="status"
      aria-live="polite"
    >
      <span
        className={cn(
          'h-1.5 w-1.5 shrink-0 rounded-full',
          state.kind === 'saved'
            ? 'bg-success'
            : state.kind === 'saving'
              ? 'bg-pending'
              : 'bg-danger',
        )}
        aria-hidden="true"
      />
      {state.kind === 'saved'
        ? 'Saved on this device'
        : state.kind === 'saving'
          ? 'Saving locally…'
          : 'Storage problem'}
    </div>
  );
}
