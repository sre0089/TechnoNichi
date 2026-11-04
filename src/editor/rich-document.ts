import type { JSONContent } from '@tiptap/core';
import type { Entry, FormatRun, NoteLine } from '../domain/model';
import { textSegments } from '../domain/formatted-text';
import { noteNumbers, plainNoteLine } from '../domain/note-lines';
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
  if (entry.type !== 'note')
    return { type: 'doc', content: [{ type: 'paragraph', content }] };
  const lines = entry.text
    .split('\n')
    .map((_, index) => entry.noteLines?.[index] ?? plainNoteLine());
  const numbers = noteNumbers(lines);
  const paragraphs: JSONContent[] = lines.map((line, index) => ({
    type: 'paragraph',
    attrs: {
      ...line,
      checked: line.checked ?? false,
      number: numbers[index],
      breakMarks: [],
    },
    content: [],
  }));
  let line = 0;
  for (const node of content) {
    if (node.type === 'hardBreak') {
      paragraphs[line].attrs!.breakMarks = node.marks ?? [];
      line++;
    } else paragraphs[line].content!.push(node);
  }
  return { type: 'doc', content: paragraphs };
}

export function contentForDocument(
  document: JSONContent,
  note = false,
): Pick<Entry, 'text' | 'formatRuns'> & { noteLines?: NoteLine[] } {
  let text = '';
  const formatRuns: FormatRun[] = [];
  const noteLines: NoteLine[] = [];
  const append = (node: JSONContent) => {
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
  };
  for (const [index, paragraph] of (document.content ?? []).entries()) {
    if (index)
      append({
        type: 'hardBreak',
        marks: document.content?.[index - 1].attrs?.breakMarks ?? [],
      });
    const attrs = paragraph.attrs;
    const line: NoteLine = {
      kind: attrs?.kind ?? 'plain',
      indent: attrs?.indent ?? 0,
      ...(attrs?.kind === 'todo' ? { checked: attrs.checked ?? false } : {}),
    };
    noteLines.push(line);
    for (const node of paragraph.content ?? []) {
      append(node);
      // Keep pasted/legacy hard breaks aligned with line metadata too.
      if (node.type === 'hardBreak')
        noteLines.push({
          ...line,
          ...(line.kind === 'todo' ? { checked: false } : {}),
        });
    }
  }
  return {
    text,
    formatRuns,
    ...(note
      ? {
          noteLines: noteLines.some(
            (line) => line.kind !== 'plain' || line.indent > 0,
          )
            ? noteLines
            : undefined,
        }
      : {}),
  };
}
