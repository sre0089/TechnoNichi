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

| Step | Bounded implementation                                                                                | Status                                       |
| ---- | ----------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| 1    | Selected duration move/end-resize handles, keyboard alternatives, cancellation and save/recovery      | Merged PR #25 as `7959f1a`; issue #20 closed |
| 2    | Page undo/redo for document actions; preserve focused text editor history and refuse stale overwrites | PR #26; final CI pending, issue #21          |
| 3    | Today/date/month navigation through the stable yearly manifest, retaining save guards                 | Implemented; validation active, issue #22    |
| 4    | Cover/open/close and restrained page transitions with reduced/no-motion fallback and safe input       | Pending, issue #23                           |
| 5    | Production offline shell opening, local search, update readiness and personal-alpha checks            | Pending, issue #24                           |

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
