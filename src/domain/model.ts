import { datesInYear, type CivilDate } from './calendar';
import { dailyTemplate } from '../templates/daily-v1';

export interface Book {
  id: string;
  title: string;
  year: number;
  startDate: CivilDate;
  endDate: CivilDate;
  locale: string;
  todayTimeZone: string;
  templateVersion: number;
}

export interface PageRecord {
  id: string;
  bookId: string;
  date: CivilDate;
  kind: 'daily';
  order: number;
}

interface BaseEntry {
  id: string;
  pageId: string;
  text: string;
  revision: number;
  deletedAt: string | null;
  style: { ink: 'purple'; emphasis: false };
}

export type Entry = BaseEntry &
  (
    | { type: 'scheduled-line'; minute: number; dayOffset: number }
    | { type: 'note'; x: number; y: number; width: number; height: number }
    | { type: 'task'; slot: number; completed: boolean }
  );

export interface Preferences {
  id: 'local';
  bookId: string;
  pageIndex: number;
  focusSide: 0 | 1;
  toolbarSide: 'left' | 'right';
  zoom: number;
}

export function manifest(book: Book): PageRecord[] {
  return datesInYear(book.year).map((date, order) => ({
    id: `${book.id}:daily:${date}`,
    bookId: book.id,
    date,
    kind: 'daily',
    order,
  }));
}

export function newEntry(
  pageId: string,
  variant: { type: 'task'; slot: number },
): Extract<Entry, { type: 'task' }>;
export function newEntry(
  pageId: string,
  variant: { type: 'note'; x: number; y: number },
): Extract<Entry, { type: 'note' }>;
export function newEntry(
  pageId: string,
  variant: { type: 'scheduled-line'; minute: number; dayOffset: number },
): Extract<Entry, { type: 'scheduled-line' }>;
export function newEntry(
  pageId: string,
  variant:
    | { type: 'scheduled-line'; minute: number; dayOffset: number }
    | { type: 'note'; x: number; y: number }
    | { type: 'task'; slot: number },
): Entry {
  const base = {
    id:
      variant.type === 'task'
        ? `${pageId}:task:${variant.slot}`
        : crypto.randomUUID(),
    pageId,
    text: '',
    revision: 0,
    deletedAt: null,
    style: { ink: 'purple' as const, emphasis: false as const },
  };
  if (variant.type === 'note')
    return { ...base, ...variant, width: 62.9, height: 14.8 };
  if (variant.type === 'task') return { ...base, ...variant, completed: false };
  return { ...base, ...variant };
}

export function assertEntry(value: unknown): asserts value is Entry {
  if (!value || typeof value !== 'object') throw new Error('Invalid entry');
  const e = value as Record<string, unknown>;
  if (
    typeof e.id !== 'string' ||
    !e.id ||
    typeof e.pageId !== 'string' ||
    typeof e.text !== 'string' ||
    !Number.isInteger(e.revision) ||
    Number(e.revision) < 0 ||
    (e.deletedAt !== null && typeof e.deletedAt !== 'string')
  )
    throw new Error('Invalid entry');
  const style = e.style as Record<string, unknown> | undefined;
  if (!style || style.ink !== 'purple' || style.emphasis !== false)
    throw new Error('Invalid entry style');
  if (e.type === 'task') {
    if (
      !Number.isInteger(e.slot) ||
      Number(e.slot) < 0 ||
      Number(e.slot) >= 5 ||
      typeof e.completed !== 'boolean'
    )
      throw new Error('Invalid task');
  } else if (e.type === 'scheduled-line') {
    if (
      !Number.isInteger(e.minute) ||
      Number(e.minute) < 0 ||
      Number(e.minute) >= 1440 ||
      (e.dayOffset !== 0 && e.dayOffset !== 1)
    )
      throw new Error('Invalid schedule');
    const absolute = Number(e.minute) + Number(e.dayOffset) * 1440;
    if (absolute < 360 || absolute > 1620)
      throw new Error('Time outside timetable');
  } else if (e.type === 'note') {
    const finite = ['x', 'y', 'width', 'height'].every(
      (key) => typeof e[key] === 'number' && Number.isFinite(e[key]),
    );
    if (
      !finite ||
      Number(e.x) < dailyTemplate.grid.x ||
      Number(e.y) < dailyTemplate.grid.y ||
      Number(e.width) <= 0 ||
      Number(e.height) <= 0 ||
      Number(e.x) + Number(e.width) > 142 ||
      Number(e.y) + Number(e.height) > 186.5
    )
      throw new Error('Invalid note geometry');
  } else throw new Error('Invalid entry type');
}

export function sameContent(a: Entry, b: Entry): boolean {
  return (
    JSON.stringify({ ...a, revision: 0 }) ===
    JSON.stringify({ ...b, revision: 0 })
  );
}
