import { assertEntry, sameContent, type Entry } from '../domain/model';
import type { PlannerDB } from './repository';
import type { SaveQueue } from './save-queue';
import type { TabRecovery, RetainedDraft } from './tab-recovery';

export interface DraftConflict {
  draft: Entry;
  saved: Entry | undefined;
}
export interface RetainedDraftGroup {
  entry: Entry;
  sources: RetainedDraft[];
}
export interface TabReview {
  conflicts: DraftConflict[];
  retained: RetainedDraftGroup[];
  unsavedCount: number;
}

export async function readTabReview(
  database: PlannerDB,
  queue: SaveQueue,
  recovery: TabRecovery | null,
  pageIds: string[],
): Promise<TabReview> {
  const drafts = queue.unsaved();
  const conflicts: DraftConflict[] = [];
  for (const draft of drafts) {
    const saved = await database.entries.get(draft.id);
    if (saved) assertEntry(saved);
    if (
      (saved?.revision ?? 0) !== draft.revision ||
      !(await database.pages.get(draft.pageId))
    )
      conflicts.push({ draft, saved });
  }
  const allowed = new Set(pageIds);
  const groups = new Map<string, RetainedDraftGroup>();
  const pageRecords = new Map<string, Entry[]>();
  for (const retained of recovery?.retained() ?? []) {
    if (!allowed.has(retained.entry.pageId)) continue;
    if (drafts.some((entry) => sameContent(entry, retained.entry))) continue;
    const saved = await database.entries.get(retained.entry.id);
    let records = pageRecords.get(retained.entry.pageId);
    if (!records) {
      records = await database.readPages([retained.entry.pageId], true);
      pageRecords.set(retained.entry.pageId, records);
    }
    const archived = records.some(
      (entry) =>
        entry.deletedAt &&
        sameContent(
          {
            ...entry,
            id: retained.entry.id,
            deletedAt: retained.entry.deletedAt,
          },
          retained.entry,
        ),
    );
    if ((saved && sameContent(saved, retained.entry)) || archived) {
      recovery?.release(retained);
      continue;
    }
    const key = JSON.stringify({ ...retained.entry, revision: 0 });
    const group = groups.get(key) ?? { entry: retained.entry, sources: [] };
    group.sources.push(retained);
    groups.set(key, group);
  }
  return {
    conflicts,
    retained: [...groups.values()],
    unsavedCount: drafts.length,
  };
}
