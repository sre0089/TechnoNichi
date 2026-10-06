# Architecture and milestone plan

Status: M1 implemented locally; validation and visual approval recorded in project state.
Requirements live in `docs/PRD.md`; visual measurements live in
`docs/PAGE_TEMPLATE_SPEC.md`. The real spread and mockup were received as private
conversation attachments and inspected. Geometry estimates retain their uncertainty.

## Compact architecture

Use the PRD's TypeScript, React, Next.js, and Dexie/IndexedDB baseline. Next.js
composes routes and a browser-only planner editor. Pure calendar, manifest, and
coordinate functions do not depend on React, the database, or an animation library.
No server, account, cloud service, or deployment is required for M1.

| Boundary    | M1 responsibility                                                            |
| ----------- | ---------------------------------------------------------------------------- |
| `app`       | Route, shell, client editor boundary, error handling                         |
| `domain`    | Validated book/page/entry records; civil dates and grid transforms           |
| `templates` | Versioned daily template; explicit timetable anchors; paper rendering        |
| `book`      | Stable ordered pages, adjacent spread navigation, bounded live pages         |
| `editor`    | Native text inputs, task completion, free-positioned notes, finish behavior  |
| `local`     | Dexie schema, serialized writes, revisions, hydration, save failure recovery |

Create these modules only as implementation needs them. Search/export, sync,
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
- Use native text controls. Short lines/tasks finish on Enter; Shift+Enter adds a
  newline. Notes use Enter for newlines and an explicit finish control. Escape
  retains drafts. Respect IME composition and native selection/undo.
- Preserve overflow text; expose focused reading/editing rather than shrinking
  fonts, expanding the paper, or pushing adjacent content.
- Only explicit previous/next controls navigate in M1. Decorative book layers
  are hidden from accessibility and cannot intercept editing input.

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
Plain CSS and native inputs handle the editor; no flipbook, component framework,
rich-text engine, or service worker was added in M1.

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
