import type { Entry } from './model';
import { dailyTemplate, hourForTime, timeToY } from '../templates/daily-v1';

export function scheduledRuns(entries: readonly Entry[]) {
  const hours = [
    ...new Set(
      entries
        .filter(
          (entry): entry is Extract<Entry, { type: 'scheduled-line' }> =>
            entry.type === 'scheduled-line' &&
            !entry.deletedAt &&
            !!entry.text.trim(),
        )
        .map((entry) => hourForTime(entry.minute, entry.dayOffset)),
    ),
  ].sort((a, b) => a - b);
  const runs: { start: number; end: number }[] = [];
  for (const hour of hours) {
    const previous = runs.at(-1);
    if (previous && hour === previous.end + 60) previous.end = hour;
    else runs.push({ start: hour, end: hour });
  }
  return runs.map((run) => {
    const startY = timeToY(run.start % 1440, Math.floor(run.start / 1440));
    const endY = timeToY(run.end % 1440, Math.floor(run.end / 1440));
    return {
      ...run,
      y: startY - dailyTemplate.grid.pitch,
      height: endY - startY + dailyTemplate.grid.pitch,
    };
  });
}
