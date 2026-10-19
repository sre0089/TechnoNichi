'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type PointerEvent,
  type KeyboardEvent,
} from 'react';
import {
  Move,
  MoveDownRight,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Minus,
  Plus,
} from 'lucide-react';
import type { Entry } from '../domain/model';
import {
  moveNote,
  resizeNote,
  sameGeometry,
  type NoteGeometry,
} from '../domain/note-geometry';
import { dailyTemplate, screenToDocument } from '../templates/daily-v1';
import { Button } from '../components/ui/button';

type Note = Extract<Entry, { type: 'note' }>;
type Mode = 'move' | 'resize';
export interface NoteGestureControls {
  beginNoteGesture: () => boolean;
  endNoteGesture: () => void;
}

function geometry(note: NoteGeometry): NoteGeometry {
  const { x, y, width, height } = note;
  return { x, y, width, height };
}

export function NoteFrame({
  entry,
  selected,
  disabled,
  edit,
  beginNoteGesture,
  endNoteGesture,
  className,
  children,
}: NoteGestureControls & {
  entry: Note;
  selected: boolean;
  disabled: boolean;
  edit: (entry: Entry) => void;
  className: string;
  children: ReactNode;
}) {
  const [preview, setPreview] = useState<NoteGeometry | null>(null);
  const latest = useRef(entry);
  useEffect(() => {
    latest.current = entry;
  }, [entry]);
  const gesture = useRef<{
    mode: Mode;
    original: NoteGeometry;
    preview: NoteGeometry;
    start: { x: number; y: number };
    rect: DOMRect;
    pointerId: number;
    handle: HTMLButtonElement;
    moved: boolean;
  } | null>(null);

  const finish = useCallback(
    (commit: boolean) => {
      const current = gesture.current;
      if (!current) return;
      gesture.current = null;
      setPreview(null);
      if (commit && !sameGeometry(current.original, current.preview))
        edit({ ...latest.current, ...geometry(current.preview) });
      endNoteGesture();
      if (current.handle.hasPointerCapture(current.pointerId))
        current.handle.releasePointerCapture(current.pointerId);
    },
    [edit, endNoteGesture],
  );

  useEffect(() => {
    const escape = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Escape' || !gesture.current) return;
      event.preventDefault();
      event.stopPropagation();
      finish(false);
    };
    const cancel = () => finish(false);
    window.addEventListener('keydown', escape, true);
    window.addEventListener('blur', cancel);
    window.addEventListener('resize', cancel);
    window.addEventListener('scroll', cancel, true);
    return () => {
      window.removeEventListener('keydown', escape, true);
      window.removeEventListener('blur', cancel);
      window.removeEventListener('resize', cancel);
      window.removeEventListener('scroll', cancel, true);
      // The planner normally prevents unmounting during a gesture.
      if (gesture.current) endNoteGesture();
    };
  }, [finish, endNoteGesture]);

  const start = (event: PointerEvent<HTMLButtonElement>, mode: Mode) => {
    if (disabled || gesture.current || event.button !== 0 || !event.isPrimary)
      return;
    const paper = event.currentTarget.closest('.paper');
    if (!paper || !beginNoteGesture()) return;
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.focus({ preventScroll: true });
    const rect = paper.getBoundingClientRect();
    const original = geometry(latest.current);
    gesture.current = {
      mode,
      original,
      preview: original,
      start: screenToDocument(event.clientX, event.clientY, rect),
      rect,
      pointerId: event.pointerId,
      handle: event.currentTarget,
      moved: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    setPreview(original);
  };
  const update = (event: PointerEvent<HTMLButtonElement>) => {
    const current = gesture.current;
    if (!current || event.pointerId !== current.pointerId) return;
    const point = screenToDocument(event.clientX, event.clientY, current.rect);
    if (!current.moved) {
      const screenDistance = Math.hypot(
        ((point.x - current.start.x) * current.rect.width) / 148,
        ((point.y - current.start.y) * current.rect.height) / 210,
      );
      // A click on a handle must not snap an imported, unsnapped note.
      if (screenDistance < 3) return;
      current.moved = true;
    }
    const transform = current.mode === 'move' ? moveNote : resizeNote;
    current.preview = transform(
      current.original,
      point.x - current.start.x,
      point.y - current.start.y,
    );
    setPreview(current.preview);
  };
  const keyboard = (event: KeyboardEvent<HTMLButtonElement>, mode: Mode) => {
    if (
      disabled ||
      gesture.current ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.nativeEvent.isComposing
    )
      return;
    const direction = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
    }[event.key];
    if (!direction) return;
    event.preventDefault();
    event.stopPropagation();
    const step = dailyTemplate.grid.pitch * (event.shiftKey ? 5 : 1);
    const transform = mode === 'move' ? moveNote : resizeNote;
    const next = transform(
      latest.current,
      direction[0] * step,
      direction[1] * step,
    );
    if (!sameGeometry(latest.current, next))
      edit({ ...latest.current, ...geometry(next) });
  };
  const current = preview ?? entry;
  const helpId = `${entry.id}-placement-help`;
  return (
    <div
      className={`${className}${selected ? ' note-selected' : ''}${preview ? ' note-adjusting' : ''}`}
      data-note-id={entry.id}
      style={{
        left: `${(current.x / 148) * 100}%`,
        top: `${(current.y / 210) * 100}%`,
        width: `${(current.width / 148) * 100}%`,
        height: `${(current.height / 210) * 100}%`,
      }}
    >
      {children}
      {selected && (
        <>
          <span id={helpId} className="sr-only">
            Drag or use arrow keys. Shift moves five squares. Escape cancels a
            drag.
          </span>
          {(['move', 'resize'] as const).map((mode) => {
            const Icon = mode === 'move' ? Move : MoveDownRight;
            return (
              <Button
                key={mode}
                size="paper"
                data-note-handle={mode}
                className={`note-handle note-${mode}-handle`}
                aria-label={mode === 'move' ? 'Move note' : 'Resize note'}
                aria-describedby={helpId}
                disabled={disabled && !preview}
                onPointerDown={(event) => start(event, mode)}
                onPointerMove={update}
                onPointerUp={(event) => {
                  if (event.pointerId !== gesture.current?.pointerId) return;
                  update(event);
                  finish(true);
                }}
                onPointerCancel={() => finish(false)}
                onLostPointerCapture={() => finish(false)}
                onKeyDown={(event) => keyboard(event, mode)}
                onClick={(event) => event.stopPropagation()}
              >
                <Icon size={15} aria-hidden="true" />
              </Button>
            );
          })}
        </>
      )}
    </div>
  );
}

