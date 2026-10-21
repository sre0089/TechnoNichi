import { afterEach, describe, expect, it, vi } from 'vitest';
import { CHANGE_KEY, TabChanges } from '../../src/local/tab-changes';

class Channel {
  static current: Channel;
  onmessage?: (event: { data: unknown }) => void;
  sent: unknown[] = [];
  closed = false;
  constructor() {
    Channel.current = this;
  }
  postMessage(value: unknown) {
    this.sent.push(value);
  }
  close() {
    this.closed = true;
  }
}
function environment(denied = false) {
  const target = Object.assign(new EventTarget(), {
    localStorage: {
      setItem: vi.fn(() => {
        if (denied) throw new Error('Denied');
      }),
    },
  });
  vi.stubGlobal('window', target);
  vi.stubGlobal('BroadcastChannel', Channel);
  const storage = (value: unknown) => {
    const event = Object.assign(new Event('storage'), {
      key: CHANGE_KEY,
      newValue: JSON.stringify(value),
    });
    target.dispatchEvent(event);
  };
  return { target, storage };
}
afterEach(() => {
  vi.unstubAllGlobals();
});

describe('metadata-only tab signals', () => {
  it('publishes book metadata without sending writing or notifying itself', () => {
    const { target } = environment();
    const receive = vi.fn();
    const bus = new TabChanges(receive);
    bus.publish('book');
    expect(Channel.current.sent).toEqual([
      { version: 1, bookId: 'book', nonce: expect.any(String) },
    ]);
    expect(target.localStorage.setItem).toHaveBeenCalledWith(
      CHANGE_KEY,
      JSON.stringify(Channel.current.sent[0]),
    );
    expect(receive).not.toHaveBeenCalled();
    bus.close();
  });
  it('deduplicates channel/storage delivery and ignores malformed signals', () => {
    const { storage } = environment();
    const receive = vi.fn();
    const bus = new TabChanges(receive);
    const change = { version: 1, bookId: 'book', nonce: 'one' };
    Channel.current.onmessage?.({ data: change });
    storage(change);
    storage({ version: 99, bookId: 'book', nonce: 'two' });
    storage({ version: 1, bookId: {}, nonce: 'three' });
    storage({ version: 1, bookId: 'book', nonce: 'x'.repeat(101) });
    expect(receive).toHaveBeenCalledExactlyOnceWith('book');
    bus.close();
  });
  it('falls back to storage events when channels are unavailable', () => {
    const { storage } = environment();
    vi.stubGlobal('BroadcastChannel', undefined);
    const receive = vi.fn();
    const bus = new TabChanges(receive);
    storage({ version: 1, bookId: 'book', nonce: 'one' });
    expect(receive).toHaveBeenCalledExactlyOnceWith('book');
    bus.close();
  });
  it('notification failures never turn a committed save into a failed save', () => {
    environment(true);
    const bus = new TabChanges(() => {});
    expect(() => bus.publish('book')).not.toThrow();
    expect(Channel.current.sent).toHaveLength(1);
    bus.close();
  });
  it('releases listeners and ignores late messages after closing', () => {
    const { storage } = environment();
    const receive = vi.fn();
    const bus = new TabChanges(receive);
    const channel = Channel.current;
    bus.close();
    storage({ version: 1, bookId: 'book', nonce: 'one' });
    channel.onmessage?.({ data: { version: 1, bookId: 'book', nonce: 'two' } });
    bus.publish('book');
    expect(channel.closed).toBe(true);
    expect(channel.sent).toEqual([]);
    expect(receive).not.toHaveBeenCalled();
  });
});
