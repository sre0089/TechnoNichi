export const CHANGE_KEY = 'daily-book:committed-change-v1';
export const CHANGE_CHANNEL = 'daily-book:changes-v1';
interface Change {
  version: 1;
  bookId: string;
  nonce: string;
}

export class TabChanges {
  private channel?: BroadcastChannel;
  private closed = false;
  private seen = new Set<string>();
  private storageEvent: (event: StorageEvent) => void;

  constructor(private receive: (bookId: string) => void) {
    const read = (value: unknown) => {
      if (this.closed || !value || typeof value !== 'object') return;
      const change = value as Partial<Change>;
      if (
        change.version !== 1 ||
        typeof change.bookId !== 'string' ||
        change.bookId.length > 200 ||
        typeof change.nonce !== 'string' ||
        change.nonce.length > 100 ||
        this.seen.has(change.nonce)
      )
        return;
      this.seen.add(change.nonce);
      if (this.seen.size > 100)
        this.seen.delete(this.seen.values().next().value!);
      this.receive(change.bookId);
    };
    try {
      this.channel = new BroadcastChannel(CHANGE_CHANNEL);
      this.channel.onmessage = (event) => read(event.data);
    } catch {
      /* Storage events/focus checks remain available. */
    }
    this.storageEvent = (event) => {
      if (event.key !== CHANGE_KEY || !event.newValue) return;
      try {
        read(JSON.parse(event.newValue));
      } catch {
        /* Ignore invalid signals. */
      }
    };
    window.addEventListener('storage', this.storageEvent);
  }

  publish(bookId: string) {
    if (this.closed) return;
    const change: Change = { version: 1, bookId, nonce: crypto.randomUUID() };
    // Only metadata travels between tabs; writing is always read from IndexedDB.
    try {
      this.channel?.postMessage(change);
    } catch {
      /* Notification is best effort. */
    }
    try {
      window.localStorage.setItem(CHANGE_KEY, JSON.stringify(change));
    } catch {
      /* Use channel/focus. */
    }
  }

  close() {
    this.closed = true;
    this.channel?.close();
    window.removeEventListener('storage', this.storageEvent);
  }
}
