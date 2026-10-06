# Decisions

## 2026-10-05 — Bootstrap destination and visibility

Status: approved by the user; public remote created and bootstrap push verified.

Use GitHub owner `sre0089`, repository name `TechnoNichi`, and public visibility.
Private visibility was recommended initially; the user explicitly chose public.
The repository name does not finalize product branding. Publication is limited
to reviewed setup files. Keep the unread local PRD outside the bootstrap commit.

## 2026-10-05 — Defer product and stack decisions

Status: accepted working agreement.

Prepare only repository documentation, ignore rules, and GitHub templates during
setup. Wait for the product PRD before choosing dependencies, scaffolding an
application, adding CI, or configuring services. This preserves the PRD as the
source of product scope and avoids speculative implementation.

## Pending decisions

- Visual approval and any measurement refinements: review the M1 fixtures.
- License: requires the user's choice; public visibility does not select one.
- Branch protection: revisit after the first real GitHub CI result.

## 2026-10-05 — Product baseline received

Status: PRD read and preserved in `docs/PRD.md`; M1 implemented locally.

Follow the independent digital book planner baseline with Next.js, React,
TypeScript, and Dexie/IndexedDB. Begin with M1's persisted daily spread rather
than cloud services or curl integration. Use Daily Book as the neutral working
title and 2026 for synthetic fixtures. The original PRD source remains local;
the derived product documents are included in the approved M1 publication.

## 2026-10-05 — Runtime and reference preparation

Status: runtime installed temporarily, references received, M1 locally verified.

