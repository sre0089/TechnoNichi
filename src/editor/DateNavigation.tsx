'use client';
import { useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  dateObject,
  labelDate,
  parseDate,
  todayInZone,
} from '../domain/calendar';
import type { Book, PageRecord } from '../domain/model';
import { Button } from '../components/ui/button';
import { Input, NativeSelect } from '../components/ui/field';
import { Dialog, DialogContent } from '../components/ui/dialog';

export function DateNavigation({
  book,
  pages,
  currentDate,
  disabled,
  open,
  setOpen,
  jump,
}: {
  book: Book;
  pages: PageRecord[];
  currentDate: string;
  disabled: boolean;
  open: boolean;
  setOpen: (open: boolean) => void;
  jump: (date: string) => Promise<boolean>;
}) {
  const [date, setDate] = useState(currentDate);
  const [month, setMonth] = useState(parseDate(currentDate).month);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const months = [...new Set(pages.map((page) => parseDate(page.date).month))];
  const monthPages = pages.filter(
    (page) => parseDate(page.date).month === month,
  );
  const offset = monthPages.length
    ? (dateObject(monthPages[0].date).getUTCDay() + 6) % 7
    : 0;
  const busy = disabled || pending;
  const go = async (target: string) => {
    if (busy) return;
    setError('');
    setPending(true);
    try {
      if (!pages.some((page) => page.date === target))
        throw new Error(`That date is outside this ${book.year} book.`);
      if (!(await jump(target)))
        throw new Error(
          'The page could not open. Finish the current action or retry saving your writing.',
        );
      setDate(target);
      setMonth(parseDate(target).month);
      setOpen(false);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Could not open that date.',
      );
    } finally {
      setPending(false);
    }
  };
  return (
    <>
      <Button
        variant="ghost"
        disabled={busy}
        onClick={() => void go(todayInZone(book.todayTimeZone))}
      >
        Today
      </Button>
      <Button
        variant="ghost"
        aria-label="Jump to date"
        disabled={busy}
        onClick={() => {
          setDate(currentDate);
          setMonth(parseDate(currentDate).month);
          setError('');
          setOpen(true);
        }}
      >
        <CalendarDays size={16} aria-hidden="true" />
        Date
      </Button>
      {error && !open && (
        <p role="alert" className="text-xs">
          {error}
        </p>
      )}
      <Dialog
        open={open}
        onOpenChange={(value) => {
          if (!pending) setOpen(value);
        }}
      >
        <DialogContent
          title="Open a date"
          description={`Your ${book.year} book. Today follows ${book.todayTimeZone}.`}
          closeDisabled={pending}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            document.getElementById('book')?.focus();
          }}
        >
          <form
            className="mb-5 flex flex-wrap items-end gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              void go(date);
            }}
          >
            <label className="flex flex-1 flex-col gap-2 text-xs">
              Date
              <Input
                type="date"
                min={book.startDate}
                max={book.endDate}
                required
                value={date}
                disabled={busy}
                onChange={(event) => setDate(event.target.value)}
              />
            </label>
            <Button type="submit" disabled={busy}>
              Open date
            </Button>
          </form>
          <div className="mb-3 flex items-center justify-between gap-2">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Previous month"
              disabled={busy || month <= months[0]}
              onClick={() => setMonth(month - 1)}
            >
              <ChevronLeft size={18} aria-hidden="true" />
            </Button>
            <label className="sr-only" htmlFor="calendar-month">
              Month
            </label>
            <NativeSelect
              id="calendar-month"
              value={month}
              disabled={busy}
              onChange={(event) => setMonth(Number(event.target.value))}
            >
              {months.map((value) => (
                <option key={value} value={value}>
                  {new Intl.DateTimeFormat('en-US', {
                    month: 'long',
                    year: 'numeric',
                    timeZone: 'UTC',
                  }).format(
                    dateObject(
                      `${book.year}-${String(value).padStart(2, '0')}-01`,
                    ),
                  )}
                </option>
              ))}
            </NativeSelect>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Next month"
              disabled={busy || month >= months.at(-1)!}
              onClick={() => setMonth(month + 1)}
            >
              <ChevronRight size={18} aria-hidden="true" />
            </Button>
          </div>
          <div className="grid grid-cols-7 gap-1" aria-label="Month dates">
            {'MTWTFSS'.split('').map((value, index) => (
              <span
                key={`heading-${index}`}
                className="py-2 text-center text-xs text-ui-muted"
                aria-hidden="true"
              >
                {value}
              </span>
            ))}
            {Array.from({ length: offset }, (_, index) => (
              <span key={`empty-${index}`} />
            ))}
            {monthPages.map((page) => (
              <Button
                key={page.id}
                className="min-h-11 px-0"
                variant={page.date === currentDate ? 'primary' : 'ghost'}
                aria-label={labelDate(page.date)}
                aria-current={page.date === currentDate ? 'date' : undefined}
                disabled={busy}
                onClick={() => void go(page.date)}
              >
                {parseDate(page.date).day}
              </Button>
            ))}
          </div>
          {error && (
            <p role="alert" className="mt-4 text-xs">
              {error}
            </p>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
