import type { Entry, FormatRun } from './model';

export function textRuns(entry: Entry): FormatRun[] {
  if (entry.formatRuns !== undefined) return entry.formatRuns;
  const { bold, italic, underline } = entry.style;
  return entry.text.length && (bold || italic || underline)
    ? [{ from: 0, to: entry.text.length, bold, italic, underline }]
    : [];
}

export function textSegments(entry: Entry, text = entry.text) {
  const segments: { text: string; format: Omit<FormatRun, 'from' | 'to'> }[] =
    [];
  let offset = 0;
  for (const { from, to, ...format } of textRuns(entry)) {
    if (from >= text.length) break;
    if (from > offset)
      segments.push({ text: text.slice(offset, from), format: {} });
    segments.push({
      text: text.slice(from, Math.min(to, text.length)),
      format,
    });
    offset = Math.min(to, text.length);
  }
  if (offset < text.length)
    segments.push({ text: text.slice(offset), format: {} });
  return segments;
}
