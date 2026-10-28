# Architecture and milestone plan

Status: M1 merged through PRs #3/#5/#6. M2 backup and deletion/recovery slices
merged through PRs #9/#13. Free-note movement/resizing is implemented on
`feat/note-movement-resizing`, merged through
[PR #15](https://github.com/sre0089/TechnoNichi/pull/15) as `ed6ef3f` after separate
user approval; issue #14 is closed. Final head `32be44e` passed CI, and the merged
application source matches it.
Requirements live in `docs/PRD.md`; visual measurements live in
`docs/PAGE_TEMPLATE_SPEC.md`. The real spread and mockup were received as private
conversation attachments and inspected. Geometry estimates retain their uncertainty.

## Compact architecture

Use the PRD's TypeScript, React, Next.js, and Dexie/IndexedDB baseline. Next.js
composes routes and a browser-only planner editor. Pure calendar, manifest, and
coordinate functions do not depend on React, the database, or an animation library.
No server, account, cloud service, or deployment is required for M1.

| Boundary        | M1 responsibility                                                                 |
| --------------- | --------------------------------------------------------------------------------- |
| `app`           | Route, shell, client editor boundary, error handling                              |
| `domain`        | Validated book/page/entry records; civil dates and grid transforms                |
| `templates`     | Versioned daily template; explicit timetable anchors; paper rendering             |
| `book`          | Stable ordered pages, adjacent spread navigation, bounded live pages              |
| `editor`        | Native text inputs, task completion, free-positioned notes, finish behavior       |
| `components/ui` | Shared native controls, Radix dialogs/popovers/tooltips, save-status presentation |
| `local`         | Dexie schema, serialized writes, revisions, hydration, save failure recovery      |

Create these modules only as implementation needs them. Search, sync,
attachments, handwriting, and a curl adapter are later milestone work.

## Data and editing contracts

- Book records retain the template version and explicit locale/Today timezone.
  Page dates are civil `YYYY-MM-DD` strings with stable IDs, independent of order.
- Scheduled-line entries store authoritative wall-clock time and an explicit
  day offset for midnight wrap. Their page placement derives from the template.
  The M1 review correction renders one native field per hour, without a timed-item
  creation control. Exact minutes and existing IDs remain stored; multiple entries
  within an hour are individually accessible. New rows share deterministic IDs
  across tabs, reserving IDs already used by entries moved to other hours.
  Timed entries now have optional submitted/completed booleans, defaulting to false
  when absent on old records. Enter or Done submits a nonblank timed task; checking
  it preserves text and adds a translucent strike-through. Clearing resets the flags.
  This additive data change needs no IndexedDB store/index migration or record rewrite.
  Consecutive occupied-hour lines derive from the entries, including completed ones;
  gaps split them and overnight offsets join them across midnight.
- Notes store document/grid position and box dimensions; viewport resizing never
  changes stored geometry. Tasks retain text and completion independently.
  New notes are limited to the grid below 03:00; older notes retain their positions.
- Use local unique IDs, schema versions, revision fields, validated records, and
  deletion markers. Add later entry kinds only when implemented.
- React holds immediate drafts; IndexedDB holds durable content. Preserve a draft
  until its transaction succeeds. Navigation flushes the latest draft before
  removing its editor; failed writes retain a visible recoverable draft.
- Show “Saving locally” while a write is pending and “Saved on this device” only
  after transaction success. M1 must not promise cloud synchronization or backup.
- Design transaction boundaries to accept expected revisions so M2 multi-tab
  stale-edit handling can be introduced without changing entry identity.
- The initial M1 used native text controls. The requested word-formatting addition
  uses scoped Tiptap fields with controlled marks. Short lines/tasks finish on Enter; Shift+Enter adds a
  newline. Notes use Enter for newlines and an explicit finish control. Escape
  retains drafts. Respect IME composition and native selection/undo.
- Preserve overflow text; expose focused reading/editing rather than shrinking
  fonts, expanding the paper, or pushing adjacent content.
- The user requested a bounded keyboard refinement on 2026-10-06: hourly-row
  Up/Down navigation and word-level bold/italic/underline shortcuts and controls.
  Plain text plus validated formatting ranges retain older entry flags and require
  no IndexedDB migration. Tiptap owns selection, composition and field-local undo;
  the existing revision-checked save/recovery path persists text and ranges together.
  This explicit scope does not start the remainder of M2.
- Only explicit previous/next controls navigate in M1. Decorative book layers
  are hidden from accessibility and cannot intercept editing input.

## Local backup boundary

`local/backup.ts` defines the strict `daily-book-backup` JSON envelope (new exports
use version 2 for duration tasks; versions 1 and 2 can be imported):
export timestamp, book, full ordered page manifest, all entry records (including
deletion markers), and local preferences. It rejects unknown fields, unsupported
versions/templates, missing/duplicate dates, duplicate entry IDs/active checklist
slots, broken page references, invalid geometry/time/format ranges and preferences.
Legacy optional flags remain absent. Files are limited to 20 MiB, 50,000 entries,
one million UTF-16 text units and 20,000 formatting runs per entry.

Export locks local editing/navigation, drains pending writes, then reads all four
tables in one read transaction. The client serializes and downloads a JSON Blob;
no writing reaches a server. Failed flushing prevents export and retains recovery.

File reading/parsing and full validation occur before the write transaction. Restore
copies/validates the archive again, then checks destination emptiness and writes all
four tables in one Dexie transaction. Any request failure aborts the whole operation.
Only a completely empty database or the generated empty 2026 bootstrap book is
eligible. Saved entries, including empty/deleted ones, or unrelated book metadata
cause refusal. Duplicate records are rejected rather than merged. Restore activates
the imported preferences/book; startup reads that book instead of creating another
default. The UI reviews a chosen file before an explicit restore action.

Concurrent restores serialize through IndexedDB; revision checks continue after
restoration. Restore commits publish book-change notices; other tabs load changes
only through explicit review. Populated-book replacement/merge flows and automatic
backups remain deferred.

## Reversible defaults

Working title: **Daily Book**. Synthetic sample year: **2026**. Locale: English.
The initial book's Today preference uses the browser's IANA timezone, stored
explicitly; entry times remain floating wall-clock times. October uses muted
purple as required by the PRD. Other themes are provisional until reference review.
The small-screen fallback is a single readable page, not a squeezed spread.

Package manager: npm, with one exact `package-lock.json`. M1 was built and tested
with project-specific Node 24.21.0 and npm 11.8.0, without replacing global Node.
Core versions: Next.js 16.3.8, React 19.3.0, Dexie 4.4.6, TypeScript 6.0.3.
Tooling: Vitest 5.0.3, Playwright 1.63.0, ESLint 10.12.0 and Prettier 3.9.9.
The app-wide UI now uses Tailwind 4.3.3, shared theme tokens and local native-control
components, Radix dialogs/popovers/tooltips, and Lucide icons. Custom CSS retains
the paper geometry and page-writing metrics. Tailwind Preflight is omitted
to preserve reviewed metrics. See [the interface system](UI_SYSTEM.md) for exact
versions, boundaries and interaction contracts. The requested word-formatting addition uses pinned Tiptap 3.31.4 for bounded entry
editors. No flipbook or service worker was added.

## M1 plan and acceptance checklist

1. Resolve the reference input, record measured geometry and uncertainty, and
   verify supported tooling from current official documentation.
2. Implement civil-date/manifest/coordinate primitives and versioned template.
3. Add the client spread editor and Dexie persistence, including observable save
   status and recoverable failures.
4. Add adjacent navigation and small-screen focus, then test actual editing,
   navigation, reload, and fixed synthetic screenshots.

- [x] Local install, dev, build, lint/format, strict type-check, unit, and browser
      commands are reproducible; CI runs real checks with verified pinned actions.
- [x] Desktop shows two editable daily pages with independently drawn paper,
      grid, header, checklist, timeline, memo area, gutter, and book depth.
- [x] A timed line, positioned note, and checklist task can be created and edited;
      completion does not delete task wording.
- [x] Turn away, return, and reload: text, times, note geometry, and completion
      survive, including an edit immediately followed by navigation.
- [x] Write failure never claims Saved or loses the latest recoverable draft.
- [x] Focus, text selection, synthetic IME events, and ordinary editing do not trigger page turns.
- [x] Resizing and small-screen focus do not rewrite stored note positions.
- [x] Pure checks cover date boundaries/leap days, midnight anchors, coordinate
      transforms, and spread ordering without assuming odd dates share a fixed side.
- [x] Blank, normally filled, dense, and small-screen synthetic fixtures exist;
      screenshots are visually inspected rather than automatically accepted.
- [x] Report actual browser checks and device gaps; no visual-match or tablet
      behavior claim without reference/device verification.
- [x] Update project state, report the runnable app and checks, then request
      commit/push approval and stop before M2.

## Roadmap and gates

| Milestone | Scope                                                                             | Gate                                                |
| --------- | --------------------------------------------------------------------------------- | --------------------------------------------------- |
| M1        | First persisted daily spread and simple navigation                                | Enter a day, turn away, return, reload without loss |
| M2        | Blocks/overlaps, movement, styles, undo/recovery, multi-tab safety, export/import | Reopen and restore a real planning day              |
| M3        | Yearly book, cover, Today/date jump, tabs, replaceable turn renderer              | Visual approval and no editing/save regressions     |
| M4        | Cached offline opening, search, migrations, accessibility, dense-page performance | A week of real planning including offline use       |
| M5        | Optional accounts, explicit sync, ownership, conflict/retry recovery              | Two-device offline/retry/privacy checks             |
| M6        | Tablet/PWA polish, history, print, backup restore, approved private deployment    | Restore correctly on a fresh device                 |
| M7        | Additional paper templates, images, then separately scoped handwriting            | Preserve entry identity and document semantics      |

No later feature is promoted into M1. No public deployment is authorized.

## Official documentation consulted

- [Next.js installation](https://nextjs.org/docs/app/getting-started/installation)
- [Dexie with React](https://dexie.org/docs/Tutorial/React)
- [Node release support](https://nodejs.org/en/about/previous-releases)

Exact dependency versions were verified against official requirements and npm
metadata, then pinned and clean-installed from the lockfile. No real-device
performance measurements or full offline shell behavior were claimed.

## Recoverable entry deletion

`deletedAt` remains the schema-v1 soft-deletion marker. UI mutation waits for
SaveQueue to flush, then uses the queue's durable revision for deletion. The
repository copies the stored record and changes only the marker and revision.
Restoration uses the deleted record's reviewed revision, checks the original slot
or note rectangle, and clears its marker in the same read/write transaction.
Refusal, stale revisions and storage failure preserve the existing records.

The editor loads visible-page records including tombstones to reserve identities;
rendering and outline filters expose active records only. New hourly and checklist
entries suffix an occupied ID instead of reusing a deleted record. The whole-book
recovery query scopes by the book's page manifest. Its dialog renders twenty
records at a time. JSON archives already include tombstones; no migration or new
service is required. Other-tab notifications are described below;
alternate-placement recovery remains separate work.

## Free-note geometry interactions

`domain/note-geometry.ts` snaps movement/resizing in template units and bounds the
result by the printed writing grid. It preserves note identities, text and marks.
Movement retains legacy dimensions; resizing has four-column/two-row minimums
except for imported edge boxes with less available space. No schema change.

`NoteFrame` owns selected-note move and resize handles. Pointer capture tracks one
primary pointer; screen positions are converted through the paper rectangle.
A three-pixel activation threshold prevents clicks from snapping legacy geometry.
React previews positions; release queues one changed record. Escape, pointer
cancellation/lost capture, window blur, scroll or resize discard the preview.
The planner locks navigation/preferences/backup/deletion during a gesture and
temporarily makes writing read-only. Handle focus survives editing re-enablement.
Arrow keys and contextual buttons reuse the same pure geometry functions. Failed
geometry saves use the existing revision-checked queue and recoverable draft path.
Full text remains available through overflow/focused editing after a resize.

## Local tab changes and recovery

`TabChanges` sends book metadata only after successful entry/deletion/restore
transactions through BroadcastChannel and a storage signal. Focus/visibility
checks compare visible durable revisions when signals are unavailable. Notices
never refresh a live editor. Explicit review reads current IndexedDB records;
loading saved changes preserves the spread and overlays remaining local drafts.

`TabRecovery` checkpoints immutable localStorage snapshots with independent
sessionStorage reload buffers. Session ownership guards late cleanup from a
previous editor instance. A successful save clears only that editor's snapshot;
closed-tab snapshots remain reviewable. Legacy and invalid buffers are retained.
`readTabReview` groups retained writing and filters equivalent durable/archive
copies. Recovery storage remains best effort and is separate from JSON backups.

Review owns the planner operation lock, pauses queued timers and waits for active
writes. Repository decisions check the reviewed saved revision transactionally.
Keep my writing archives the replaced version before updating the original;
Keep both archives the draft and leaves saved writing on the page. Use saved
writing explicitly drops the reviewed local draft after checking its saved version.
Occupied placement, concurrent changes and failed transactions retain drafts.
Copies use existing schema-v1 tombstones, new IDs and the ordinary archive format.

## Duration tasks and overlap lanes

`scheduled-block` adds explicit endMinute/endDayOffset to the existing timed fields,
marks, completion and revision/deletion metadata. Validation requires end > start
inside 06:00–03:00 (+1). IndexedDB indexes and template version remain unchanged.
Archive v2 includes blocks; v1 continues accepting only its original entry kinds.

`domain/durations.ts` owns conversion, display labels, explicit civil time parsing
and a deterministic half-open interval-lane projection. `ScheduleControls` edits
both endpoints together after validation; cancel leaves the entry unchanged.
Brackets use exact endpoint coordinates minus the template's one-row writing
offset. Writing stays in the containing hourly row. Separate gutter lanes and
`HourWritingMenu` expose overlapping/same-hour entries without changing other
writing or duplicating editors. Dense lanes compress within the gutter; the full
chooser and day outline retain every task's text and exact interval.

Deletion, backups and retained tab snapshots already store full entry objects.
Repository conflict decisions permit reviewed conversion between scheduled kinds
while retaining type/page checks for other kinds. Duration restores allow overlap;
point/checklist/note occupied-placement refusal stays intact. Drag creation,
pointer movement/resizing and application-wide undo remain later work.
