# Digital Book Planner — Product requirements

The repository setup from Prompt 1 should now be complete. Read AGENTS.md and PROJECT_STATE.md first and retain that workflow. Verify the repository instead of assuming setup succeeded.

This is the product requirements document for an independent digital book planner. The brand name is undecided; use a neutral working title. This is a new web product, not Sherpa or Spelunk, and does not inherit their CLI, ML, PyPI, or Homebrew requirements.

Treat this PRD as the product baseline. Create docs/PRD.md from it, retain the important details, and record proposed changes rather than quietly simplifying the vision. Any older blueprint that treats the planner edition as unknown is superseded: the reference is the Hobonichi Techo Cousin.

## 1. Why this product exists

I use a physical Hobonichi Techo Cousin daily. I am left-handed, and ink sometimes smudges while I write. I want the familiar planner without that friction, not a replacement productivity methodology.

Build a functional digital book: open its cover, move through pages with beautiful animations, type beside its time markers, check tasks, and place notes on the page. Return later and find the same content in the same place.

The book itself is the interface. Do not turn this into a calendar dashboard, kanban board, endless document, or an infinite whiteboard with a decorative book background.

The core promise is: faithful page experience, effortless editing, trustworthy saving.

## 2. Reference and visual fidelity

Use my uploaded English-layout Cousin daily-spread photo as the primary visual reference. Look for `references/private/cousin-daily-spread.png` or the image attached to this coding session. An attachment from another chat is not automatically available here. If missing, ask for it before claiming a visual match; nonvisual work can continue.

Implement a measured, independently drawn layout using the Cousin's A5 proportions, 148:210, and approximately 3.7 mm grid pitch. These are logical design proportions, not a claim that CSS millimeters match a physical ruler on every screen.

Preserve:
- Warm, restrained paper and a faint grid across the writing surface.
- Boxed upper-left date header with month, large day number, weekday, and quiet metadata.
- Five vertically stacked task checkboxes beside the header.
- Subtle left-side timetable and lightly printed schedule/memo divider.
- Large uninterrupted memo area; no permanent cards or labeled productivity sections.
- Muted monthly accents; October's reference is purple.
- Quiet footer, miniature calendar at the lower right of the spread, and outer-edge month marker.
- Facing pages, believable gutter, cover edge, subtle shadows, and page-stack depth.

Measure header bounds, margins, grid origins, checklist anchors, timeline marks, and footer placement. Record uncertainty; do not invent exact measurements from a perspective photograph. Keep grid lines faint but user text clearly readable. Do not reproduce photographic glare, curvature, ghost text, or paper show-through as a baked background.

The timetable is optional structure inside the writing area. Do not stretch it to fill the entire page or import the weekly layout into daily pages. Determine the daily row-to-time mapping from the reference; do not assume every grid row means 30 minutes. The visible sequence includes 6, 9, 12, 15, 18, 21, 0, 3. Represent midnight wrap explicitly.

Use original graphics, licensed fonts, and independent branding. Keep the photograph private and out of production assets. Preserve footer space, but use blank/user-authored text rather than bundling Hobonichi quotations. Do not imply official affiliation or claim naming/legal clearance.

Record a versioned PageTemplate containing logical dimensions, grid geometry, typography, header/footer/checklist regions, explicit timeline anchors, spread-side behavior, and theme tokens. Model spread-level elements separately instead of duplicating them on every page.

Produce visual fixtures for a blank spread, a normally filled day, a dense day, and a small-screen focused page. A beautiful empty book is not enough.

## 3. Scope and release boundaries

First useful milestone:
A two-page daily spread with one editable timed line, a free-positioned note, a checklist task, local persistence, and previous/next navigation. Use real persisted data, not a static mockup.

Personal alpha:
One yearly book, typed daily planning, duration blocks, basic styles, undo/redo, deletion recovery, Today/date jump, search, export/import, cached offline opening, and polished cover/page transitions. No account required.

Private cross-device beta:
Optional accounts, cloud synchronization, conflict recovery, version history, private attachments, installability refinements, and print views.

Later:
Yearly calendar/index, monthly and weekly pages, month-introduction/memo pages, drawing and handwriting, images, recurrence, calendar import, cross-page links, custom covers, reusable templates, annual archive/PDF, and an archival bookshelf.

Do not add AI, streaks, productivity scores, social feeds, collaboration, automatic rescheduling, a plugin platform, or billing to the alpha. They are not needed to solve this problem.

## 4. User experience

Returning users can open today or resume their last page. First use can show a simple year-selection/book-creation screen and cover. Do not force a long cover animation every visit.

