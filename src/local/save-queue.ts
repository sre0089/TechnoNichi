import { assertEntry, type Entry } from '../domain/model';

export type SaveState = {
  kind: 'saved' | 'saving' | 'error';
  message?: string;
};
export const RECOVERY_KEY = 'daily-book:unsaved-v1';

export interface RecoveryStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function readRecovery(storage: RecoveryStorage): Entry[] {
  const raw = storage.getItem(RECOVERY_KEY);
  if (!raw) return [];
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed) || parsed.length > 1000)
    throw new Error('Invalid draft recovery');
  parsed.forEach(assertEntry);
  return parsed;
}

export class SaveQueue {
  private pending = new Map<string, Entry>();
  private recovery = new Map<string, Entry>();
  private revisions = new Map<string, number>();
  private timer: ReturnType<typeof setTimeout> | undefined;
  private running: Promise<boolean> | undefined;

  constructor(
    private write: (entry: Entry, expectedRevision: number) => Promise<Entry>,
    private notify: (state: SaveState) => void,
    private storage?: RecoveryStorage,
  ) {}

  seed(entries: Entry[]): void {
    entries.forEach((e) => this.revisions.set(e.id, e.revision));
  }

  revision(id: string): number | undefined {
    return this.revisions.get(id);
  }

  private checkpoint(): void {
    try {
      if (this.recovery.size)
        this.storage?.setItem(
          RECOVERY_KEY,
          JSON.stringify([...this.recovery.values()]),
        );
      else this.storage?.removeItem(RECOVERY_KEY);
    } catch {
      /* IndexedDB remains authoritative; an in-memory failed draft is retained. */
    }
  }

  edit(entry: Entry): void {
    assertEntry(entry);
    if (!this.revisions.has(entry.id))
      this.revisions.set(entry.id, entry.revision);
    this.pending.set(entry.id, entry);
    this.recovery.set(entry.id, entry);
    this.checkpoint();
    this.notify({ kind: 'saving' });
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      void this.flush();
    }, 120);
  }

  async flush(): Promise<boolean> {
    clearTimeout(this.timer);
    if (this.running) return this.running;
    this.running = this.drain();
    try {
      return await this.running;
    } finally {
      this.running = undefined;
    }
  }

  private async drain(): Promise<boolean> {
    while (this.pending.size) {
      const [id, entry] = this.pending.entries().next().value as [
        string,
        Entry,
      ];
      this.pending.delete(id);
      try {
        const saved = await this.write(
          entry,
          this.revisions.get(id) ?? entry.revision,
        );
        this.revisions.set(id, saved.revision);
        if (this.recovery.get(id) === entry) this.recovery.delete(id);
        this.checkpoint();
      } catch (error) {
        if (!this.pending.has(id)) this.pending.set(id, entry);
        this.notify({
          kind: 'error',
          message:
            error instanceof Error && error.name === 'QuotaExceededError'
              ? 'Storage is full. Your writing is still here.'
              : error instanceof Error && error.message.includes('Another tab')
                ? error.message
                : 'Could not save on this device. Your writing is still here.',
        });
        return false;
      }
    }
    this.notify({ kind: 'saved' });
    return true;
  }

  unsaved(): Entry[] {
    return [...this.recovery.values()];
  }
  dispose(): void {
    clearTimeout(this.timer);
  }
}
