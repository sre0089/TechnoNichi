# Decisions

## 2026-11-03 — Allow provider srcdoc overlays during saved app updates

The approved live note-list update passed fresh-profile checks, but a held
old-shell book could not apply Save and update. Netlify's injected badge adds a
same-origin-inherited client with URL `about:srcdoc`, frame type `nested`. The
existing conservative all-window count treated that overlay as a second editor.
Confirmed the actual client list in a disposable Chromium store.

Ignore only clients matching both `nested` and `about:srcdoc` during the waiting
worker's update check. Keep every real embedded planner document, top-level or
auxiliary window and unknown frame type in the refusal guard. Keep save-before-
activation and retained recovery drafts unchanged. The waiting worker handles
the message, so this correction can unblock an older running app too. Test both
the harmless overlay and an actual embedded planner URL before accepting release.
The [Client frame-type reference](https://developer.mozilla.org/en-US/docs/Web/API/Client/frameType)
and installed worker source were reviewed for this narrow distinction.

The user's approval covers completing this production release. Use a separate
synthetic alias to exercise old → fixed-shell updates; do not roll production
back to a pre-list writer now that v3 note metadata can exist. Publish the tested
fixed artifact and retain the production lock. Book data remains on-device.

Release closeout: PR #49 merged green as `d99c9cc`, matching source `61fe3ac`.
Published the exact tested preview `6aeab28865575a3e5356e978` via the provider's
atomic publish API, preserving the production lock. Its nine hosted cases pass
on production; a separate old-shell alias verifies all four database tables
survive update in three engines. New lists then save and reopen offline. Keep
this list-compatible artifact as the working baseline rather than reverting to
a pre-list writer. No account, synchronization or billing setting changed.

## 2026-11-03 — Structured lines in free notes

The user explicitly approved three slash-menu choices in notes: to-do checkbox,
bullet and numbered list, with leading markers and Tab/Shift+Tab indentation.
This extends the alpha's editing scope beyond the original plain free-note text;
keep timed tasks and the surrounding book interface unchanged.

Extend the installed Tiptap paragraph rather than adding another editor or list
dependency. Each logical line retains its text and inline marks, plus optional
validated kind/depth/completion metadata. Native checkbox widget decorations sit
before editable text; derived sibling numbering is not stored as authoritative content.
Use the existing editor history and save queue for structural edits and checkbox
changes. Preserve newer list metadata when undoing geometry changes.

Enter continues a list, empty-item Enter exits it, Shift+Enter starts a plain
line, and Backspace at a line start removes one indent or marker. Bound depth to
six levels. Slash triggers only at the start of a line; Escape keeps literal
text. Ordinary Tab remains focus navigation outside lists. Preserve IME handling.

Export archive v3 only when note metadata exists; keep v1/v2 import and ordinary
v2 export behavior. No database index migration is needed. Older app readers
reject v3 archives instead of silently discarding metadata. Older app writers
must not be used against books with structured notes: subsequent release rollback
must retain list support. Feature implementation does not authorize publication.

Reviewed official Tiptap node-view and
[node/mark commands](https://tiptap.dev/docs/editor/api/commands/nodes-and-marks)
documentation, plus installed ProseMirror widget/view source. A nested custom
node view lost first-line text during native multiline replacement; keep normal
paragraph DOM and use decorations for real checkboxes instead. Regression tests
cover both on-paper and focused phone editing. Render writing as text and schema
nodes, never pasted HTML.

## 2026-11-03 — Approved stable production origin and retained build

The user explicitly approved merging #41 then #43 after green checks and making
<https://technonichi.netlify.app> public on Netlify Free, without paid add-ons,
a domain purchase or invitations. Both reviewed trees merged unchanged. Publish
the already tested retained build A rather than introducing a new build during
release: all 26 artifact fingerprints match; application runtime/configuration/
dependencies are equivalent to merged main `b40ffd1`. Payload source remains
`89db2a9`, with adapter 5.16.5 and Node 24. Distinguish this verified provenance
from a provider Git integration, which is not configured.

Production deployment `6aea7ab7c85f6df45f0ab51e` is ready and locked against
automatic publication. All six production hosted smoke cases pass across three
engines, including offline edits and independent backup recovery. Keep subsequent
publication manual and separately reviewed. Preserve standalone display and the
purple theme. The staging A → B → A exercise proves same-schema retained-artifact
recovery only; it does not authorize data/schema downgrades.

Hosted use needs no local terminal. The stable production origin owns a separate
browser-local store: transfer existing writing by retained backup and explicit
restore into an empty store before creating a new book. Keep the original book
and backup. Installation can create another store, so retain the existing App
setup guidance. Accounts, synchronization, invitations and broader device/trial
acceptance remain separate work.

## 2026-11-03 — Hosted update and retained-artifact rollback

The user authorized synthetic staging update/refusal/rollback checks. Preserve
the current working build before the update and use a second isolated tracked
checkout for the new build. A preflight redeploy of retained processed output
passes on a separate draft alias. With `--no-build`, explicitly select
`.netlify/static`; the normal `.next` publish setting is not the adapter's
processed output. Preserve the generated internal function directory and cached
function manifest too. Verify the resulting worker, root build ID and resources
before treating it as a usable rollback baseline.

Use an opt-in browser harness with operator file checkpoints rather than hiding
provider mutations inside normal tests. Three fresh browser stores stay open
across one hosted update and one return to the retained compatible build. Assert
refusal, retained drafts, actual loaded shell identity, database/format/geometry
preservation and offline edits. All data is synthetic and artifacts stay ignored.
This re-publishes compatible artifacts to a draft alias; it does not exercise
Netlify's production atomic-restore API or authorize schema downgrades. Production
publication, native OS multi-window acceptance and PR merges remain separate.

The live A → B → A exercise passed in Chromium, Firefox and WebKit with no page
errors. The loaded client build IDs changed as expected; newer data across all
four stores, including post-update offline writing, survived rollback exactly.
The restored deployment also passes the six ordinary hosted smoke cases. A used
adapter 5.16.5; B automatically selected 5.16.6. Verified the detected 5.16.6
package's official source/provenance and record the platform difference outside
the app lockfile. Retain the full tested output, not a fresh build assumed to be
equivalent. No production release or schema downgrade is established by this test.

## 2026-11-03 — Preserve the standalone app-window experience

The user likes the current separate Chrome app window, purple title bar and
native feeling, and explicitly wants to keep that direction. Preserve the
existing standalone manifest display, purple theme color and restrained interface
through hosting and later UI changes. Native window chrome is browser/OS-owned;
check its actual behavior on target devices. The supplied reference screenshot
remains private; only the design preference is recorded here. No UI change is
requested by this confirmation.

## 2026-11-03 — Approved Netlify Free staging

The user approved the proposed green merges (#37/#39) and Netlify Free synthetic
staging. Keep this separate from paid services, custom-domain purchase and real
tester use. Official CLI 27.16.2 was reviewed and invoked temporarily with install
scripts disabled; the user completed its browser authorization. No Netlify plugin
was available. Credentials remain in Netlify's external user configuration.

Track Node 24 and the full locked-install/worker build in `netlify.toml`, with
explicit worker CDN headers matching Next's existing headers; ignore `.netlify/`.
The official dry build detects runtime 5.16.5. Build and upload an isolated
tracked-source checkout, excluding the private originals and runtime artifacts.
First deploy is a synthetic draft; stable publication and invites wait for hosted
acceptance. Existing book data/schema and UI stay unchanged. Record exact build,
adapter and deployed source IDs, and never infer hosted behavior from a local build.

The project's preview visibility was private by default and required the user's
dashboard change; official Netlify docs expose no CLI/public API for that setting.
The user made previews public while keeping production private. A separate local
adapter build followed by `deploy --no-build` uploaded the wrong static directory;
use one `netlify deploy --context deploy-preview --alias staging` command so
adapter-modified output remains in scope. Hosted tests caught the missing worker
before any real use. Keep failed draft IDs out of rollback baselines.

Do not connect Git-wide credentials for this slice: an isolated checkout and
manual deployment preserve source review and avoid automatic publication. The
hosted smoke harness requires an explicit HTTPS origin, uses disposable browser
profiles and synthetic backup downloads, and keeps screenshots/traces ignored.
Record hosted pass/failure separately from local/CI and native OS installation.

## 2026-11-03 — Hosting-readiness proposal, not deployment

The user authorized preparing the hosted-pilot proposal and local checks after
reporting successful Chrome installation and reopening with edits retained while
the terminal server was stopped. Record that narrow manual result; OS/browser
versions, installed updates, fresh-profile restore and physical Safari/phone
acceptance were not reported. PR #37 final head `5d96929` has all four CI jobs
green and remains open; this planning approval is not a merge authorization.

Issue #38 on `docs/hosting-readiness` covers documentation and local checks only.
Recommend Netlify Free as the $0 pilot option with commercial-project flexibility,
subject to hosted Next.js/worker validation. Its OpenNext adapter introduces a
platform compatibility boundary outside the npm lockfile. Vercel is the closest
framework alternative: Hobby needs confirmed personal/non-commercial eligibility;
Pro needs an approved subscription/usage budget. Current official prices,
eligibility, Node support, adapter behavior and release controls are linked in
PRODUCT_READINESS_PLAN.md. No account, CLI, adapter, service, domain, production
configuration or paid plan was installed/created/selected by this work.

Use a stable root HTTPS origin, explicit Node 24/locked dependencies/full worker
build and synthetic staging. Provider publication and cached client updates are
separate: vet builds before publishing, then retain explicit save-before-update.
Hosted rollback must preserve local books and account for already cached shells;
it never authorizes a schema downgrade or data clearing. Approval of an actual
provider/plan/origin and provisioning remains the next concrete decision.

## 2026-11-03 — Approved integration and local installability

The user approved merging #31, #34 and #35 after green checks, then authorized
continued work and smaller periodic commits/pushes. Merged each reviewed head
using merge commits, retargeting the stacked PRs to main in sequence. Verified
identical trees; issues #30/#32/#33 closed. Main is `700fc64`.

Start the bounded local-installability part of Stage 2 on `feat/installable-book`.
This accepts earlier minimal PWA work proposed in PRODUCT_READINESS_PLAN.md;
hosting/deployment and later beta features remain separate. Preserve local-book
editing and the existing explicit saved-update strategy. Installation metadata
must not imply account synchronization or guaranteed browser-storage retention.
Official WebKit documentation describes separate local storage for Home Screen/
Dock apps, so guide users to export before installing and import into an empty
installed app where needed. Native OS installation remains a manual gate.

Keep the manifest identity/start/scope at `/`, request standalone display and use
Daily Book as the existing neutral working title. Public metadata never includes
personal book IDs or text. Supply original SVG-derived PNG icons at 192/512,
a separately padded maskable 512 icon and an opaque 180 Apple icon, plus a small
favicon. Source SVG is tracked; raster exports were reviewed. Use existing Sharp
0.35.5 only for export, adding no runtime/build dependency. Root theme metadata
preserves browser zoom defaults. Installed Next manifest/PWA guides and official
[MDN installation guidance](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/How_to/Trigger_install_prompt),
[icon guidance](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/How_to/Define_app_icons) and
[WebKit storage behavior](https://webkit.org/blog/14787/webkit-features-in-safari-17-2/)
were reviewed before implementation.

Extend the production worker's public allowlist with only the manifest and six
original icon files. Include their emitted bytes in the shell version so metadata
changes produce an explicit saved update; hash the compiled manifest response,
not its TypeScript source. Root/static caching and current/previous shell
retention stay intact. Book data, APIs and arbitrary public paths remain outside
the shell cache. Update refusal covers other tabs and installed app windows.

Offer a production-only App setup dialog on first use, from the book and from its
closed cover. Retain a browser-supplied beforeinstallprompt event only until it is
consumed; flush pending writing before invoking its one-use prompt. Failed saving
retains the offer; a chooser failure consumes it and falls back to instructions.
Support both returned choice and legacy userChoice promises. Acceptance means
installation requested; only appinstalled reports that event's completion. Do
not persist an installed flag. Standard standalone display mode and Apple's
navigator.standalone identify only the current window. Neither means cloud sync
or offline readiness. First-use app-mode guidance prioritizes restoring an
existing browser-book backup before creating another book.

Production browser tests exercise the prompt protocol with synthetic events and
both app-mode signals. Actual manifest eligibility is checked in Chromium; icon
decoding/opacity, public-only caching, offline edits, save failure/retry and guide
keyboard/phone layout are checked across all three engines. These checks do not
install an OS app or prove physical Safari storage behavior; keep that manual gate
in PERSONAL_ALPHA.md before a hosted invited pilot.

## 2026-11-02 — Dependency security maintenance

Status: implemented and locally verified on 2026-11-03 in
[PR #35](https://github.com/sre0089/TechnoNichi/pull/35). The user requested
continued work after visually approving the new UI;
[issue #33](https://github.com/sre0089/TechnoNichi/issues/33) is the active bounded
maintenance slice, before installable/hosted pilot work. Existing setup and
typography PRs remain unmerged; continue on `chore/dependency-security` based on
typography head `bd6dd4f`. Commits/pushes remain authorized; merging and service
setup remain separate.

Update Next.js and its matching lint plugin from 16.3.8 to 16.4.4. Read installed
upgrade/font guides before/after the update and the official
[Next release](https://github.com/vercel/next.js/releases/tag/v16.4.4) and
[security advisory](https://github.com/vercel/next.js/security/advisories/GHSA-673q-mjm6-r5xr).
Keep React, TypeScript, ESLint, TypeScript-ESLint, Vitest and Playwright on their
existing direct versions. Update Vite to locked 8.3.5 and Zod to locked 4.6.7
within existing parent ranges; their upstream fixes are documented in the
[Vite release](https://github.com/vitejs/vite/releases/tag/v8.3.5) and
[Zod release](https://github.com/colinhacks/zod/releases/tag/v4.6.7).

A root override pins Minimatch 11.0.1 because all installed lint consumers still
request affected 10.x. This is a deliberate major-version override, not an audit
force-fix or linter downgrade. Review of the upstream 10.2.6-to-11.0.1 diff and
[changelog](https://github.com/isaacs/minimatch/blob/v11.0.1/changelog.md) established
that 11 replaces the matching algorithm and removes makeRe/AST/regexp/internal
APIs. Installed consumers use retained Minimatch.match, pattern and the minimatch
function; both CommonJS and ESM exports and Node 24 remain supported. Verify
identical linted-file coverage, actual TS rule enforcement and ignored paths as
well as the normal lint/type/unit/build/browser checks. Remove this override
once every parent natively accepts a patched matcher and a new lockfile still
passes audit/coverage checks. No application runtime uses Minimatch.

The refreshed initial audit had 15 findings (12 moderate, two high, one critical).
After these changes, clean `npm ci` succeeds and `npm audit` reports zero known
findings. This is a point-in-time registry result. Preserve the exact lockfile;
no application data, schema, template or UI changes are intended. Verify actual
old/new production shell activation with synthetic writing in addition to the
normal offline suite before considering this slice complete. On 2026-11-03,
clean install, zero audit findings, unchanged 86-file lint coverage, enforcement/
ignore probes, 145 units/build and the actual two-shell update probe all passed.
The full browser suite passed 245 cases/four existing intentional skips and
all 12 normal production offline cases passed across the three engines. Final-head
CI and separate merge permission remain required.

## 2026-11-02 — Editorial interface typography

Status: implemented and locally verified in
[PR #34](https://github.com/sre0089/TechnoNichi/pull/34), tracked by
[issue #32](https://github.com/sre0089/TechnoNichi/issues/32). Visual review pending.

Use the two user-provided images as stylistic inspiration for a serif-led
interface. They do not establish an exact font identification. Use Lora for
headings, branding, cover titles and introductory prose; IBM Plex Sans for
controls, labels and help text; a system monospace stack for small captions.
Keep the warm palette. Simplify first-use prose while retaining local storage,
backup and out-of-year opening information. Form values use regular weight.

Pin `@fontsource-variable/lora` and `@fontsource-variable/ibm-plex-sans` at 5.3.0
with the npm lockfile. Both have OFL-1.1 licenses and no package lifecycle scripts
or dependencies. Load only normal Latin variable WOFF2 faces (83,500 bytes total)
through `next/font/local`; no browser or build-time font CDN requests. Include
unmodified font licenses under `public/licenses/`. The existing production worker
includes emitted font resources without a worker change. Installed Next font/CSS
guides and official [Fontsource variable-font guidance](https://fontsource.org/docs/getting-started/variable),
[Lora](https://fontsource.org/fonts/lora/use) and
[IBM Plex Sans](https://fontsource.org/fonts/ibm-plex-sans/use) informed this choice.

Printed paper retains its original Arial/Georgia metrics; timed writing, notes,
checklist text and enlarged writing retain their existing font rules and grid
geometry. No saved data, template version or archive format changes.

The typography branch is based on unmerged setup head `57c88d3`; publish a focused
PR targeting `feat/personal-book-setup` so its diff contains only typography.
PR #31's successful CI and the user's fresh-profile setup/settings confirmation
are recorded separately from visual acceptance of these new fonts.

Dependency review found the same 15 audit findings on the old/new lockfiles
(12 moderate, two high, one critical); neither font is flagged. Existing versions
are unchanged. [Issue #33](https://github.com/sre0089/TechnoNichi/issues/33) tracks
framework/tool maintenance separately, before hosted use. Do not force-fix or
blindly downgrade lint tooling during a typography change.

## 2026-11-01 — Personal book setup and opening

Status: implemented and locally verified on 2026-11-02 in
[PR #31](https://github.com/sre0089/TechnoNichi/pull/31), tracked by
[issue #30](https://github.com/sre0089/TechnoNichi/issues/30). Awaiting review/merge.

Fresh means all four IndexedDB tables are empty. Startup is read-only: it returns
validated existing metadata or asks for setup; incomplete metadata fails without
repair or deletion. The schema remains version 1; the optional opening preference
is additive and absent means resume. No IDs, dates, entries or geometry migrate.
New books use random IDs, full chosen-year manifests and validated name/timezone.
Creation and import serialize the empty-store check with every write in one
transaction. Remove the old shape-based disposable-bootstrap exception: even an
empty imported `personal-2026` is a real book and must not be replaced.

New books default to Today using the stored timezone; opening to Last page is
also available in setup and View settings. Today outside the chosen year falls
back to the saved position (January 1 for a new book). Recovery drafts take
precedence over either opening preference and retain their page side. First-use
emergency buffers block creating an unrelated book; original-book import remains
available; a backup missing known retained page IDs is refused before mutation.
No recovery buffers are cleared by setup. Invalid buffers remain
untouched for manual recovery. One active book only; year switching is later work.

Existing regression journeys now explicitly seed synthetic pre-setup data instead
of relying on production demo creation. Dedicated first-use journeys use the real
setup screen. New archives retain version 2 and optionally include opening choice;
v1/v2 archives without it continue to resume. Old app versions' strict validators
may reject new archives containing the new preference; use the current app.

## 2026-11-01 — Proposed product readiness sequence

Status: Stage 1 implementation and periodic commits/pushes authorized on
2026-11-01. Later stages, services, deployments and merges remain unapproved.

Record the next delivery plan in `PRODUCT_READINESS_PLAN.md`. Propose a personal
trial/book setup and an installable invited local-book pilot before the private
cross-device beta. Moving minimal PWA/hosting work earlier is an explicit proposal
relative to the PRD, not an approved replacement of its milestone order. The
earlier five-step implementation approval is exhausted.

Preserve local-first editing. Ownership/account isolation, explicit guest-book
migration, durable sync and a tested history/backup recovery process precede
real cloud-book invitations. Vercel and Supabase are candidates subject to
runtime, intended-use, budget, region and plan review; neither is provisioned.
Quick capture and reminders remain proposals; carry-forward is explicit and
recurrence/further page views retain their later scope. The immediate bounded
implementation candidate is personal book setup with old/imported-book safety.

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

The integrated implementation was published as `55c7344` on
`feat/m1-daily-spread`, with PR #3 left open for review. Original private inputs and
screenshots remain excluded. Publication-record documentation follows separately;
no source changes or later milestone work are included in that follow-up.

## 2026-10-06 — Requested writing keyboard controls

The user requested arrow-key navigation between time tasks and Cmd/Ctrl+U/I/B
formatting. This authorizes a bounded editor addition, leaving the remainder of
M2 deferred. Implement on local `feat/writing-keyboard-controls` based on the
published M1 head `f5eb19b`; new commit/push requires approval under AGENTS.
The user granted publication approval on 2026-10-06. The follow-up PR targets the
still-open M1 branch for a focused diff; merge M1 first and retarget this follow-up
to main before its separately approved merge. Issue #4 tracks this addition.

Unmodified Up/Down moves through the same page's hourly fields, including empty
hours, without wrapping or turning the book. Left/Right and modified arrows keep
their native meaning. Text selection, composition and read-only fields block row
switching. Multiline or overflowing writing uses native caret movement except at
the start/end endpoints, so the shortcut cannot skip its hidden text.

The first pass used whole-entry formatting while an optional scope question awaited
an answer. The user then explicitly requested per-word granularity. This supersedes
that default: shortcuts and buttons format selected words, or set pending marks
for subsequent typing at a collapsed caret.

Use MIT-licensed Tiptap 3.31.4/ProseMirror in bounded entry fields, enabling only
plain paragraphs, hard breaks, bold, italic, underline and field-local undo/redo.
Native textareas cannot render mixed styles in one line. This explicitly requested
change replaces those page/enlarged writing fields; it does not make the book a
single contenteditable or start the remainder of M2. Pin all packages and preserve
Next.js client rendering with `immediatelyRender: false` per official guidance.

Keep plaintext `text` and optional validated `formatRuns` (UTF-16 offsets, sorted,
nonoverlapping, controlled boolean marks) in the document model rather than HTML.
Old whole-entry flags become equivalent ranges during rendering, without rewriting
records. New text/format edits persist both together through the existing revision
checks and recovery buffer. Plain clipboard text is inserted as text nodes; no
links, lists, images, HTML markup, input rules or automatic markdown are enabled.
Reading, outline and checkbox width measurement render the same safe segments.
Formatting participates in field-local undo while that editor remains mounted;
book-wide history, deletion recovery and full editor undo remain later work.

Official references: [Next.js integration](https://tiptap.dev/docs/editor/getting-started/install/nextjs),
[editor API](https://tiptap.dev/docs/editor/api/editor),
[undo/redo](https://tiptap.dev/docs/editor/extensions/functionality/undo-redo).
Versions, React peer compatibility and MIT package licenses were verified via npm
metadata before installation. The production-only audit reports zero vulnerabilities
on 2026-10-06; the existing development braces chain remains recorded in UI_SYSTEM.

The first published CI run exposed a Firefox rapid-replacement formatting failure.
Avoid repeated editability/view updates during typing, and distinguish the editor's
own React write echoes from external changes before replacing live content.
Strengthen repeated replacement coverage and wait for observed editor selection
instead of a fixed test delay; repeated WebKit runs exposed selection settling
after undo/redo. PR #5 remains stacked on PR #3, with neither merged.

## 2026-10-06 — Approved integration into main

The user approved both outstanding merges. Merge PR #3 first, preserving its
history, then retarget PR #5 to main and merge its unchanged checked head.
Both tracking issues close after integration. Verify that the final merged tree
matches the reviewed writing head and fast-forward local main without rewriting
shared history or removing private untracked files. Record completed merges in
PROJECT_STATE on a focused documentation branch. This approval completes the
current implementation; it does not start later milestones or authorize deployment.

Post-merge CI and repeated Chromium runs exposed an intermittent synthetic empty
contenteditable fill that left the writing unchanged. Test clearing through the
real Cmd/Ctrl+A, Backspace interaction, asserting empty writing before the existing
line-splitting/reload checks. All 15 repeated keyboard journeys passed across the
three engines. This changes the test fixture, not application behavior.

## 2026-10-06 — Authorized local backup slice

The user's “ok go ahead” accepts the proposed versioned JSON export/import feature,
including word formatting. Implement that bounded first M2 slice; other M2 features,
cloud provisioning and deployment remain deferred. Publication/merge approval is
separate under AGENTS.

Use a strict `daily-book-backup` version-1 envelope containing one full yearly
daily-template-v1 book, ordered civil-date pages, all entry records, preferences
and an ISO UTC export timestamp. Preserve IDs, revisions, exact overnight times,
note geometry, completion, deletion markers, UTF-16 formatting ranges and missing
legacy optional flags. Reject duplicate IDs/active task slots, unknown fields,
invalid references/records, unsupported templates/versions and incomplete manifests.
Version 1 supports years 1900–2200 with a 20 MiB file limit, 50,000 entries, one
million UTF-16 text units and 20,000 formatting runs per entry. No dependencies or
IndexedDB schema changes are needed.

Export flushes the queue before a consistent read transaction. A failed flush keeps
the recovery draft and prevents download. Restore reviews a selected file first,
then uses one write transaction for destination checks and all four tables. Permit
an empty store or the app's generated empty 2026 shell, since startup initializes
that shell automatically. Refuse any saved entry (even empty/deleted) or unrelated
book; avoid a destructive replacement or ambiguous merge flow. Do not catch a
bulk/request failure inside the transaction. Successful restoration activates the
imported book and its preferences; startup must honor that book on reload.

The file is plain JSON stored locally, not encrypted, synced or uploaded. Reuse the
shared Radix dialog, native file input, Tailwind tokens and Lucide icons. Lock local
editing/navigation during database operations; keep the dialog open until its
operation settles. Other tabs are not refreshed automatically; richer cross-tab
notifications and conflict handling remain deferred.

Official references: [Dexie transaction commit/abort behavior](<https://dexie.org/docs/Dexie/Dexie.transaction()>),
[bulkAdd failure behavior](<https://dexie.org/docs/Table/Table.bulkAdd()>), and
[Blob/File text reading](https://developer.mozilla.org/en-US/docs/Web/API/Blob/text).
File parsing stays outside the transaction to avoid transaction inactivity while
awaiting non-database work.

The user approved committing, pushing and opening the backup PR on 2026-10-06.
Track this slice with issue #8 and verify CI on the published head. This approval
does not include merging the PR or starting another feature slice.

The first published CI runs exposed a 30-second timeout in the combined WebKit
backup round trip on Linux. Browser logs show the second profile opening 21–25
seconds after the source profile, leaving little time to restore and reload.
Give only this long journey a 60-second test budget, retain normal five-second
assertions and other tests' 30-second budget, and name its three phases. Manage the
restore profile as a test fixture so teardown uses its separate budget and cannot
replace the original failure location. The application source is unchanged.
Nine repeated round trips passed locally across the three engines.
Official guidance: [Playwright test/teardown timeouts](https://playwright.dev/docs/test-timeouts)
and [test fixtures](https://playwright.dev/docs/test-fixtures).

The next CI run passed every backup journey but exposed an existing WebKit
boundary-arrow test failure after an immediate programmatic focus jump. The
installed Tiptap focus command schedules work on an animation frame. Switch
those three fixture jumps to real pointer clicks and assert initial focus before
the arrow key, retaining all endpoint, overnight, selection, IME and reload
assertions. This is a fixture refinement; application source is unchanged.
All 15 repeated keyboard journeys passed across Chromium/Firefox/WebKit; the
required format/lint/types/43-unit/build checks passed afterward.

## 2026-10-07 — Bounded deletion and recovery slice

The user authorized recoverable deletion for timed writing, free notes and
checklist entries. Track it with issue #12 on `feat/deletion-recovery`, based on
main `8029986`. The user approved commit/push/PR publication on 2026-10-07;
merge still requires separate task-specific approval.

Keep schema-v1 tombstones and original identities; never physically remove an
entry in this slice. Reserve deleted IDs when generating new hourly/checklist
records. Flush drafts before mutation and check revisions transactionally. Restore
only into an unoccupied hourly row/checklist slot or nonintersecting note rectangle,
including refusal for empty saved entries. This conservative policy protects newer
writing and keeps both records available; alternative placement is later work.

Use the existing shared Radix dialogs and toolbar/context controls. Recovery spans
one complete book, sorts newest-first and renders twenty entries at a time. Keep
full text/ranges/completion/geometry in records and backups. No new dependencies,
cloud behavior, permanent deletion, book-wide undo or cross-tab notifications.

A Firefox rewrite test exposed an empty focus-save echo that could overwrite newer
DOM input before the editor's observer had processed it. Skip content replacement
while the editor is focused and recognize the focus-save record as an emitted
local echo. The existing text and recovery assertions stay intact; five repeated
Firefox journeys and the full three-engine browser suite passed afterward.

## 2026-10-19 — Free-note movement and resizing

The user authorized implementation and periodic commits/pushes on
`feat/note-movement-resizing`, tracked by issue #14. Merge remains separate.
Keep the existing note records and page coordinates; use no new dependencies.
Dedicated selected-note handles own pointer gestures, preserving native text
selection. Preview geometry and persist one change on release; cancellation
leaves the original record intact. Provide handle arrow keys and contextual
buttons as non-drag alternatives.

Snap to the existing 3.7-unit grid and bound geometry by the printed writing grid.
New note creation stays in the lower memo area; movement may use the whole printed
grid, including the positions of legacy upper-grid notes. Notes remain notes and
never acquire a time. Minimum resized size is four columns by two rows, except
imported edge boxes whose available space is smaller. Movement preserves existing
sizes. Resizing preserves full text/ranges; existing overflow reading/editing remains.
Block navigation and other placement-changing controls during a pointer gesture.
Keep the existing revision-checked save queue and recoverable failure behavior.

Regression verification found two local timing issues. The long new Firefox
journey reached the existing 30-second test limit while a production build ran
concurrently; it passed in ten seconds without the build, with assertions and
timeouts unchanged. An existing WebKit deletion test could target its button while
the failed-save banner shifted the page. Establish the expected Storage problem
state before clicking, retaining every subsequent recovery assertion. Limit the
full local browser run to three workers; each multi-tab test still exercises its
own concurrent tabs.

## 2026-10-20 — Two-tab notices and explicit conflict recovery

The user authorized this bounded slice and continues periodic commits/pushes.
Track issue #16 on `feat/tab-change-recovery`; merge requires separate approval.
Publish book metadata after successful commits through BroadcastChannel and a
storage signal, with focus/visibility checks for missed signals. Notifications
never contain writing and never automatically replace the page or focused editor.

Review a local draft beside the latest saved version. Decisions check the reviewed
saved revision in the same transaction as any mutation. Keep my writing preserves
the replaced saved version as a Deleted entries copy; Keep both keeps the saved
version on the page and archives the draft there. Explain this placement in the UI.
Use saved writing explicitly discards this tab's reviewed draft. Refuse resurrection
or movement into occupied placement, keeping the draft available. Recovery copies
retain entry fields and flow through existing JSON archives; no schema migration.

Replace the shared auxiliary draft buffer with immutable emergency localStorage
snapshots and an independent per-tab session copy. Each checkpoint writes a fresh
key before removing its own previous key. Releasing a reviewed snapshot cannot
erase a newer draft from its writer. Never clear another editor's current key
on successful saving. Retained/legacy copies remain reviewable; release a snapshot
only after verifying equivalent durable content or saving its copy. Leave the
mutable legacy key untouched because an older app may still write it. Filter
already-durable or archived equivalents from review, and retain malformed buffers.
This is best-effort recovery storage, not cloud sync or a replacement for backups.

Browser behavior checked against primary documentation:
[BroadcastChannel](https://developer.mozilla.org/en-US/docs/Web/API/Broadcast_Channel_API),
[sessionStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/sessionStorage),
and [storage events](https://developer.mozilla.org/en-US/docs/Web/API/Window/storage_event).
Session copies survive reloads, are independent across tabs even when initially
cloned, and end when the tab closes; the separate emergency keys retain drafts
for later explicit review. No new dependencies or external services are needed.

Review pauses the save queue and locks page mutations until dismissal. Pending
drafts retain their actual expected durable revision in recovery checkpoints,
including after earlier saves whose UI record still has its original revision.
Decisions accept only the reviewed local draft and latest saved revision. Loading
changes overlays any remaining drafts and preserves the current spread. Every
successful choice/copy flows through existing Deleted entries and JSON backups.

Repeated Firefox journeys exposed delayed dialog focus restoration stealing the
first keystroke from a newly focused field. Restore focus only while it remains
unclaimed, checking both before and inside the animation-frame callback. Apply
the same helper to tab review, deletion and enlarged writing. Durable IndexedDB
assertions and all original writing assertions remain intact; ten repeated
Firefox journeys passed after the fix.

Implementation checkpoint `20a5050` passed Ubuntu CI (90 units, production build,
146 browser passes/four intentional skips). The documentation-head run then
exhausted the existing 30-second total test budget in WebKit's full formatted
timed-task deletion/rewrite/restoration lifecycle, while reopening its second
recovery dialog; 145 other browser journeys passed. CI retains no trace artifact
for this run, so this does not establish a stalled storage operation. Scope a
60-second total budget to that existing journey, which has four reloads, two
deletions and three recovery dialogs. Preserve every assertion, ordinary expect
timeout, retry policy and the rest of the suite's limits. Nine repeated lifecycle
journeys passed in the three engines, and `npm run check` passed again with 90
units and production build. Recheck final-head CI before requesting merge.

## 2026-10-28 — Bounded duration-task slice

After confirming manual two-tab recovery works, the user authorized duration tasks
with time controls, subtle spans, readable overlaps and persistence/recovery.
Track issue #18 on `feat/duration-tasks`, carrying the approved merge closeout
`9854b4a` above main `7a12c7e`. Periodic commits/pushes remain authorized; merging
is separate. Duration dragging/resizing and broad undo/redo are later slices.

Implement `scheduled-block` with start minute/dayOffset and endMinute/endDayOffset,
validated as a positive range entirely inside 06:00–03:00 (+1). Use explicit day
choices in the interval editor; never infer a following day from a reversed range.
Add/Remove duration preserves identity, text, marks, completion and start time.
Page creation defaults to an editable 12:00–13:00 task; contextual Add duration
defaults to one hour or the remaining timetable, disabled at 03:00 (+1).

Derived half-open overlap lanes reuse space only when the earlier task ends at or
before the next start. Place brackets in the existing time gutter, bounded away
from printed time numbers. Keep text in its existing containing-hour row and at
the same x position. Multiple entries in an hour offer a full-text chooser; retain
the existing cycling control for point-only duplicates. Never rewrite times,
move unrelated writing or render duplicate live editors to resolve an overlap.

Duration tasks deliberately permit overlap during restoration. Existing point,
checklist and note occupancy rules remain. Reviewed line/block conversion races
use the same revision checks and archive copies as other tab conflicts. Both
endpoints flow through all existing records, recovery snapshots and tombstones.

Write archive version 2 and accept versions 1 and 2, keeping v1 strict about its
original entry kinds/fields. This prevents an older app silently treating a duration
archive as point tasks. IndexedDB's unchanged id/pageId indexes need no migration;
old records stay untouched. Use installed React/Radix/Tiptap/Tailwind and existing
local Node 24.16.0, with no new dependency or service. Installed Next.js client
component guidance was read before the UI changes.

The first hosted run passed all duration journeys and 169 browser tests overall,
but an existing Firefox failed-save notification fixture expected no notice after
a one-shot write failure. A synthetic reproduction demonstrated that the empty
focus-write can consume that fault, after which the new text commits successfully
and correctly announces its change. Hold entry-write failures until the test
explicitly permits Retry, force both focus and text writes through the failure,
and verify the latest text actually reached the failed write and recovery buffer.
Retain the original no-notice/no-signal, retry, durable-text and recipient-only
notice assertions, with unchanged timeouts/retries. This correction changes test
setup only; the application source remains `fb931a9`. Nine strengthened repetitions
passed across the three engines, and `npm run check` passed again with 111 units
and production build. Final-head CI validates the correction before merge review.

## 2026-10-28 — Five-step approval and duration placement

The user authorized automatic approval for the next five bounded steps. Their
scope, exclusions and progress are recorded in `APPROVED_FIVE_STEPS.md`; this
supersedes the usual stop/commit/push/PR/merge approval gates for these five steps.
All final-head checks still precede each merge. Stop when the batch is complete;
physical-device and week-of-use gates remain manual. No spending or deployment.

Step 1 (#20) adds selected duration move/end-resize handles and non-drag controls.
Snap deltas to 15 minutes, Shift to one hour; preserve exact starting minutes and
duration when moving. End resizing keeps a positive range within 06:00–03:00 (+1).
Preview through the note placement lock, then queue exactly one changed entry at
release. A click never snaps an imported interval. Interruption cancels. Keep
native text arrows and focus distinct from handle shortcuts. No schema/dependency
change. Reuse existing saving, revisions, deletion/recovery and archive v2.

Split browser CI by engine after the common format/lint/types/unit/build job.
The preceding single job took over thirteen minutes; per-engine jobs keep the
growing suite bounded and all three must pass before merge. Preserve installed
action SHAs, minimal contents:read permissions, test assertions/timeouts/retries
and explicit two-worker browser limits. References are in the batch ledger.

## Page action history — 2026-10-28

Use bounded current-tab history (50 actions), separate from focused Tiptap word
undo. Metadata undo preserves latest own text/marks/ink and writes through a fresh
revision/content compare-and-swap transaction. Creation undo is a recoverable
soft-delete; redo restores the same identity and checks occupied placement.
Observe only own completed saves as history baselines; loading remote records must
not legitimize stale undo. Reset on import and explicit tab reconciliation, retain
on navigation and on failed undo. No new database schema or archive fields.

## Date navigation — 2026-10-28

Use the existing yearly manifest for date destinations and page side. Today uses
the book's existing `todayTimeZone`; report out-of-year dates instead of moving
to an unrelated boundary. The miniature calendar is one accessible trigger into
a larger native-field/month-button dialog, retaining readable pointer targets.
Reuse Radix/native controls without adding a calendar dependency. Date jumps
flush current drafts and share the existing navigation lock.

## Book interaction renderer — 2026-10-28

Use the existing editable HTML/CSS renderer with a replaceable small book-state
hook and 180ms CSS transitions. Preserve one editor tree; hide it behind the cover
only after a successful draft flush. Do not add a curl dependency at this stage:
restrained CSS satisfies the PRD fallback without duplicate editing surfaces or
pointer arbitration risk. Inputs never initiate turns; explicit previous/next do.
Resume is immediate on app load. Reduced motion and optional `motion: none` are
supported, with old preferences/archives defaulting to device behavior. Close/open
state is transient, not saved journal content. Resize/blur settles ongoing motion.

## Offline shell and local search — 2026-10-28

Use a small native service worker for the single static production route. The
build script embeds the public prerendered HTML and an exact static-asset list,
and hashes those inputs plus worker source for the shell version. This prevents
mixing a later server HTML response with an older asset manifest and avoids
caching any user/API response. Development never registers it. Installation waits
for all assets; cached root/static responses serve offline. Online cache repair
uses that same build snapshot. Only this app's shell caches are pruned, retaining
the previous shell for in-flight chunks. Writing remains entirely in IndexedDB.

Updates wait for an explicit Save and update command, successful draft flush and
one remaining planner window before skipWaiting/claim/reload. Initial activation
and ordinary updates do not auto-reload existing editors. Failed updates retain
writing; optional storage persistence is requested only by a user control and is
never described as a backup. Separate production port 3100 isolates test/cache
behavior from development port 3000; origin-local book transfer is explicit JSON
export/import into an empty store. No deployment, account or paid service.

Search reads current-book active records after a save flush, normalizes Unicode
and case for matching, filters date/type and renders 20 results per page. Opening
a result verifies the original active identity in a fresh page load, selects its
manifest side and focuses that editor. No second editable document or network
search index is introduced. The full-year synthetic fixture has 1,825 entries.

Pin Playwright 1.64.0 (and matching browsers) after checking its
[official release](https://github.com/microsoft/playwright/releases/tag/v1.64.0)
and npm Node engine >=20 compatibility with Node 24. The previous 1.63 WebKit
build rejects offline service-worker navigation even for literal cached responses;
[official issue #42775](https://github.com/microsoft/playwright/issues/42775)
tracks the fix in 1.64. This permits the same offline tests in all three engines
without a skip or application workaround. No application dependency changes.
The exact package lock changes only Playwright's three packages.

Worker lifecycle references reviewed:
[MDN using service workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers),
[skipWaiting](https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerGlobalScope/skipWaiting),
and [Playwright service workers](https://playwright.dev/docs/service-workers).
Next's installed PWA/client-boundary guides were also read before implementation.

The repeated offline update journey exposed row autofocus after operation unlock.
Writing now claims automatic focus once per selection/editor instance; unlocking
an operation does not reclaim an old row. The update control uses an explicitly
guarded aria-disabled/busy state so native disabling does not discard keyboard
focus. Refusals restore only unclaimed focus. All three engines assert update
button focus, retained draft text, retry and the subsequent offline reopening.
