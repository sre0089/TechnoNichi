import { isScheduled, sameContent, type Entry } from '../domain/model';

export type HistoryDirection = 'undo' | 'redo';
interface Action {
  before: Entry | null;
  after: Entry;
  label: string;
}
export interface HistoryInfo {
  undoCount: number;
  redoCount: number;
  undoLabel: string | null;
  redoLabel: string | null;
}

function documentFields(entry: Entry) {
  const { text, formatRuns, style, revision, ...fields } = entry;
  void text;
  void formatRuns;
  void style;
  void revision;
  return JSON.stringify(fields);
}
function label(before: Entry | null, after: Entry) {
  if (!before) return 'Create entry';
  if (before.deletedAt !== after.deletedAt)
    return after.deletedAt ? 'Delete entry' : 'Restore entry';
  if (
    'completed' in before &&
    'completed' in after &&
    before.completed !== after.completed
  )
    return after.completed ? 'Complete task' : 'Uncheck task';
  if (before.type !== after.type)
    return after.type === 'scheduled-block'
      ? 'Add duration'
      : 'Remove duration';
  if (before.type === 'note' && after.type === 'note')
    return before.x !== after.x || before.y !== after.y
      ? 'Move note'
      : 'Resize note';
  if (isScheduled(before) && isScheduled(after))
    return before.minute !== after.minute ||
      before.dayOffset !== after.dayOffset
      ? 'Change time'
      : before.type === 'scheduled-block'
        ? 'Change duration'
        : 'Finish task';
  return 'Change entry';
}

// Current-tab document history. The focused writing editor owns word undo.
export class PageHistory {
  private undoStack: Action[] = [];
  private redoStack: Action[] = [];
  private known = new Map<string, Entry>();
  constructor(private limit = 50) {}
  info(): HistoryInfo {
    return {
      undoCount: this.undoStack.length,
      redoCount: this.redoStack.length,
      undoLabel: this.undoStack.at(-1)?.label ?? null,
      redoLabel: this.redoStack.at(-1)?.label ?? null,
    };
  }
  private prune() {
    const ids = new Set(
      [...this.undoStack, ...this.redoStack].map((action) => action.after.id),
    );
    for (const id of this.known.keys()) if (!ids.has(id)) this.known.delete(id);
  }
  observe(entry: Entry) {
    if (
      [...this.undoStack, ...this.redoStack].some(
        (action) => action.after.id === entry.id,
      )
    )
      this.known.set(entry.id, structuredClone(entry));
  }
  edit(before: Entry | undefined, after: Entry) {
    if (before && sameContent(before, after)) return;
    const wordsChanged =
      before &&
      (before.text !== after.text ||
        JSON.stringify(before.formatRuns) !==
          JSON.stringify(after.formatRuns) ||
        JSON.stringify(before.style) !== JSON.stringify(after.style));
    if (
      before &&
      (wordsChanged || documentFields(before) === documentFields(after))
    ) {
      this.redoStack = [];
      this.observe(after);
      this.prune();
      return;
    }
    this.record(before ?? null, after);
  }
  record(before: Entry | null, after: Entry, name = label(before, after)) {
    this.undoStack.push({
      before: before ? structuredClone(before) : null,
      after: structuredClone(after),
      label: name,
    });
    if (this.undoStack.length > this.limit) this.undoStack.shift();
    this.redoStack = [];
    this.observe(after);
    this.prune();
  }
  request(direction: HistoryDirection) {
    const action = (direction === 'undo' ? this.undoStack : this.redoStack).at(
      -1,
    );
    if (!action) return null;
    const expected = this.known.get(action.after.id);
    if (!expected) throw new Error('History is no longer available.');
    return {
      expected: structuredClone(expected),
      target: direction === 'undo' ? action.before : action.after,
      label: action.label,
    };
  }
  complete(direction: HistoryDirection, saved: Entry) {
    const from = direction === 'undo' ? this.undoStack : this.redoStack;
    const to = direction === 'undo' ? this.redoStack : this.undoStack;
    const action = from.at(-1);
    if (!action || action.after.id !== saved.id)
      throw new Error('History changed.');
    from.pop();
    to.push(action);
    this.observe(saved);
    this.prune();
  }
  reset() {
    this.undoStack = [];
    this.redoStack = [];
    this.known.clear();
  }
}
