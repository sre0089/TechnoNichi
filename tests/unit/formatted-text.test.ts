import { describe, expect, it } from 'vitest';
import { assertEntry, newEntry } from '../../src/domain/model';
import { textSegments } from '../../src/domain/formatted-text';
import {
  documentFor,
  contentForDocument,
} from '../../src/editor/rich-document';

const line = () => ({
  ...newEntry('page', { type: 'scheduled-line', minute: 720, dayOffset: 0 }),
  text: 'Lunch with friends',
});

describe('safe word formatting and legacy writing', () => {
  it('round trips independent and combined word marks, spaces, newlines and Unicode', () => {
    const entry = {
      ...line(),
      text: 'Lunch  with\nfriends 🐱',
      formatRuns: [
        { from: 0, to: 5, bold: true },
        { from: 7, to: 11, italic: true },
        { from: 12, to: 19, underline: true, bold: true },
      ],
    };
    assertEntry(entry);
    expect(contentForDocument(documentFor(entry))).toEqual({
      text: entry.text,
      formatRuns: entry.formatRuns,
    });
    expect(
      textSegments(entry)
        .map((segment) => segment.text)
        .join(''),
    ).toBe(entry.text);
    expect(textSegments(entry, 'Lunch  with')).toEqual([
      { text: 'Lunch', format: { bold: true } },
      { text: '  ', format: {} },
      { text: 'with', format: { italic: true } },
    ]);
  });
  it('retains legacy whole-entry styling without rewriting old records', () => {
    const entry = {
      ...line(),
      style: { ...line().style, bold: true, underline: true },
    };
    expect(contentForDocument(documentFor(entry))).toEqual({
      text: entry.text,
      formatRuns: [{ from: 0, to: 18, bold: true, underline: true }],
    });
    expect(entry).not.toHaveProperty('formatRuns');
    expect(
      contentForDocument(documentFor({ ...entry, formatRuns: [] })),
    ).toEqual({ text: entry.text, formatRuns: [] });
  });
  it('normalizes multi-paragraph input and keeps blank lines and trailing whitespace', () => {
    expect(
      contentForDocument({
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              { type: 'text', text: 'First  ', marks: [{ type: 'bold' }] },
            ],
          },
          { type: 'paragraph' },
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Last ' }, { type: 'hardBreak' }],
          },
        ],
      }),
    ).toEqual({
      text: 'First  \n\nLast \n',
      formatRuns: [{ from: 0, to: 7, bold: true }],
    });
  });
  it('rejects overlapping, out-of-bounds, unmarked and malformed formatting ranges', () => {
    const entry = line();
    for (const formatRuns of [
      null,
      {},
      [{ from: -1, to: 2, bold: true }],
      [{ from: 0, to: 19, bold: true }],
      [{ from: 2, to: 2, italic: true }],
      [{ from: 1.5, to: 3, bold: true }],
      [{ from: 0, to: 1, bold: 'yes' }],
      [{ from: 0, to: 1 }],
      [
        { from: 3, to: 8, bold: true },
        { from: 7, to: 9, italic: true },
      ],
    ])
      expect(() => assertEntry({ ...entry, formatRuns })).toThrow(
        'Invalid formatting ranges',
      );
    expect(() => assertEntry({ ...entry, formatRuns: [] })).not.toThrow();
  });
});
