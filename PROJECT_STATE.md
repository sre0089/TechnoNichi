# Project state

## Current stage

M1, including the reviewed UI and timed-writing refinements, is committed and
pushed on `feat/m1-daily-spread`. Implementation commit: `55c7344`.
[PR #3](https://github.com/sre0089/TechnoNichi/pull/3) is open and unmerged;
[issue #2](https://github.com/sre0089/TechnoNichi/issues/2) remains open until merge.

The user approved the current UI appearance and latest checkbox alignment, then
explicitly authorized committing/pushing the reviewed local refinements on
2026-10-05. GitHub CI passed for the new implementation head; the publication
section below and PR Checks tab record validation. Earlier local-review sections
are historical checkpoints rather than the current publication status.

Current local task (2026-10-06): arrow-key hourly navigation and word-level
bold/italic/underline shortcuts and controls, on `feat/writing-keyboard-controls`
based on published `f5eb19b`. The user authorized this bounded editor addition,
then commit/push and a follow-up PR on 2026-10-06. Publication is
in progress under [issue #4](https://github.com/sre0089/TechnoNichi/issues/4),
with a PR based on the still-open M1 branch. Local checks are recorded below;
previous GitHub CI results cover the published baseline.

No merge, remainder of M2, cloud services or public deployment is authorized or begun.

## Completed work

- Public GitHub repository: https://github.com/sre0089/TechnoNichi.
- Bootstrap setup and verification PR #1 merged; base commit `49c3176`.
- Full PRD body preserved in `docs/PRD.md`; architecture, roadmap, and template documented.
- Inspected the real spread and mockup attached on 2026-10-05. Recorded approximate
  logical geometry and explicit midnight anchors; references remain private.
- Implemented Next.js/React/TypeScript client editor, daily template, stable dated
  page manifest, two-day spread, timed text, positioned notes, five checklist slots,
  exact-time control, previous/next, resume position, single-page focus, page sizing,
  toolbar side, enlarged text editing, and linear day outline.
- Implemented Dexie/IndexedDB schema v1 and serialized revision-checked writes.
  Save confirmation follows transaction success; failed writes retain drafts and
  block page navigation, with retry and copyable recovery text.
- Added meaningful unit/browser tests, exact dependency lockfile, formatter/linter,
  strict types, and a real CI workflow with verified pinned GitHub Actions.
- Generated and visually inspected synthetic blank, normal, dense, and phone fixtures.
- Added shared UI components and view settings; exact stack and component contracts
  are documented in `docs/UI_SYSTEM.md`.

## Git status and publication

- Published M1 branch: `feat/m1-daily-spread`, based on main at
  `49c3176a9d1ba1d82fab18cb85150881d0bfac5f`.
- M1 implementation commit: `e2c7da7`; pushed to the branch's origin upstream.
- Open, unmerged PR: https://github.com/sre0089/TechnoNichi/pull/3.
- Tracking issue:
  https://github.com/sre0089/TechnoNichi/issues/2.
- Both original prompt files remain local and untracked. Reference attachments
  are not in the application assets. Screenshots/traces are ignored local artifacts.
- Setup history: `7e962e1`, `a1c2539`, merged through
  https://github.com/sre0089/TechnoNichi/pull/1.
- GitHub identity/authentication and origin were verified during setup. Repository-local
  commits use the verified account's no-reply email; global Git settings were preserved.

## Published M1 baseline — runtime and checks

Named environment: this macOS arm64 workspace, temporary project-specific Node
24.21.0 and npm 11.8.0, Playwright-managed desktop Chromium, Firefox, and WebKit.
The global Node installation was not replaced.

- `npm ci --no-audit --no-fund`: pass; clean lockfile installation.
- `npm run lint`: pass with supported ESLint 10 and standalone TypeScript,
  React Hooks, and Next.js plugins.
- `npm run typecheck`: pass.
- `npm test`: pass; 12 tests across calendar/geometry, durable writes,
  stale revision rejection, in-flight typing, and failed-write recovery.
- `npm run test:browser`: pass; 19 passed, 2 skipped. All six functional journeys
  passed in Chromium, Firefox,
  and WebKit. Visual capture is Chromium-only; the equivalent screenshot cases are
  deliberately skipped in Firefox/WebKit.
- `npm run check`: pass; final formatting, lint, strict types, all 12 unit tests,
  and optimized production build passed after the last source changes.
- PRD source-body comparison: pass; requirement content retained verbatim.
- `git diff --cached --check`: pass. Staged source paths and the storage/editor/CI
  diff were reviewed; private inputs and screenshots are excluded. Credential
  pattern scan passed. No secret scan is claimed to prove absence of every secret.
- GitHub CI: full validation passed on Ubuntu for commit `5881f48` in
  https://github.com/sre0089/TechnoNichi/actions/runs/37390840274.
  See the PR's Checks tab for results on subsequent documentation commits.
- Real tablet/touch/IME, performance benchmarks, and visual approval: not run.
- Final synthetic screenshots are in ignored `artifacts/m1-blank.png`,
  `m1-normal.png`, `m1-dense.png`, `m1-phone.png`, and `m1-phone-editor.png`.
- Fresh staged-file copy without `.next` or `next-env.d.ts`: `npm run typecheck`
  passed after generating route types, verifying the clean-clone type-check path.
- Local dev server is running at http://127.0.0.1:3000; HTTP request returned 200.

Early issues corrected: sandbox denied the local listening port (approved
browser-test retry); module mode changed during a first browser run (stable rerun
passed); Next's bundled React lint preset did not support ESLint 10 (replaced with
compatible standalone plugins); a browser alert selector also matched Next's route
announcer (selector scoped to the real application alert). Final outcomes supersede
those early failures.

## M1 review corrections — approved publication

- Removed the extra dashed divider; aligned time numbers to every third grid line
  and added dots at the intermediate hourly intersections.
- Made all 22 hourly writing rows directly editable, removed the timed-line creation
  control and repeated on-page timestamps, and limited new notes to the lower grid.
- Applied a system monospace font only to entered writing on the page. Existing
  printed and interface fonts remain unchanged.
- Preserved old note geometry, exact times, and entry IDs, with access to multiple
  entries in an hour. Added collision-safe row IDs and regression coverage for time
  moves and stale edits in two tabs.
- Updated README, architecture, template specification, decisions, and this state.
- `npm run check`: pass after the final source changes (format, lint, strict types,
  14 unit tests, production build).
- `npm run test:browser`: pass after the final source changes; 28 passed, 2 skipped.
  All nine functional journeys passed in Chromium, Firefox, and WebKit. The two
  skipped cases are the intentionally Chromium-only screenshot fixture.
- Regenerated synthetic blank, normal, dense, phone, and enlarged-editor fixtures
  in ignored `artifacts/`; inspected grid alignment, the monospace writing, and
  overflow behavior. Real tablet/touch/IME checks remain pending.
- `git diff --check`: pass. Source, test, and documentation diffs reviewed.
- Existing workspace dev server serves the revisions at http://127.0.0.1:3000;
  HTTP verification returned 200 during local review.
- Publication to the existing PR #3 is authorized. The CI workflow validates
  the same checks and browser journeys; see the PR's Checks tab for the latest
  head's result.

## Hourly typography refinement — local review

- Hourly writing is about 19% smaller and sits lower within its existing row,
  just above the grid line. Note/checklist and interface typography stays the same.
- CSS and template typography metadata changed; page geometry and saved writing
  are unchanged. Template specification and decisions record the refinement.
- Compared synthetic before/after row captures, including descenders; inspected
  regenerated normal-spread and phone fixtures. Row captures are ignored local
  `artifacts/hourly-type-before.png` and `artifacts/hourly-type-after.png`.
- `npm run check`: pass (format, lint, strict types, 14 unit tests, production build).
- `npm run test:browser`: pass (28 passed, 2 intentionally skipped screenshot cases)
  across Chromium, Firefox, and WebKit. No new tests were added for this CSS change.
- At the synthetic desktop viewport, hourly glyph width dropped from about 6.48
  to 5.24 px; the single-line field's scroll/client height both remain 13 px.
  The descenders remain clear of the line in the inspected Chromium capture;
  physical tablet/touch checks and user visual approval remain pending.
- Files changed: `src/app/globals.css`, `src/templates/daily-v1.ts`,
  `docs/PAGE_TEMPLATE_SPEC.md`, `docs/DECISIONS.md`, and this state.
- Suggested commit: `style: settle hourly writing above grid lines` for PR #3.
  Changes are local and uncommitted; GitHub CI has not run this refinement.
- Published baseline remains `ebe0b50` on `feat/m1-daily-spread`, PR #3 open.

## Timed task completion and vertical lines — initial local review

- Enter or Done reveals an unchecked checkbox just after timed writing; checking
  adds a translucent strike-through and persists completion. Clearing removes it.
- Original bold lines sit two grid columns right of the timestamps. Writing starts
  one column farther right. Consecutive occupied hours share a line from first to
  last marker; gaps split runs and singletons have one-row markers. Completed tasks
  remain occupied; midnight and duplicate-hour entries are handled explicitly.
- Added optional validated flags with false defaults for older entries. No database
  schema migration, record rewrite, or deletion; old IDs/times/notes stay intact.
- Final source checks passed: `npm run check` (format, lint, strict types, 17 unit
  tests, production build), and `npm run test:browser` (34 passed, 2 intentionally
  skipped screenshot cases across Chromium, Firefox, WebKit).
- Synthetic review captures: ignored `artifacts/m1-timed-tasks.png`,
  `m1-timed-tasks-detail.png`, and `m1-timed-tasks-phone.png`. The 12:00–14:00 line,
  right-of-text checkboxes, translucent completion, and phone rendering were inspected.
- Source: `src/domain/model.ts`, new `src/domain/schedule.ts`,
  `src/templates/daily-v1.ts`, `src/editor/Planner.tsx`, `src/app/globals.css`.
  Updated persistence/browser tests; added `tests/unit/schedule.test.ts`.
  README, architecture, template, decisions, and this state reflect the new behavior.
- Local publication is pending approval; PR #3 still contains published `ebe0b50`.
  New local changes include the earlier smaller/lower typography. Suggested combined
  commit: `feat: add timed task completion and consecutive-hour lines`.
- Real tablet/touch checks and full visual approval remain pending. No broader M2,
  services, deployment, or GitHub CI run of these changes has begun.

## Integrated occupied-hour line correction — current local review

- Fixed first-row coverage: every run starts one grid row above its first marker
  and ends at its last marker. The 12:00–14:00 run now spans logical y 53.3–64.4,
  covering all three writing rows; gaps and singleton behavior stay consistent.
- Aligned the bold stroke with the actual faint grid stroke's center, accounting
  for its one-pixel width. A minimum two-pixel bold stroke fully covers it on
  phone pages too, removing the offset/parallel-stroke appearance.
- Updated domain geometry, CSS, unit/browser regressions, README, template specification,
  decisions, and this state. Existing saved entries and times are unchanged.
- Final source validation: `npm run check` passed (format, lint, strict types,
  17 unit tests, production build). `npm run test:browser` passed: 34 passed,
  2 intentionally skipped screenshot cases. The run test verifies first/last row
  bounds, stroke-center alignment, and bold width at desktop and phone sizes in
  Chromium, Firefox, and WebKit.
- Inspected synthetic isolated-context captures in ignored
  `artifacts/m1-grid-line-desktop.png` and `m1-grid-line-phone.png`; every entry is
  encompassed and the bold line continues the underlying grid stroke.
- All typography/completion/line changes remain local on `feat/m1-daily-spread`;
  published PR #3 still has `ebe0b50`. GitHub CI has not run these local changes.
  Suggested combined commit: `feat: add timed task completion and integrated hour lines`.
- Physical tablet/touch behavior remains unverified.

## Shared UI system — current local review

- Added Tailwind 4.3.3/PostCSS, shared theme tokens and reusable native controls.
  Radix Dialog/Popover/Tooltip supplies floating interfaces; Lucide provides
  consistent icons. Exact dependency versions are pinned and documented in
  `docs/UI_SYSTEM.md`; the npm lockfile is updated.
- Applied the components to navigation/view controls, settings, selected-writing
  controls, enlarged editing, day outline, opening retry, storage recovery and
  small paper actions. Existing grid geometry, paper typography, saved entries
  and persistence behavior remain intact; Tailwind Preflight is omitted.
- View settings exposes existing saved page size and toolbar position. Dialogs
  contain focus and restore it on close, including to the original writing row.
  Reading popovers retain long text within viewport bounds. Keyboard hints do
  not move focus or navigate; Escape during IME composition retains the dialog.
- Final source validation: `npm run check` passed (format, lint, strict types,
  17 unit tests, optimized default Turbopack production build).
  `npm run test:browser` passed: 43 passed, 2 intentionally skipped screenshot
  cases. All 14 functional journeys pass in Chromium, Firefox and WebKit.
  Three new journeys cover settings persistence/focus at desktop and phone
  sizes, full-text reading/enlarged editing/IME Escape, and keyboard hints.
- Final compiled production UI smoke passed in six fresh contexts: Chromium,
  Firefox and WebKit at 1440 × 1120 and 390 × 844. Checked compiled theme styling,
  settings bounds, reading/editing, IME Escape, focus restoration, completion and
  reload persistence; no page errors were observed. The temporary loopback
  production server on port 3002 was stopped afterward; the existing development
  preview remains at http://127.0.0.1:3000.
- Inspected regenerated synthetic normal/dense/phone/editor captures and new
  `artifacts/m1-ui-settings.png`, `m1-ui-phone-settings.png`,
  `m1-ui-phone-popover.png`. Artifacts use isolated synthetic stores and remain
  ignored. Physical tablet/touch/IME and assistive-technology checks remain pending.
- Production-only npm audit reported zero vulnerabilities. Full audit reported
  four high findings in the same pre-existing Next lint plugin → fast-glob →
  micromatch → braces chain; the advisory lists no patched version as of
  2026-10-05. No unsafe automatic major downgrade was applied. Details and the
  primary advisory are linked in `docs/UI_SYSTEM.md`.
- Initial production validation encountered a sandbox worker-port error cached
  by Turbopack. Clearing only generated production cache and retrying with local
  worker permissions resolved it. Build scripts/bundler defaults are unchanged.
- Source/dependency/component and documentation diffs reviewed; whitespace checks
  passed. Original private inputs and screenshots remain untracked/ignored.
  These UI changes and the earlier local refinements remain uncommitted on
  `feat/m1-daily-spread`; PR #3 still contains published `ebe0b50`. No GitHub CI
  run, merge, deployment, external service or later milestone work is claimed.

## Tighter timed-writing inset — current local review

- Moved the shared timed-writing origin from x 24.8 to x 22.025: one quarter of
  a grid square to the right of the bold line at x 21.1. The same row boundary
  still sets its right edge, and checkboxes continue to follow the writing.
  Stored entries, line geometry, baselines and font sizes are unchanged.
- Updated the template, existing unit/browser spacing assertions, README,
  template specification, decisions and project state.
- `npm run check` passed: format, lint, strict types, 17 unit tests and production
  build. `npm run test:browser` passed: 43 passed, 2 intentional screenshot skips.
  Existing geometry checks now confirm quarter-square placement and positive
  clearance from the bold stroke at desktop/phone widths in all three engines.
- Inspected synthetic `artifacts/m1-tight-inset-desktop.png` and
  `m1-tight-inset-phone.png`. Chromium's textarea clears the bold stroke by about
  1.72 px on desktop and 0.70 px on phone; both start inside the line's grid square.
  Captures remain ignored; physical touch checks remain pending.
- Local and uncommitted on `feat/m1-daily-spread`; published PR #3 remains at
  `ebe0b50`. Suggested refinement commit: `style: tighten timed writing inset`.

## Centered timed checkboxes — current local review

- Centered the timed checkbox in the clear row between horizontal strokes by
  excluding the upper grid stroke from its flex overlay. Centered the checked
  mark inside its box instead of inheriting the printed checklist's upward offset.
  Checkbox size/font, horizontal placement, writing and saved completion are intact.
- Changed `src/app/globals.css`, the existing browser completion journey, template
  specification, decisions and this state. Top checklist placement is unchanged.
- `npm run check` passed: format, lint, strict types, 17 unit tests and production
  build. `npm run test:browser` passed: 43 passed, 2 intentional screenshot skips.
  Existing completion coverage measures centering at desktop/phone widths in
  Chromium, Firefox and WebKit, and still verifies keyboard toggling/persistence.
- Inspected checked and unchecked synthetic rows in ignored
  `artifacts/m1-centered-checkbox-desktop.png` and `m1-centered-checkbox-phone.png`.
  Physical touch checks remain pending. Changes remain local on
  `feat/m1-daily-spread`; published PR #3 remains at `ebe0b50`.
  Suggested refinement commit: `style: center timed task checkboxes`.
- User visual approval received on 2026-10-05: “yup this is good”. Publication of
  the local refinements still requires explicit commit/push authorization.

## Approved refinement publication — current status

- User authorized commit/push to existing PR #3 on 2026-10-05, after visual review.
  This batch contains the smaller/lower hourly writing, timed completion,
  integrated consecutive-hour lines, shared Tailwind/Radix/Lucide UI, quarter-square
  writing inset and centered timed checkboxes. It remains within the existing M1.
- Git identity, authenticated GitHub account `sre0089`, public origin and open
  PR/issue were verified. Fetched `main` and the feature branch; the remote feature
  head matches local `ebe0b50`, and local history contains the current base.
- Reviewed source, exact dependency changes, tests and documentation. The final
  source already passed `npm run check` (17 unit tests and production build) and
  `npm run test:browser` (43 passed, 2 intentional screenshot skips) after the
  checkbox correction. Publication-only documentation updates are formatted.
- Chosen implementation commit: `feat: refine planner writing and shared UI controls`.
  The final integrated implementation is one coherent review batch on the existing
  feature branch; no partial historical staging snapshot will be published.
- Implementation `55c7344de2ac1a95a8e79d4568f13e942eef7e4d` was committed and
  pushed successfully to the existing branch. PR #3's title and description were
  updated to the final scope and validation. No force push, merge or issue closure.
- GitHub CI passed for that implementation in
  https://github.com/sre0089/TechnoNichi/actions/runs/37405700428:
  format, lint, strict types, 17 unit tests, production build and 43 browser tests
  passed; 2 screenshot cases were intentionally skipped.
  The PR's Checks tab reports results for any later publication-record commits.
- The reviewed 25 staged paths passed whitespace and credential-pattern checks.
  Original private prompt files, private references, synthetic screenshots and
  runtime data remain excluded. The only untracked workspace files after the
  implementation commit are the two original private prompt documents.

## Writing keyboard controls — initial whole-entry review, 2026-10-06

- Implemented the user's bounded keyboard request on `feat/writing-keyboard-controls`,
  based on published `f5eb19b`. No new commit, push, PR or GitHub CI run yet.
  Existing PR #3 remains the published M1 baseline.
- Unmodified Up/Down moves through hourly rows on the same page, including empty
  rows and midnight. First/last rows do not wrap or turn pages. Left/Right,
  modified arrows, selections, IME composition and read-only fields retain native
  behavior. Multiline/overflowing text leaves only at its start/end endpoints.
  The caret column is retained where possible and clamped to the next text length.
- Cmd/Ctrl+B/I/U toggles whole-entry bold/italic/underline, with matching pressed
  buttons in contextual controls and enlarged editing. Whole-entry scope is the
  stated default at this initial checkpoint; it is superseded by the requested
  word-level correction below. Notes and top checklist tasks share the formatting commands.
- Optional validated boolean flags keep old records plain without migrations or
  rewrites. The same revision-checked save and recovery path persists formatting.
  Completion combines strike-through with underline, and checkbox text measurement
  uses the entry's font weight/style. Paper size, font size and baselines are unchanged.
- Changed `src/domain/model.ts`, `src/editor/Planner.tsx`, new
  `src/editor/writing-keys.ts`, three test files, README, architecture, template,
  interface system, decisions and this state. No dependencies added.
- `npm run check` passed: formatting, lint, strict types, 18 unit tests and optimized
  default production build. `npm run test:browser` passed: 49 tests, 2 intentional
  screenshot skips, across Chromium, Firefox and WebKit. The two new journeys
  exercise navigation boundaries, selections, caret editing, composition,
  combined styles/completion, both modifier families, buttons, reload/page turns,
  reading and enlarged editing.
- Compiled production smoke passed in six fresh synthetic contexts: desktop and
  phone viewports in Chromium, Firefox and WebKit. Inspected synthetic captures
  `artifacts/keyboard-controls-desktop.png` and `keyboard-controls-phone.png`;
  the controls fit, and formatted writing/checkmarks remain within the paper grid.
  These artifacts are ignored and private planner data was not read or captured.
- Physical tablet, touch keyboard, real IME and assistive-technology checks remain
  unverified. Formatting changes are not part of native text undo; full style undo
  remains later editor work. New publication requires approval under AGENTS.
- Suggested commit: `feat: add writing navigation and formatting shortcuts`.

## Word-level formatting correction — approved review, 2026-10-06

- The user clarified that formatting must have per-word granularity. Cmd/Ctrl+B/I/U
  now applies to selected words; without a selection, it styles subsequent typing.
  Contextual buttons preserve the range and report active styles. Notes, checklist
  tasks and enlarged writing use the same commands; Up/Down navigation is retained.
- Added exact-pinned Tiptap 3.31.4 with a constrained document/paragraph/text schema,
  hard breaks, bold/italic/underline and field-local undo/redo. Existing paper font
  size, baseline, geometry, line grouping and completion remain intact. New fonts,
  notebook-wide contenteditable, HTML storage and broader editor features were not added.
- The document keeps plain text plus optional validated, sorted nonoverlapping
  formatting ranges. Older plain and whole-entry styled records remain readable,
  without migrations or record rewrites. Revision checks and recovery persist the
  full entry. Reading and checkbox measurement use the same styled segments.
- Source: model, formatted-text helpers, RichWriting, rich-document adapter,
  Planner, keyboard helper, paper CSS, exact package/lockfile pins. Updated browser,
  document/persistence and formatted-text unit tests, README and affected docs.
- Source checks passed: `npm run check` (format, lint, strict types, 22 unit tests,
  production build). `npm run test:browser` passed: 52 tests and 2 intentional
  screenshot skips across Chromium, Firefox and WebKit after the IME correction.
  All 17 functional journeys pass in each engine; Chromium also captures fixtures.
- Compiled production word-formatting/navigation/reload smoke passed in six fresh
  synthetic contexts: desktop and phone widths in all three engines. Inspected
  `artifacts/word-formatting-desktop.png`, `word-formatting-phone.png` and
  `word-formatting-editor.png`; words keep their independent marks, and paper
  layout, completion placement and focused editing remain usable. Captures are
  ignored and contain only synthetic writing.
- Added journeys verify independent marks, selected-word toolbar actions, combined
  completion, typed marks, insertion/deletion range tracking, field-local undo/redo,
  and plain-text paste containing HTML-like literal text. Clipboard tests use a
  synthetic boundary; physical clipboard/IME/device behavior remains unverified.
- Formatting history stays within the mounted entry editor. Book-wide history and
  the rest of M2 remain deferred. Runtime audit reported zero vulnerabilities on
  2026-10-06. Existing development-only audit findings remain documented.
- The user authorized publication on 2026-10-06. The work is on
  `feat/writing-keyboard-controls`, based on `f5eb19b`. Tracking issue:
  https://github.com/sre0089/TechnoNichi/issues/4. PR #3 is unchanged.
  Chosen commit: `feat: add writing navigation and word formatting`.
  Publication and GitHub CI results will be recorded after they complete.

## Keyboard and word-formatting publication — in progress

- Verified authenticated account `sre0089`, public HTTPS origin, commit identity
  and the existing open PR #3. Fetched the bases; `origin/feat/m1-daily-spread`
  matches local base `f5eb19b`, and `origin/main` remains `49c3176`.
- User authorization covers committing, pushing and opening the follow-up PR.
  The PR will target `feat/m1-daily-spread` so its diff contains only this bounded
  addition. Review/merge PR #3 first, then retarget the follow-up to `main` before
  merging; each merge requires separate approval.
- Source, dependency, unit/browser and documentation changes were reviewed.
  Final source passed the local checks recorded above; publication edits only
  update documentation. Private originals, references, planner data and synthetic
  screenshots remain excluded.

## Files and scope

- App/editor and shared UI: `src/app/`, `src/editor/`, `src/components/ui/`.
- Pure document/template/calendar: `src/domain/`, `src/templates/`.
- Durable storage/draft serialization: `src/local/`.
- Unit and browser journeys: `tests/`.
- Tooling: `package.json`, `package-lock.json`, `.nvmrc`, TypeScript/Next/ESLint/
  PostCSS/Prettier/Vitest/Playwright configs, ignore rules, `.github/workflows/checks.yml`.
- Docs: PRD, architecture, page template, decisions, README, contributing guide,
  interface system and AGENTS. Font license: `public/licenses/kalam-OFL.txt`.

## Limits and next action

The visual template is independently drawn and estimated, not an exact measured
copy. The initial book is 2026, opening on October 6–7; navigation stays within
that book. Full year-selection/cover/Today/date-jump/month navigation is M3.
There are no duration blocks, dragging/resizing, full rich text, book-wide undo/soft deletion,
export/import, cached offline reopening, search, accounts, sync, or deployment.

Stale writes are blocked rather than silently overwriting; rich conflict resolution,
cross-tab change notifications, and full recovery/archives are M2. Browser eviction
can still remove local data, and the auxiliary draft buffer is best effort.
A local save is not a cloud sync or backup. Device checks and full performance
profiling remain pending; no FPS claims were made.

Exact next action: complete the authorized keyboard/word-formatting publication
and verify GitHub CI, then review the follow-up alongside PR #3.
Physical device checks remain pending as described above.
Merge requires separate approval.
Stop before merge approval or M2. Recommend branch protections only
after the first real GitHub CI run and verification of available repository features.
