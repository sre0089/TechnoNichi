import Paragraph from '@tiptap/extension-paragraph';
import { Extension, type Editor } from '@tiptap/core';
import { Plugin } from '@tiptap/pm/state';
import type { NoteLine } from '../domain/model';
import { noteNumbers } from '../domain/note-lines';

/** Each logical note line stays a paragraph; markers are real, non-editable controls. */
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
  addNodeView() {
    return ({ editor, node, getPos }) => {
      let current = node;
      const dom = document.createElement('p');
      dom.className = 'note-line';
      const marker = document.createElement('span');
      marker.className = 'note-list-marker';
      marker.contentEditable = 'false';
      marker.setAttribute('aria-hidden', 'true');
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'note-todo-checkbox';
      checkbox.contentEditable = 'false';
      const contentDOM = document.createElement('span');
      contentDOM.className = 'note-line-text';
      dom.append(marker, checkbox, contentDOM);
      const refresh = () => {
        dom.dataset.kind = current.attrs.kind;
        dom.dataset.checked = String(
          current.attrs.kind === 'todo' && current.attrs.checked,
        );
        dom.style.setProperty('--note-indent', String(current.attrs.indent));
        marker.dataset.marker =
          current.attrs.kind === 'bullet' ? '•' : `${current.attrs.number}.`;
        marker.hidden = !['bullet', 'number'].includes(current.attrs.kind);
        checkbox.hidden = current.attrs.kind !== 'todo';
        checkbox.checked = current.attrs.checked;
        checkbox.disabled = !editor.isEditable;
        checkbox.setAttribute(
          'aria-label',
          `Complete note to-do: ${current.textContent || 'Untitled'}`,
        );
      };
      checkbox.addEventListener('change', () => {
        const pos = getPos();
        if (!editor.isEditable || pos === undefined) {
          refresh();
          return;
        }
        editor.view.dispatch(
          editor.state.tr.setNodeMarkup(pos, undefined, {
            ...current.attrs,
            checked: checkbox.checked,
          }),
        );
      });
      refresh();
      return {
        dom,
        contentDOM,
        update: (next) => {
          if (next.type !== current.type) return false;
          current = next;
          refresh();
          return true;
        },
        stopEvent: (event) => event.target === checkbox,
        ignoreMutation: (mutation) =>
          mutation.type !== 'selection' &&
          !contentDOM.contains(mutation.target),
      };
    };
  },
});

export const NoteNumbering = Extension.create({
  name: 'noteNumbering',
  addProseMirrorPlugins() {
    return [
      new Plugin({
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
