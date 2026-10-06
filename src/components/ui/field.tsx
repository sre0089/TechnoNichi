import { forwardRef, type ComponentProps } from 'react';
import { cn } from './utils';

const fieldStyle =
  'rounded-control border border-solid border-line bg-surface px-3 py-2 text-xs text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:opacity-40';

export const Input = forwardRef<HTMLInputElement, ComponentProps<'input'>>(
  function Input({ className, ...props }, ref) {
    return <input ref={ref} className={cn(fieldStyle, className)} {...props} />;
  },
);

export const NativeSelect = forwardRef<
  HTMLSelectElement,
  ComponentProps<'select'>
>(function NativeSelect({ className, ...props }, ref) {
  return (
    <select
      ref={ref}
      className={cn(fieldStyle, 'min-h-10 max-[760px]:min-h-11', className)}
      {...props}
    />
  );
});

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  ComponentProps<'textarea'>
>(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(fieldStyle, 'block w-full resize-y', className)}
      {...props}
    />
  );
});

// Page checkboxes keep their native input, grid sizing, and completion semantics.
export function InkCheckbox(props: Omit<ComponentProps<'input'>, 'type'>) {
  return <input type="checkbox" {...props} />;
}