export function NotePlacementControls({
  entry,
  edit,
  disabled,
}: {
  entry: Note;
  edit: (entry: Entry) => void;
  disabled: boolean;
}) {
  const pitch = dailyTemplate.grid.pitch;
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div
        role="group"
        aria-label="Move note one square"
        className="flex items-center gap-1"
      >
        <span className="mr-1 text-ui-muted">Move</span>
        {(
          [
            ['left', ArrowLeft, -1, 0],
            ['up', ArrowUp, 0, -1],
            ['down', ArrowDown, 0, 1],
            ['right', ArrowRight, 1, 0],
          ] as const
        ).map(([name, Icon, dx, dy]) => {
          const next = moveNote(entry, dx * pitch, dy * pitch);
          return (
            <Button
              key={name}
              variant="ghost"
              size="icon"
              aria-label={`Move note ${name}`}
              disabled={disabled || sameGeometry(entry, next)}
              onClick={() => edit({ ...entry, ...geometry(next) })}
            >
              <Icon size={15} aria-hidden="true" />
            </Button>
          );
        })}
      </div>
      <div
        role="group"
        aria-label="Note size"
        className="flex items-center gap-1"
      >
        {(
          [
            ['Narrower note', Minus, -1, 0],
            ['Wider note', Plus, 1, 0],
            ['Shorter note', Minus, 0, -1],
            ['Taller note', Plus, 0, 1],
          ] as const
        ).map(([name, Icon, dx, dy]) => {
          const next = resizeNote(entry, dx * pitch, dy * pitch);
          return (
            <Button
              key={name}
              variant="ghost"
              size="small"
              aria-label={name}
              disabled={disabled || sameGeometry(entry, next)}
              onClick={() => edit({ ...entry, ...geometry(next) })}
            >
              <Icon size={12} aria-hidden="true" />
              {name.split(' ')[0]}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