Use npm with one lockfile and project-specific Node 24.21.0 rather than the
global Node 25.6.0. The [official Node release table](https://nodejs.org/en/about/previous-releases)
lists Node 24 as LTS and Node 25 as EOL. The global runtime was preserved.

The private real spread and mockup were attached in this conversation. The real
page is the primary geometry reference; the mockup's stretched timetable and
misaligned written times are not authoritative. Preserve 148:210 proportions,
approximate 3.7 mm pitch, and midnight offsets. Approximate bounds and uncertainty
are documented in the page-template spec; visual approval remains pending.

## 2026-10-05 — M1 tools and boundaries

Status: implemented and locally verified; commit/push/PR publication approved
by the user on 2026-10-05. Merge and M2 are not authorized.

Pinned Next.js 16.3.8, React 19.3.0, Dexie 4.4.6, TypeScript 6.0.3, Vitest 5.0.3,
Playwright 1.63.0, Prettier 3.9.9, and ESLint 10.12.0. Verified official docs and
registry engines/peer requirements; a clean `npm ci` succeeded.

Next's bundled React lint preset failed under supported ESLint 10. Use compatible
standalone TypeScript, React Hooks, and Next.js plugins rather than an unsupported
ESLint 9 or forced peer overrides. The final lint run passed.

Use locally bundled Kalam Regular under OFL 1.1; retain its complete font notice
in `public/licenses/kalam-OFL.txt`. Paper and book layers are independently drawn
in CSS. No photographic background or quotations are bundled.

Serialized IndexedDB writes check expected revisions. Navigation flushes before
unmounting; failed writes block the turn and retain a recoverable draft. A best-effort
localStorage buffer helps reload recovery but is not a backup. Full cross-tab
notifications, conflict choices, export/import, and movement/undo stay in M2.

Use a simple CSS transition for M1. Curl/cover work stays in M3; offline shell
caching stays in M4. CI has read-only permissions and verified commit-pinned
checkout/setup-node actions; no deployment credentials or production services.
The first published CI verification passed on Ubuntu in
[run 37390840274](https://github.com/sre0089/TechnoNichi/actions/runs/37390840274).

Generate route/environment declarations with `next typegen` before strict type
checks and ignore the generated `next-env.d.ts`, following the
[official Next.js CLI documentation](https://nextjs.org/docs/app/api-reference/cli/next).
This keeps type checks usable in a fresh clone before a dev server or build exists.

## 2026-10-05 — M1 grid and row editing correction

Status: user approved implementation and subsequently approved committing/pushing
the reviewed revisions to PR #3 on 2026-10-05. PR merge remains unapproved.

The user's latest upright spread clarifies that time numbers sit on every third
horizontal line, with dots at intervening hourly intersections. Remove the extra
dashed divider and align the time column with the grid. Use one native field across
each hourly writing row from 06:00 to 03:00 (+1); remove the timed-line creation
button and repeated inline timestamps. Create free notes only below the last time row.

Keep all persisted IDs, exact minutes, and note geometry. Multiple old entries in
one hour can be cycled and opened through the day outline. Empty rows use shared,
collision-safe IDs so two tabs still detect stale writes and moving an entry leaves
its old row available without reusing the moved entry's ID. This corrects the
unmerged M1 template v1; no storage migration or deletion is required.

Use a system monospace stack close to the user's sample for entered page writing
only: hourly text, free-note text, and checklist text. Preserve printed labels and
interface typography, including the enlarged editor. This adds no dependency or
remote font request. The sample's exact font identity is not claimed.

## 2026-10-05 — Hourly writing size and baseline refinement

Status: local implementation requested; commit/push pending approval.

The user found hourly writing too large and high above its grid line. Reduce only
hourly text from 2.1 to 1.7 container-width units (about 19% less glyph width).
Use a 0.45-unit top inset and 2.05-unit line height, together filling the unchanged
2.5-unit row. This lowers the baseline with a small gap for descenders and keeps
native text/caret rendering together. Notes, checklist, printed labels, and the
interface keep their current typography; no content or stored geometry changes.

## 2026-10-05 — Timed task completion and consecutive-hour lines

Status: user requested local implementation. Publication remains pending approval,
including the preceding uncommitted hourly typography refinement.

Finishing timed writing with Enter reveals an unchecked checkbox just after the
text. Done/Done editing offer the same finish action for the enlarged editor.
Checking it applies a translucent strike-through; unchecking restores the writing.
Completion is stored with the entry and uses the existing revision-checked save path.
Blanking a task hides its checkbox and resets its flags. Shift+Enter and IME Enter
continue editing rather than submitting.

Add optional submitted/completed flags, with absent flags treated as false on old
records. New scheduled entries start with both false. Validate supplied values and
reject completed entries that are not submitted. Do not migrate or rewrite existing
IDs, text, times, revisions, or note geometry. Older timed writing receives a
checkbox when explicitly finished again.

Draw original bold lines at x 21.1: the second grid line right of timestamp x 13.7.
Move hourly writing to x 24.8, leaving one grid column between line and text. Group
occupied adjacent hours from the first marker to the last in the initial local
implementation; the following review corrects first-row coverage. An isolated task gets a
one-row marker above its time. Include completed tasks, ignore blank/deleted entries,
deduplicate multiple entries in one hour, and preserve midnight adjacency. This is
visual grouping only; no duration, dragging, or other M2 work was added.

## 2026-10-05 — Full-row coverage and integrated grid stroke

Status: user requested local implementation; publication remains pending approval.

The initial grouped line omitted the first entry's writing row. Start every run
one grid pitch above its first marker, ending at the final occupied marker. This
encompasses all writing rows and preserves the existing gap/singleton behavior.
Align the bold line with the center of the faint grid stroke rather than its tile
edge, so it completely covers that stroke without a parallel line. Use a minimum
two-pixel bold width to retain this replacement appearance at phone sizes.
Regression checks measure first/last writing bounds and exact grid-stroke centers
at desktop and phone widths in all three browser engines. Data and times are unchanged.

## 2026-10-05 — Shared interface system throughout the current app

Status: user approved implementation and explicitly selected the current-app UI
scope. Changes remain local; publication needs separate approval.

Adopt Tailwind 4 with a small local component layer, Radix Dialog/Popover/Tooltip
and Lucide icons. Share theme values, button variants, native fields and save-state
presentation across the toolbar, settings, contextual writing panel, enlarged
editor, day outline and recovery/opening controls. Keep one headless primitive
family rather than adding both Radix and Base UI. No shadcn generator is required
for this small set of locally owned components.

Import Tailwind's theme and utilities without Preflight so the reviewed paper
and native writing metrics survive. Keep original custom paper/grid CSS and the
page-only monospace typography. Dialogs contain focus and restore it on close;
reading popovers retain full text and avoid viewport edges. Settings exposes only
the existing saved preferences. Continue using the existing durable write queue;
save status still follows real entry transaction outcomes.

Dragging, rich text, duration blocks, services and cloud integrations remain later
milestones. [UI_SYSTEM.md](UI_SYSTEM.md) records exact versions, contracts,
official references, and the existing unpatched development-only braces advisory.

## 2026-10-05 — Timed writing inset within the line's grid square

Status: user requested this refinement after approving the UI's appearance;
publication remains pending approval.

Move timed writing from x 24.8 to x 22.025, one quarter of the 3.7-unit grid square
right of the bold line at x 21.1. This supersedes the earlier full-column gap:
writing now starts inside the same square, with a small clearance from the stroke.
The row still extends to the same right edge, and completion checkboxes follow its
text. Fonts, baselines, line geometry, notes, checklist text and stored entries
remain unchanged. Update existing spacing assertions rather than adding a separate
test suite for this visual refinement.

## 2026-10-05 — Center timed checkboxes within the grid row

Status: local refinement requested; publication remains pending approval.

Center the timed checkbox between the upper grid stroke and the next horizontal
line. The original input-area centering included the upper stroke, putting the
box half a stroke above the clear row's center. Exclude that stroke from the
completion overlay and keep flex centering. Center the checked mark within its
box rather than inheriting the top checklist's upward mark offset. Preserve its
size/font, horizontal position, task state, writing baseline and printed checklist.

## 2026-10-05 — Publish the reviewed M1 refinements

The user explicitly authorized commit/push of the reviewed local UI and writing
refinements to the existing PR #3. Earlier pending-publication statuses above
record their initial review checkpoints. Publish the final integrated implementation
in one coherent commit, including its tests and documentation, rather than committing
partial historical staging snapshots. Merge and later milestones remain separate.
Project state and the PR's Checks tab record publication and CI results.
