# Project state

## Free-note slash lists — implementation in progress, 2026-11-03

The user approved leading to-do checkboxes, bullets and numbered lists in free
notes, chosen through `/`, with Enter continuation and Tab/Shift+Tab indentation.
Work is on `feat/note-lists`, based on the still-unmerged release-record branch
for PR #45, tracked by [issue #46](https://github.com/sre0089/TechnoNichi/issues/46).
Keep its PR focused against that branch; no merge or production publication is
authorized by this feature request. Existing production stays unchanged.

Extend the existing Tiptap paragraph with validated per-line kind/indent/completion
and a real leading checkbox; no new dependency. Keep plain text and inline marks
as the shared search/recovery representation. Empty-list Enter exits to plain
writing; Shift+Enter starts a plain line, Backspace at a marker removes one depth
or the marker, and indent is bounded at six levels. Ordinary inline slashes stay
text. Slash menu supports filtering, pointer choice, arrow keys, Enter/Tab and
Escape; the focused note keeps its caret. IME events bypass these shortcuts.

Backups containing structured note metadata use version 3; ordinary books keep
version 2 exports. Both v1/v2 imports remain supported. No IndexedDB index/schema
change is needed for optional note fields. Existing plain/formatted notes retain
their text, whitespace, newline marks and geometry. Geometry/history operations
must preserve newer note metadata just as they preserve newer writing. Older
app versions are not compatible writers for structured notes; do not roll this
feature back to the pre-list build or ask users to clear books.

Acceptance: three list choices, leading independently checkable boxes, depth and
numbering behavior, word styles/native undo, save/reload, portable empty-profile
restore, old notes/backups and unaffected timed tasks. Unit checks currently
pass 150 tests; focused browser verification and final closeout are in progress.
Raw synthetic screenshots/traces remain ignored; supplied personal writing stays
private. No service/provider setting is changed by this task.

## Approved public production release — 2026-11-03

