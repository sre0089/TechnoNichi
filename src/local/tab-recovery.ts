import { sameContent, type Entry } from '../domain/model';
import { readRecovery, RECOVERY_KEY, type RecoveryStorage } from './save-queue';

export const TAB_RECOVERY_PREFIX = `${RECOVERY_KEY}:tab:`;
export const SESSION_DRAFT_KEY = 'daily-book:tab-draft-v1';
const OWNER_KEY = 'daily-book:tab-draft-owner';
type Store = RecoveryStorage & {
  length: number;
  key(index: number): string | null;
};
export interface RetainedDraft {
  entry: Entry;
  key: string;
  raw: string;
}

function get(store: RecoveryStorage | undefined, key: string) {
  try {
    return store?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

// Every editor instance owns one emergency key. Reloads/duplicated tabs get an
// independent session copy; successful writes can only clear their own key.
export class TabRecovery implements RecoveryStorage {
  readonly id = crypto.randomUUID();
  readonly key = `${TAB_RECOVERY_PREFIX}${this.id}`;
  private memory: string | null;

  constructor(
    private local?: Store,
    private session?: RecoveryStorage,
  ) {
    this.memory = get(session, SESSION_DRAFT_KEY) ?? get(local, RECOVERY_KEY);
    try {
      session?.setItem(OWNER_KEY, this.id);
    } catch {
      /* Best effort. */
    }
  }

  getItem() {
    return this.memory;
  }
  setItem(_key: string, value: string) {
    this.memory = value;
    try {
      this.local?.setItem(this.key, value);
    } catch {
      /* Keep memory/session. */
    }
    try {
      if (this.session?.getItem(OWNER_KEY) === this.id)
        this.session.setItem(SESSION_DRAFT_KEY, value);
    } catch {
      /* Keep memory/local emergency copy. */
    }
  }
  removeItem() {
    this.memory = null;
    try {
      this.local?.removeItem(this.key);
    } catch {
      /* Retain the extra copy. */
    }
    try {
      if (this.session?.getItem(OWNER_KEY) === this.id)
        this.session.removeItem(SESSION_DRAFT_KEY);
    } catch {
      /* Retain the extra copy. */
    }
  }

  retained(): RetainedDraft[] {
    const result: RetainedDraft[] = [];
    try {
      const keys = Array.from({ length: this.local?.length ?? 0 }, (_, i) =>
        this.local!.key(i),
      );
      for (const key of keys) {
        if (
          !key ||
          key === this.key ||
          (key !== RECOVERY_KEY && !key.startsWith(TAB_RECOVERY_PREFIX))
        )
          continue;
        const raw = get(this.local, key);
        if (!raw) continue;
        try {
          for (const entry of readRecovery({
            getItem: () => raw,
            setItem() {},
            removeItem() {},
          }))
            result.push({ entry, key, raw });
        } catch {
          /* Invalid legacy buffers are left untouched. */
        }
      }
    } catch {
      /* The current queue remains available if storage is denied. */
    }
    return result;
  }

  // Only after a durable copy/same content has been verified. A newer edit in
  // that tab changes raw, so this review can never erase its updated buffer.
  release(retained: RetainedDraft) {
    try {
      if (this.local?.getItem(retained.key) !== retained.raw) return;
      const entries = readRecovery({
        getItem: () => retained.raw,
        setItem() {},
        removeItem() {},
      });
      const remaining = entries.filter(
        (entry) =>
          entry.id !== retained.entry.id || !sameContent(entry, retained.entry),
      );
      if (remaining.length)
        this.local.setItem(retained.key, JSON.stringify(remaining));
      else this.local.removeItem(retained.key);
    } catch {
      /* The durable copy already exists; keep this extra copy. */
    }
  }
}
