export type CivilDate = string;

export function isLeapYear(year: number): boolean {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

export function daysInMonth(year: number, month: number): number {
  return (
    [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][
      month - 1
    ] ?? 0
  );
}

export function parseDate(date: CivilDate): {
  year: number;
  month: number;
  day: number;
} {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date))
    throw new Error('Invalid calendar date');
  const [year, month, day] = date.split('-').map(Number);
  if (year < 1900 || year > 2200 || day < 1 || day > daysInMonth(year, month)) {
    throw new Error('Invalid calendar date');
  }
  return { year, month, day };
}

export function dateString(
  year: number,
  month: number,
  day: number,
): CivilDate {
  const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  parseDate(date);
  return date;
}

export function dateObject(date: CivilDate): Date {
  const { year, month, day } = parseDate(date);
  return new Date(Date.UTC(year, month - 1, day));
}

export function datesInYear(year: number): CivilDate[] {
  const dates: CivilDate[] = [];
  for (let month = 1; month <= 12; month += 1) {
    for (let day = 1; day <= daysInMonth(year, month); day += 1)
      dates.push(dateString(year, month, day));
  }
  return dates;
}

export function labelDate(date: CivilDate): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(dateObject(date));
}

export function spreadIndex(pageIndex: number): number {
  return Math.floor(pageIndex / 2) * 2;
}
