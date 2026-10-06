import { describe, expect, it } from 'vitest';
import { assertEntry, newEntry } from '../../src/domain/model';
import { scheduledRuns } from '../../src/domain/schedule';
import { dailyTemplate, timeToY } from '../../src/templates/daily-v1';

const line = (minute: number, dayOffset = 0, text = 'A timed task') => ({
  ...newEntry('page', { type: 'scheduled-line', minute, dayOffset }),
  text,
});

describe('timed task completion and occupied-hour lines', () => {
  it('reads earlier entries without flags and rejects malformed completion', () => {
    const legacy = line(720);
    delete legacy.submitted;
    delete legacy.completed;
    expect(() => assertEntry(legacy)).not.toThrow();
    expect(() =>
      assertEntry({ ...legacy, submitted: true, completed: true }),
    ).not.toThrow();
    expect(() => assertEntry({ ...legacy, completed: true })).toThrow();
    expect(() => assertEntry({ ...legacy, submitted: 'yes' })).toThrow();
    expect(() => assertEntry({ ...legacy, completed: 1 })).toThrow();
    expect(line(720)).toMatchObject({ submitted: false, completed: false });
  });
  it('covers every occupied row from above the first entry to the last marker', () => {
    const entries = [
      line(840),
      line(720),
      line(780),
      line(795),
      line(960),
      line(900, 0, '  '),
      { ...line(900), deletedAt: '2026-10-05' },
      {
        ...newEntry('page', { type: 'note', x: 28.5, y: 127.3 }),
        text: 'Not a timed task',
      },
    ];
    expect(scheduledRuns(entries)).toEqual([
      {
        start: 720,
        end: 840,
        y: timeToY(720, 0) - dailyTemplate.grid.pitch,
        height: timeToY(840, 0) - timeToY(720, 0) + dailyTemplate.grid.pitch,
      },
      {
        start: 960,
        end: 960,
        y: timeToY(960, 0) - dailyTemplate.grid.pitch,
        height: dailyTemplate.grid.pitch,
      },
    ]);
  });
  it('joins midnight and keeps checked tasks occupied while gaps split runs', () => {
    const entries = [
      line(1380),
      { ...line(0, 1), submitted: true, completed: true },
      line(60, 1),
    ];
    expect(scheduledRuns(entries)).toEqual([
      {
        start: 1380,
        end: 1500,
        y: timeToY(1380, 0) - dailyTemplate.grid.pitch,
        height: timeToY(60, 1) - timeToY(1380, 0) + dailyTemplate.grid.pitch,
      },
    ]);
    expect(scheduledRuns([entries[0], entries[2]])).toHaveLength(2);
    expect(scheduledRuns([])).toEqual([]);
    expect(dailyTemplate.scheduleLineX - dailyTemplate.timelineX).toBeCloseTo(
      dailyTemplate.grid.pitch * 2,
    );
    expect(dailyTemplate.scheduleX - dailyTemplate.scheduleLineX).toBeCloseTo(
      dailyTemplate.grid.pitch / 4,
    );
  });
});
