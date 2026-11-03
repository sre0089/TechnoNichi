# Product readiness plan

Planning date: 2026-11-01; readiness review updated 2026-11-03. Stage 1, interface
typography and dependency maintenance merged through PR #35. Local installability
in PR #37 passed all four final-head CI jobs and the user's reported native Chrome
installation/offline-reopen check. PR #37 remains open. The user authorized the
hosting proposal and local checks in issue #38; provider setup, spending,
deployment and further merges remain separate. The starting-point snapshot below
is historical; PROJECT_STATE.md records current implementation and evidence.

## Goal and release boundaries

Make the book useful for an ordinary person's daily cycle: open Today, capture
work, plan time, complete tasks, review the day and choose what to carry forward.
Keep the book as the main interface and preserve immediate offline editing.

There are two distinct releases to prepare:

1. An invited local-book pilot: people create their own book and use an installed
   or browser-based app at a stable HTTPS address. Books remain in their browser;
   portable backups and storage limits are explained clearly.
2. A private cross-device beta: optional accounts add a private cloud copy, durable
   synchronization, version recovery and a tested server-backup process.

Broader public launch follows those trials. Hosted access alone does not establish
cross-device continuity, account privacy or backup readiness.

The PRD remains the product baseline. This plan **proposes** moving a minimal PWA
installation experience and an invited local-only deployment ahead of M5. The PRD
currently places installability refinements/private deployment in later work.
This sequencing change needs review before execution. Quick capture and reminders
are additional proposals; recurrence and further page views remain later scope.
No PRD requirements are silently replaced by this document.

## Verified starting point — historical snapshot, 2026-11-01

- Merged PR #29 provides duration placement, page undo/redo, date navigation,
  cover/transitions, local search, JSON archives and cached production opening.
- Its recorded final checks passed: 128 unit tests, 221 browser tests with four
  existing intentional skips, nine production offline cases, format/lint/types
  and build. These results were recorded on 2026-10-28, not rerun for this plan.
- The implementation stores books in Dexie/IndexedDB. It has no account or cloud
  sync layer. `initialize()` still creates `personal-2026`, with a fixed starting
  spread. A first-use/year-selection flow and app manifest remain to be built.
- Real tablet, real IME, assistive-technology and week-of-use acceptance remain
  unverified. Existing desktop samples do not establish physical-device behavior.
- Existing browser-local IDs can repeat on different devices. Cloud design must
  address identity mapping and distinguish local revisions from server revisions.

## Proposed delivery order

| Stage | Deliverable                                 | Depends on                                | Exit evidence                                                                      |
| ----- | ------------------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------- |
| 0     | Personal trial and focused fixes            | Existing app                              | Seven days of planning, real-device checks and backup restore recorded             |
| 1     | Personal book setup and safe migration      | Baseline audit; may run during trial      | Fresh users create a chosen-year book; existing/imported books survive             |
| 2     | Installable invited pilot                   | Stages 0–1; hosting approval              | Hosted install/offline/update/restore journeys work on target devices              |
| 3     | Accounts and ownership boundary             | Pilot feedback; backend approval          | Two accounts cannot access one another's cloud or cached books                     |
| 4     | Durable sync and conflict recovery          | Stage 3 and a reviewed sync specification | Two devices pass offline, retry, conflict and deletion journeys                    |
| 5     | History, operational recovery and beta gate | Built alongside stages 3–4                | An isolated server restore and fresh-device recovery succeed before real cloud use |
| 6     | Daily planning conveniences                 | Trial evidence; stable earlier stages     | Small independently accepted features improve capture/review                       |
| 7     | Broader launch readiness                    | Stable invited beta and its evidence      | Approved support, costs, privacy behavior, monitoring and release/rollback plan    |

These are ordered work packages, not calendar promises. The seven-day trial is
actual elapsed use. Estimate implementation slices after scoping them; sync and
recovery are several coherent slices, not one dependency-installation task.

## Stage 0 — Establish daily-use evidence

