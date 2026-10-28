# Five approved implementation steps

On 2026-10-28 the user said: “continue, go ahead and auto approve anything for the
next 5 steps.” This authorizes the five bounded steps below, including their
commits, pushes, PRs and merges after successful review/checks. It supersedes
AGENTS.md's usual stop/approval gates for these five steps only. It does not
authorize spending, external account/service setup, deployment, force pushes,
shared-history rewriting, private-data publication or unlimited later features.

Each step uses its own branch and linked issue/PR, appropriate local tests and
final-head CI before merge. Record each completed merge here in the next step's
documentation; stop after step 5. Physical-device, assistive-technology and a full
week of actual planning remain manual gates, not automatically verified work.

| Step | Bounded implementation                                                                                | Status                                                     |
| ---- | ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| 1    | Selected duration move/end-resize handles, keyboard alternatives, cancellation and save/recovery      | Merged PR #25 as `7959f1a`; issue #20 closed               |
| 2    | Page undo/redo for document actions; preserve focused text editor history and refuse stale overwrites | Merged PR #26 as `1df47ca`; issue #21 closed               |
| 3    | Today/date/month navigation through the stable yearly manifest, retaining save guards                 | Merged PR #27 as `d2ee98c`; issue #22 closed               |
| 4    | Cover/open/close and restrained page transitions with reduced/no-motion fallback and safe input       | Merged PR #28 as `65ba796`; issue #23 closed               |
| 5    | Production offline shell opening, local search, update readiness and personal-alpha checks            | Implemented and locally checked; issue #24 tracks PR/merge |

## Acceptance boundaries

1. Gesture previews never save until release. Movement preserves duration; resize
   changes only the end, bounded by 06:00–03:00 (+1). Preserve identity, words,
   marks, completion and existing overlap rules. Use 15-minute deltas, Shift for
   60 minutes; clicks/cancellation retain exact imported times.
2. One completed gesture is one undo action. Revision checks protect changes from
   another tab. Undo is a new durable write. Native word-editor undo keeps priority
   while typing. Keep history bounded; successful restore/import resets history.
3. Date jumps select the correct spread and page side, including leap days and
   boundaries. Today uses the book's stored timezone and reports out-of-book dates.
4. Only explicit book/navigation controls trigger motion. No cloned live editors,
   gesture interception, long mandatory opening, or dependency on animation for
   saving. Prefer existing HTML/CSS if curl compromises editing.
5. Cache only the production app shell and public local assets; writing stays in
   IndexedDB. Updates are offered explicitly after saving. Search current-book
   entries and navigate to original identities. No cloud, account or deployment.

CI's browser journeys will run in a three-engine matrix after the common checks,
retaining the installed action pins and minimal permissions. All jobs must pass
before the approved merge. Primary references:
[GitHub matrix jobs](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/run-job-variations)
and [Playwright CI](https://playwright.dev/docs/ci-intro).

## Step 1 completion

PR #25 merged on 2026-10-28 as `7959f1a71649ce934517cfbd98134407d9791142`.
The merged tree equals reviewed head `507cc54d6fde174d6f99db9272b2e2b2b496dd20`.
[Final CI](https://github.com/sre0089/TechnoNichi/actions/runs/40672628651)
passed common checks and all three browser jobs. Local validation was 115 units,
179 browser passes and four intentional skips. Issue #20 closed automatically.

## Step 2 behavior

Page history retains at most 50 current-tab document actions. Creation, completion,
submission, geometry/time/type changes, deletion and restoration are undoable.
Typing/word styles stay with Tiptap's focused editor history; page undo preserves
newer own words/styles. Toolbar buttons or Cmd/Ctrl+Z outside text fields perform
page undo (Shift+Z for redo, Ctrl+Y also supported). Undo writes a new revision,
refuses stale/occupied changes, and retains history on failure. Reload, import and
explicit tab reconciliation reset this ephemeral history. Navigation alone does not.

## Step 3 behavior

Today derives a civil date from the book's stored timezone. Date navigation uses
manifest position for spread and focused side, retains save/gesture locks, and
persists resume. Dates outside the book are reported without silently clamping.
The date dialog has a native date field, month selection/previous/next and
44-pixel day buttons. The miniature calendar opens that same readable calendar
rather than exposing tiny individual day targets. No data/schema change.

## Step 4 behavior

The existing settled HTML/CSS book remains the only live editor tree. An explicit
Close book command flushes drafts; failure keeps the open editor and recovery.
The original cloth-style cover opens at the current/resume spread. Initial loads
resume immediately without a mandatory animation. Explicit turns use a brief
180ms CSS transition; fields/gestures are disabled during it. Resize or window
blur settles motion safely. Distant date/search jumps remain direct. Device
reduced-motion and a saved No animation preference bypass motion. No curl library
or cloned inputs are introduced. Optional motion preference validates in archives;
old archives without it keep system behavior. No database migration.

## Steps 2–4 completion

Each merged tree equals its reviewed head; all common and three browser jobs passed.

| Step | PR  | Merge     | Reviewed head | Final CI                                                                       | Browsers                        |
| ---- | --- | --------- | ------------- | ------------------------------------------------------------------------------ | ------------------------------- |
| 2    | #26 | `1df47ca` | `51439cb`     | [40675794003](https://github.com/sre0089/TechnoNichi/actions/runs/40675794003) | 188 passed, 4 intentional skips |
| 3    | #27 | `d2ee98c` | `c4bf392`     | [40677290268](https://github.com/sre0089/TechnoNichi/actions/runs/40677290268) | 200 passed, 4 intentional skips |
| 4    | #28 | `65ba796` | `25696ff`     | [40677449250](https://github.com/sre0089/TechnoNichi/actions/runs/40677449250) | 212 passed, 4 intentional skips |

Issues #21/#22/#23 closed automatically. Intermediate WebKit input/test ordering
failures were addressed before these final successful runs. No checks were bypassed.

## Step 5 implementation and validation

Production shell opening, explicit saved updates, other-window update refusal,
cache repair, storage protection and local search are implemented. The build
embeds static public HTML and a hashed-asset allowlist; no journal/API response is
cached. Searches stay local and open original identities. Updates preserve the
existing database/archive schema. See [PERSONAL_ALPHA.md](PERSONAL_ALPHA.md) for
origin-specific use, backup transfer, update behavior, measurements and manual gates.

Local checks passed 128 unit tests, format/lint/strict types and production build.
The full browser run passed 221 journeys with four existing intentional skips.
All nine production offline cases passed across three engines. The final search-focus improvement passed all six engine cases; the expanded
offline-search/update/repair journeys passed all nine final production cases
after fixing operation-unlock focus and retaining update-button focus on refusal. Final-head CI must pass common checks, every browser job and its
production offline cases before the preapproved merge. No sixth feature follows.
