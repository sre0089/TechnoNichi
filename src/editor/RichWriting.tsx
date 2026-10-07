'use client';

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react';
import { EditorContent, useEditor, useEditorState } from '@tiptap/react';
import { type Editor, type JSONContent } from '@tiptap/core';
import Document from '@tiptap/extension-document';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import Bold from '@tiptap/extension-bold';
import Italic from '@tiptap/extension-italic';
import Underline from '@tiptap/extension-underline';
import HardBreak from '@tiptap/extension-hard-break';
import { UndoRedo } from '@tiptap/extensions/undo-redo';
import type { Entry } from '../domain/model';
import { textSegments, textRuns } from '../domain/formatted-text';
import { formatForKey, type WritingFormat } from './writing-keys';
import { documentFor, contentForDocument } from './rich-document';

const WritingContext = createContext<{
  active: { editor: Editor; id: string } | null;
  activate: (editor: Editor, id: string) => void;
} | null>(null);

export function WritingProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<{ editor: Editor; id: string } | null>(
    null,
  );
  return (
    <WritingContext.Provider
      value={{
        active,
        activate: (editor, id) =>
          setActive((current) =>
            current?.editor === editor ? current : { editor, id },
          ),
      }}
    >
      {children}
    </WritingContext.Provider>
  );
}

export function useWritingFormat(id: string) {
  const context = useContext(WritingContext)!;
  const editor =
    context.active?.id === id && !context.active.editor.isDestroyed
      ? context.active.editor
      : null;
  const state = useEditorState({
    editor,
    selector: ({ editor }) => ({
      bold: editor?.isActive('bold') ?? false,
      italic: editor?.isActive('italic') ?? false,
      underline: editor?.isActive('underline') ?? false,
    }),
  });
  return {
    state,
    toggle: (format: WritingFormat) =>
      editor?.chain().focus().toggleMark(format).run(),
  };
}

const fields = new WeakMap<HTMLElement, Editor>();
export function focusWriting(node: HTMLElement, caret: number) {
  const editor = fields.get(node);
  if (!editor || editor.isDestroyed) return;
  editor.commands.focus();
  editor.commands.setTextSelection(positionForText(editor, caret));
}

function positionForText(editor: Editor, offset: number) {
  let seen = 0;
  let result = editor.state.doc.content.size - 1;
  let found = false;
  editor.state.doc.descendants((node, position) => {
    if (found) return false;
    if (node.type.name === 'paragraph' && position > 0) seen++;
    const length = node.isText
      ? node.text!.length
      : node.type.name === 'hardBreak'
        ? 1
        : 0;
    if (length && offset <= seen + length) {
      result = position + Math.max(0, offset - seen);
      found = true;
    }
    seen += length;
  });
  return result;
}

function contentFor(editor: Editor) {
  return contentForDocument(editor.getJSON() as JSONContent);
}

export function FormattedText({
  entry,
  text,
}: {
  entry: Entry;
  text?: string;
}) {
  return (
    <>
      {textSegments(entry, text).map((segment, index) => (
        <span
          key={index}
          style={{
            fontWeight: segment.format.bold ? 700 : undefined,
            fontStyle: segment.format.italic ? 'italic' : undefined,
            textDecorationLine: segment.format.underline
              ? 'underline'
              : undefined,
          }}
        >
          {segment.text}
        </span>
      ))}
    </>
  );
}

