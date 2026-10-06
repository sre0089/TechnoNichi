import { forwardRef, type ComponentProps } from 'react';
import { cn } from './utils';

const variants = {
  primary: 'border-ink bg-ink text-paper hover:bg-ink/90',
  secondary: 'border-line bg-surface text-ink hover:bg-wash',
  ghost:
    'border-transparent bg-transparent text-ui-muted hover:bg-wash hover:text-ink',
};
const sizes = {
  default: 'h-10 px-3 max-[760px]:min-h-11',
  small: 'h-8 px-2.5',
  icon: 'h-10 w-10 p-0 max-[760px]:h-11 max-[760px]:w-11',
  paper: 'h-auto',
};

export const Button = forwardRef<
  HTMLButtonElement,
  ComponentProps<'button'> & {
    variant?: keyof typeof variants;
    size?: keyof typeof sizes;
  }
>(function Button(
  {
    variant = 'secondary',
    size = 'default',
    className,
    type = 'button',
    ...props
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        'ui-button inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-control border border-solid text-xs font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:pointer-events-none disabled:opacity-40',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
});
