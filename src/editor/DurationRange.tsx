'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent,
  type KeyboardEvent,
} from 'react';
import {
  Move,
  ChevronDown,
  ArrowUp,
  ArrowDown,
  Minus,
  Plus,
} from 'lucide-react';
import type { DurationEntry, Entry } from '../domain/model';
import {
  adjustDuration,
  absoluteStart,
  absoluteEnd,
  sameRange,
  type DurationAdjustment,
} from '../domain/durations';
import { dailyTemplate, screenToDocument } from '../templates/daily-v1';
import { Button } from '../components/ui/button';
import type { NoteGestureControls } from './NoteFrame';

export function DurationRange({
  entry,
  display,
  lane,
  x,
  y,
  height,
  selected,
  disabled,
  edit,
  preview,
  beginNoteGesture,
  endNoteGesture,
}: NoteGestureControls & {
  entry: DurationEntry;
  display: DurationEntry;
  lane: number;
  x: number;
  y: number;
  height: number;
  selected: boolean;
  disabled: boolean;
  edit: (entry: Entry) => void;
  preview: (entry: DurationEntry | null) => void;
}) {
  const [active, setActive] = useState(false);
  const latest = useRef(entry);
  useEffect(() => {
    latest.current = entry;
  }, [entry]);
  const gesture = useRef<{
    mode: DurationAdjustment;
    original: DurationEntry;
    value: DurationEntry;
    startY: number;
    rect: DOMRect;
    pointer: number;
    handle: HTMLButtonElement;
    moved: boolean;
  } | null>(null);
  const finish = useCallback(
    (commit: boolean) => {
      const current = gesture.current;
      if (!current) return;
      gesture.current = null;
      setActive(false);
      preview(null);
      if (commit && !sameRange(current.original, current.value))
        edit({
          ...latest.current,
          minute: current.value.minute,
          dayOffset: current.value.dayOffset,
          endMinute: current.value.endMinute,
          endDayOffset: current.value.endDayOffset,
        });
      endNoteGesture();
      if (current.handle.hasPointerCapture(current.pointer))
        current.handle.releasePointerCapture(current.pointer);
    },
    [edit, endNoteGesture, preview],
  );
  useEffect(() => {
    if (!selected) return;
    const cancel = () => finish(false);
    const escape = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape' && gesture.current) {
        event.preventDefault();
        event.stopPropagation();
        finish(false);
      }
    };
    window.addEventListener('keydown', escape, true);
    window.addEventListener('blur', cancel);
    window.addEventListener('resize', cancel);
    window.addEventListener('scroll', cancel, true);
    return () => {
      window.removeEventListener('keydown', escape, true);
      window.removeEventListener('blur', cancel);
      window.removeEventListener('resize', cancel);
      window.removeEventListener('scroll', cancel, true);
      if (gesture.current) endNoteGesture();
    };
  }, [finish, endNoteGesture, selected]);
  const start = (
    event: PointerEvent<HTMLButtonElement>,
    mode: DurationAdjustment,
  ) => {
    if (disabled || gesture.current || event.button !== 0 || !event.isPrimary)
      return;
    const paper = event.currentTarget.closest('.paper');
    if (!paper || !beginNoteGesture()) return;
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.focus({ preventScroll: true });
    const rect = paper.getBoundingClientRect();
    gesture.current = {
      mode,
      original: latest.current,
      value: latest.current,
      startY: screenToDocument(event.clientX, event.clientY, rect).y,
      rect,
      pointer: event.pointerId,
      handle: event.currentTarget,
      moved: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    setActive(true);
    preview(latest.current);
  };
  const update = (event: PointerEvent<HTMLButtonElement>) => {
    const current = gesture.current;
    if (!current || event.pointerId !== current.pointer) return;
    const dy =
      screenToDocument(event.clientX, event.clientY, current.rect).y -
      current.startY;
    if (!current.moved && Math.abs((dy * current.rect.height) / 210) < 3)
      return;
    current.moved = true;
    current.value = adjustDuration(
      current.original,
      current.mode,
      (dy / dailyTemplate.grid.pitch) * 60,
    );
    preview(current.value);
  };
  const keyboard = (
    event: KeyboardEvent<HTMLButtonElement>,
    mode: DurationAdjustment,
  ) => {
    if (
      disabled ||
      gesture.current ||
      event.metaKey ||
      event.ctrlKey ||
      event.altKey ||
      event.nativeEvent.isComposing ||
      !['ArrowUp', 'ArrowDown'].includes(event.key)
    )
      return;
    event.preventDefault();
    event.stopPropagation();
    const next = adjustDuration(
      latest.current,
      mode,
      (event.key === 'ArrowUp' ? -1 : 1) * (event.shiftKey ? 60 : 15),
    );
    if (!sameRange(latest.current, next)) edit(next);
  };
  const help = `${entry.id}-duration-help`;
  return (
    <div
      className="duration-range"
      style={{
        left: `${(x / 148) * 100}%`,
        top: `${(y / 210) * 100}%`,
        height: `${(height / 210) * 100}%`,
      }}
    >
      <span
        className={`duration-span${selected ? ' duration-selected' : ''}`}
        data-entry-id={entry.id}
        data-start={absoluteStart(display)}
        data-end={absoluteEnd(display)}
        data-lane={lane}
        aria-hidden="true"
      />
      {selected && (
        <>
          <span id={help} className="sr-only">
            Drag or use Up and Down for 15 minutes. Shift changes one hour.
            Escape cancels a drag.
          </span>
          {(['move', 'end'] as const).map((mode) => (
            <Button
              key={mode}
              size="paper"
              className={`duration-handle duration-${mode}-handle`}
              data-duration-handle={mode}
              aria-label={
                mode === 'move' ? 'Move duration' : 'Resize duration end'
              }
              aria-describedby={help}
              disabled={disabled && !active}
              onPointerDown={(event) => start(event, mode)}
              onPointerMove={update}
              onPointerUp={(event) => {
                if (event.pointerId === gesture.current?.pointer) {
                  update(event);
                  finish(true);
                }
              }}
              onPointerCancel={() => finish(false)}
              onLostPointerCapture={() => finish(false)}
              onKeyDown={(event) => keyboard(event, mode)}
              onClick={(event) => event.stopPropagation()}
            >
              {mode === 'move' ? (
                <Move size={13} aria-hidden="true" />
              ) : (
                <ChevronDown size={13} aria-hidden="true" />
              )}
            </Button>
          ))}
        </>
      )}
    </div>
  );
}

export function DurationPlacementControls({
  entry,
  edit,
  disabled,
}: {
  entry: DurationEntry;
  edit: (entry: Entry) => void;
  disabled: boolean;
}) {
  return (
    <div
      className="flex flex-wrap items-center gap-1"
      role="group"
      aria-label="Duration placement"
    >
      {(
        [
          ['Earlier', 'move', -15, ArrowUp],
          ['Later', 'move', 15, ArrowDown],
          ['Shorter', 'end', -15, Minus],
          ['Longer', 'end', 15, Plus],
        ] as const
      ).map(([label, mode, delta, Icon]) => {
        const next = adjustDuration(entry, mode, delta);
        return (
          <Button
            key={label}
            variant="ghost"
            size="icon"
            disabled={disabled || sameRange(entry, next)}
            aria-label={`${label} duration by 15 minutes`}
            title={`${label} by 15 minutes`}
            onClick={() => edit(next)}
          >
            <Icon size={15} aria-hidden="true" />
          </Button>
        );
      })}
    </div>
  );
}