Outside the book, keep only restrained controls such as Today, date jump, search, undo, zoom, settings, and save status. Show contextual editing controls when an item is selected; hide them afterward.

Desktop: a readable two-page spread.
Tablet: spread or single-page focus, depending on readable size.
Phone: a single page with zoom and an optional enlarged text editor, not a tiny two-page spread.

Keep text positions stable across sizes. Configure toolbar placement for either hand, including a right-side option for left-handed use. Preserve browser zoom, text selection, and ordinary keyboard editing. Provide visible focus, accessible controls, non-drag alternatives, and a linear day outline based on the same entries. Decorative page layers must not intercept input or pollute screen-reader output.

## 5. Editing behaviors

Timed line:
Click an empty timetable position, type directly beside the time, and finish without opening an event form. The editor border disappears, leaving writing on paper. Natural snapping follows the measured template; a small control also permits exact times.

Duration block:
Drag through an empty schedule range or use a non-drag control. Display a subtle bracket/highlight, not a large appointment card. Moving it updates time; resizing updates duration. Permit overlapping entries with explicit lanes and a quiet overlap cue. Never silently rearrange the entire page.

Free note:
Click a memo-grid position and type. Store position and size in document/grid coordinates. Dragging a note changes location, never its time. Converting it to a scheduled item must be explicit.

Checklist:
Type beside a top checkbox, then toggle completion without deleting the wording. Later allow explicitly copying unfinished tasks to another day; do not move them automatically.

Text and overflow:
Start with native text controls styled to match the page, not one uncontrolled contenteditable book. Define consistent fonts, baselines, wrapping, and caret behavior. Enter completes a short line/task; Shift+Enter adds a line break. For multiline notes, Enter inserts a newline and an explicit finish action exits. Escape exits editing while retaining the draft, rather than discarding text unexpectedly. Respect IME composition.

If content exceeds its box, preserve it and show an overflow affordance. Offer resizing, moving, or focused reading. Never silently shrink fonts, erase text, expand the paper, or push other notes downward. Start with item-level ink, emphasis, and highlight styles; defer full rich text.

Undo and deletion:
Group typing into useful steps; one drag is one undo step. Do not fight the focused text editor's native undo. Soft-delete with recovery. Undo after synchronization creates a new change rather than rewriting server history.

## 6. Book navigation and animation

Separate book states such as closed, opening, open, turning, and closing from editing states such as typing, selecting, moving, resizing, and later drawing.

Only page corners/edges or explicit controls start a page turn. Text selection, note movement, normal scrolling, and browser zoom must not accidentally turn pages. Keyboard page shortcuts must not hijack caret keys inside inputs. One pointer gesture has one owner until it ends or is canceled.

Support previous/next spread, Today, date jump, miniature-calendar navigation, month navigation, and optional bookmark/resume position. Searching far away should jump directly, not animate hundreds of turns. Derive the current spread from a stable page manifest; do not assume odd dates always belong on the same side.

Use HTML/CSS/SVG for settled, editable pages. Prototype Motion/CSS for cover and depth, and evaluate StPageFlip/page-flip behind a replaceable BookRenderer adapter. Verify current documentation, licensing, maintenance, and input behavior before adopting it. A library demo is not proof that editable pages work.

Prefer one live editor per page, with read-only representations during motion if needed. Do not let animation clones duplicate live inputs, IDs, event handlers, or accessibility content. Preserve the latest draft before unmounting; a local-save failure must keep a recoverable editor/draft. Do not wait for cloud acknowledgement to navigate.

Test rapid turns, canceled drags, resizing, focus restoration, and turning while typing. Fall back to restrained CSS page transitions if a curl library compromises editing. Do not build a custom 3D engine first.

Animation is brief and interruptible where safe. Support reduced-motion and no-animation modes; no sound by default. Render only a bounded window around the current spread, not a year's worth of live editors.

## 7. Document and calendar model

Store editable objects, not page screenshots or viewport coordinates.

Use validated typed records:
- Book: ID, title, date range, locale, calendar/time-zone preference, template version, cover preferences, ownership when applicable.
- Page: stable ID, book ID, kind, date/period, ordered-manifest reference.
- Entry: discriminated type, ID, page ID, text, controlled style, schedule OR document geometry, revision, deletion marker.
- Asset: later attachments, dimensions/type/checksum and upload state.
- Local preferences: last page, zoom, motion, handedness, toolbar placement.
- Sync records later: operation ID, expected revision, outbox state, conflict versions, server cursor.

First entry types: scheduled-line, scheduled-block, task, note. Keep future images/strokes behind later migrations, not empty placeholder implementations.

