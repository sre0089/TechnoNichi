import { assertEntry, type DurationEntry, type ScheduledEntry } from './model';
import { dailyTemplate, timeLabel, timeToY } from '../templates/daily-v1';

export const absoluteStart = (entry: ScheduledEntry) =>
  entry.minute + entry.dayOffset * 1440;
export const absoluteEnd = (entry: DurationEntry) =>
  entry.endMinute + entry.endDayOffset * 1440;

export type DurationAdjustment = 'move' | 'end';
export function sameRange(a: DurationEntry, b: DurationEntry) {
  return (
    absoluteStart(a) === absoluteStart(b) && absoluteEnd(a) === absoluteEnd(b)
  );
}
export function adjustDuration(
  entry: DurationEntry,
  mode: DurationAdjustment,
  minutes: number,
): DurationEntry {
  if (!Number.isFinite(minutes)) throw new Error('Invalid time adjustment');
  const delta = Math.round(minutes / 15) * 15;
  let start = absoluteStart(entry);
  let end = absoluteEnd(entry);
  if (mode === 'move') {
    const shift = Math.max(360 - start, Math.min(1620 - end, delta));
    start += shift;
    end += shift;
  } else end = Math.max(start + 1, Math.min(1620, end + delta));
  return {
    ...entry,
    minute: start % 1440,
    dayOffset: Math.floor(start / 1440),
    endMinute: end % 1440,
    endDayOffset: Math.floor(end / 1440),
  };
}

export function scheduledLabel(entry: ScheduledEntry) {
  const start = timeLabel(entry.minute, entry.dayOffset);
  return entry.type === 'scheduled-block'
    ? `${start}–${timeLabel(entry.endMinute, entry.endDayOffset)}`
    : start;
}

export function withDuration(entry: ScheduledEntry): DurationEntry {
  if (entry.type === 'scheduled-block') return entry;
  const end = Math.min(absoluteStart(entry) + 60, 1620);
  const block: DurationEntry = {
    ...entry,
    type: 'scheduled-block',
    endMinute: end % 1440,
    endDayOffset: Math.floor(end / 1440),
  };
  assertEntry(block);
  return block;
}

export function withoutDuration(entry: DurationEntry): ScheduledEntry {
  const { endMinute, endDayOffset, ...line } = entry;
  // Endpoints belong only to blocks, including in strict portable archives.
  void endMinute;
  void endDayOffset;
  return { ...line, type: 'scheduled-line' };
}

// Wall-clock values are explicit. Overnight never relies on a timezone or Date.
export function timeParts(value: string, dayOffset: number) {
  if (!/^\d{2}:\d{2}$/.test(value) || ![0, 1].includes(dayOffset))
    throw new Error('Enter a time and choose its day.');
  const [hour, minute] = value.split(':').map(Number);
  if (hour > 23 || minute > 59) throw new Error('Enter a valid time.');
  return { minute: hour * 60 + minute, dayOffset };
}

// Lanes are a projection, never an edit to entry times or other page positions.
// Half-open ranges let a task ending at 13:00 share a lane with one starting then.
export function durationLanes(entries: readonly DurationEntry[]) {
  const sorted = entries
    .filter((entry) => !entry.deletedAt)
    .toSorted(
      (a, b) =>
        absoluteStart(a) - absoluteStart(b) ||
        absoluteEnd(a) - absoluteEnd(b) ||
        a.id.localeCompare(b.id),
    );
  const laneEnds: number[] = [];
  return sorted.map((entry) => {
    const start = absoluteStart(entry);
    const end = absoluteEnd(entry);
    let lane = laneEnds.findIndex((previous) => previous <= start);
    if (lane < 0) lane = laneEnds.length;
    laneEnds[lane] = end;
    return {
      entry,
      lane,
      y: timeToY(entry.minute, entry.dayOffset) - dailyTemplate.grid.pitch,
      height:
        timeToY(entry.endMinute, entry.endDayOffset) -
        timeToY(entry.minute, entry.dayOffset),
    };
  });
}
