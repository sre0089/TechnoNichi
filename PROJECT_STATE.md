# Project state

## Current stage

M1 is committed and pushed on `feat/m1-daily-spread`; PR #3 is open for review.
The user approved commit/push/PR publication on 2026-10-05. Visual review remains pending.
The user approved publishing the reviewed grid, hourly editing, memo-area, and
page-text font corrections on the same M1 branch on 2026-10-05. The PR's commit
list and Checks tab provide the latest publication and validation status.
No M2 work, cloud services, or public deployment has begun.

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

## Git status and publication

- Active branch: `feat/m1-daily-spread`, based on main at
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

## Files and scope

- App/editor: `src/app/`, `src/editor/`.
- Pure document/template/calendar: `src/domain/`, `src/templates/`.
- Durable storage/draft serialization: `src/local/`.
- Unit and browser journeys: `tests/`.
- Tooling: `package.json`, `package-lock.json`, `.nvmrc`, TypeScript/Next/ESLint/
  Prettier/Vitest/Playwright configs, ignore rules, `.github/workflows/checks.yml`.
- Docs: PRD, architecture, page template, decisions, README, contributing guide,
  and AGENTS. Font license: `public/licenses/kalam-OFL.txt`.

## Limits and next action

The visual template is independently drawn and estimated, not an exact measured
copy. The initial book is 2026, opening on October 6–7; navigation stays within
that book. Full year-selection/cover/Today/date-jump/month navigation is M3.
There are no duration blocks, dragging/resizing, styles, undo/soft deletion,
export/import, cached offline reopening, search, accounts, sync, or deployment.

Stale writes are blocked rather than silently overwriting; rich conflict resolution,
cross-tab change notifications, and full recovery/archives are M2. Browser eviction
can still remove local data, and the auxiliary draft buffer is best effort.
A local save is not a cloud sync or backup. Device checks and full performance
profiling remain pending; no FPS claims were made.

Exact next action: review the updated M1 and screenshots for visual feedback.
The user authorized the `fix: align timetable and edit hourly rows directly`
commit and push to the existing PR #3. Merge requires separate approval.
Stop before merge approval or M2. Recommend branch protections only
after the first real GitHub CI run and verification of available repository features.