The user explicitly approved merging green PRs #41 then #43 and publishing the
tested app publicly on Netlify Free. Both merged after all four final-head CI
jobs passed: #41 as `cfc6b6f` (run 41593720888), then retargeted #43 as `b40ffd1`
(run 41737946302). Each merged tree matches its reviewed head. Issues #40/#42
closed. Local main fast-forwarded to `b40ffd1`; release records are on
`chore/production-release`, tracked by
[issue #44](https://github.com/sre0089/TechnoNichi/issues/44).

**Production is live at <https://technonichi.netlify.app>.** Deployment
`6aea7ab7c85f6df45f0ab51e` is ready and published (2026-11-04 00:22:24 UTC,
November 3 locally). Published the retained tested build A without rebuilding:
source `89db2a9bcbce7af9c07de1fc4af2ef3088767070`, worker
`52dc0466c66817fe7e8b`, Next build `FQMVzhTIwbBvFJGyF649C`, adapter 5.16.5 and
Node 24 function runtime. All 26 retained static/function fingerprints matched
immediately before upload. Runtime/configuration/dependencies match merged main
`b40ffd1`; subsequent source differences are tests, documentation and tooling.

On the stable production origin, all six hosted smoke cases pass across
Chromium/Firefox/WebKit (31.3s): fresh synthetic setup, saved/completed writing,
reload, offline edits/reopening and independent empty-profile backup restore.
All 23 precache resources return nonempty HTTP 200 without redirects; worker
bytes, MIME, no-cache/no-store/must-revalidate, nosniff, CSP and HTTPS/HSTS pass.
Manifest scope/start/id remain `/`, display `standalone`, purple theme `#514560`.
Inspected the synthetic online setup and restored/offline screenshots. A fresh
lockfile audit reports zero known findings at review time. Raw receipts and
screenshots stay ignored under `artifacts/production-release*`.

Provider read-back confirms Free / `credit-free`, this exact published deployment
locked, and no Git-connected automatic deploys. No paid add-on, domain purchase,
account, cloud book storage or invitation was added. Future publication remains
a separately reviewed manual step. Previous unpublished/pending-merge statements
below are historical and superseded by this record.

Existing localhost/staging books stay in their original browser stores. Export
and retain a backup there, restore it into the empty production store **before
creating a book**, then install the production app separately and wait for
Available offline. No terminal is required for hosted use. The original book is
preserved; origins/profiles/devices do not synchronize. See
[PERSONAL_ALPHA.md](docs/PERSONAL_ALPHA.md) for the exact transfer steps.

No application code, schema, dependency version or standalone-window design
changed. Broader physical-device/accessibility and seven-day use evidence remain
pending before invitations; the hosted automation does not establish those.
Next bounded action is the user's production-origin book transfer/install check
and the remaining personal trial, with focused fixes for any actual defects.

Release/evidence checkpoint `2fef3d3` and usage-guide checkpoint `9c5cc91` are
pushed in [PR #45](https://github.com/sre0089/TechnoNichi/pull/45), targeting main.
This documentation PR remains unmerged; the explicit merge approval covered
#41/#43. Four affected Markdown files pass Prettier, five local document links
resolve, and working/staged whitespace checks pass. App suites were not repeated
for documentation changes; production results above are from the actual release.
The private untracked originals remain untouched and excluded.

The provider's optional floating badge remains enabled. The CLI rejected the
attempted setting change (HTTP 422); no successful badge removal is claimed.
[Official badge documentation](https://docs.netlify.com/manage/projects/powered-by-netlify-badge/)
allows disabling it on Free in Project configuration → General without a redeploy.
The user was given that optional dashboard step to preserve the clean window
appearance. It does not block book transfer or alter the deployed app artifacts.

The user subsequently reported turning the badge off and saving. Follow-up
read-back still reports `built_with_badge_enabled: true`, and a fresh disposable
Chromium profile still displays the badge on the production setup screen (HTTP
200). Record the discrepancy rather than claiming removal. The same published
deployment remains ready and locked; no redeploy or book data change occurred.
The synthetic screenshot remains ignored. Recheck the setting on the
`technonichi` project; this optional appearance issue does not block normal use.

## Hosted update and compatible rollback verification — 2026-11-03

The user authorized the next bounded staging reliability check: a real hosted
shell update with synthetic books open, refusal for failed saves/another window,
then return to the retained working shell with newer writing preserved. Work is
on `test/hosted-release-recovery`, based on staging head `fb058c4`, tracked by
[issue #42](https://github.com/sre0089/TechnoNichi/issues/42). PR #41's current head
has all four CI jobs green in run 41593720888. This task does not merge PR #41,
publish production or change visibility/invitations.

Retained build A is worker `52dc0466c66817fe7e8b`, Next build
`FQMVzhTIwbBvFJGyF649C`, source `89db2a9`. Re-publishing its processed static output
with the cached internal function manifest to a separate `rollback-check` draft
succeeds (deploy `6aea681e49dd08a15c45d314`). That preview and current staging both
serve identical worker bytes, root build identity, valid manifest and all 23
precache resources. SHA-256 fingerprints retain 26 static/function artifacts in
an ignored local baseline report. No private originals entered the source checkout.

Added an opt-in hosted lifecycle harness. It holds independent Chromium/Firefox/
WebKit books open and pauses at explicit operator deployment checkpoints. It
never deploys by itself, requires an explicit HTTPS origin/new artifact directory,
and will compare data and actual client build IDs through update and rollback.
The live lifecycle run passed in all three engines. Each used an independent
synthetic book and checked another top-level browser client refusing activation,
a simulated failed entry write retaining the latest draft and refusing reload,
successful save/activation of the distinct new client build, preserved book/page/
preference records and other entries' formatting/completion/geometry, plus a new
offline entry surviving reopening. After returning to build A, all four database
tables exactly matched the newer post-update snapshot and offline reopening
retained it. No page errors; inspected the synthetic rollback screenshot.

| Phase      | Provider draft ID          | Source     | Worker                 | Next build ID           |
| ---------- | -------------------------- | ---------- | ---------------------- | ----------------------- |
| Working A  | `6ae982f33cba1eda0cac3ac4` | `89db2a9`  | `52dc0466c66817fe7e8b` | `FQMVzhTIwbBvFJGyF649C` |
| Update B   | `6aea6940c92dd1d7e1675290` | `fb058c4`  | `0a688a1380937f97161b` | `6Hztdcoj-eeisfF0svGpz` |
| Restored A | `6aea69b7d4d6174f7be0b903` | retained A | `52dc0466c66817fe7e8b` | `FQMVzhTIwbBvFJGyF649C` |

Both deployment transitions were independently checked over HTTPS: exact worker
bytes, actual root build identity and all 23 precache resources. All 26 retained
artifact fingerprints matched immediately before restoring A. Staging now serves
that verified restored baseline. The provider confirms production is unpublished
and no Git auto-deploy connection exists. This is same-schema, retained-artifact
rollback on a draft alias, not a production atomic-restore API or schema downgrade
test. Top-level browser clients exercise the worker window guard; native OS app
windows remain narrower manual evidence. Raw checkpoint/report/screenshot files
stay ignored under `artifacts/hosted-lifecycle-42/`.

Build A's packaged function records adapter 5.16.5; the provider automatically
selected 5.16.6 for B. Published official package provenance for 5.16.6 was verified
after detection (upstream commit `010b931ec8f589cf85f339e5be7f0f88f160dd4d`). Both
record Node 24 runtime. This is a platform-version change outside the application
lockfile; retained A restored its tested older adapter output too. No app dependency,
schema, UI or source behavior changed.

Checkpoint `5228e9b` contains the harness and scope record. Final automated
closeout: `npm run check` passes formatting/lint/strict types, all 145 units and
production build. The post-rollback `npm run test:hosted` passes all six hosted
cases across the same three engines (22.7s), including independent backup restore.
No new product feature, production publication or PR merge has occurred.

Harness/evidence checkpoints `5228e9b` and `8b58961` are pushed in
[PR #43](https://github.com/sre0089/TechnoNichi/pull/43), targeting
`chore/netlify-staging` for a focused diff. Retarget after separately approved
merge of #41. Final-head CI is pending; formatting, whitespace and four local
document links pass. No artifacts or private originals are tracked. Next bounded
action is release review of #41/#43 and the remaining manual acceptance evidence;
no production publication or merge authorization is inferred from these results.

The user confirmed that the separate Chrome app window, purple title bar and
native feeling are design preferences to preserve. Recorded in DECISIONS.md and
added to the manual staging checklist. This follow-up changes documentation only;
the hosted build, app UI, manifest and book data are unchanged.

On 2026-11-03 the user confirmed the supplied hosted staging test flow works,
covering the requested installation/window, normal editing and offline-reopen
checks on their tested setup. This is an overall user report, not a new automated
run. Device/OS/browser versions and whether the optional phone/tablet repeat was
performed were not supplied. Hosted update/refusal/rollback and broader trial
checks remain before production release. Record the confirmation without treating
it as PR merge, production-visibility or invitation approval.

## Approved Netlify staging setup — 2026-11-03

The user approved merging green PRs #37 and #39 and proceeding with Netlify Free
synthetic staging. No paid add-ons, domain purchase, account/cloud-book features
or tester invitations are authorized by this slice. Issue
[#40](https://github.com/sre0089/TechnoNichi/issues/40) tracks the work on
`chore/netlify-staging`, initially based on reviewed #39 head `a8d4208`.

PR #37 merged as `3ee6cc5`; PR #39 merged as `e1c78dd`, each after all four
final-head checks passed. Their merged trees match reviewed heads `5d96929` and
`a8d4208`. Local main fast-forwarded to `e1c78dd`. WebKit's search replacement case
appended old text in the first #39 CI run. The unchanged local search file passed
12 cases; the failed CI job then passed on retry. No fix is claimed for that
unreproduced timing failure. Retain this evidence if it recurs.

Plugin discovery found no Netlify connector. Reviewed official CLI documentation
and pinned CLI 27.16.2 (Node >=22.13); used a temporary npm-exec copy under Node 24
with dependency installation scripts disabled, without changing project packages.
The user completed official interactive login. Team `sre0089` reports Free /
`credit-free`. No paid plan or recharge was enabled. Account API exposes no
unambiguous recharge-enabled field, so do not claim that toggle was verified.

Created empty Netlify project `technonichi`, ID
`a4fe62cb-705e-4e2b-be56-8aa3d3b29eea`. The provider reports the reserved project
URL `https://technonichi.netlify.app`; it is not yet a verified working app.
Local `.netlify/` metadata is ignored. `netlify.toml` declares the reviewed locked
install/full worker build, Node 24 and explicit static-worker headers. Official
CLI `build --dry --offline` successfully parses it and detects Next runtime 5.16.5;
the adapter's official package metadata was reviewed before build execution.

Checkpoint `89db2a9` is pushed. Built an isolated tracked-source checkout at
`/private/tmp/technonichi-netlify-staging`: clean `npm ci`, official adapter
5.16.5 packaging and function bundling pass. Package filenames were inspected;
private originals, runtime exports and environment files are absent. The CLI has
not linked a Git repository/webhook, so there are no automatic Git deploys. The
provider rejects forcing SSL before certificate provisioning; HTTPS must instead
be verified on the actual built-in deployment URL. No successful force-SSL toggle
or stop-builds setting is claimed.

The first draft (`6ae981631e98f631898b31f2`) used `deploy --no-build` after a separate
build; that upload missed the adapter's processed static output. After the user
changed preview visibility to Public in the dashboard, all six hosted checks
failed on this draft (worker 404 / setup unavailable). Replaced it using a single
adapter build-and-deploy command from the isolated source; do not reuse the failed
draft as a rollback baseline. Production visibility remains private by user choice.

Corrected staging draft `6ae982f33cba1eda0cac3ac4` is available at
`https://staging--technonichi.netlify.app`, from source `89db2a9`, worker version
`52dc0466c66817fe7e8b`. Root, worker and manifest return HTTP 200 over HTTPS. Actual
CDN worker MIME, no-cache/no-store/must-revalidate, nosniff, CSP and HSTS headers
are verified. The stable production origin has not been published.

Added an explicit `HOSTED_BASE_URL` HTTPS-only browser harness and `npm run
test:hosted`; it creates only synthetic fresh-profile books and checks all public
shell resources, offline edits/reopening, completion and portable backup restore
without altering the source book. Generated Netlify files are excluded from lint
as well as Git. The corrected hosted rerun passes all six cases across
Chromium/Firefox/WebKit (23.0s), including all 23 shell resources, synthetic first
use, timed completion, offline edits/reopening and backup restore into an independent
empty profile. Inspected the synthetic restored-book screenshot. Physical OS
installation, hosted update/refusal/rollback and week-of-use/accessibility gates
remain pending before invitations. Final combined local checks are complete;
their outcome is recorded in the closeout below.

Verification closeout on the staging branch: `npm run check` passes formatting,
lint, strict types, all 145 units and production build. `npm run test:hosted` with
the explicit staging origin passes six cases; the earlier six failures belong
only to the superseded incorrectly packaged draft. Source `89db2a9` produced the
hosted app; follow-up changes add the test harness, tool-cache lint exclusion and
documentation only. The provider reports deploy state `ready`, branch `staging`,
region `cmh`, no published timestamp and no provider commit reference. Source
provenance is the isolated checkout's recorded Git SHA, not a claimed Netlify Git
integration. No stable production deploy or invitation occurred.

Checkpoints `89db2a9` (configuration) and `7dac500` (hosted tests/evidence) are
pushed in [PR #41](https://github.com/sre0089/TechnoNichi/pull/41), targeting main.
Whitespace, staged paths and four affected local document links pass. No private
original, credential, backup, screenshot or generated bundle is tracked. Final-head
CI is pending; PR #41 has not been granted separate merge approval. The next
bounded action is real-device installation/offline testing of the synthetic hosted
preview, followed by hosted update/rollback validation before production release.

## Hosting-readiness proposal and Chrome acceptance — 2026-11-03

The user reported installing the production app in Chrome, seeing the existing
book without a restore, writing, closing the terminal server and book, then
reopening the installed app without restarting the server and finding the edits.
This is user-reported native Chrome installation and offline-reopen evidence.
Chrome version, OS, elapsed use, backup restore, offline edits after reopening,
Safari/phone behavior and installed-app updates were not reported. Do not infer
those outcomes or publish actual book content.

Installability PR [#37](https://github.com/sre0089/TechnoNichi/pull/37) remains open
at `5d96929`. All four jobs passed in
[CI run 41585988969](https://github.com/sre0089/TechnoNichi/actions/runs/41585988969).
The previous pending-CI/native-Chrome statements below are superseded by this
record. Merge permission remains separate.

The user authorized the next bounded task: hosting proposal and local deployment
readiness checks. Work is on `docs/hosting-readiness`, based on PR #37's reviewed
head. Periodic documentation commits/pushes remain authorized. This task does not
provision services, publish the app, purchase a domain, select a paid plan or merge
PRs. Scope: record the manual result, compare current official provider terms,
specify build/origin/storage/update/rollback requirements and verify local output.
Acceptance: a concrete proposal with costs, known limits and hosted/manual gates.
Tracked by [issue #38](https://github.com/sre0089/TechnoNichi/issues/38).

Checkpoint `556281f` records the Chrome result and is pushed. The proposal is in
docs/PRODUCT_READINESS_PLAN.md under Stage 2: recommend Netlify Free for a small
$0 pilot, with Vercel Hobby/Pro alternatives and current official pricing/terms.
It specifies release settings, a stable root origin, explicit book transfer,
synthetic hosted checks, saved update/refusal, rollback and tester expectations.
No provider choice or hosting configuration has been applied.

Local `npm run build` passes on Node 24.16.0 / Next.js 16.4.4; generated worker
version `3c0ead368415eb4a8efc` includes 23 public resources. A temporary production
server at 127.0.0.1:3300 served exact worker bytes, required worker MIME/cache/CSP/
nosniff headers, valid root manifest metadata and all 23 precache URLs as nonempty
HTTP 200 without redirects. It was stopped after testing. Synthetic reports stay
ignored; no user's browser store was opened. Hosted adapter/CDN, HTTPS/origin and
real-device update/rollback gates remain pending. No runtime/dependency changes.

Proposal checkpoint `94b1ab9` is pushed in
[PR #39](https://github.com/sre0089/TechnoNichi/pull/39), targeting
`feat/installable-book` for a documentation-only diff. Retarget after separately
approved merge of #37. `npm run format:check`, whitespace, dependency-file drift
and four affected local document-link checks pass. Unchanged editor/unit/offline
suites were not repeated; their green final-head CI is recorded above. Private
originals and generated reports remain unpublished. Final-head PR CI is pending.

Next bounded action: review provider/plan and authorize the concrete staging setup
before connecting a host or publishing. Proposed choice is Netlify Free, no paid
add-ons/domain purchase, synthetic data first, stable project origin confirmed
before invites. No spending, hosting configuration, deployment or PR merge occurred.

## Approved integration and local installability — 2026-11-03

The user separately approved merging PRs #31, #34 and #35 after their checks and
asked to continue with smaller periodic commits/pushes. All three merged in order:

| PR  | Result                                   | Merge commit | Final-head CI                     |
| --- | ---------------------------------------- | ------------ | --------------------------------- |
| #31 | Personal book setup; issue #30 closed    | `0855df1`    | 41392913768, all four jobs passed |
| #34 | Editorial typography; issue #32 closed   | `619fb8c`    | 41571003978, all four jobs passed |
| #35 | Dependency maintenance; issue #33 closed | `700fc64`    | 41582646117, all four jobs passed |

Each merged tree exactly matches its reviewed head (`57c88d3`, `bd6dd4f`,
`fd28cb0`, respectively). Local main fast-forwarded to `700fc64`. No repeated app
tests were needed for those identical trees. Private local originals are retained
and unpublished. The previous outstanding merge-permission statements below are
historical and superseded only for these three PRs.

Active branch: `feat/installable-book`, based on merged main `700fc64`, tracked by
[issue #36](https://github.com/sre0089/TechnoNichi/issues/36).
Review PR: [#37](https://github.com/sre0089/TechnoNichi/pull/37), targeting main.
Completed the local installability slice: manifest, original app icons,
installation guidance/prompt support and offline metadata. Hosting, services,
spending, accounts and sync remain separate. Future merges require separate
approval. Checkpoints `e8a4a0c` (integration record), `5238677` (manifest/icons)
and `158e00e` (public metadata cache), followed by `4d31ea9` (installation UI and
journeys), are committed/pushed. Icons were rendered from the original SVG using
existing Sharp 0.35.5; no new dependency. The cache
adds only the manifest and six original icons to its public allowlist, with
emitted contents included in the shell version. Existing save-before-update and
other-window refusal remain in place.

The production-only App setup guide is available on first use, in the book and
from its closed cover. Browser native offers are one-use, save first, preserve
the offer after failed saving and distinguish acceptance from appinstalled.
App info identifies standard/Apple standalone mode without a persisted installed
claim. Guidance explains Safari's separate app store, export before installation,
restore before creating another book, and offline readiness separately. No schema,
archive version, writing geometry or user data changes.

`npm run check` passes format/lint/strict types, 145 units and production build.
`npm run test:offline` passes all 33 cases across Chromium/Firefox/WebKit, including
actual manifest eligibility in Chromium, icon decoding, offline metadata/writing,
guide phone/keyboard behavior, synthetic prompt errors/retry/save refusal and both
standalone signals with closed-cover controls. The full editor regression,
`npm run test:browser -- --workers=3`, passes 245 cases with four existing
intentional skips across the same engines (3.2 minutes).
Native OS/device acceptance and browser/installed storage transfer remain manual;
no hosted deployment has occurred.

An additional ignored local two-build upgrade probe passed in all three engines,
from pre-installability cache `5e4becdd09d550c18a76` to installation-enabled cache
`7a9c67d090ddebe80019`. Failed saving refused activation and retained the latest
draft; retry loaded distinct new scripts; offline reopening preserved book,
pages, preferences, formatted/completed timed writing and note geometry. Three
synthetic entries per engine, no page errors. The final same-source production
rebuild has cache `63f6f76815a570476f9c`; its 33 production journeys passed.
The probe, shell copies and screenshots remain local/ignored, outside CI counts.

Inspected synthetic phone guide and desktop app-mode screenshots. The guide fits
a 320px viewport, scrolls, and restores keyboard focus. Formatting, whitespace and
four affected local document links pass. Private originals remain unpublished.
Common checks passed in [CI run 41585762389](https://github.com/sre0089/TechnoNichi/actions/runs/41585762389)
on `4d31ea9`; browser jobs are pending. The validation-record commit changes only
documentation; final-head CI still must pass before any separately approved merge.

Next bounded action: review the production App setup flow and complete actual
desktop installation/backup transfer checks in PERSONAL_ALPHA.md. Phone acceptance
needs an approved reachable secure origin. Hosting/provider configuration needs
its own concrete review; no next milestone has begun.

## Dependency maintenance — locally verified, 2026-11-03

The user previewed the typography, said it looks great, and requested continued
work. This is visual approval; browser/device were not specified. PR #34 head
`bd6dd4f` passed all four jobs in
[CI run 41571003978](https://github.com/sre0089/TechnoNichi/actions/runs/41571003978).
PR #31 is also green. Neither has been merged or granted separate merge approval.

Completed the bounded maintenance implementation for
[issue #33](https://github.com/sre0089/TechnoNichi/issues/33) on
`chore/dependency-security`, based on `bd6dd4f`. Checkpoint `a00f2bd` is pushed and
[PR #35](https://github.com/sre0089/TechnoNichi/pull/35) targets
`feat/editorial-typography`. Retarget to main after #31 and #34 merge. Periodic
commits/pushes remain authorized; no merge, hosting or service setup occurred.

Next and its lint plugin are 16.4.4; locked Vite/Zod are 8.3.5/4.6.7. A reviewed
Minimatch 11.0.1 override replaces affected 10.x lint dependencies; DECISIONS.md
records API/consumer compatibility evidence and the removal condition. Direct
React, TypeScript, ESLint, TypeScript-ESLint, Vitest and Playwright versions stay
as before. Changed paths are package.json/lockfile, current architecture versions,
decisions/state and Next's generated AGENTS.md heading (h1 to h2, verified against
its installed generate-agent-files.js). No app, template, schema, test, worker or
workflow source changes were required.

Final local checks on dependency checkpoint `a00f2bd`:

- `npm ci`: clean install succeeds from the exact lockfile. `npm audit --json`
  changed from 15 findings (12 moderate, two high, one critical) to zero known
  findings at verification time. This does not predict future registry advisories.
- Lint coverage remains the same 86 files, with no errors/warnings; virtual-source
  and ignored-path probes verify actual TS-rule enforcement and exclusions.
- `npm run check`: format/lint/strict types, 145 units and Next.js 16.4.4 production
  build pass on local Node 24.16.0. Installed version-matched docs were read, and
  AGENTS.md continues to point at the installed Next guides.
- `npm run test:browser -- --workers=3`: 245 pass, four existing intentional skips
  across Chromium, Firefox and WebKit. No new failures or test changes.
- `npm run test:offline`: all 12 production cases pass across the same engines,
  including real font loading, refused updates, retry and offline reopening.
- An additional local actual-two-build shell probe passed in all three engines:
  cache `5e4becdd09d550c18a76` (16.3.8) to `321dd616d4cb1d91f55a` (16.4.4). Failed
  saving refused activation and retained the latest draft; retry loaded distinct
  new script assets; offline reload preserved book/pages/preferences, formatting,
  timed completion and note geometry. Three synthetic entries per engine; no page
  errors. Inspected the synthetic post-update screenshot. The script, shell copies,
  reports and screenshot stay ignored/local and are not counted as CI tests.

[CI run 41581948202](https://github.com/sre0089/TechnoNichi/actions/runs/41581948202)
has passed common checks; browser jobs remain pending at this record. The follow-up
validation commit changes only guidance/documents. Final-head CI must pass before
merge. Whitespace, staged paths and local documentation links are reviewed; no
private inputs, runtime writing, credentials or generated artifacts are published.

Next bounded action: obtain separate permission to merge the reviewed PR stack
#31, then #34, then #35 after required checks pass. Installability is the next
product slice; hosting/provider setup needs its own concrete review. Broader
physical-device, IME, assistive-technology and week-of-use acceptance remain manual.

## Interface typography — locally verified, 2026-11-02

The user confirmed that fresh-browser book creation and settings work. Browser,
device and specific settings were not supplied. PR #31 head `57c88d3` has passed
all four jobs in [CI run 41392913768](https://github.com/sre0089/TechnoNichi/actions/runs/41392913768).
It remains open and unmerged; this confirmation does not grant merge permission.

The user then requested polished UI typography using two attached inspiration
images. Implemented on `feat/editorial-typography`, based on `57c88d3`, tracked by
[issue #32](https://github.com/sre0089/TechnoNichi/issues/32) and
[PR #34](https://github.com/sre0089/TechnoNichi/pull/34). Application checkpoint
`fa5a360` is committed/pushed under the standing periodic-commit instruction.
PR #34 targets `feat/personal-book-setup` to keep its diff focused; retarget to main
after PR #31 merges. Neither PR has merge approval.

Lora gives headings, branding, cover titles and introductory prose a book-like
appearance. IBM Plex Sans supplies compact UI; system monospace supplies quiet
captions. First-use copy and hierarchy are simpler, form values use regular
weight and dialog titles/descriptions have clearer hierarchy. The new fonts are
pinned, locally bundled normal Latin variable faces (83,500 bytes total), with
original OFL licenses under `public/licenses/`. Printed paper and editable writing
keep their original fonts and geometry. Saved data and template versions do not
change.

Changed paths: root font loading and global typography tokens, shared dialog/field
styles, setup UI/copy, exact npm manifests, public font licenses, the memo viewport
browser fixture and actual offline font-loading assertions. Decisions document the
font sources and boundaries.

Final local verification on `fa5a360`:

- `npm run check`: format, lint, strict types, 145 units and production build pass.
- `npm run test:browser -- --workers=3`: 245 pass, four existing intentional skips
  across Chromium, Firefox and WebKit. The initial targeted run exposed a test
  click at y=721 outside its 720px viewport after the header font changed; the
  test now scrolls the memo into view and uses current page bounds. The complete
  final run passes without changing writing geometry or pointer behavior.
- `npm run test:offline`: all 12 production cases pass in the same engines,
  including both actual font faces loaded after network disconnection and only
  app-origin font requests. The unchanged worker includes the new emitted assets.
- Inspected synthetic desktop/phone setup, cover and normally filled spread
  screenshots. License copies match their reviewed packages. Whitespace and
  affected local documentation links pass. No screenshots or private inputs ship.

[CI run 41570472159](https://github.com/sre0089/TechnoNichi/actions/runs/41570472159)
has passed common checks; final-head browser CI is pending at this closeout.
The subsequent validation-record commit changes only documentation. Final-head
CI must pass before merge. Visual approval of the new fonts and broader physical
input/device checks remain manual. Next bounded action: review this UI locally,
then separately approve any merge. No next product milestone or service began.

The font addition leaves the same pre-existing 15 audit findings as the old
lockfile (12 moderate, two high, one critical); neither font is flagged. Existing
framework/toolchain maintenance is tracked in
[issue #33](https://github.com/sre0089/TechnoNichi/issues/33) before hosted use.

## Personal book setup — locally verified, 2026-11-02

Implemented Stage 1 on `feat/personal-book-setup`, tracked by
[issue #30](https://github.com/sre0089/TechnoNichi/issues/30) and
[PR #31](https://github.com/sre0089/TechnoNichi/pull/31). The user authorized
implementation and frequent commits/pushes. Published checkpoints: plan `a80d611`,
setup `e051182` and final application/recovery coverage `441a1f5`.
The PR is open and unmerged; issue #30 remains open pending merge.

Create your book accepts name, year, Today timezone and Today/Last page opening.
Existing metadata is validated without rewriting it. Setup/import require all four
tables to be empty and commit atomically; even an empty imported legacy-shaped
book is protected. Older preferences resume by default. Recovery buffers block
unrelated creation/import, survive original-book restore and open their original
page/side ahead of Today. View settings can change the opening choice. Today
outside the book's year resumes the saved page (January 1 for a new book).

Main changed paths: `src/editor/BookSetup.tsx`, planner startup/settings/backup UI,
`src/local/book-setup.ts`, repository/backup/recovery handling and the preferences
model. Cover titles wrap safely. Synthetic legacy fixtures preserve the existing
regression journeys; separate first-use cases exercise the actual setup screen.
Planning, architecture, decisions and personal-alpha instructions agree with this
scope. No dependencies, IndexedDB schema, services or deployment change.

Final local checks on application head `441a1f5`:

- `npm run check`: format, lint, strict types, 145 unit tests and production build
  passed. Runtime: project-specific Node 24.16.0; exact existing npm lockfile.
- `npm run test:browser -- --workers=3`: 245 passed, four existing intentional
  skips across Chromium, Firefox and WebKit. Initial Today failures were traced
  to the new legacy fixture using UTC; it now retains the configured browser
  timezone and the complete final run passes.
- `npm run test:offline`: all 12 production cases passed across the same engines,
  including a newly created personal book and offline editing/reopening.
- Inspected ignored synthetic desktop/phone setup screenshots; whitespace and
  six local links across the five affected documents pass. Private originals,
  real book data, credentials and generated artifacts remain unpublished.

[CI run 41392448441](https://github.com/sre0089/TechnoNichi/actions/runs/41392448441)
for `441a1f5` has passed its common checks; browser jobs are still running at this
record. Final-head CI must pass before merge. The documentation-only closeout
also triggers CI and does not change application/test sources.

Next bounded action: review PR #31 and try setup/import in a fresh browser profile
without clearing the existing book. Physical-device, real IME, assistive-technology
and week-of-use gates remain manual. Merge requires separate approval. Annual book
switching and Stage 2 installation/hosting remain later scope; no next stage began.

## Product readiness planning — 2026-11-01

The user requested a plan for broader use and practical integrations.
[PRODUCT_READINESS_PLAN.md](docs/PRODUCT_READINESS_PLAN.md) proposes a personal
trial and book setup, an installable invited local-book pilot, optional accounts,
durable cross-device sync, recovery before real cloud use and later planning
conveniences. It records dependencies, acceptance evidence and decisions needed
before service setup. Earlier pilot hosting/PWA work is an explicit proposed
adjustment to the PRD's release order; the PRD remains unchanged.

The user then authorized implementation and frequent GitHub commits/pushes.
The active bounded slice is Stage 1: personal book setup, preserving existing and
imported books. Publish this plan on `docs/product-readiness-plan`, then implement
on `feat/personal-book-setup`. Service provisioning, deployment and merges remain
outside this authorization. The earlier five-step approval has ended.

Verified closeout: [PR #29](https://github.com/sre0089/TechnoNichi/pull/29) merged
on 2026-10-28 as `7518cba1d01c7d165981f1316f9cc022e2036101`; local `main` is
at that commit. The five-step implementation batch is complete. Its recorded
final checks passed 128 units, 221 browser tests/four intentional skips and nine
production offline cases. Those application checks are historical evidence and
are not rerun for this documentation-only plan. Real-device/week-of-use gates
remain unverified.

## Five preapproved steps — 2026-10-28

The user authorized five bounded implementation steps with commits, pushes, PRs
and checked merges. [APPROVED_FIVE_STEPS.md](docs/APPROVED_FIVE_STEPS.md) records
the scope; ordinary stop/approval gates resume after this batch. No deployment,
spending, external services, destructive history changes or private-data uploads.

| Step | Result                                                   | Merge / final CI                                 |
| ---- | -------------------------------------------------------- | ------------------------------------------------ |
| 1    | Duration movement/resizing; issue #20 closed             | PR #25, `7959f1a`; run 40672628651               |
| 2    | Revision-safe page undo/redo; issue #21 closed           | PR #26, `1df47ca`; run 40675794003               |
| 3    | Today/date/month navigation; issue #22 closed            | PR #27, `d2ee98c`; run 40677290268               |
| 4    | Cover and safe book transitions; issue #23 closed        | PR #28, `65ba796`; run 40677449250               |
| 5    | Offline/search/readiness implemented and locally checked | `feat/offline-search`; issue #24 tracks PR/merge |

All four merged trees exactly match their final reviewed heads. Final CI passed
all common and three-engine jobs for each: step 1 had 179 browser passes/four
intentional skips; step 2 had 188/four; step 3 had 200/four; step 4 had 212/four.
Their unit totals were 115, 120, 123 and 124 respectively. Focus and test ordering
races exposed during intermediate runs were corrected before the green merges.

Step 5 implements a generated production shell worker, saved explicit updates,
other-tab update refusal, online cache repair, optional browser storage protection
and book-local search with original-entry navigation. No data/schema change.
Playwright 1.64.0 is pinned after official review to fix the 1.63 WebKit offline
emulation bug. `npm run check` passes format/lint/strict types, 128 units and build.
The full browser run passed 221 journeys with four existing intentional skips.
All six search-focus cases and all nine final production offline cases passed.
A repeated update case exposed focus returning to the old row after unlocking;
writing now claims focus once per selection and a refused update retains its
button focus. All three engines verify refusal, retry, offline search and repair.
The synthetic-year measurement passed in all three engines and was recorded in
PERSONAL_ALPHA.md. Final-head CI is required before merge; issue #24 links the
publication and merge record. Physical device,
real IME, assistive technology and a week of actual planning remain unverified.

## Approved duration-task merge — 2026-10-28

The user separately approved merging PR #19 on 2026-10-28.
[PR #19](https://github.com/sre0089/TechnoNichi/pull/19) merged into `main` as
`9d96a99` at 09:34:13 UTC (05:34:13 America/New_York); issue #18 closed automatically.
Local `main` was fast-forwarded to the same commit. Its complete file tree matches
the reviewed head `17710a9`, including source, tests, dependencies, workflow and
README. No application changes were made during the merge.

Final head `17710a9` passed [GitHub CI](https://github.com/sre0089/TechnoNichi/actions/runs/40658098900):
format, lint, strict types, 111 unit tests, production build and 170 browser tests
with four intentional skips. Those checks were not rerun locally for this
identical-tree merge. Only this project-state record changes afterward on
`docs/duration-merge-state`, with formatting and whitespace checks; publication
continues under the user's standing periodic commit/push instruction.

Duration tasks, overlap selection and archive v2 support are now integrated.
Next bounded action: manually review the duration controls, then scope movement
and resizing of duration tasks. Physical tablet, real IME and assistive-technology
checks remain unverified. No next feature, deployment or service work has begun.

## Duration tasks — implementation and validation history, 2026-10-28

The user confirmed the manual two-tab recovery check works on 2026-10-28. Browser,
device and individual choices were not specified; broader device/IME/accessibility
coverage remains unverified. The user then authorized the next bounded M2 slice:
duration tasks with start/end controls, subtle spans, readable overlaps and the
existing saving/backup/conflict-recovery guarantees.

Work was on `feat/duration-tasks`, based on merged main `7a12c7e` plus merge closeout
`9854b4a`, tracked by [issue #18](https://github.com/sre0089/TechnoNichi/issues/18).
Periodic commits/pushes continued under the user's standing instruction; the user
separately approved merging on 2026-10-28 as recorded above.

Implementation checkpoint `fb931a9` is pushed. Scheduled-block records retain
explicit start/end day offsets. The page derives overlap lanes in the time gutter,
retains existing writing coordinates and offers a readable chooser for entries
sharing an hour, Add/Remove duration and a keyboard accessible interval dialog.
Archived/deleted versions retain endpoints; line/block
conversion conflicts are resolved explicitly. New exports use JSON archive v2;
both v1 and v2 are accepted, and v1 rejects duration records. No dependencies or
IndexedDB stores/indexes change. Existing entry records are not rewritten.

Validation of application checkpoint `fb931a9`:

- `npm run check`: passed formatting, lint, strict types, 111 unit tests across
  ten files, and optimized production build. Twenty-one new unit cases cover
  valid/invalid and overnight intervals, pure lane projection, archive versions,
  deletion/restore and reviewed range/type-conversion conflicts.
- `npm run test:browser -- tests/browser/durations.spec.ts --workers=3`:
  24 passed across Chromium, Firefox and WebKit. Final phone chooser/interval
  refinements also passed their three-engine journeys before publication.
- `npm run test:browser -- --workers=3`: 170 passed, four intentional skips.
  Production build and browser suite ran sequentially. Existing Chromium-only
  touch and visual fixtures retain their skips in Firefox/WebKit.
- Inspected ignored synthetic `artifacts/durations-overlap-desktop.png`,
  `artifacts/durations-phone-controls.png` and `artifacts/durations-phone-chooser.png`.
  Verified paper-relative writing placement, current/other chooser focus, explicit
  overnight validation, failure/retry, full v2 restore and endpoint conflict copies.
- Reviewed source and staged paths; whitespace checks passed. No private inputs,
  screenshots, credentials, application data, dependencies or lockfile changes are
  published. Final PR/CI evidence is linked through tracking issue #18 and its PR.

Runtime for this slice: existing local Node 24.16.0 (project PATH only); the global
Node installation is unchanged. Pointer movement/resizing of duration blocks,
broader undo/redo and the next milestone remain deferred.

Final-head CI and separate merge approval are complete as recorded above.
Duration appearance and physical tablet/IME/accessibility behavior still need
the user's manual review. No next feature or deployment has begun.

Published [PR #19](https://github.com/sre0089/TechnoNichi/pull/19) on this branch.
Initial [CI](https://github.com/sre0089/TechnoNichi/actions/runs/40655541897) passed
format/lint/types, 111 units, production build and 169 browser journeys, including
all new duration cases; four cases skipped intentionally. One existing Firefox
notification check failed after its one-shot fault could permit a later successful
text write. An isolated synthetic reproduction verified an empty focus-write
failing followed by a committed text-write and legitimate notice. The corrected
fixture keeps storage failed through both writes until Retry, confirms the latest
text was attempted/retained and preserves all original assertions and timeouts.
Application source remains identical to `fb931a9`; final CI follows the fixture
correction rather than treating the first run as success.
`npm run test:browser -- tests/browser/tab-changes.spec.ts --grep "failed saves do not announce" --repeat-each=3 --workers=3`
passed all nine strengthened checks. `npm run check` passed again with 111 units
and production build. The PR's Checks tab reports CI for this final correction.
Final corrected head `17710a9` passed all checks with 111 unit tests, production
build and 170 browser tests/four intentional skips before the approved merge.

## Approved tab recovery merge — 2026-10-21

The user separately approved merging PR #17 on 2026-10-21.
[PR #17](https://github.com/sre0089/TechnoNichi/pull/17) merged into `main` as
`7a12c7e` at 04:40:04 UTC (00:40:04 America/New_York); issue #16 closed automatically.
Local `main` was fast-forwarded to the same commit. A full tree comparison with
the reviewed head `b9df802` is identical, including source, tests, dependencies,
workflow and README; no application changes were made during merge.

Final head `b9df802` passed [GitHub CI](https://github.com/sre0089/TechnoNichi/actions/runs/39534041958):
format, lint, strict types, 90 unit tests, production build and 146 browser tests
with four intentional skips. Those checks were not rerun locally for this
identical-tree merge. Only this project-state closeout changes afterward;
formatting and whitespace checks are recorded for it on `docs/tab-merge-state`,
published under the user's continuing periodic commit/push instruction.

The two-tab review is now integrated, and the user confirmed it works manually
on 2026-10-28. The newly authorized duration slice is recorded above. Physical
tablet, real IME and assistive-technology checks remain unverified. No deployment,
new service or dependency change has begun.

## Tab recovery validation — 2026-10-20 publication history

Current bounded slice: issue #16, PR #17, `feat/tab-change-recovery`.
Implementation checkpoints `eb7e5de` and `20a5050` were pushed while main was
`ed6ef3f`. No merge, deployment, service or dependency change had occurred yet.

- Other-tab notices preserve live page writing. Explicit review compares local
  and saved versions, checks revisions transactionally, and offers Keep my writing,
  Use saved writing or Keep both. Preserved versions use existing Deleted entries
  and JSON backups. Closed-tab snapshots offer Save recovery copy.
- Immutable emergency snapshots and independent tab reload buffers prevent
  successful saves from clearing another draft. Malformed/legacy buffers remain
  available; equivalent durable/archive copies are filtered from review.
- `npm run check`: passed format, lint, strict types, all 90 unit tests across
  nine files, and optimized production build on project-specific Node 24.21.0.
- `npm run test:browser -- tests/browser/tab-changes.spec.ts --workers=3`:
  all 39 new browser journeys passed across Chromium, Firefox and WebKit.
- `npm run test:browser -- tests/browser/tab-changes.spec.ts --project=firefox
--grep "notices committed|edit versus" --repeat-each=5 --workers=1`:
  ten passed after conditional dialog focus restoration, with durable-writing
  assertions and original timeouts retained.
- `npm run test:browser -- --workers=3`: 146 passed, four intentional skips.
  Existing phone-touch and visual-fixture cases remain Chromium-only. Production
  build and browser runs were sequential to avoid local CPU contention.
- Reviewed synthetic `artifacts/tab-conflict-desktop.png` and
  `artifacts/tab-conflict-phone.png`; snapshots/traces remain ignored and local.
  Staged path review and whitespace checks pass. Private source documents and
  application data are excluded from publication.
- Final-head CI is available through PR #17's Checks tab. Physical tablet, real
  IME and assistive-technology behavior remains unverified for this slice. Recovery
  buffers remain best effort and same-device only; JSON exports remain necessary
  for independent backups.

The publication gate was final PR CI and separate merge approval under AGENTS.md;
both are now satisfied as recorded above. A manual two-tab review on the user's
browser is still useful; no next M2 feature has begun.

Implementation `20a5050` passed [Ubuntu CI](https://github.com/sre0089/TechnoNichi/actions/runs/39532807634)
with 90 unit tests, production build and 146 browser passes/four intentional skips.
The documentation-head [run](https://github.com/sre0089/TechnoNichi/actions/runs/39533042690)
then passed 145 browser journeys but exhausted the existing 30-second total budget
in WebKit's formatted timed-task delete/rewrite/restore lifecycle while reopening
its second recovery dialog. The fix scopes a 60-second total budget to that
four-reload lifecycle; all assertions, ordinary expect timeouts and retry settings
are unchanged. `npm run check` passed again (90 units and production build).
`npm run test:browser -- tests/browser/deletion.spec.ts --grep "a formatted completed timed task" --repeat-each=3 --workers=3`
passed all nine repeated lifecycle journeys across Chromium, Firefox and WebKit.
The application source remains identical to checked implementation `20a5050`;
the correction changes only that test's total budget and its documentation.
The PR's Checks tab reports CI for the correction's final head.

## Current stage

M1, including the reviewed UI, timed-writing refinements, hourly keyboard
navigation and word-level formatting, is merged into `main`.
The user explicitly approved both merges on 2026-10-06.
[PR #3](https://github.com/sre0089/TechnoNichi/pull/3) merged as `5160a3e`;
[PR #5](https://github.com/sre0089/TechnoNichi/pull/5) was retargeted to `main`
and merged as `eb54eba`. Tracking issues #2 and #4 are closed.

Both approved heads had successful GitHub CI before merge. Final writing source
`7ae15d3` passed 22 unit tests, production build and 52 browser tests with two
intentional screenshot skips. The merged application tree is identical to that
checked head. Exact run links and merge details appear below.
Earlier local-review/publication sections are historical checkpoints.

The user accepted the next bounded proposal on 2026-10-06: versioned local JSON
export/import, including word formatting. Implementation began on `feat/planner-backups`,
based on merged main `619945a` (PR #6). The user approved committing, pushing and
opening a PR on 2026-10-06. Implementation commit `a9ebb3b` is pushed and published
in [PR #9](https://github.com/sre0089/TechnoNichi/pull/9), tracked by
[issue #8](https://github.com/sre0089/TechnoNichi/issues/8). The user explicitly
approved the merge on 2026-10-06. PR #9 merged as `d3ae0da` at
2026-10-07 01:26:30 UTC (October 6 in the user's time zone); issue #8 is closed.
Local `main` was fast-forwarded to the same merge without rewriting history.
The short repository README merged through
[PR #10](https://github.com/sre0089/TechnoNichi/pull/10) as `1ed7960`.
The user authorized reconciling the backup PR with that main branch on 2026-10-06.
The README conflict is resolved by retaining the exact short README from main;
application source, dependencies and tests are unchanged by this reconciliation.
Reconciliation validation passed: formatting, lint, strict types, all 43 unit tests,
production build and all 12 backup browser journeys across Chromium, Firefox and
WebKit. The first sandboxed build could not bind Turbopack's internal port; moving
aside its generated cache and rebuilding with local process permissions passed.
The PR Checks tab reports CI for the updated branch after publication.
The first reconciliation CI run passed 63 browser journeys but failed the existing
WebKit assertion for Left-arrow movement immediately after returning to a row.
Removed the redundant animation-frame caret reset in `Planner.tsx`, which could
overwrite the next keystroke. Tiptap's focus command already preserves selection;
the existing test assertions and timeouts are unchanged. All 15 repeated arrow
journeys passed across Chromium, Firefox and WebKit after this correction.
`npm run check` passed again after the correction, including all 43 unit tests and
the production build. Final head `3c7825f` passed
[GitHub CI](https://github.com/sre0089/TechnoNichi/actions/runs/37555260963):
43 unit tests, production build and 64 browser tests with two intentional skips.
The merged application source, tests, dependencies and short README are identical
to that checked head. This merge record is maintained on `docs/backup-merge-state`.
The user authorized the next bounded M2 slice on 2026-10-07: deletion and recovery
for timed writing, free notes and checklist entries. Implementation was on
`feat/deletion-recovery`, based on main `8029986`, tracked by
[issue #12](https://github.com/sre0089/TechnoNichi/issues/12). The user approved
committing, pushing and opening a PR on 2026-10-07. Implementation `9f21f69` is
published in [PR #13](https://github.com/sre0089/TechnoNichi/pull/13). Final head
`1cf94d9` passed [GitHub CI](https://github.com/sre0089/TechnoNichi/actions/runs/37665927109):
56 unit tests, production build and 85 browser tests with two intentional skips.
The user separately approved merging on 2026-10-07. PR #13 merged as `687ddb0`
at 18:31:50 UTC; issue #12 closed automatically. Local `main` was fast-forwarded
to that merge, and its application source, tests, dependencies and README match
the checked head. The merge record and the user's successful backup recovery
check are retained in the current feature branch.

On 2026-10-19 the user authorized free-note movement/resizing and periodic
commits/pushes. Implementation was on `feat/note-movement-resizing`, based on `687ddb0`,
tracked by [issue #14](https://github.com/sre0089/TechnoNichi/issues/14).
The first checkpoint `69bcf9a` adds pure grid-snapped movement/resizing and six
passing geometry tests. UI checkpoint `05e9084` adds selected-note pointer handles,
keyboard alternatives and cancellation. [PR #15](https://github.com/sre0089/TechnoNichi/pull/15)
merged into `main` after the user's separate approval on 2026-10-19.
Merge commit: `ed6ef3f`, at 07:06:13 UTC; issue #14 closed automatically.
Local `main` was fast-forwarded to that merge. Local validation passed: 62 unit tests, production build and 107
browser journeys with four intentional skips. Checkpoint `05e9084` also passed
[GitHub CI](https://github.com/sre0089/TechnoNichi/actions/runs/39202846186) with
the same counts. Final reviewed head `32be44e` passed
[GitHub CI](https://github.com/sre0089/TechnoNichi/actions/runs/39203423518):
62 unit tests, production build and 107 browser journeys with four intentional skips.
Merged application source, tests, dependencies, workflow and README match that
checked head. This documentation closeout is maintained on `docs/note-merge-state`
under the existing commit/push authorization. Cloud services and other M2 features
remain deferred.

On 2026-10-20 the user authorized two-tab change notices and conflict recovery,
continuing periodic commits/pushes. Work was on `feat/tab-change-recovery`, based
on merged main `ed6ef3f` plus the note merge closeout `eb897d1`, tracked by
[issue #16](https://github.com/sre0089/TechnoNichi/issues/16). The first checkpoint
`eb7e5de` adds transactional decisions/recovery copies, isolated recovery buffers
and metadata-only notifications. UI integration now includes explicit review,
three conflict choices, retained-draft copies and saved-change loading. All 90
unit tests and all 39 new three-engine browser journeys pass. Ten repeated
Firefox journeys also pass after correcting delayed dialog focus restoration.
UI checkpoint `20a5050` is pushed in
[PR #17](https://github.com/sre0089/TechnoNichi/pull/17). Full `npm run check`
passes formatting, lint, strict types, 90 unit tests and production build.
The complete browser suite passes: 146 passed and four intentional skips.
Final reviewed head `b9df802` passed GitHub CI with the same counts. The user
separately approved merging on 2026-10-21; PR #17 merged as `7a12c7e` at
04:40:04 UTC, and issue #16 closed automatically. Local main matches the merge
and the reviewed head's complete file tree. This closeout is maintained on
`docs/tab-merge-state`.

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
- Added toolbar Backups controls, complete-book JSON export after saving drafts,
  file validation/preview and transactional restore into a fresh planner. Word
  formatting, completion, note geometry, exact times, revisions, legacy flags,
  deletion markers and preferences are retained. Restored books reopen correctly.
- Added recoverable deletion for timed tasks, checklist tasks and notes, with
  whole-book recovery and transactional refusal to overwrite occupied placement.
- Added grid-snapped free-note movement/resizing, pointer and keyboard controls,
  cancellation, bounds and retained geometry/text across reload and backups.
- Integrated local two-tab notices and explicit conflict review into main, with
  per-tab draft recovery and transactional archive copies.
- Integrated duration tasks with explicit start/end controls, overlap brackets
  and selection, completion/deletion/conflict recovery, and v2 JSON backups with
  continued support for v1 imports.

## Git status and publication

- Integrated branch: `main` at `9d96a99`; documentation closeout:
  `docs/duration-merge-state`. Merged [PR #19](https://github.com/sre0089/TechnoNichi/pull/19),
  closed issue #18, checked head `17710a9`; implementation checkpoint `fb931a9`
  and validation checkpoint `b1ef36c`. Periodic commits/pushes continue under the
  user's standing instruction.
  Merged [PR #17](https://github.com/sre0089/TechnoNichi/pull/17) as `7a12c7e`,
  closed issue #16, checked head `b9df802`; implementation checkpoints `eb7e5de`
  and `20a5050`. Periodic commits/pushes continue under the user's instruction.
  Merged PR #15, closed issue #14, final checked head `32be44e`.
  Source checkpoints `69bcf9a` and `05e9084` are retained.
  Deletion/recovery implementation: `9f21f69`, merged PR #13, closed issue #12.
  Final head `1cf94d9` passed GitHub CI as recorded above.
  Backup merge record reached main through PR #11.
  Application merge: `eb54eba`.
  Merge-record/test maintenance is tracked by PR #6 below.
- Merged M1 PR: https://github.com/sre0089/TechnoNichi/pull/3.
- Merged writing-controls PR: https://github.com/sre0089/TechnoNichi/pull/5.
- Merged backup PR: https://github.com/sre0089/TechnoNichi/pull/9, base `main`,
  branch `feat/planner-backups`, checked head `3c7825f`, merge `d3ae0da`.
  Issue #8 closed automatically after the explicitly approved merge.
- Tracking issues #2 and #4 closed after their changes reached `main`.
- Implementation history is retained through merge commits; no force push,
  shared-history rewrite, branch deletion or global Git setting change.
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
  Published implementation: `700986f`, followed by the correction described below.

## Keyboard and word-formatting publication — historical checkpoint

- Verified authenticated account `sre0089`, public HTTPS origin, commit identity
  and the existing open PR #3. Fetched the bases; `origin/feat/m1-daily-spread`
  matches local base `f5eb19b`, and `origin/main` remains `49c3176`.
- User authorization covers committing, pushing and opening the follow-up PR.
  [PR #5](https://github.com/sre0089/TechnoNichi/pull/5) targets `feat/m1-daily-spread` so its diff contains only this bounded
  addition. Review/merge PR #3 first, then retarget the follow-up to `main` before
  merging; each merge requires separate approval.
- Source, dependency, unit/browser and documentation changes were reviewed.
  Final source passed the local checks recorded above; publication edits only
  update documentation. Private originals, references, planner data and synthetic
  screenshots remain excluded.
- Committed and pushed implementation `700986f869c61edc6027cd3ddc172b7692479bd2`.
  Opened tracking issue #4 and PR #5; both remain open, and PR #3 remains unchanged.
  Reviewed all 19 staged paths, whitespace and credential patterns before publication.
- Initial GitHub CI run
  https://github.com/sre0089/TechnoNichi/actions/runs/37426754719 passed installation,
  formatting, lint, strict types, 22 unit tests and production build, but a Firefox
  word-replacement assertion failed (51 browser tests passed, 2 intentional skips).
- Corrected editor synchronization: update editability only when it changes, and
  ignore React echoes of the editor's own writes so they cannot replace newer live
  content. External/enlarged-editor changes still synchronize through the same path.
  Strengthened rapid word-replacement assertions and replaced the fixed selection
  delay with observed readiness; repeated runs exposed asynchronous selection
  settling after undo/redo in WebKit. Final checks are recorded below.
- Corrected final source passed `npm run check` (format, lint, strict types,
  22 unit tests and production build), and `npm run test:browser` (52 passed,
  2 intentional screenshot skips). Repeated word-formatting journeys passed
  24/24 across all three engines. The production smoke passed all six fresh
  desktop/phone contexts with no page errors. Its temporary port 3002 preview
  was stopped afterward; the existing development server was preserved.
- Current published CI status is available in
  [PR #5's Checks tab](https://github.com/sre0089/TechnoNichi/pull/5/checks).
  Subsequent correction/documentation commits run the same full workflow.

## Approved merges — current status, 2026-10-06

- User approved the outstanding work and both merges. Verified authenticated
  account `sre0089`, public origin, clean tracked workspace and exact approved
  heads before acting. Private original documents remained untracked.
- PR #3 head `f5eb19b5a8cd03f106325faf390a08785768cc90` had successful CI:
  https://github.com/sre0089/TechnoNichi/actions/runs/37406188769.
  Merged with head matching as `5160a3e0258d70f3c6494e0a0c8da65f7820b620`.
- Retargeted PR #5 to `main` after PR #3 merged. Its approved head
  `7ae15d345b7602c70deb7184c65627b9039e5ac9` remained unchanged, mergeable and
  checked successfully in
  https://github.com/sre0089/TechnoNichi/actions/runs/37427991591:
  clean install, format, lint, strict types, 22 unit tests, production build,
  52 browser tests and two intentional screenshot skips.
- Merged PR #5 with head matching as
  `eb54eba1d92a86785f50574e6600b5484f40851a`. GitHub closed both tracking issues.
  Fetched origin and fast-forwarded local `main`; comparison against `7ae15d3`
  showed no tree differences. No application changes or repeated local tests
  were needed for the merges.
- Merge-record documentation uses a separate `docs/approved-merge-state` branch.
  Main's post-merge workflow runs at
  https://github.com/sre0089/TechnoNichi/actions/runs/37429040322;
  its run page reports its current outcome. The first post-merge run and the
  first merge-record run exposed a Chromium test-fixture failure: synthetic
  empty contenteditable fill sometimes left the text unchanged. All other
  51 browser tests passed, with two intentional screenshot skips.
- Updated the occupied-hour regression to use the real Cmd/Ctrl+A, Backspace
  interaction and explicitly assert empty writing before checking the line split.
  All 15 repeated clearing journeys passed across Chromium, Firefox and WebKit.
  Application source is unchanged. The merge-record PR includes this test
  correction and runs the full CI workflow. No deployment occurred.
- Merge-record/test follow-up:
  [PR #6](https://github.com/sre0089/TechnoNichi/pull/6), tracked by
  [issue #7](https://github.com/sre0089/TechnoNichi/issues/7).
- Final merge-record/test correction passed `npm run check` (format, lint,
  strict types, 22 unit tests and production build) and `npm run test:browser`
  (52 passed, two intentional screenshot skips). PR #6's Checks tab records
  the published head's workflow result.

## Files and scope

- App/editor and shared UI: `src/app/`, `src/editor/`, `src/components/ui/`.
- Pure document/template/calendar: `src/domain/`, `src/templates/`.
- Durable storage/draft serialization: `src/local/`.
- Unit and browser journeys: `tests/`.
- Tooling: `package.json`, `package-lock.json`, `.nvmrc`, TypeScript/Next/ESLint/
  PostCSS/Prettier/Vitest/Playwright configs, ignore rules, `.github/workflows/checks.yml`.
- Docs: PRD, architecture, page template, decisions, README, contributing guide,
  interface system and AGENTS. Font license: `public/licenses/kalam-OFL.txt`.

## Local backup slice — implementation, 2026-10-06

- Strict version-1 `daily-book-backup` envelope; full ordered yearly manifest,
  all entry records and local preferences. Unsupported versions/templates,
  incomplete dates, broken references, duplicate IDs/active checklist slots,
  unknown fields and invalid geometry/time/formatting/preferences are rejected.
- Files are capped at 20 MiB, 50,000 records, one million UTF-16 text units and
  20,000 formatting runs per entry. Supported daily-template-v1 years: 1900–2200.
- Download locks local editing/navigation, flushes latest drafts and reads a
  consistent snapshot. Failed saving prevents download and preserves recovery.
- Choosing a file only validates/previews it. Explicit restoration atomically
  checks the destination and writes all four stores. Only an empty database or
  generated empty 2026 shell is eligible; any saved entry, including empty or
  deleted records, prevents replacement. Unrelated empty books are preserved.
- No merge/replace flow, server upload, encryption or automatic backup is added.
  Successful restore activates the imported book/preferences immediately and on
  reload. Concurrent restores serialize; revision checks remain active afterward.
- Uses existing shared UI/dependencies. Changes are in `src/local/backup.ts`,
  repository initialization/transactions, the planner hook, `BackupsDialog.tsx`,
  toolbar and shared dialog dismissal. New unit/browser tests cover round trips,
  leap years, formatting, legacy/deleted records, duplicates/invalid inputs,
  existing-writing refusal, rollback/retry, queue failure and phone keyboard UI.
- Final `npm run check`: pass (format, lint, strict types, 43 unit tests and optimized
  production build). Full `npm run test:browser -- --workers=3`: 64 passed, two
  intentional screenshot skips, across Chromium/Firefox/WebKit.
- Synthetic desktop/320px phone captures were inspected. Corrected an unintended
  border around the restore section caused by omitted Tailwind Preflight; the final
  source passed `npm run check` and all 12 backup browser journeys again. Captures
  are ignored `artifacts/backups-desktop.png` and `artifacts/backups-phone.png`.
- Production preview on port 3002 passed hydration, complete-year JSON download,
  empty-book restoration and reload with no page errors, using an isolated synthetic
  browser profile. Temporary preview was stopped; the user's port-3000 development
  server was preserved. Physical device/assistive-technology checks remain pending.
- `git diff --check`: pass. Source, tests and affected documentation were reviewed;
  private originals remain untracked and captures are ignored. No dependencies,
  credentials, personal planner data or private references are included.
- Branch `feat/planner-backups` is based on `619945a`. The user approved
  commit/push/PR publication on 2026-10-06. Implementation `a9ebb3b` is committed,
  pushed to the public origin and published in PR #9, which closes issue #8 when
  merged. Publication records are included in a documentation follow-up commit.
  [PR #9's Checks tab](https://github.com/sre0089/TechnoNichi/pull/9/checks) records
  CI on each published head. Merge requires separate approval.
- Initial GitHub CI runs on `a9ebb3b` and `7d82f63` passed all project checks and
  63 browser tests, with two intentional skips, but the combined WebKit backup
  round trip exceeded the 30-second test budget. The restore profile opened only
  21–25 seconds after the source profile; inline cleanup masked the timed-out step.
  Give only that multi-profile journey 60 seconds, add named phases and use fixture
  teardown for the restore context. All assertions keep their normal five-second
  timeout and other journeys keep 30 seconds. Nine repeated round trips passed
  locally across all three engines; all 12 backup journeys and `npm run check`
  passed again after the fixture correction. The test correction is included in PR #9;
  its Checks tab reports CI for the corrected head. Application source is unchanged.
- The CI run on `6eae55a` passed all backup journeys and project checks; an existing
  WebKit boundary-arrow fixture instead failed after a scripted focus jump to an
  empty field. Tiptap schedules focus on an animation frame. Use real field clicks
  and assert the starting focus before testing the boundary arrows, preserving
  the existing focus/navigation assertions. All 15 repeated keyboard journeys
  passed across the three engines, and `npm run check` passed again. PR #9 includes this fixture refinement;
  application source remains the approved backup implementation.

## Limits and next action

The visual template is independently drawn and estimated, not an exact measured
copy. The initial book is 2026, opening on October 6–7; navigation stays within
that book. Full year-selection/cover/Today/date-jump/month navigation is M3.
Duration tasks are integrated on main through approved PR #19 (closed issue #18).
Pointer dragging/resizing of duration tasks remains a separate slice.
There is no full rich text or book-wide undo,
cached offline reopening, search, accounts, sync, or deployment. Local JSON backups
are available on `main`; they do not merge/replace a populated planner.

Stale writes are blocked rather than silently overwriting. Explicit conflict review
and cross-tab notices are integrated on main through approved PR #17, with final
head `b9df802` validated locally and by GitHub CI.
Richer archives remain deferred. Browser eviction
can still remove local data, and the auxiliary draft buffer is best effort.
A local save is not a cloud sync or backup. Device checks and full performance
profiling remain pending; no FPS claims were made.

The user confirmed on 2026-10-19 that backup recovery works in their manual check.
The device/browser and individual scenarios were not specified; this confirmation
does not establish completion of the separate deletion/occupied-slot checks.

Free-note movement/resizing is merged, and the user confirmed on 2026-10-20 that
moving and resizing work in their manual check. The device/browser and input
method were not specified; broader touch, pen and accessibility coverage remains
unverified. Two-tab change notifications and stale-edit recovery, authorized on
2026-10-20, are complete and merged after separate approval on 2026-10-21.
The user confirmed the two-tab check works on 2026-10-28 and authorized duration
tasks next. PR #19 merged after separate approval on 2026-10-28. Next: manual
duration review, then scope duration movement/resizing. Other M2 features remain
deferred.
Physical device checks remain pending as described above.
Recommend branch protections only
after the first real GitHub CI run and verification of available repository features.

## Deletion and recovery — local implementation, 2026-10-07

- Select writing and choose **Delete entry**, then confirm or keep it. Deletion
  flushes the latest draft before a revision-checked transaction; the page changes
  only after the write commits. A failed save or delete leaves writing retained.
- **Deleted entries** lists the whole current book, newest deletion first, with
  twenty entries per page. Restore retains IDs, text, styles, word ranges,
  completion, exact time and note geometry. Off-spread restore stays on the current
  spread; the writing is present when its original page is opened.
- Restore checks the original placement in the same transaction as its write:
  an active entry in that hourly row/checklist slot or an intersecting note refuses
  restoration. Even an empty saved slot is occupied. Both entries stay unchanged.
- New hourly/checklist entries reserve all retained IDs, including deleted IDs,
  so rewriting an emptied slot cannot replace deleted history. No schema or
  dependency change is needed. Deleted records remain in JSON backups and can be
  restored individually after importing a complete-book backup.
- A Firefox rewrite journey exposed a stale empty-entry echo while native input
  was still pending. Focused editor content now remains authoritative; initial
  focus-save echoes are also tracked with this editor's own emitted records.
  Five repeated Firefox checklist journeys passed after the correction.
- Full browser suite: 85 passed, two intentional screenshot skips, across
  Chromium, Firefox and WebKit. All 21 new recovery journeys passed. Synthetic
  desktop and 320px phone screenshots were visually inspected; artifacts remain
  local and ignored. Final `npm run check` passed: formatting, lint, strict types,
  all 56 unit tests across six files and the production build. Whitespace checks
  passed. The unit suite includes two connections racing to restore different
  deleted entries into one slot; exactly one succeeds and the other is retained.
- The browser-test permission review once timed out; its permitted retry succeeded.
  Physical touch/IME/assistive-technology testing remains unverified. Permanent
  deletion, alternate-placement restoration, book-wide undo and cross-tab change
  notifications are not added.

## Free-note movement/resizing — verified implementation, 2026-10-19

- Dedicated selected-note handles preview snapped movement/resizing. A completed
  gesture queues one geometry edit; clicks do not snap old unsnapped notes.
  Escape, pointer cancellation/lost capture, blur, scrolling and viewport changes
  cancel without persisting the preview. Navigation, other entry actions and view
  changes are locked during the gesture; native text editing remains separate.
- Arrow keys on handles move/resize by one square, Shift by five. Contextual Move
  and size buttons provide alternatives to dragging. Grid bounds/minimum sizes
  preserve all text and original identity; overflow reading/editing is retained.
- `npm run check` passed after the interaction refinements: formatting, lint,
  strict types, 62 unit tests across seven files and production build. Full local
  browser run `npm run test:browser -- --workers=3`: 107 passed, four intentional
  skips (two Chromium-only visual fixtures, two Chromium-only touch injections
  skipped in Firefox/WebKit). Synthetic desktop and
  phone screenshots were visually inspected and remain ignored local artifacts.
- All 22 new browser journeys passed across Chromium, Firefox and WebKit; two
  touch-injection cases are intentionally skipped outside Chromium. The new
  cancellation fixture includes Firefox's zero-valued mouse pointer ID.
- A concurrent build caused one earlier Firefox test timeout; without the build,
  that journey passed with unchanged assertions/timeouts. Another run exposed
  an existing WebKit failed-save setup racing its error-banner layout shift. The
  fixture now waits for Storage problem before targeting Delete; subsequent
  recovery assertions remain intact. The complete suite passed afterward.
- Chromium touch injection passed; real touch, pen, IME and assistive-technology
  checks remain pending. New notes are created below 03:00; movement may use the
  printed grid, including legacy upper-grid notes. No dependency/schema change,
  duration blocks, book-wide undo, cloud work or deployment is included.
- On 2026-10-20 the user confirmed moving and resizing work in their manual
  check. Device/browser, input method and individual scenarios were not specified.

## Approved batch — date navigation

Step 3 adds Today, native date entry, a keyboard-accessible month calendar and a
miniature-calendar trigger. Stable manifest order selects spread/side; timezone
and out-of-book behavior are explicit. Navigation flushes drafts before loading
and refuses failed saves. Browser validation covers phone resume, first/last
pages, Today at timezone midnight, month browsing and save failure. Leap-day,
DST and manifest-parity checks are in the new navigation unit tests. PR #27 subsequently merged as `d2ee98c` after final CI passed; no deployment/service configuration.

Step 3 local checks passed: format/lint/strict types, 123 units and production
build. The combined navigation/editor suite passed 64 browser journeys with two
intentional visual-fixture skips; all 12 new navigation cases passed across the
three engines. Synthetic date-navigation screenshot was inspected. Final PR CI subsequently passed the complete suite before merge.

## Approved batch — book interactions

Step 4 is implemented on `feat/book-experience`: original cover, save-before-close,
same-date open/resume, explicit 180ms CSS spread transitions, device reduced motion
and an optional saved No animation preference. No cloned editors or curl library.
Resize/blur settles motion; input/placement controls lock during transitions.
All 21 book/history engine cases passed locally after the final cover-only
visibility polish. `npm run check` passed format/lint/strict types, 124 unit tests
and production build. Synthetic cover screenshot was inspected. Final CI subsequently passed before PR #28 merged as `65ba796`. Earlier steps
merged through PRs #26/#27; the WebKit history test ordering correction is pushed as
`51439cb` and included in #27. Physical device/motion approval remains manual.
