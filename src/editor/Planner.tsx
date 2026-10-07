'use client';

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
} from 'react';
import {
  dateObject,
  datesInYear,
  labelDate,
  parseDate,
} from '../domain/calendar';
import {
  newEntry,
  newHourlyEntry,
  newTaskEntry,
  type Entry,
  type PageRecord,
} from '../domain/model';
import {
  dailyTemplate as template,
  hourlyRows,
  hourForTime,
  screenToDocument,
  snapNote,
  timeLabel,
} from '../templates/daily-v1';
import { usePlanner } from './use-planner';
import { scheduledRuns } from '../domain/schedule';
import {
  ChevronLeft,
  ChevronRight,
  Settings2,
  Expand,
  Eye,
  Check,
  PanelLeft,
  PanelRight,
  NotebookPen,
  Bold,
  Italic,
  Underline,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input, InkCheckbox, Textarea } from '../components/ui/field';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTrigger,
} from '../components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../components/ui/popover';
import { Hint, TooltipProvider } from '../components/ui/tooltip';
import { SaveStatus } from '../components/ui/save-status';
import { PageSizeSelect, ViewSettings } from './ViewSettings';
import { BackupsDialog } from './BackupsDialog';
import {
  DeleteEntryButton,
  DeletedEntriesDialog,
} from './DeletedEntriesDialog';
import {
  RichWriting,
  WritingProvider,
  useWritingFormat,
  FormattedText,
  focusWriting,
} from './RichWriting';

function FormattingControls({
  entry,
  disabled = false,
}: {
  entry: Entry;
  disabled?: boolean;
}) {
  const { state, toggle } = useWritingFormat(entry.id);
  return (
    <div
      className="flex items-center gap-1"
      role="group"
      aria-label="Writing format"
    >
      {(
        [
          ['bold', 'Bold', Bold, 'B'],
          ['italic', 'Italic', Italic, 'I'],
          ['underline', 'Underline', Underline, 'U'],
        ] as const
      ).map(([format, label, Icon, key]) => (
        <Hint key={format} label={`${label} · Cmd/Ctrl+${key}`}>
          <Button
            variant="ghost"
            size="icon"
            aria-label={label}
            aria-pressed={state?.[format] ?? false}
            aria-keyshortcuts={`Meta+${key} Control+${key}`}
            className="aria-pressed:bg-wash aria-pressed:text-ink"
            disabled={disabled}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => toggle(format)}
          >
            <Icon size={16} aria-hidden="true" />
          </Button>
        </Hint>
      ))}
    </div>
  );
}

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

function finishTimed(entry: Entry, edit: (entry: Entry) => void) {
  if (entry.type === 'scheduled-line' && entry.text.trim() && !entry.submitted)
    edit({ ...entry, submitted: true, completed: false });
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
  const writing = useRef<HTMLElement>(null);
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <DialogContent
        title="A little more room"
        description="Take your time. Your writing stays with the page."
        className="max-w-xl"
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          writing.current?.focus();
        }}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          requestAnimationFrame(() =>
            document.getElementById(entry.id)?.focus(),
          );
        }}
      >
        <label
          htmlFor="focused-writing"
          className="mb-3 block text-xs font-semibold"
        >
          Your writing
        </label>
        <RichWriting
          entry={entry}
          edit={edit}
          label="Your writing"
          fieldRef={writing}
          mode="enlarged"
          enlarged
        />
        <div className="mt-5 flex items-center justify-between">
          <FormattingControls entry={entry} />
          <DialogClose asChild>
            <Button
              variant="primary"
              onClick={() => {
                finishTimed(entry, edit);
              }}
            >
              Done editing
            </Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TaskRow({
  task,
  isNew,
  edit,
  select,
  moving,
  selected,
}: {
  task: Extract<Entry, { type: 'task' }>;
  isNew: boolean;
  edit: (entry: Entry) => void;
  select: (id: string) => void;
  moving: boolean;
  selected: boolean;
}) {
  const input = useRef<HTMLElement>(null);
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
      <InkCheckbox
        aria-label={`Complete task ${task.slot + 1} on ${date}`}
        checked={task.completed}
        disabled={moving}
        onChange={(e) => edit({ ...task, completed: e.target.checked })}
      />
      <RichWriting
        key={task.id}
        entry={task}
        edit={edit}
        label={`Task ${task.slot + 1} on ${date}`}
        fieldRef={input}
        readOnly={moving}
        selected={selected}
        onFocus={() => {
          if (isNew) edit(task);
          select(task.id);
        }}
        onOverflow={setOverflow}
      />
      {overflow && (
        <Button
          size="paper"
          className="task-overflow"
          aria-label={`Read full task ${task.slot + 1}`}
          onClick={() => select(task.id)}
        >
          …
        </Button>
      )}
    </div>
  );
}

