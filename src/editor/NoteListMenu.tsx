'use client';

import {
  useEffect,
  useId,
  useRef,
  useState,
  type MutableRefObject,
} from 'react';
import { createPortal } from 'react-dom';
import type { Editor } from '@tiptap/core';
import { List, ListOrdered, SquareCheck } from 'lucide-react';

const choices = [
  { kind: 'todo', label: 'To-do checkbox', Icon: SquareCheck },
  { kind: 'bullet', label: 'Bullet list', Icon: List },
  { kind: 'number', label: 'Numbered list', Icon: ListOrdered },
] as const;
type Menu = {
  from: number;
  to: number;
  query: string;
  index: number;
  x: number;
  y: number;
  position: 'fixed' | 'absolute';
};

function match(editor: Editor) {
  const { selection } = editor.state;
  if (!selection.empty || selection.$from.parent.type.name !== 'paragraph')
    return null;
  const prefix = selection.$from.parent.textBetween(
    0,
    selection.$from.parentOffset,
    '',
    '\n',
  );
  const query = /^\/([a-z -]*)$/i.exec(prefix)?.[1];
  return query === undefined
    ? null
    : {
        from: selection.from - prefix.length,
        to: selection.from,
        query,
      };
}

export function NoteListMenu({
  editor,
  readOnly,
  keyHandlerRef,
}: {
  editor: Editor;
  readOnly: boolean;
  keyHandlerRef: MutableRefObject<((event: KeyboardEvent) => boolean) | null>;
}) {
  const [menu, setMenu] = useState<Menu | null>(null);
  const id = useId();
  const choose = useRef<(index: number) => void>(() => {});
  useEffect(() => {
    let current: Menu | null = null;
    let dismissed: string | null = null;
    const visibleChoices = (query: string) =>
      choices.filter((choice) =>
        choice.label.toLowerCase().includes(query.toLowerCase()),
      );
    const refresh = () => {
      const found =
        !readOnly && editor.isFocused && !editor.view.composing
          ? match(editor)
          : null;
      const key = found ? `${found.from}:${found.to}:${found.query}` : null;
      if (!found || key === dismissed || !visibleChoices(found.query).length) {
        if (!found) dismissed = null;
        current = null;
      } else {
        const rect = editor.view.coordsAtPos(found.to);
        const host = editor.view.dom.closest<HTMLElement>('[role="dialog"]');
        const bounds = host?.getBoundingClientRect();
        const minX = Math.max(8, (bounds?.left ?? 0) + 8);
        const maxX =
          Math.min(window.innerWidth, bounds?.right ?? window.innerWidth) - 248;
        const minY = Math.max(8, (bounds?.top ?? 0) + 8);
        const maxY =
          Math.min(window.innerHeight, bounds?.bottom ?? window.innerHeight) -
          185;
        const x = Math.max(minX, Math.min(rect.left, maxX));
        const y = Math.max(minY, Math.min(rect.bottom + 6, maxY));
        current = {
          ...found,
          index:
            current?.query === found.query
              ? Math.min(current.index, visibleChoices(found.query).length - 1)
              : 0,
          x: x - (bounds?.left ?? 0) + (host?.scrollLeft ?? 0),
          y: y - (bounds?.top ?? 0) + (host?.scrollTop ?? 0),
          position: host ? 'absolute' : 'fixed',
        };
      }
      setMenu(current);
      editor.view.dom.setAttribute('aria-expanded', String(!!current));
      if (current) {
        editor.view.dom.setAttribute('aria-controls', id);
        editor.view.dom.setAttribute(
          'aria-activedescendant',
          `${id}-${current.index}`,
        );
      } else {
        editor.view.dom.removeAttribute('aria-controls');
        editor.view.dom.removeAttribute('aria-activedescendant');
      }
    };
    const apply = (index: number) => {
      const found = match(editor);
      if (!found || readOnly) return;
      const choice = visibleChoices(found.query)[index];
      if (!choice) return;
      editor
        .chain()
        .focus()
        .deleteRange({ from: found.from, to: found.to })
        .updateAttributes('paragraph', { kind: choice.kind, checked: false })
        .run();
      refresh();
    };
    choose.current = apply;
    const dismiss = () => {
      if (!current) return;
      dismissed = `${current.from}:${current.to}:${current.query}`;
      refresh();
    };
    editor.view.dom.addEventListener('dismiss-note-list-menu', dismiss);
    keyHandlerRef.current = (event) => {
      if (!current || event.metaKey || event.ctrlKey || event.altKey)
        return false;
      if (event.key === 'Escape') {
        dismiss();
        return true;
      }
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        const length = visibleChoices(current.query).length;
        current.index =
          (current.index + (event.key === 'ArrowDown' ? 1 : -1) + length) %
          length;
        refresh();
        return true;
      }
      if (event.key === 'Enter' || event.key === 'Tab') {
        apply(current.index);
        return true;
      }
      return false;
    };
    editor.on('transaction', refresh);
    editor.on('focus', refresh);
    editor.on('blur', refresh);
    window.addEventListener('resize', refresh);
    window.addEventListener('scroll', refresh, true);
    refresh();
    return () => {
      keyHandlerRef.current = null;
      editor.off('transaction', refresh);
      editor.off('focus', refresh);
      editor.off('blur', refresh);
      choose.current = () => {};
      window.removeEventListener('resize', refresh);
      window.removeEventListener('scroll', refresh, true);
      editor.view.dom.removeEventListener('dismiss-note-list-menu', dismiss);
      editor.view.dom.removeAttribute('aria-expanded');
      editor.view.dom.removeAttribute('aria-controls');
      editor.view.dom.removeAttribute('aria-activedescendant');
    };
  }, [editor, readOnly, keyHandlerRef, id]);
  if (!menu) return null;
  const filtered = choices.filter((choice) =>
    choice.label.toLowerCase().includes(menu.query.toLowerCase()),
  );
  return createPortal(
    <div
      className="note-slash-menu"
      style={{ left: menu.x, top: menu.y, position: menu.position }}
    >
      <div className="note-slash-title">Add a list</div>
      <div id={id} role="listbox" aria-label="Note list style">
        {filtered.map(({ kind, label, Icon }, index) => (
          <button
            key={kind}
            id={`${id}-${index}`}
            type="button"
            role="option"
            aria-selected={index === menu.index}
            data-note-choice={index}
            onClick={() => choose.current(index)}
            onPointerDown={(event) => event.preventDefault()}
          >
            <Icon size={16} aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>
      <div className="note-slash-help">
        ↑ ↓ choose · Enter apply · Esc dismiss
      </div>
    </div>,
    editor.view.dom.closest('[role="dialog"]') ?? document.body,
  );
}