Separate semantic date/time, document/grid geometry, and transformed screen coordinates. Scheduled placement derives from authoritative civil time and template anchors; free-note placement derives from grid geometry. Test coordinate conversion independently of React. Zoom/resizing must never rewrite stored positions.

Store page dates as calendar dates, not UTC instants. Store overnight start/end dates or explicit day offsets. Alpha entries use floating planner wall-clock times; calendar-import time zones and reminders are separate later concerns. Choose a documented Today time-zone preference. Generate leap days and boundaries using calendar logic, not 24-hour millisecond arithmetic.

Books retain template versions. Later inserting front matter must not rename dated pages or migrate old note positions silently. Monthly/weekly views should reference the same scheduled entry IDs instead of creating editable duplicates.

## 8. Local saving, offline use, and recovery

Use Dexie over IndexedDB for the local-first store. React state is a draft/view, not the durable source of truth. Use local IDs, schema versions, validated imports, and tested migrations.

Typing appears immediately. Persist continuously through short serialized transactions. Show “Saved on this device” only after a successful transaction. Do not depend on page-close handlers. Keep a failed write visibly recoverable; never show a false save confirmation.

Serialize conflicting writes from two tabs/windows or detect revision conflicts; do not assume a browser has only one editor. Define change notifications and stale-edit behavior.

Distinguish “Saving locally,” “Saved on this device,” “Syncing,” “Synced,” “Offline,” and “Storage problem.” A local save is neither cloud synchronization nor a backup.

Handle storage quotas, denied persistence, and eviction risk. Provide export early. Request persistent browser storage when appropriate without promising permanent retention.

By the offline-alpha milestone, cache the application shell, templates, and licensed assets with an explicit service-worker strategy. Offline reopening requires an initial successful load. Only previously stored/downloaded content is available offline. Do not cache private API responses indiscriminately or assume background execution is reliable.

Application updates must not reload during editing. Offer an update-ready state after saving; test cache and database upgrades together.

## 9. Cloud synchronization and privacy — later beta

Preferred backend: Supabase Auth, PostgreSQL, and private object storage. Do not provision paid services or require a cloud account for the first implementation.

Dexie plus Supabase is not automatic synchronization. Implement an explicit protocol when the beta begins:
- Commit the local edit and outbox operation atomically.
- Send a unique operation ID plus expected entity revision.
- Authenticate, verify ownership, validate, deduplicate retries, and update the server transactionally.
- Acknowledge only after commit.
- Pull changes using a durable cursor, including deletion markers.
- Preserve pending edits during reconciliation; notifications only trigger pulls.
- Preserve both versions of concurrent same-entry changes, including edit-versus-delete.
- Offer keep local, keep remote, or keep both. Do not silently use last-write-wins for journals.

Keep local data account-isolated. Guest-to-account import is explicit. Signing out must not expose the previous user's book; warn/export before clearing unsynced data.

Test row-level ownership and private attachment policies with two accounts. Keep administrative credentials out of browser bundles. Never capture journal text, search queries, photos, or personal screenshots in analytics, error logs, public previews, or GitHub. Use synthetic data for development.

Validate archives and text; render no untrusted HTML. Do not claim end-to-end encryption unless it is separately designed, implemented, and tested. Back up database rows AND attachment bytes; replication is not a backup.

## 10. Search, export, and future paper features

Search locally stored text by book/date/type. Results open the correct page and highlight the existing item; search does not own a second editable copy.

Personal alpha needs versioned JSON export/import with validation, explicit duplicate-ID handling, and restoration into an empty store. Later archives include assets, manifest, checksums, and version metadata. Failed imports must not partially destroy existing books.

Print/PDF uses the same templates/data without perspective, shadows, handles, or animations. A PDF is a readable archive, not an editable backup. Process full-year exports incrementally.

Images later support upload/paste, positioning, resize, crop, safe formats, thumbnails, and recoverable offline upload states. Handwriting later uses vector strokes, undoable pen/eraser/highlighter tools, and device-tested input handling. Do not promise universal palm rejection or handwriting recognition.

## 11. Technical baseline and boundaries

Use one TypeScript repository with React and Next.js. Use browser-only boundaries for the editor and IndexedDB; keep pure document/calendar/layout functions independent of React, databases, and animation libraries.

Suggested modules:
- app: routes and app composition.
- domain: schemas, dates, geometry, validated commands.
- templates: versioned page design and print rendering.
- book: cover, manifest, navigation, animation adapter.
- editor: selection, text input, gestures, undo.
- local: persistence and migrations.
- search/export: derived indexes and portable archives.
- sync: later outbox/reconciliation and authenticated server boundary.