function Writing({
  entry,
  edit,
  select,
  moving,
  isNew = false,
  otherWriting = [],
  moveRow,
  selected,
}: {
  entry: Entry;
  edit: (e: Entry) => void;
  select: (id: string) => void;
  moving: boolean;
  isNew?: boolean;
  otherWriting?: Entry[];
  moveRow?: (direction: -1 | 1, caret: number) => boolean;
  selected: boolean;
}) {
  const input = useRef<HTMLElement>(null);
  const [overflow, setOverflow] = useState(false);
  useEffect(() => {
    const node = input.current;
    if (!node) return;
    const observer = new ResizeObserver(() =>
      setOverflow(node.scrollHeight > node.clientHeight + 2),
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [entry.text]);
  const isNote = entry.type === 'note';
  const submitted =
    entry.type === 'scheduled-line' && entry.submitted && !!entry.text.trim();
  const style = isNote
    ? box(entry.x, entry.y, entry.width, entry.height)
    : entry.type === 'scheduled-line'
      ? box(
          template.scheduleX,
          hourlyRows.find(
            (row) =>
              row.absolute === hourForTime(entry.minute, entry.dayOffset),
          )!.y - template.grid.pitch,
          template.grid.x + template.grid.width - template.scheduleX,
          template.grid.pitch,
        )
      : {};
  const label = isNote
    ? `Note on ${entry.pageId.split(':').at(-1)}`
    : entry.type === 'scheduled-line'
      ? `Timed writing ${timeLabel(entry.minute, entry.dayOffset)}`
      : 'Writing';
  return (
    <div
      className={`writing-item ${isNote ? 'note' : 'timed'}${submitted ? ' submitted' : ''}${entry.type === 'scheduled-line' && entry.completed ? ' completed' : ''}${overflow ? ' has-overflow' : ''}`}
      style={style}
    >
      <RichWriting
        key={entry.id}
        entry={entry}
        edit={edit}
        label={label}
        fieldRef={input}
        readOnly={moving}
        selected={selected}
        mode={isNote ? 'note' : 'short'}
        onOverflow={setOverflow}
        moveRow={moveRow}
        onFocus={() => {
          if (moving) return;
          if (isNew) edit(entry);
          select(entry.id);
        }}
        onFinish={() => finishTimed(entry, edit)}
      />
      {submitted && entry.type === 'scheduled-line' && (
        <div className="timed-completion">
          <span className="completion-measure" aria-hidden="true">
            <FormattedText entry={entry} text={entry.text.split('\n')[0]} />
          </span>
          <InkCheckbox
            aria-label={`Complete timed task ${timeLabel(entry.minute, entry.dayOffset)} on ${entry.pageId.split(':').at(-1)}`}
            checked={entry.completed ?? false}
            disabled={moving}
            onChange={(event) =>
              edit({ ...entry, completed: event.target.checked })
            }
          />
        </div>
      )}
      {otherWriting.length > 1 && (
        <Button
          size="paper"
          className="row-alternatives"
          disabled={moving}
          aria-label={`Other writing in this hour (${otherWriting.length} entries)`}
          title="Cycle through existing writing in this hour"
          onClick={() => {
            const index = otherWriting.findIndex((e) => e.id === entry.id);
            select(otherWriting[(index + 1) % otherWriting.length].id);
          }}
        >
          +{otherWriting.length - 1}
        </Button>
      )}
      {overflow && (
        <Button
          size="paper"
          className="overflow-mark"
          aria-label="Read overflowing writing"
          onClick={() => {
            select(entry.id);
            document.getElementById('full-writing')?.focus();
          }}
        >
          …
        </Button>
      )}
    </div>
  );
}

function DailyPage({
  page,
  side,
  entries: records,
  edit,
  select,
  moving,
  selectedId,
}: {
  page: PageRecord;
  side: 0 | 1;
  entries: Entry[];
  edit: (e: Entry) => void;
  select: (id: string) => void;
  moving: boolean;
  selectedId: string | null;
}) {
  const entries = records.filter((entry) => !entry.deletedAt);
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
    create(newEntry(page.id, { type: 'note', ...snapNote(point.x, point.y) }));
  };
  const paper = useRef<HTMLElement>(null);
  return (
    <section
      ref={paper}
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
              : newTaskEntry(page.id, slot, records);
          return (
            <TaskRow
              key={slot}
              task={task}
              selected={task.id === selectedId}
              isNew={!existing}
              edit={edit}
              select={select}
              moving={moving}
            />
          );
        })}
      </div>
      {hourlyRows.map((row) => (
        <span
          className={row.label === null ? 'time-dot' : 'time-marker'}
          style={box(template.timelineX, row.y)}
          key={row.absolute}
          aria-hidden="true"
        >
          {row.label}
        </span>
      ))}
      {scheduledRuns(entries).map((run) => (
        <span
          className="schedule-line"
          key={run.start}
          data-start={run.start}
          data-end={run.end}
          style={box(template.scheduleLineX, run.y, 0, run.height)}
          aria-hidden="true"
        />
      ))}
      {hourlyRows.map((row, index) => {
        const existing = entries
          .filter(
            (e) =>
              e.type === 'scheduled-line' &&
              hourForTime(e.minute, e.dayOffset) === row.absolute,
          )
          .sort((a, b) => a.id.localeCompare(b.id));
        const entry =
          existing.find((e) => e.id === selectedId) ??
          existing[0] ??
          newHourlyEntry(page.id, row.minute, row.dayOffset, records);
        return (
          <Writing
            key={row.absolute}
            entry={entry}
            selected={entry.id === selectedId}
            isNew={!existing.length}
            otherWriting={existing}
            edit={edit}
            select={select}
            moving={moving}
            moveRow={(direction, caret) => {
              if (moving) return false;
              const next = paper.current?.querySelectorAll<HTMLElement>(
                '.timed .writing-input',
              )[index + direction];
              if (!next) return false;
              focusWriting(next, caret);
              return true;
            }}
          />
        );
      })}
      <div
        className="writing-surface"
        style={box(
          template.grid.x,
          template.memoY,
          template.grid.width,
          template.grid.y + template.grid.height - template.memoY,
        )}
        onClick={positionClick}
        title="Click the lower grid to write a free note."
      />
      {entries
        .filter((e) => e.type === 'note')
        .map((entry) => (
          <Writing
            key={entry.id}
            entry={entry}
            selected={entry.id === selectedId}
            edit={edit}
            select={select}
            moving={moving}
          />
        ))}
      <span className="month-tab" aria-hidden="true">
        {parts.month}
      </span>
      <div className="page-tools">
        <Button
          size="paper"
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
        </Button>
        <Button
          size="paper"
          disabled={
            moving || entries.filter((e) => e.type === 'task').length >= 5
          }
          onClick={() => {
            const slot = Array.from({ length: 5 }, (_, i) => i).find(
              (i) => !entries.some((e) => e.type === 'task' && e.slot === i),
            );
            if (slot !== undefined)
              create(newTaskEntry(page.id, slot, records));
          }}
        >
          + Task
        </Button>
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

