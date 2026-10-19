import { dailyTemplate as template } from '../templates/daily-v1';

export interface NoteGeometry {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const noteMinimum = {
  width: template.grid.pitch * 4,
  height: template.grid.pitch * 2,
};

const tidy = (value: number) => Math.round(value * 1000) / 1000;
const { grid } = template;
const right = tidy(grid.x + grid.width);
const bottom = tidy(grid.y + grid.height);

function snapWithin(value: number, origin: number, maximum: number) {
  const last = Math.floor((maximum - origin + 0.000001) / grid.pitch);
  const step = Math.max(
    0,
    Math.min(last, Math.round((value - origin) / grid.pitch)),
  );
  return tidy(origin + step * grid.pitch);
}

// Deltas are in document units, independent of zoom, scroll and page side.
// Moving preserves even legacy unsnapped box sizes and never changes content.
export function moveNote(
  note: NoteGeometry,
  dx: number,
  dy: number,
): NoteGeometry {
  return {
    ...note,
    x: snapWithin(note.x + dx, grid.x, tidy(right - note.width)),
    y: snapWithin(note.y + dy, grid.y, tidy(bottom - note.height)),
  };
}

function snapSize(value: number, minimum: number, available: number) {
  // Imported boxes can be closer to an edge than today's minimum size.
  const maximum = Math.floor((available + 0.000001) / grid.pitch) * grid.pitch;
  if (maximum < minimum) return tidy(available);
  return tidy(
    Math.max(
      minimum,
      Math.min(maximum, Math.round(value / grid.pitch) * grid.pitch),
    ),
  );
}

export function resizeNote(
  note: NoteGeometry,
  dx: number,
  dy: number,
): NoteGeometry {
  return {
    ...note,
    width: snapSize(note.width + dx, noteMinimum.width, tidy(right - note.x)),
    height: snapSize(
      note.height + dy,
      noteMinimum.height,
      tidy(bottom - note.y),
    ),
  };
}

export function sameGeometry(a: NoteGeometry, b: NoteGeometry) {
  return (
    a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height
  );
}
