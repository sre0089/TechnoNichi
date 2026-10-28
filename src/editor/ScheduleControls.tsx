'use client';

import { useState } from 'react';
import {
  assertEntry,
  type DurationEntry,
  type Entry,
  type ScheduledEntry,
} from '../domain/model';
import {
  absoluteStart,
  scheduledLabel,
  timeParts,
  withDuration,
  withoutDuration,
} from '../domain/durations';
import { timeLabel } from '../templates/daily-v1';
import { Button } from '../components/ui/button';
import { Input, NativeSelect } from '../components/ui/field';
import { Dialog, DialogContent } from '../components/ui/dialog';
import { restoreUnclaimedFocus } from './restore-focus';

function DurationDialog({
  entry,
  edit,
  close,
}: {
  entry: DurationEntry;
  edit: (entry: Entry) => void;
  close: () => void;
}) {
  const [start, setStart] = useState(timeLabel(entry.minute, 0));
  const [end, setEnd] = useState(timeLabel(entry.endMinute, 0));
  const [startDay, setStartDay] = useState(entry.dayOffset);
  const [endDay, setEndDay] = useState(entry.endDayOffset);
  const [error, setError] = useState('');
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <DialogContent
        title="Task duration"
        description="Choose a start and end within this page’s 06:00–03:00 timetable. Times after midnight belong to the following day (+1)."
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          restoreUnclaimedFocus(() =>
            document.getElementById('duration-control'),
          );
        }}
      >
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            try {
              const from = timeParts(start, startDay);
              const to = timeParts(end, endDay);
              const changed = {
                ...entry,
                ...from,
                endMinute: to.minute,
                endDayOffset: to.dayOffset,
              };
              assertEntry(changed);
              edit(changed);
              close();
            } catch (error) {
              setError(
                error instanceof Error
                  ? error.message
                  : 'Choose a valid duration.',
              );
            }
          }}
        >
          <fieldset className="m-0 flex flex-wrap gap-3 border-0 p-0">
            <legend className="mb-2 text-sm font-semibold">Start</legend>
            <label className="space-y-1 text-xs">
              Time
              <Input
                type="time"
                step={60}
                required
                aria-label="Start time"
                value={start}
                onChange={(e) => {
                  setStart(e.target.value);
                  setError('');
                }}
              />
            </label>
            <label className="space-y-1 text-xs">
              Day
              <NativeSelect
                aria-label="Start day"
                value={startDay}
                onChange={(e) => {
                  setStartDay(Number(e.target.value));
                  setError('');
                }}
              >
                <option value={0}>Same day</option>
                <option value={1}>Following day (+1)</option>
              </NativeSelect>
            </label>
          </fieldset>
          <fieldset className="m-0 flex flex-wrap gap-3 border-0 p-0">
            <legend className="mb-2 text-sm font-semibold">End</legend>
            <label className="space-y-1 text-xs">
              Time
              <Input
                type="time"
                step={60}
                required
                aria-label="End time"
                value={end}
                onChange={(e) => {
                  setEnd(e.target.value);
                  setError('');
                }}
              />
            </label>
            <label className="space-y-1 text-xs">
              Day
              <NativeSelect
                aria-label="End day"
                value={endDay}
                onChange={(e) => {
                  setEndDay(Number(e.target.value));
                  setError('');
                }}
              >
                <option value={0}>Same day</option>
                <option value={1}>Following day (+1)</option>
              </NativeSelect>
            </label>
          </fieldset>
          {error && (
            <p role="alert" className="text-sm">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" onClick={close}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Apply duration
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ScheduleControls({
  entry,
  edit,
  disabled,
}: {
  entry: ScheduledEntry;
  edit: (entry: Entry) => void;
  disabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  if (entry.type === 'scheduled-block')
    return (
      <>
        <span className="text-ui-muted">{scheduledLabel(entry)}</span>
        <Button
          id="duration-control"
          disabled={disabled}
          onClick={() => setOpen(true)}
        >
          Edit duration
        </Button>
        <Button
          variant="ghost"
          disabled={disabled}
          onClick={() => edit(withoutDuration(entry))}
        >
          Remove duration
        </Button>
        {open && (
          <DurationDialog
            entry={entry}
            edit={edit}
            close={() => setOpen(false)}
          />
        )}
      </>
    );
  return (
    <>
      <label className="flex items-center gap-2 text-ui-muted">
        Time
        <Input
          type="time"
          aria-label="Exact time"
          disabled={disabled}
          value={timeLabel(entry.minute, 0)}
          onChange={(event) => {
            const value = event.target.value;
            if (!/^\d{2}:\d{2}$/.test(value)) return;
            const [hour, minute] = value.split(':').map(Number);
            const total = hour * 60 + minute;
            if (total >= 360 || total <= 180)
              edit({ ...entry, minute: total, dayOffset: total < 360 ? 1 : 0 });
          }}
        />
      </label>
      <small className="text-ui-muted">
        {entry.dayOffset ? 'Following day (+1)' : 'Same day'} · 06:00–03:00
      </small>
      <Button
        disabled={disabled || absoluteStart(entry) >= 1620}
        onClick={() => edit(withDuration(entry))}
      >
        Add duration
      </Button>
    </>
  );
}