function PlannerEditor() {
  const {
    view,
    entries: records,
    saveState,
    openingError,
    moving,
    edit,
    navigate,
    updatePreferences,
    retry,
    unsaved,
    exportBackup,
    restoreBackup,
    listDeletedEntries,
    deleteEntry,
    restoreEntry,
  } = usePlanner();
  const entries = records.filter((entry) => !entry.deletedAt);
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
          <Button onClick={() => location.reload()}>Try opening again</Button>
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
    <TooltipProvider delayDuration={450} skipDelayDuration={200}>
      <main className={`workspace toolbar-${preferences.toolbarSide}`}>
        <header className="app-header">
          <a className="brand" href="#book">
            <NotebookPen
              className="text-ink"
              size={24}
              strokeWidth={1.5}
              aria-hidden="true"
            />
            Daily Book
            <span className="brand-caption">a place for your day</span>
          </a>
          <SaveStatus state={saveState} />
        </header>
        <div className="book-toolbar">
          <div className="spread-navigation">
            <Hint label="Previous two days">
              <Button
                aria-label="Previous spread"
                variant="ghost"
                size="icon"
                onClick={() => void turn(-1)}
                disabled={moving || preferences.pageIndex === 0}
              >
                <ChevronLeft size={20} strokeWidth={1.5} aria-hidden="true" />
              </Button>
            </Hint>
            <div className="spread-title">
              <span>{monthTitle}</span>
              <strong>
                {parseDate(visible[0].date).day}
                {visible[1] ? ` — ${parseDate(visible[1].date).day}` : ''}
              </strong>
            </div>
            <Hint label="Next two days">
              <Button
                aria-label="Next spread"
                variant="ghost"
                size="icon"
                onClick={() => void turn(1)}
                disabled={moving || preferences.pageIndex + 2 >= pages.length}
              >
                <ChevronRight size={20} strokeWidth={1.5} aria-hidden="true" />
              </Button>
            </Hint>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <DeletedEntriesDialog
              disabled={moving || focusedEditor}
              listEntries={listDeletedEntries}
              restoreEntry={restoreEntry}
            />
            <BackupsDialog
              disabled={moving}
              exportBackup={exportBackup}
              restoreBackup={async (archive) => {
                await restoreBackup(archive);
                setSelectedId(null);
                setFocusedEditor(false);
              }}
            />
            <PageSizeSelect
              zoom={preferences.zoom}
              onChange={(zoom) => void updatePreferences({ zoom })}
              disabled={moving}
            />
            <Hint label="Move view controls to the other side">
              <Button
                aria-label="Switch toolbar side"
                variant="ghost"
                size="icon"
                disabled={moving}
                onClick={() =>
                  void updatePreferences({
                    toolbarSide:
                      preferences.toolbarSide === 'right' ? 'left' : 'right',
                  })
                }
              >
                {preferences.toolbarSide === 'right' ? (
                  <PanelLeft size={17} strokeWidth={1.5} aria-hidden="true" />
                ) : (
                  <PanelRight size={17} strokeWidth={1.5} aria-hidden="true" />
                )}
              </Button>
            </Hint>
            <Dialog>
              <Hint label="View settings">
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="View settings"
                  >
                    <Settings2 size={18} strokeWidth={1.5} aria-hidden="true" />
                  </Button>
                </DialogTrigger>
              </Hint>
              <DialogContent
                title="View settings"
                description="Make the book comfortable for the way you plan."
              >
                <ViewSettings
                  preferences={preferences}
                  moving={moving}
                  change={(changes) => void updatePreferences(changes)}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>
        {saveState.kind === 'error' && (
          <aside className="storage-alert" role="alert">
            <p>{saveState.message}</p>
            <Button onClick={() => void retry()}>Retry saving</Button>
            <Button
              variant="ghost"
              onClick={() => setShowRecovery(!showRecovery)}
            >
              Recover writing
            </Button>
            {showRecovery && (
              <Textarea
                aria-label="Recoverable writing"
                readOnly
                value={unsaved()
                  .map(
                    (e) =>
                      `${e.pageId.split(':').at(-1)} · ${e.type}\n${e.text}`,
                  )
                  .join('\n\n')}
              />
            )}
          </aside>
        )}
        <div className="focus-tabs" aria-label="Focused page">
          {visible.map((page, side) => (
            <Button
              key={page.id}
              variant="ghost"
              aria-pressed={preferences.focusSide === side}
              onClick={() =>
                void updatePreferences({ focusSide: side as 0 | 1 })
              }
            >
              {labelDate(page.date)}
            </Button>
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
              entries={records.filter((e) => e.pageId === page.id)}
              edit={edit}
              select={setSelectedId}
              moving={moving || focusedEditor}
              selectedId={selectedId}
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
          <aside
            className="context-controls mx-auto mt-5 flex max-w-[1040px] flex-wrap items-center gap-3 rounded-panel border border-solid border-line bg-surface p-3 text-xs shadow-sm"
            aria-label="Writing controls"
          >
            <span className="mr-1 font-semibold text-ink">
              {selected.type === 'scheduled-line'
                ? 'Hourly writing'
                : selected.type === 'note'
                  ? 'Free note'
                  : 'Checklist task'}
            </span>
            <FormattingControls entry={selected} disabled={moving} />
            {selected.type === 'scheduled-line' && (
              <>
                <label className="flex items-center gap-2 text-ui-muted">
                  Time
                  <Input
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
                        edit({
                          ...selected,
                          minute: total,
                          dayOffset: offset,
                        });
                    }}
                  />
                </label>
                <small className="text-ui-muted">
                  {selected.dayOffset ? 'Following day (+1)' : 'Same day'} ·
                  06:00–03:00
                </small>
              </>
            )}
            <div className="ml-auto flex flex-wrap items-center gap-1">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" id="full-writing">
                    <Eye size={15} aria-hidden="true" />
                    Read full writing
                  </Button>
                </PopoverTrigger>
                <PopoverContent aria-label="Full writing" align="end">
                  <p className="m-0 whitespace-pre-wrap break-words leading-relaxed">
                    {selected.text ? (
                      <FormattedText entry={selected} />
                    ) : (
                      'Nothing written yet.'
                    )}
                  </p>
                </PopoverContent>
              </Popover>
              <DeleteEntryButton
                entry={selected}
                disabled={moving || focusedEditor}
                deleteEntry={async () => {
                  await deleteEntry(selected.id);
                  setSelectedId(null);
                  setFocusedEditor(false);
                  requestAnimationFrame(() => bookRef.current?.focus());
                }}
              />
              <Button variant="ghost" onClick={() => setFocusedEditor(true)}>
                <Expand size={15} aria-hidden="true" />
                Edit writing
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  finishTimed(selected, edit);
                  document.getElementById(selected.id)?.blur();
                  setSelectedId(null);
                }}
              >
                <Check size={15} aria-hidden="true" />
                Done
              </Button>
            </div>
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
          <p>
            Write directly in an hourly row. Use the lower grid for free notes.
          </p>
          <span>{view.book.year} · local book</span>
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
                      <Button
                        variant="ghost"
                        className="h-auto w-full justify-start whitespace-pre-wrap text-left"
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
                          ? `${timeLabel(entry.minute, entry.dayOffset)} · ${entry.submitted ? (entry.completed ? '✓ ' : '□ ') : ''}`
                          : entry.type === 'task'
                            ? `${entry.completed ? '✓' : '□'} `
                            : 'Note · '}
                        <FormattedText entry={entry} />
                      </Button>
                    </li>
                  ))}
              </ul>
            </section>
          ))}
        </details>
      </main>
    </TooltipProvider>
  );
}

export function Planner() {
  return (
    <WritingProvider>
      <PlannerEditor />
    </WritingProvider>
  );
}