Create modules only as their milestone needs them. Do not build Python services, microservices, Redis, a vector database, a CRDT, or an elaborate plugin system.

Use a supported Node version, one package manager/lockfile, TypeScript strict checks, formatter/linter, a suitable unit runner, and Playwright browser/visual tests. Verify current compatibility and record choices. React controls the document; no flipbook package owns the source of truth.

A compatible Next.js host is a deployment option, not authorization to deploy. Keep development, synthetic previews, and production data isolated. Document real service costs and backup limits when services are chosen.

## 12. Testing and acceptance gates

Test user journeys, not merely component existence:
1. Type a timed entry, note, and task; navigate away and reload. Text, time, position, and completion survive.
2. Edit, then turn immediately. No lost latest draft, duplicate entry, or duplicated editor.
3. Select text and move a note without turning a page.
4. Zoom/resize without changing stored geometry.
5. Exercise leap days, month/year boundaries, overnight times, and spread parity.
6. Fail a local write and expose recovery without claiming Saved.
7. Open two tabs and prevent silent stale overwrites.
8. Export/import into an empty store and compare IDs, text, dates, geometry, and later asset checksums.
9. Reopen a previously cached app offline and preserve new edits.
10. In beta, retry a committed mutation without duplication and retain both conflicting versions across devices.
11. Verify account A cannot read account B's content or cached UI.
12. Navigate and edit without dragging or animation.
13. Verify old data/template fixtures survive upgrades.

Capture blank, normal, and dense-page screenshots under fixed browser/font conditions. Compare to the reference and inspect visually; do not automatically accept changed baselines. Run Chromium, Firefox, and WebKit tests at the appropriate milestones, plus manual tests on the actual tablet. Label device behavior unverified until tested.

Measure typing and navigation performance on named baseline devices. Aim for smooth turns and responsive typing, not unsupported FPS claims. A full-year synthetic book should use bounded rendering and require no network request to read locally available pages.

## 13. Milestones

Repository setup is separate and should already be done.

M1 — First working daily spread:
App/tooling foundation, measured template, two editable days, timed text, note, checklist, local saving, simple navigation, and reload tests. Return screenshots and a runnable local app. No cloud or elaborate curl.

M2 — Complete local page editor:
Duration/overlap handling, movement/resizing, basic styles, undo/recovery, multi-tab safety, export/import, and coordinate/date tests. Gate: a real planning day can be edited, reopened, and restored.

M3 — Book experience:
Yearly manifest, cover, spread/focus layouts, Today/date jump, tabs, and page-turn integration. Run a short motion/input experiment against the real editor; replace the renderer if it fails. Gate: visual approval plus no gesture/save regressions.

M4 — Offline personal alpha:
Service-worker opening, local search, migration/recovery states, accessibility, and dense-page performance. Gate: a week of actual planning, including offline use.

M5 — Secure cross-device beta:
Accounts, explicit sync, conflict UI, private ownership, and recovery. Gate: two-device offline/retry/privacy tests, not merely successful happy-path requests.

M6 — Release readiness:
Tablet/PWA polish, version history, print/export, operational backup restore, deployment documentation, and approved private deployment. Gate: a fresh device can restore the book correctly.

M7 — Additional paper experiences:
Year/month/week/memo templates and images, then separately scoped handwriting. Keep the same entry identity and document semantics.

Split an oversized milestone into smaller independently testable tasks. Do not promote later features into M1 merely because they appear in this PRD.

## 14. What to do now

First inspect the repository and reference image. Present a compact architecture, unresolved blockers, and M1 acceptance checklist. Ask only for genuinely missing credentials/reference information or consequential decisions; use documented reversible defaults for the working title, sample year, and theme.

Persist this PRD and a practical architecture/roadmap in docs, updating AGENTS.md links and PROJECT_STATE.md. Record measured template details in docs/PAGE_TEMPLATE_SPEC.md. Add interaction/data/test detail as implementation requires; do not spend the entire session generating empty specifications.

This prompt authorizes implementing M1 locally on a dedicated branch once actual blockers are resolved. In an executable environment, proceed with that bounded slice after stating the plan; do not stop at another generic proposal. In plan-only mode, return the executable M1 plan and request the mode/permission change.

At completion, provide the local run commands, files changed, screenshots where available, actual test results, visual approximations still awaiting approval, and next task. Request commit/push approval under Prompt 1. Do not proceed to M2, provision cloud services, or deploy publicly.

The first demonstration must let me enter part of my actual day, turn away, return, reload, and recover the writing. It must already feel like my Cousin rather than a generic calendar, while remaining honest about unimplemented features.
