import type { NoteLine } from './model';

export const plainNoteLine = (): NoteLine => ({ kind: 'plain', indent: 0 });

/** Number siblings independently at each depth, retaining parents across children. */
export function noteNumbers(lines: NoteLine[]): number[] {
  const counts: number[] = [];
  return lines.map((line) => {
    counts.length = Math.min(counts.length, line.indent + 1);
    if (line.kind !== 'number') {
      counts[line.indent] = 0;
      return 0;
    }
    counts[line.indent] = (counts[line.indent] ?? 0) + 1;
    return counts[line.indent];
  });
}