Use [PERSONAL_ALPHA.md](PERSONAL_ALPHA.md) as the trial procedure. Record device,
browser, input method and the result of each manual check without publishing real
book text or screenshots. Collect usability problems as specific reproducible bugs.

Acceptance: write and finish a real day; reopen after a browser restart; edit and
reopen offline; use touch placement and zoom; use keyboard/real IME/screen reader;
export and restore in an empty profile without damaging the original. Fix any
loss, save-status, input or recovery defect before inviting other users.

Output: a short acceptance record and a prioritized bug list. Manual checks remain
pending until a person performs them. Use one small issue/branch/PR per actual fix.

## Stage 1 — Personal book setup

Replace the fresh-store demo bootstrap with a small Create your book flow:
book name, chosen year, stored Today timezone and Today/resume opening behavior.
Introduce backup/import and the meaning of Saved on this device at the point where
they are useful. Offer an explicit import into a suitable empty destination.

Preserve existing books, IDs, dates, positions, formatting and pending recovery
buffers. Do not infer first use solely from an empty entries table: an empty
custom/imported book is still a real book. Define fresh-store detection and any
versioned migration before changing startup. Do not rename `personal-2026` or
silently convert existing books to another year.

Acceptance: a fresh profile can create 2026, 2027 or a leap-year book; Today opens
the right side; a returning user resumes; current fixtures and v1/v2 archives
survive the change; failed setup/import leaves existing data intact. Keep one
active yearly book for this slice. Define a safe year-rollover path before broader
launch; multi-book/archive UI requires separate scope under the PRD's later work.

## Stage 2 — Installable invited pilot

Local implementation authorized on 2026-11-03 under issue #36: manifest/original
icons, production App setup guidance/native offers, separate-store recovery hints
and public metadata caching. Local production tests cover prompt/save/retry and
offline behavior. This completes only the local implementation slice; physical
device installation, a stable hosted origin and invited-pilot acceptance remain
pending. No hosting or service has been provisioned.

Add a manifest, original icons and installation guidance, reusing the existing
offline worker. Test installed and browser modes on actual target devices;
installation and offline readiness are separate states.

Vercel is a hosting candidate for the existing Next.js app. Before provisioning,
review the intended use, eligible plan, budget, region, stable domain and build
compatibility. Vercel Hobby is limited to personal non-commercial use; do not
assume it covers the planned product. No provider or paid plan is selected here.

Use synthetic data for the first hosted staging check. Verify that the host
packages the generated `public/sw.js`, serves its headers correctly and supports
the pinned Node/runtime. Verify online/offline reopening and updates against the
hosted build, not only local production preview. Test rollback with an existing
book and cache; never solve a deployment problem by asking users to clear books.

Choose the stable origin before testers create real books. Development, preview
and production origins have separate stores; transfer is explicit export/import,
with a retained backup. Keep staging separate from production data. Agree a small
invited group, support/feedback path and privacy/storage explanation before invites.

Acceptance: a new tester can create or import a book, install/open it, plan offline,
apply an update safely and restore a backup using the provided instructions.

### Hosting proposal — reviewed 2026-11-03, not provisioned

Recommendation: use **Netlify Free for a small, $0 local-book pilot**, subject to
the hosted compatibility checks below. This is a proposed choice, not an account
or deployment. It supports a possible commercial direction without assuming
Vercel Hobby eligibility. Vercel remains the closest Next.js platform fit if a
personal non-commercial pilot is confirmed or a paid budget is approved.

| Option                          | Current baseline cost                                                                                 | Fit and constraint                                                                                                                                        |
| ------------------------------- | ----------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Netlify Free, recommended pilot | $0/month; 300 credits/month                                                                           | Commercial projects permitted. Next.js uses Netlify's OpenNext adapter, so verify this exact build and worker after packaging. Limits can pause the site. |
| Vercel Hobby                    | $0/month                                                                                              | Native Next.js support; restricted to personal, non-commercial use. Product intent alone does not establish eligibility.                                  |
| Vercel Pro                      | Starts at $20/month with one developer seat and included usage credit; additional usage can cost more | Framework-aligned alternative when Hobby is unsuitable; needs explicit budget approval.                                                                   |

