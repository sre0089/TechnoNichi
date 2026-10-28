'use client';

import { useRef, useState } from 'react';
import { isScheduled, type Entry } from '../domain/model';
import { scheduledLabel } from '../domain/durations';
import { Button } from '../components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../components/ui/popover';
import { FormattedText } from './RichWriting';
import { restoreUnclaimedFocus } from './restore-focus';

export function HourWritingMenu({
  entries,
  selectedId,
  select,
  disabled,
}: {
  entries: Entry[];
  selectedId: string;
  select: (id: string) => void;
  disabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const chosen = useRef<string | null>(null);
  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (next) chosen.current = null;
        setOpen(next);
      }}
    >
      <PopoverTrigger asChild>
        <Button
          size="paper"
          className="row-alternatives"
          disabled={disabled}
          aria-label={`Other writing in this hour (${entries.length} entries)`}
        >
          +{entries.length - 1}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        aria-label="Writing in this hour"
        align="end"
        onCloseAutoFocus={(event) => {
          if (chosen.current) {
            event.preventDefault();
            const id = chosen.current;
            restoreUnclaimedFocus(() => document.getElementById(id));
          }
        }}
      >
        <p className="mt-0 text-xs text-ui-muted">
          Choose writing to edit. Other tasks keep their times and duration.
        </p>
        <ul className="m-0 list-none space-y-2 p-0">
          {entries.filter(isScheduled).map((entry) => (
            <li key={entry.id}>
              <Button
                className="h-auto w-full flex-col items-start gap-1 whitespace-pre-wrap break-words text-left"
                aria-pressed={entry.id === selectedId}
                onClick={() => {
                  chosen.current = entry.id;
                  select(entry.id);
                  setOpen(false);
                }}
              >
                <span className="text-xs text-ui-muted">
                  {entry.type === 'scheduled-block' ? 'Duration' : 'Timed task'}{' '}
                  · {scheduledLabel(entry)}
                </span>
                <span>
                  {entry.text ? (
                    <FormattedText entry={entry} />
                  ) : (
                    'Empty writing'
                  )}
                </span>
              </Button>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
