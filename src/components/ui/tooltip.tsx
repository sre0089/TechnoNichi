'use client';

import * as Tooltip from '@radix-ui/react-tooltip';
import type { ReactElement } from 'react';

export const TooltipProvider = Tooltip.Provider;

export function Hint({
  children,
  label,
}: {
  children: ReactElement;
  label: string;
}) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content
          sideOffset={6}
          className="z-50 max-w-64 rounded-control bg-ink px-3 py-2 font-interface text-xs text-paper shadow-float"
        >
          {label}
          <Tooltip.Arrow className="fill-ink" />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}