Sources: [Netlify pricing](https://www.netlify.com/pricing/),
[commercial-project eligibility](https://www.netlify.com/blog/introducing-netlify-free-plan/),
[Next.js integration](https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/overview/),
[Vercel pricing](https://vercel.com/pricing/) and
[Hobby eligibility](https://vercel.com/docs/plans/hobby).
Use the current pricing page's credit model, not the older allowance figures in
Netlify's commercial-eligibility announcement. Prices are a point-in-time review,
not an approved charge or a guarantee about a particular account.

Netlify production deployments consume 15 credits each; four successful releases
would use 60 of the 300 credits before traffic/compute. Bandwidth consumes 20
credits/GB; requests consume 2 credits/10,000. These are rates, not a usage forecast.
Free has hard limits rather than overage charges; exhausting a project's allowance
can pause all projects on the account until reset or an upgrade. Keep this pilot
separate from unrelated critical projects, monitor usage, retain Free and leave
auto recharge off. Frequent GitHub commits need not become production releases.
[Credit rates](https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/how-credits-work/),
[limits and recharge](https://www.netlify.com/pricing/).
If choosing Vercel Pro instead, approve the base subscription and on-demand budget
separately; its spend-pause checks can lag usage and are not an exact dollar cap.
[Spend management](https://vercel.com/docs/spend-management).

### Proposed build and release settings

These are reviewable settings for a later authorized setup, not installed config.

| Setting          | Proposed value or acceptance rule                                                                                                                                                                                                                                       |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Repository       | Existing public `sre0089/TechnoNichi`; grant Git integration access to this repository only where supported.                                                                                                                                                            |
| Source           | Approved, green `main` after separate merge approval for PR #37 and this documentation. Record the deployed commit SHA.                                                                                                                                                 |
| Project root     | Repository root; keep the detected Next.js integration.                                                                                                                                                                                                                 |
| Node             | Explicit major `24.x`, consistent with `.nvmrc` and `engines.node`; record the actual provider patch version.                                                                                                                                                           |
| Install          | Netlify defaults to `npm install`; reject any manifest/lockfile drift, then run `npm ci` before building. On Vercel, explicitly set the install command to `npm ci`.                                                                                                    |
| Build            | Netlify: `git diff --exit-code -- package.json package-lock.json && npm ci && npm run build`. Vercel: `npm run build` after its explicit install. Both run the worker generator; bare `next build` omits it.                                                            |
| Output           | Next.js framework output; Netlify's detected `.next` integration, not a raw `public/` upload or static export.                                                                                                                                                          |
| Secrets/services | No app environment variables, database, auth, asset store or email service required for this slice. Authenticate interactively; never put credentials in source or chat.                                                                                                |
| Dependencies     | Review and record the platform adapter/version before accepting staging. Netlify auto-updates its adapter by default; this is outside the npm lockfile. If incompatible, review a pin or provider change separately. No adapter or CLI was installed for this proposal. |
| Region           | Local book data stays on-device; no cloud book-data region is being selected. Record any provider function region and ordinary hosting logs during setup; revisit residency before cloud storage.                                                                       |
| Publication      | First build is synthetic staging only. Lock production auto-publishing after a known-good baseline, then publish vetted builds manually after CI and staging checks. Keep preview data synthetic.                                                                       |

Both providers document Node 24 support:
[Netlify Node 24](https://www.netlify.com/changelog/2026-07-07-nodejs-24-default-new-sites/),
[Vercel Node versions](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions).
Netlify's documented automatic install uses `npm install`, not `npm ci`.
The proposed build command therefore checks for dependency-file drift and runs
a clean locked install before compiling. This is our proposed guard, not a claimed
provider setting or a hosted-tested command; staging must verify that Git state
is available and logs show the intended commands. Refuse release if the guard or
clean install fails; do not silently accept regenerated dependencies.
[Netlify dependency management](https://docs.netlify.com/build/configure-builds/manage-dependencies/).
Vercel recognizes the package build script; still verify its effective command.
[Vercel build settings](https://vercel.com/docs/builds/configure-a-build).
Netlify supports locking the published deploy while subsequent builds continue.
[Deploy management](https://docs.netlify.com/deploy/manage-deploys/manage-deploys-overview/).

### Origin, book transfer and tester expectations

Choose and record one stable HTTPS production origin before testers create real
books. Initially propose the provider's included project subdomain, with no domain
purchase. Its exact name/availability is unresolved; no URL has been reserved.
Use `/` for app start, identity and worker scope. Do not deploy under a repository
subpath: the existing worker, manifest and static URLs are root-relative.

Localhost, preview URLs, the chosen production domain, alternate domains and
Safari installed containers can have different stores. Export a backup on the
old origin, retain the original, open the destination online, and restore into an
empty store before creating another book. Never overwrite an existing destination
book or ask testers to clear site data. A later domain change needs the same
transfer procedure; redirection does not transfer IndexedDB or app installation.

The invited pilot's application URL can be publicly reachable. Inviting a small
group does not provide authentication or make hosting private. Each person's book
remains in that browser/container; no account, cloud copy, recovery email or device
sync is provided. Ordinary host request logs may include IP/URL metadata; journal
text and search remain local. Keep analytics/session replay off in this slice.
Start with 2–3 invited testers after acceptance, provide this local-storage/backups
explanation, and collect sanitized bugs through the existing repository Issues.
Never ask for personal backups or screenshots in public issues.

### Hosted acceptance and rollback procedure

All hosted checks below remain pending. Local results are narrower evidence.

1. On a synthetic staging build, request `/`, `/sw.js`, `/manifest.webmanifest`
   and every URL in the worker's precache list. Require HTTP 200, correct MIME
   types, no sign-in/HTML interception, correct root scope and the actual generated
   worker. Verify CDN responses preserve `no-cache, no-store, must-revalidate`,
   JavaScript MIME, `nosniff` and the existing worker CSP. Platform packaging must
   include `public/sw.js` generated after Next's build; build success alone is
   insufficient. Confirm all font/icon requests remain on the app origin.
2. In a clean profile on the chosen stable origin, create a synthetic book, write
   tasks/notes, complete/style/move entries, save and reopen. Export and restore in
   a separate empty profile; compare dates, text, completion and geometry without
   modifying the original. Verify a second tester receives their own fresh store.
3. Install on actual desktop Chrome and Safari, then iPhone/iPad Safari. Launch
   from the icon, follow separate-store restore guidance, wait for Available
   offline, disconnect networking, write and reopen. Use airplane mode for phones;
   localhost desktop evidence does not establish hosted/mobile behavior. Record
   device/OS/browser versions, icon appearance and observed store sharing.
4. Publish a second vetted shell at the same origin with no schema change and
   keep a synthetic installed book open. Confirm Save and update waits for saving;
   failed saving and another tab/app window refuse activation; retry preserves all
   writing and loads the new shell. Verify offline reopening after the update.
5. Re-publish the previously known-good compatible deployment at the same origin,
   keeping auto-publishing locked. Confirm worker update discovery, explicit saved
   activation and offline reopening with the current book still intact. Host
   rollback does not instantly replace an already cached/installed shell or roll
   back its IndexedDB. This procedure approves no schema downgrade; a future
   migration needs a separate compatibility/forward-fix plan. Never clear books
   or caches as a rollback instruction.
6. Before invites, record production SHA, real URL, plan/usage controls, effective
   adapter/Node versions, header checks, manual results, known limitations and a
   support path. Finish the daily-use/accessibility gates in PERSONAL_ALPHA.md.
   If any loss, saving or recovery check fails, hold invites and open a focused bug.

Netlify can republish an available prior atomic deployment without rebuilding;
locking publication prevents an automatic Git deployment undoing that rollback.
[Rollback and deploy locking](https://docs.netlify.com/deploy/manage-deploys/manage-deploys-overview/).
Vercel's alternative rollback limits depend on plan.
[Vercel rollback](https://vercel.com/docs/instant-rollback).

### Local readiness result — 2026-11-03

On Node 24.16.0, `npm run build` succeeds with Next.js 16.4.4 and generates 23
public shell resources, version `3c0ead368415eb4a8efc`. A temporary production server
on `127.0.0.1:3300`, separate from the user's book, served the exact generated
worker bytes and expected worker headers. All 23 precache URLs returned nonempty
HTTP 200 responses without redirects. Manifest name, standalone display and root
identity/start/scope passed. The temporary server was then stopped. The synthetic
response report stays ignored under `artifacts/hosting-readiness/`.

This verifies local Next output, not Netlify/Vercel packaging, CDN behavior, DNS,
HTTPS, rollback or target-device installation. The preceding unchanged application
head `5d96929` passed all four jobs in CI run 41585988969. This documentation-only
task changes no runtime code, dependencies, configuration or data; it does not
repeat the unchanged editor/unit/offline suites or claim hosted acceptance.

## Stage 3 — Accounts and ownership

Candidate services: Supabase Auth and PostgreSQL, consistent with the PRD.
Decide the initial sign-in method, account-recovery path, region and budget before
configuration. If email sign-in is chosen, review production email delivery and
limits as part of that slice. Guest use remains available.

Build an account-scoped local-storage boundary before enabling cloud journals.
Signing out or switching accounts must not render the previous person's cached
book. Preserve/export unsynced drafts instead of clearing them automatically.
Moving a guest book into an account is explicit and validates conflicts; it must
not combine unrelated books silently.
Define user-initiated book/account deletion and its local-cache/backup-retention
behavior before inviting people to store real cloud books.

Review server keys/identity mapping for repeated legacy IDs. Define ownership
for every book, page, entry, revision and mutation; validate both database grants
and row-level policies. Keep administrative credentials server-side. Revisit the
static-shell cache policy before adding authenticated/server-rendered routes:
private book responses and auth tokens must stay out of shared shell caches.

Acceptance: anonymous access is refused for cloud journals; account A cannot read,
insert, update or delete account B's records even through direct API requests;
account switching, logout, expired sessions and guest migration preserve the
appropriate drafts. UI/account isolation is not a claim of end-to-end encryption.

## Stage 4 — Durable synchronization

First write a small protocol specification with operation and failure examples.
Keep local saves immediate. Atomically save each document mutation and an outbox
operation, including deletes, restores, undo and duration/geometry changes.
Separate local CAS revisions from the last acknowledged server revision.

The server authenticates ownership, validates content, deduplicates mutation IDs
and checks expected revisions in one transaction. Acknowledgements follow durable
commit. Clients pull through a durable change cursor, including tombstones. Any
Realtime integration is a prompt to pull; missed notifications cannot lose edits.

Preserve both versions of edit/edit and edit/delete conflicts. Provide explicit
Keep local / Keep remote / Keep both choices. Keep local save status separate from
Syncing / Synced / Offline / Sign-in required / Conflict. Device zoom, toolbar and
page-focus preferences stay local unless a later requirement changes that.

Split implementation into: mutation/outbox and migration; authenticated push and
deduplication; cursor-based pull; conflict decisions and UI. Use synthetic books
until the privacy and recovery gates pass. Add migrations and backward archive
tests where record formats change; never export credentials with a book backup.

Acceptance: two devices converge after offline edits, duplicate delivery, dropped
responses, reconnect and interrupted pulls; conflicting changes remain recoverable;
deleted entries do not silently reappear; a failed sync never blocks a local save
or claims server acknowledgement. Retry after a committed-but-unacknowledged
operation must not create a duplicate. A long-disconnected device has a defined,
tested recovery path when server change history has been compacted.

## Stage 5 — History, recovery and the private beta gate

Design history and backups alongside sync; complete this gate before inviting
people to store real books in the cloud. Retain recoverable server revisions and
make restoring one a new validated change, including the existing conflict rules.

Choose retention, automatic backup frequency, access controls and the acceptable
recovery window with the service budget. Verify the actual provider plan's backup
capabilities; do not promise managed backups on an unsupported plan. Preserve
portable JSON export independently of server recovery. Future attachments require
their own protected byte backups; database backups alone do not cover those files.

Acceptance: restore a synthetic server backup into an isolated environment, verify
book IDs/content/time/geometry/formatting/deletions and test recovery on a fresh
device. Confirm an individual older entry can be recovered without overwriting
newer edits. Test a returning device after a server restore as well: expired or
rolled-back cursors must not discard its newer local or queued writing.
Record the procedure and actual outcome, not merely that a backup
schedule exists. Only then begin the invited two-device beta with real books.

## Stage 6 — Practical planning conveniences

Select these from trial feedback, one independent slice at a time:

| Candidate                    | Bounded behavior                                                      | Acceptance                                                                                |
| ---------------------------- | --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Copy unfinished tasks        | Explicit choice of tasks and destination date; retain the original    | No automatic rescheduling, lost formatting or duplicate copies on retry                   |
| Quick capture (new proposal) | Save a thought immediately, then explicitly place it on a dated page  | The thought survives interruption and placement preserves a single original               |
| Recurrence (later PRD work)  | Define a simple repeat rule and explicit occurrence identity          | No duplicates; clear handling of one occurrence versus the series                         |
| Reminders (new proposal)     | Optional server-scheduled web push with permission and timezone rules | No notification after completion/deletion; duplicate/retry and permission handling tested |

Quick capture needs its own entry/destination design; do not hide an uncontrolled
second journal behind an inbox. Reminders need a reviewed scheduler, subscription
storage and browser-support checks. Never depend on a sleeping browser timer or
promise exact delivery on every device. Monthly/weekly views, external calendar
integration, attachments and handwriting remain separately scoped later work.

## Stage 7 — Broader launch

Review pilot/beta findings before setting a launch date. Complete real-device,
accessibility, security, restore and performance evidence for the supported usage.
Define account/book deletion and backup-retention behavior; publish clear storage,
sync and privacy explanations. Establish a support contact and a reproducible bug
report flow. Choose sanitized operational error reporting and uptime checks;
exclude journal text, search strings, screenshots and session replay by default.

Document service costs/limits, spending controls, release/rollback procedures and
who responds to failed saves, sync incidents or restores. Hosting and backend
approval precede provisioning; review credentials through official authentication,
never chat or tracked files. Wider release is a separate approval, not a result
inferred from successful staging.

## Immediate next bounded task

Review this proposal, then scope **personal book setup** as a single implementation
task while the Stage 0 trial gathers human feedback. Its first deliverable is a
concrete first-use and migration design with fresh/existing/imported-book cases.
Do not provision hosting, accounts or cloud storage as part of that task.

Subsequent implementation slices get real GitHub Issues, short-lived branches,
appropriate checks and reviewed publication. This planning pass creates no new
issues or service resources and does not change the application or PRD.

## Official references reviewed

- [Next.js PWA guide](https://nextjs.org/docs/app/guides/progressive-web-apps):
  manifest and installation capabilities; use installed version-specific guides
  again when implementation begins.
- [Next.js on Vercel](https://vercel.com/docs/frameworks/full-stack/nextjs) and
  [Hobby restrictions](https://vercel.com/docs/plans/hobby): hosting candidates and
  intended-use/plan review before deployment.
- [Supabase Auth](https://supabase.com/docs/guides/auth),
  [Next.js auth integration](https://supabase.com/docs/guides/auth/server-side/nextjs)
  and [row-level security](https://supabase.com/docs/guides/database/postgres/row-level-security):
  identity, ownership and account-scoped data access.
- [Database change subscriptions](https://supabase.com/docs/guides/realtime/subscribing-to-database-changes):
  optional notifications alongside a durable sync protocol.
- [Supabase backups](https://supabase.com/docs/guides/platform/backups):
  plan-dependent recovery and the separate attachment-backup boundary.
- [Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API):
  optional permission-based reminders delivered through a service worker.
