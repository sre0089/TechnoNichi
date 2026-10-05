'use client';

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
} from 'react';
import {
  dateObject,
  datesInYear,
  labelDate,
  parseDate,
} from '../domain/calendar';
import { newEntry, type Entry, type PageRecord } from '../domain/model';
import {
  dailyTemplate as template,
  screenToDocument,
  snapNote,
  timeLabel,
  timeToY,
  yToTime,
} from '../templates/daily-v1';
import { usePlanner } from './use-planner';

function box(
  x: number,
  y: number,
  width?: number,
  height?: number,
): CSSProperties {
  return {
    left: `${(x / 148) * 100}%`,
    top: `${(y / 210) * 100}%`,
    ...(width === undefined ? {} : { width: `${(width / 148) * 100}%` }),
    ...(height === undefined ? {} : { height: `${(height / 210) * 100}%` }),
  };
}

function finishShort(event: KeyboardEvent<HTMLTextAreaElement>) {
  if (event.nativeEvent.isComposing) return;
  if (event.key === 'Escape' || (event.key === 'Enter' && !event.shiftKey)) {
    event.preventDefault();
    event.currentTarget.blur();
  }
}

function FocusedEditor({
  entry,
  edit,
  close,
}: {
  entry: Entry;
  edit: (entry: Entry) => void;
  close: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const writing = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    dialog.current?.showModal();
    writing.current?.focus();
  }, []);
  return (
    <dialog
      ref={dialog}
      className="focused-editor"
      aria-labelledby="focused-title"
      onClose={close}
    >
      <h2 id="focused-title">A little more room</h2>
      <label htmlFor="focused-writing">Your writing</label>
      <textarea
        ref={writing}
        id="focused-writing"
        value={entry.text}
        onChange={(event) => edit({ ...entry, text: event.target.value })}
      />
      <button onClick={() => dialog.current?.close()}>Done editing</button>
    </dialog>
  );
}

