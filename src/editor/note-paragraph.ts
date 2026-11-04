import Paragraph from '@tiptap/extension-paragraph';
import { Extension, type Editor } from '@tiptap/core';
import { Plugin } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import { closeHistory } from '@tiptap/pm/history';
import type { NoteLine } from '../domain/model';
import { noteNumbers } from '../domain/note-lines';

/** Keep native paragraph DOM intact so browser/IME text replacement stays reliable. */
export const NoteParagraph = Paragraph.extend({
  whitespace: 'pre',
  addAttributes() {
    return {
      kind: { default: 'plain', rendered: false },
      indent: { default: 0, rendered: false },
      checked: { default: false, rendered: false, keepOnSplit: false },
      number: { default: 0, rendered: false, keepOnSplit: false },
      breakMarks: { default: [], rendered: false, keepOnSplit: false },
    };
  },
  renderHTML({ node }) {
    return [
      'p',
      {
        class: 'note-line',
        'data-kind': node.attrs.kind,
        'data-checked': String(
          node.attrs.kind === 'todo' && node.attrs.checked,
        ),
        'data-marker':
          node.attrs.kind === 'bullet' ? '•' : `${node.attrs.number}.`,
        style: `--note-indent: ${node.attrs.indent}${node.attrs.kind === 'number' ? `; --note-marker-width: ${String(node.attrs.number).length + 2}ch` : ''}`,
      },
      0,
    ];
  },
});

export const NoteNumbering = Extension.create({
  name: 'noteNumbering',
  addProseMirrorPlugins() {
    return [
      new Plugin({
        props: {
          decorations(state) {
            const widgets: Decoration[] = [];
            state.doc.forEach((node, position) => {
              if (node.attrs.kind !== 'todo') return;
              widgets.push(
                Decoration.widget(
                  position + 1,
                  (view, getPos) => {
                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.className = 'note-todo-checkbox';
                    checkbox.contentEditable = 'false';
                    checkbox.checked = node.attrs.checked;
                    checkbox.disabled = !view.editable;
                    checkbox.setAttribute(
                      'aria-label',
                      `Complete note to-do: ${node.textContent || 'Untitled'}`,
                    );
                    checkbox.addEventListener('change', () => {
                      const pos = getPos();
                      if (!view.editable || pos === undefined) return;
                      const current = view.state.doc.nodeAt(pos - 1);
                      if (!current || current.attrs.kind !== 'todo') return;
                      view.dispatch(
                        closeHistory(
                          view.state.tr.setNodeMarkup(pos - 1, undefined, {
                            ...current.attrs,
                            checked: checkbox.checked,
                          }),
                        ),
                      );
                    });
                    return checkbox;
                  },
                  {
                    key: `${position}:${node.attrs.checked}:${node.textContent}`,
                    side: -1,
                    ignoreSelection: true,
                    stopEvent: () => true,
                  },
                ),
              );
            });
            return DecorationSet.create(state.doc, widgets);
          },
        },
        appendTransaction(transactions, _old, state) {
          if (!transactions.some((tr) => tr.docChanged)) return;
          const lines: NoteLine[] = [];
          state.doc.forEach((node) =>
            lines.push({ kind: node.attrs.kind, indent: node.attrs.indent }),
          );
          const numbers = noteNumbers(lines);
          const tr = state.tr;
          state.doc.forEach((node, pos, index) => {
            if (node.attrs.number !== numbers[index])
              tr.setNodeMarkup(pos, undefined, {
                ...node.attrs,
                number: numbers[index],
              });
          });
          return tr.docChanged ? tr : undefined;
        },
      }),
    ];
  },
});

export function noteLineKey(editor: Editor, event: KeyboardEvent): boolean {
  if (event.metaKey || event.ctrlKey || event.altKey) return false;
  const { $from, empty } = editor.state.selection;
  const attrs = $from.parent.attrs;
  if (event.key === 'Tab' && attrs.kind !== 'plain') {
    editor.commands.updateAttributes('paragraph', {
      indent: Math.max(
        0,
        Math.min(6, attrs.indent + (event.shiftKey ? -1 : 1)),
      ),
    });
    return true;
  }
  if (
    event.key === 'Backspace' &&
    empty &&
    $from.parentOffset === 0 &&
    (attrs.kind !== 'plain' || attrs.indent)
  ) {
    editor.commands.updateAttributes(
      'paragraph',
      attrs.indent > 0
        ? { indent: attrs.indent - 1 }
        : { kind: 'plain', checked: false },
    );
    return true;
  }
  if (event.key !== 'Enter') return false;
  if (
    empty &&
    !$from.parent.content.size &&
    attrs.kind !== 'plain' &&
    !event.shiftKey
  ) {
    editor.commands.updateAttributes('paragraph', {
      kind: 'plain',
      indent: 0,
      checked: false,
    });
    return true;
  }
  editor
    .chain()
    .splitBlock()
    .updateAttributes('paragraph', {
      kind: event.shiftKey ? 'plain' : attrs.kind,
      indent: attrs.indent,
      checked: false,
    })
    .run();
  return true;
}
