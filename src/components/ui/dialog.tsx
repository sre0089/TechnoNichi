'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { ComponentProps, ReactNode } from 'react';
import { Button } from './button';
import { cn } from './utils';

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export function DialogContent({
  title,
  description,
  children,
  className,
  onEscapeKeyDown,
  closeDisabled = false,
  ...props
}: Omit<ComponentProps<typeof DialogPrimitive.Content>, 'title'> & {
  title: string;
  description: string;
  children: ReactNode;
  closeDisabled?: boolean;
}) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-ink/35 backdrop-blur-xs" />
      <DialogPrimitive.Content
        className={cn(
          'fixed left-1/2 top-1/2 z-50 max-h-[85dvh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-panel border border-solid border-line bg-surface p-6 font-interface text-ink shadow-float focus:outline-none',
          className,
        )}
        onEscapeKeyDown={(event) => {
          if (event.isComposing) event.preventDefault();
          onEscapeKeyDown?.(event);
        }}
        {...props}
      >
        <div className="mb-6 pr-9">
          <DialogPrimitive.Title className="m-0 font-display text-2xl font-normal">
            {title}
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="mb-0 mt-2 text-xs leading-relaxed text-ui-muted">
            {description}
          </DialogPrimitive.Description>
        </div>
        {children}
        <DialogPrimitive.Close asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Close dialog"
            disabled={closeDisabled}
            className="absolute right-3 top-3"
          >
            <X size={17} aria-hidden="true" />
          </Button>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