export function RichWriting({
  entry,
  edit,
  label,
  fieldRef,
  readOnly = false,
  onFocus,
  onOverflow,
  onFinish,
  mode = 'short',
  moveRow,
  enlarged = false,
  selected = false,
}: {
  entry: Entry;
  edit: (entry: Entry) => void;
  label: string;
  fieldRef?: RefObject<HTMLElement | null>;
  readOnly?: boolean;
  onFocus?: () => void;
  onOverflow?: (overflow: boolean) => void;
  onFinish?: () => void;
  mode?: 'short' | 'note' | 'enlarged';
  moveRow?: (direction: -1 | 1, caret: number) => boolean;
  enlarged?: boolean;
  selected?: boolean;
}) {
  const context = useContext(WritingContext)!;
  const emittedEntries = useRef(new WeakSet<Entry>());
  // Event handlers read the latest draft without re-creating the editor or its history.
  const latest = useRef({
    entry,
    edit,
    readOnly,
    onFocus,
    onOverflow,
    onFinish,
    mode,
    moveRow,
    context,
  });
  useEffect(() => {
    latest.current = {
      entry,
      edit,
      readOnly,
      onFocus,
      onOverflow,
      onFinish,
      mode,
      moveRow,
      context,
    };
  });
  const editor: Editor | null = useEditor(
    {
      immediatelyRender: false,
      shouldRerenderOnTransaction: false,
      extensions: [
        Document,
        Paragraph.extend({ whitespace: 'pre' }),
        Text,
        Bold,
        Italic,
        Underline,
        HardBreak,
        UndoRedo,
      ],
      enableInputRules: false,
      enablePasteRules: false,
      content: documentFor(entry),
      editable: !readOnly,
      autofocus: enlarged ? 'end' : false,
      editorProps: {
        handleDOMEvents: {
          // Let the browser commit IME text without running ProseMirror's Enter
          // or formatting keymaps. Returning true here does not preventDefault.
          keydown: (view, event) =>
            event.isComposing || view.composing || event.keyCode === 229,
        },
        attributes: {
          id: enlarged ? 'focused-writing' : entry.id,
          role: 'textbox',
          'aria-label': label,
          'aria-multiline': 'true',
          spellcheck: 'false',
          class: `writing-input${enlarged ? ' enlarged-writing' : ''}`,
        },
        handleKeyDown: (view, event) => {
          const activeEditor = fields.get(view.dom);
          const current = latest.current;
          if (event.isComposing || view.composing || event.keyCode === 229)
            return false;
          if (current.readOnly) return false;
          const format = formatForKey(event);
          if (format) {
            event.preventDefault();
            activeEditor?.commands.toggleMark(format);
            return true;
          }
          if (event.key === 'Escape' && current.mode !== 'enlarged') {
            event.preventDefault();
            view.dom.blur();
            return true;
          }
          if (event.key === 'Enter') {
            if (current.mode !== 'short' || event.shiftKey) {
              activeEditor?.commands.setHardBreak();
              return true;
            }
            current.onFinish?.();
            view.dom.blur();
            return true;
          }
          const { selection } = view.state;
          if (
            current.moveRow &&
            selection.empty &&
            !event.metaKey &&
            !event.ctrlKey &&
            !event.altKey &&
            !event.shiftKey &&
            (event.key === 'ArrowUp' || event.key === 'ArrowDown')
          ) {
            const position = view.state.doc.textBetween(
              0,
              selection.from,
              '\n',
              '\n',
            ).length;
            const multiline =
              current.entry.text.includes('\n') ||
              view.dom.scrollHeight > view.dom.clientHeight + 2;
            const direction = event.key === 'ArrowUp' ? -1 : 1;
            if (
              (!multiline ||
                (direction === -1
                  ? position === 0
                  : position === current.entry.text.length)) &&
              current.moveRow(direction, position)
            )
              return true;
          }
          return false;
        },
        handlePaste: (view, event) => {
          if (latest.current.readOnly) return true;
          const text = event.clipboardData?.getData('text/plain');
          if (text === undefined) return false;
          const plain = { ...latest.current.entry, text, formatRuns: [] };
          fields
            .get(view.dom)
            ?.commands.insertContent(
              documentFor(plain).content![0].content ?? [],
            );
          return true;
        },
      },
      onFocus: ({ editor }) => {
        const current = latest.current;
        // Focusing an empty slot saves its initial record. Its React echo can
        // arrive after typing and must not replace the newer editor content.
        emittedEntries.current.add(current.entry);
        current.context.activate(editor, current.entry.id);
        current.onFocus?.();
      },
      onBlur: ({ editor }) => {
        editor.view.dom.scrollTop = 0;
      },
      onUpdate: ({ editor }) => {
        const current = latest.current;
        const content = contentFor(editor);
        const changed = {
          ...current.entry,
          ...content,
          ...(current.entry.type === 'scheduled-line' && !content.text.trim()
            ? { submitted: false, completed: false }
            : {}),
        };
        current.entry = changed;
        emittedEntries.current.add(changed);
        current.edit(changed);
        requestAnimationFrame(() => {
          if (!editor.isDestroyed)
            current.onOverflow?.(
              editor.view.dom.scrollHeight > editor.view.dom.clientHeight + 2,
            );
        });
      },
    },
    [entry.id, enlarged],
  );
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    const node = editor.view.dom;
    fields.set(node, editor);
    if (fieldRef) fieldRef.current = node;
    const observer = new ResizeObserver(() =>
      onOverflow?.(node.scrollHeight > node.clientHeight + 2),
    );
    observer.observe(node);
    return () => {
      observer.disconnect();
      fields.delete(node);
      if (fieldRef?.current === node) fieldRef.current = null;
    };
  }, [editor, fieldRef, onOverflow]);
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    // Updating the view while the browser is typing can interrupt its pending
    // DOM/selection changes. Only update editability when it actually changes.
    if (editor.isEditable === readOnly) editor.setEditable(!readOnly, false);
    editor.view.dom.setAttribute('aria-readonly', String(readOnly));
    editor.view.dom.setAttribute('aria-label', label);
  }, [editor, readOnly, label]);
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    // React can acknowledge an earlier keystroke after the editor has moved on.
    // An echo of this editor's own write must never replace newer live content.
    // The browser may have an input mutation pending in its DOM observer.
    // Keep focused writing authoritative until that input reaches onUpdate.
    if (editor.isFocused || emittedEntries.current.has(entry)) return;
    const content = documentFor(entry);
    if (JSON.stringify(editor.getJSON()) !== JSON.stringify(content)) {
      // ProseMirror omits empty marks/content arrays. Compare semantic ranges too
      // before changing content, so typing and stored marks retain their history.
      const current = contentFor(editor);
      if (
        current.text !== entry.text ||
        JSON.stringify(current.formatRuns) !==
          JSON.stringify(contentForEntry(entry))
      )
        editor.commands.setContent(content, { emitUpdate: false });
    }
  }, [editor, entry]);
  useEffect(() => {
    if (
      editor &&
      !editor.isDestroyed &&
      selected &&
      !readOnly &&
      !editor.isFocused
    )
      editor.commands.focus();
  }, [editor, selected, readOnly]);
  return <EditorContent editor={editor} className="writing-field" />;
}

function contentForEntry(entry: Entry) {
  return textRuns(entry).map(({ from, to, ...format }) => ({
    from,
    to,
    ...Object.fromEntries(Object.entries(format).filter(([, value]) => value)),
  }));
}
