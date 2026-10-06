import type { JSONContent } from '@tiptap/core';
import type { Entry, FormatRun } from '../domain/model';
import { textSegments } from '../domain/formatted-text';
import type { WritingFormat } from './writing-keys';

export function documentFor(entry: Entry): JSONContent {
  const content: JSONContent[] = [];
  for (const segment of textSegments(entry)) {
    const marks = (['bold', 'italic', 'underline'] as const)
      .filter((key) => segment.format[key])
      .map((type) => ({ type }));
    segment.text.split('\n').forEach((text, index) => {
      if (index) content.push({ type: 'hardBreak', marks });
      if (text) content.push({ type: 'text', text, marks });
    });
  }
  return { type: 'doc', content: [{ type: 'paragraph', content }] };
}

export function contentForDocument(
  document: JSONContent,
): Pick<Entry, 'text' | 'formatRuns'> {
  let text = '';
  const formatRuns: FormatRun[] = [];
  for (const [index, paragraph] of (document.content ?? []).entries()) {
    if (index) text += '\n';
    for (const node of paragraph.content ?? []) {
      const value = node.type === 'hardBreak' ? '\n' : (node.text ?? '');
      const from = text.length;
      text += value;
      const format: Omit<FormatRun, 'from' | 'to'> = {};
      for (const mark of node.marks ?? []) {
        if (
          mark.type === 'bold' ||
          mark.type === 'italic' ||
          mark.type === 'underline'
        )
          format[mark.type] = true;
      }
      if (value && Object.keys(format).length) {
        const previous = formatRuns.at(-1);
        if (
          previous?.to === from &&
          ['bold', 'italic', 'underline'].every(
            (key) =>
              previous[key as WritingFormat] === format[key as WritingFormat],
          )
        )
          previous.to = text.length;
        else formatRuns.push({ from, to: text.length, ...format });
      }
    }
  }
  return { text, formatRuns };
}