function TaskRow({
  task,
  isNew,
  edit,
  select,
  moving,
}: {
  task: Extract<Entry, { type: 'task' }>;
  isNew: boolean;
  edit: (entry: Entry) => void;
  select: (id: string) => void;
  moving: boolean;
}) {
  const input = useRef<HTMLTextAreaElement>(null);
  const [overflow, setOverflow] = useState(false);
  useEffect(() => {
    const node = input.current;
    if (!node) return;
    const observer = new ResizeObserver(() =>
      setOverflow(node.scrollHeight > node.clientHeight + 2),
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  const date = task.pageId.split(':').at(-1);
  return (
    <div className={`task-row${task.completed ? ' completed' : ''}`}>
      <input
        type="checkbox"
        aria-label={`Complete task ${task.slot + 1} on ${date}`}
        checked={task.completed}
        disabled={moving}
        onChange={(e) => edit({ ...task, completed: e.target.checked })}
      />
      <textarea
        ref={input}
        id={task.id}
        aria-label={`Task ${task.slot + 1} on ${date}`}
        value={task.text}
        readOnly={moving}
        spellCheck={false}
        rows={1}
        onFocus={() => {
          if (isNew) edit(task);
          select(task.id);
        }}
        onChange={(event) => {
          edit({ ...task, text: event.target.value });
          const node = event.target;
          requestAnimationFrame(() =>
            setOverflow(node.scrollHeight > node.clientHeight + 2),
          );
        }}
        onBlur={(event) => {
          event.currentTarget.scrollTop = 0;
        }}
        onKeyDown={finishShort}
      />
      {overflow && (
        <button
          className="task-overflow"
          aria-label={`Read full task ${task.slot + 1}`}
          onClick={() => select(task.id)}
        >
          …
        </button>
      )}
    </div>
  );
}

function Writing({
  entry,
  edit,
  select,
  moving,
}: {
  entry: Entry;
  edit: (e: Entry) => void;
  select: (id: string) => void;
  moving: boolean;
}) {
  const input = useRef<HTMLTextAreaElement>(null);
  const [overflow, setOverflow] = useState(false);
  useEffect(() => {
    const node = input.current;
    if (!node) return;
    const observer = new ResizeObserver(() =>
      setOverflow(node.scrollHeight > node.clientHeight + 2),
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  const isNote = entry.type === 'note';
  const style = isNote
    ? box(entry.x, entry.y, entry.width, entry.height)
    : entry.type === 'scheduled-line'
      ? box(
          template.scheduleX,
          timeToY(entry.minute, entry.dayOffset) - 2.5,
          114,
          7.4,
        )
      : {};
  const label = isNote
    ? `Note on ${entry.pageId.split(':').at(-1)}`
    : entry.type === 'scheduled-line'
      ? `Timed writing ${timeLabel(entry.minute, entry.dayOffset)}`
      : 'Writing';
  return (
    <div
      className={`writing-item ${isNote ? 'note' : 'timed'}${overflow ? ' has-overflow' : ''}`}
      style={style}
    >
      {entry.type === 'scheduled-line' && (
        <span className="entry-time" aria-hidden="true">
          {timeLabel(entry.minute, entry.dayOffset)}
        </span>
      )}
      <textarea
        ref={input}
        id={entry.id}
        aria-label={label}
        value={entry.text}
        readOnly={moving}
        spellCheck={false}
        placeholder={isNote ? 'Your note…' : 'Write beside the time…'}
        onFocus={() => select(entry.id)}
        onChange={(event) => {
          edit({ ...entry, text: event.target.value });
          const node = event.target;
          requestAnimationFrame(() =>
            setOverflow(node.scrollHeight > node.clientHeight + 2),
          );
        }}
        onBlur={(event) => {
          event.currentTarget.scrollTop = 0;
        }}
        onKeyDown={(event) => {
          if (isNote) {
            if (event.key === 'Escape' && !event.nativeEvent.isComposing) {
              event.preventDefault();
              event.currentTarget.blur();
            }
          } else finishShort(event);
        }}
      />
      {overflow && (
        <button
          className="overflow-mark"
          aria-label="Read overflowing writing"
          onClick={() => {
            select(entry.id);
            document.getElementById('full-writing')?.focus();
          }}
        >
          …
        </button>
      )}
    </div>
  );
}

function DailyPage({
  page,
  side,
  entries,
  edit,
  select,
  moving,
}: {
  page: PageRecord;
  side: 0 | 1;
  entries: Entry[];
  edit: (e: Entry) => void;
  select: (id: string) => void;
  moving: boolean;
}) {
  const parts = parseDate(page.date);
  const object = dateObject(page.date);
  const month = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    timeZone: 'UTC',
  })
    .format(object)
    .toUpperCase();
  const weekday = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    timeZone: 'UTC',
  })
    .format(object)
    .toUpperCase();
  const ordinal = datesInYear(parts.year).indexOf(page.date) + 1;
  const create = (entry: Entry) => {
    edit(entry);
    select(entry.id);
  };
  const positionClick = (event: MouseEvent<HTMLDivElement>) => {
    if (moving || event.target !== event.currentTarget) return;
    const paper = event.currentTarget.closest('.paper') as HTMLElement;
    const point = screenToDocument(
      event.clientX,
      event.clientY,
      paper.getBoundingClientRect(),
    );
    if (point.x < template.scheduleX && point.y <= 113)
      create(
        newEntry(page.id, { type: 'scheduled-line', ...yToTime(point.y) }),
      );
    else
      create(
        newEntry(page.id, { type: 'note', ...snapNote(point.x, point.y) }),
      );
  };
  return (
    <section
      className={`paper ${side === 0 ? 'left-page' : 'right-page'}`}
      aria-label={labelDate(page.date)}
    >
      <div
        className="paper-grid"
        style={box(
          template.grid.x,
          template.grid.y,
          template.grid.width,
          template.grid.height,
        )}
        aria-hidden="true"
      />
      <div
        className="date-box"
        style={box(
          template.header.x,
          template.header.y,
          template.header.width,
          template.header.height,
        )}
      >
        <span className="date-month">{month}</span>
        <span className="date-number">{parts.day}</span>
        <span className="date-weekday">{weekday}</span>
        <span className="date-meta">
          <span className="moon">◕</span>
          {ordinal}
        </span>
      </div>
      <div
        className="checklist"
        style={box(template.checklist.x, template.checklist.y, 78, 18.5)}
      >
        {Array.from({ length: 5 }, (_, slot) => {
          const existing = entries.find(
            (e) => e.type === 'task' && e.slot === slot,
          );
          const task =
            existing?.type === 'task'
              ? existing
              : newEntry(page.id, { type: 'task', slot });
          return (
            <TaskRow
              key={slot}
              task={task}
              isNew={!existing}
              edit={edit}
              select={select}
              moving={moving}
            />
          );
        })}
      </div>
      <div
        className="memo-divider"
        style={box(template.dividerX, template.grid.y, 0, 88.8)}
        aria-hidden="true"
      />
      {template.timeline.map((anchor) => (
        <span
          className="time-marker"
          style={box(template.timelineX - 1, anchor.y - 1.7, 3.7, 3.7)}
          key={anchor.label}
          aria-hidden="true"
        >
          {anchor.label}
        </span>
      ))}
      <div
        className="writing-surface"
        style={box(
          template.grid.x,
          template.grid.y,
          template.grid.width,
          template.grid.height,
        )}
        onClick={positionClick}
        title="Click beside a time to write; click elsewhere on the grid for a note."
      />
      {entries
        .filter((e) => e.type !== 'task')
        .map((entry) => (
          <Writing
            key={entry.id}
            entry={entry}
            edit={edit}
            select={select}
            moving={moving}
          />
        ))}
      <span className="month-tab" aria-hidden="true">
        {parts.month}
      </span>
      <div className="page-tools">
        <button
          disabled={moving}
          onClick={() =>
            create(
              newEntry(page.id, {
                type: 'scheduled-line',
                minute: 540,
                dayOffset: 0,
              }),
            )
          }
        >
          + Timed line
        </button>
        <button
          disabled={moving}
          onClick={() => {
            const notes = entries.filter((e) => e.type === 'note').length;
            create(
              newEntry(page.id, {
                type: 'note',
                ...snapNote(28.5, 127.3 + (notes % 3) * 18.5),
              }),
            );
          }}
        >
          + Note
        </button>
        <button
          disabled={
            moving || entries.filter((e) => e.type === 'task').length >= 5
          }
          onClick={() => {
            const slot = Array.from({ length: 5 }, (_, i) => i).find(
              (i) => !entries.some((e) => e.type === 'task' && e.slot === i),
            );
            if (slot !== undefined)
              create(newEntry(page.id, { type: 'task', slot }));
          }}
        >
          + Task
        </button>
      </div>
    </section>
  );
}

function MiniCalendar({
  date,
  selectedDates,
}: {
  date: string;
  selectedDates: string[];
}) {
  const { year, month } = parseDate(date);
  const dates = datesInYear(year).filter((d) => parseDate(d).month === month);
  const offset = (dateObject(dates[0]).getUTCDay() + 6) % 7;
  return (
    <div className="mini-calendar" aria-hidden="true">
      {'MTWTFSS'.split('').map((day, i) => (
        <span className="mini-heading" key={`heading-${i}`}>
          {day}
        </span>
      ))}
      {Array.from({ length: offset }, (_, i) => (
        <span key={`empty-${i}`} />
      ))}
      {dates.map((d) => (
        <span className={selectedDates.includes(d) ? 'current' : ''} key={d}>
          {parseDate(d).day}
        </span>
      ))}
    </div>
  );
}

export function Planner() {
  const {
    view,
    entries,
    saveState,
    openingError,
    moving,
    edit,
    navigate,
    updatePreferences,
    retry,
    unsaved,
  } = usePlanner();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showRecovery, setShowRecovery] = useState(false);
  const [focusedEditor, setFocusedEditor] = useState(false);
  const bookRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (selectedId) document.getElementById(selectedId)?.focus();
  }, [selectedId]);
  if (!view)
    return (
      <main className="opening">
        <div className="brand-mark" aria-hidden="true">
          ▤
        </div>
        <h1>Daily Book</h1>
        <p role={openingError ? 'alert' : 'status'}>
          {openingError
            ? 'Browser storage could not open. Your writing has not been cleared.'
            : 'Opening your book…'}
        </p>
        {openingError && (
          <button onClick={() => location.reload()}>Try opening again</button>
        )}
      </main>
    );
  const { preferences, pages } = view;
  const visible = pages.slice(preferences.pageIndex, preferences.pageIndex + 2);
  const selected = entries.find((e) => e.id === selectedId);
  const monthTitle = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(dateObject(visible[0].date));
  const turn = async (direction: number) => {
    if (await navigate(preferences.pageIndex + direction * 2)) {
      setSelectedId(null);
      bookRef.current?.focus();
    } else if (selectedId) {
      document.getElementById(selectedId)?.focus();
    }
  };
  return (
    <main className={`workspace toolbar-${preferences.toolbarSide}`}>
      <header className="app-header">
        <a className="brand" href="#book">
          <span className="brand-mark" aria-hidden="true">
            ▤
          </span>
          Daily Book<span className="brand-caption">a place for your day</span>
        </a>
        <div
          className={`save-state ${saveState.kind}`}
          role="status"
          aria-live="polite"
        >
          <span className="status-dot" aria-hidden="true" />
          {saveState.kind === 'saved'
            ? 'Saved on this device'
            : saveState.kind === 'saving'
              ? 'Saving locally…'
              : 'Storage problem'}
        </div>
      </header>
      <div className="book-toolbar">
        <div className="spread-navigation">
          <button
            aria-label="Previous spread"
            className="arrow-button"
            onClick={() => void turn(-1)}
            disabled={moving || preferences.pageIndex === 0}
          >
            ←
          </button>
          <div className="spread-title">
            <span>{monthTitle}</span>
            <strong>
              {parseDate(visible[0].date).day}
              {visible[1] ? ` — ${parseDate(visible[1].date).day}` : ''}
            </strong>
          </div>
          <button
            aria-label="Next spread"
            className="arrow-button"
            onClick={() => void turn(1)}
            disabled={moving || preferences.pageIndex + 2 >= pages.length}
          >
            →
          </button>
        </div>
        <div className="display-controls">
          <label>
            Size
            <select
              aria-label="Page size"
              value={preferences.zoom}
              onChange={(event) =>
                void updatePreferences({ zoom: Number(event.target.value) })
              }
            >
              <option value={0.85}>Small</option>
              <option value={1}>Comfortable</option>
              <option value={1.15}>Large</option>
            </select>
          </label>
          <button
            aria-label="Switch toolbar side"
            onClick={() =>
              void updatePreferences({
                toolbarSide:
                  preferences.toolbarSide === 'right' ? 'left' : 'right',
              })
            }
          >
            Controls: {preferences.toolbarSide}
          </button>
        </div>
      </div>
      {saveState.kind === 'error' && (
        <aside className="storage-alert" role="alert">
          <p>{saveState.message}</p>
          <button onClick={() => void retry()}>Retry saving</button>
          <button onClick={() => setShowRecovery(!showRecovery)}>
            Recover writing
          </button>
          {showRecovery && (
            <textarea
              aria-label="Recoverable writing"
              readOnly
              value={unsaved()
                .map(
                  (e) => `${e.pageId.split(':').at(-1)} · ${e.type}\n${e.text}`,
                )
                .join('\n\n')}
            />
          )}
        </aside>
      )}
      <div className="focus-tabs" aria-label="Focused page">
        {visible.map((page, side) => (
          <button
            key={page.id}
            aria-pressed={preferences.focusSide === side}
            onClick={() => void updatePreferences({ focusSide: side as 0 | 1 })}
          >
            {labelDate(page.date)}
          </button>
        ))}
      </div>
      <div
        className={`book focus-${preferences.focusSide}${moving ? ' turning' : ''}`}
        id="book"
        ref={bookRef}
        tabIndex={-1}
        aria-label="Daily planner spread"
        style={
          {
            '--book-width': `${1040 * preferences.zoom}px`,
            '--zoom': preferences.zoom,
          } as CSSProperties
        }
      >
        {visible.map((page, side) => (
          <DailyPage
            key={page.id}
            page={page}
            side={side as 0 | 1}
            entries={entries.filter((e) => e.pageId === page.id)}
            edit={edit}
            select={setSelectedId}
            moving={moving || focusedEditor}
          />
        ))}
        {visible.length === 1 && (
          <div className="paper end-paper" aria-hidden="true">
            <span>Every day, a little space.</span>
          </div>
        )}
        {visible[1] && (
          <MiniCalendar
            date={visible[1].date}
            selectedDates={visible.map((p) => p.date)}
          />
        )}
        <span className="gutter" aria-hidden="true" />
      </div>
      {selected && (
        <aside className="context-controls" aria-label="Writing controls">
          <span>
            {selected.type === 'scheduled-line'
              ? 'Timed line'
              : selected.type === 'note'
                ? 'Free note'
                : 'Checklist task'}
          </span>
          {selected.type === 'scheduled-line' && (
            <>
              <label>
                Time
                <input
                  type="time"
                  aria-label="Exact time"
                  value={timeLabel(selected.minute, 0)}
                  onChange={(event) => {
                    const [hour, minute] = event.target.value
                      .split(':')
                      .map(Number);
                    const total = hour * 60 + minute;
                    const offset = total < 360 ? 1 : 0;
                    if (
                      Number.isFinite(total) &&
                      (total >= 360 || total <= 180)
                    )
                      edit({ ...selected, minute: total, dayOffset: offset });
                  }}
                />
              </label>
              <small>
                {selected.dayOffset ? 'Following day (+1)' : 'Same day'} ·
                06:00–03:00
              </small>
            </>
          )}
          <details>
            <summary id="full-writing" tabIndex={0}>
              Read full writing
            </summary>
            <p className="full-writing">
              {selected.text || 'Nothing written yet.'}
            </p>
          </details>
          <button onClick={() => setFocusedEditor(true)}>Edit writing</button>
          <button
            onClick={() => {
              document.getElementById(selected.id)?.blur();
              setSelectedId(null);
            }}
          >
            Done
          </button>
        </aside>
      )}
      {focusedEditor && selected && (
        <FocusedEditor
          entry={selected}
          edit={edit}
          close={() => setFocusedEditor(false)}
        />
      )}
      <footer className="workspace-footer">
        <p>Click beside a time to write. Click the grid for a note.</p>
        <span>2026 · local book</span>
      </footer>
      <details className="day-outline">
        <summary>Day outline</summary>
        {visible.map((page) => (
          <section key={page.id}>
            <h2>{labelDate(page.date)}</h2>
            <ul>
              {entries
                .filter((e) => e.pageId === page.id && e.text)
                .sort((a, b) => {
                  const key = (e: Entry) =>
                    e.type === 'task'
                      ? e.slot
                      : e.type === 'scheduled-line'
                        ? 100 + e.minute + e.dayOffset * 1440
                        : 2000 + e.y;
                  return key(a) - key(b);
                })
                .map((entry) => (
                  <li key={entry.id}>
                    <button
                      onClick={() => {
                        void updatePreferences({
                          focusSide: visible.findIndex(
                            (p) => p.id === entry.pageId,
                          ) as 0 | 1,
                        });
                        setSelectedId(entry.id);
                      }}
                    >
                      {entry.type === 'scheduled-line'
                        ? `${timeLabel(entry.minute, entry.dayOffset)} · `
                        : entry.type === 'task'
                          ? `${entry.completed ? '✓' : '□'} `
                          : 'Note · '}
                      {entry.text}
                    </button>
                  </li>
                ))}
            </ul>
          </section>
        ))}
      </details>
    </main>
  );
}
