# Daily Book

An independent digital book planner with the familiar Cousin daily-page experience.
`TechnoNichi` is the repository identifier; final product branding remains undecided.
This is not an officially affiliated product.

M1 runs locally: two daily pages, timed writing, free-positioned notes, five tasks
per day, completion, adjacent navigation, and durable local saving. The 2026 book
initially opens on October 6–7 and resumes the last spread after reopening.
Small screens focus one page; selected writing has an enlarged editor.

## Run locally

Use Node 24 LTS (`.nvmrc`) and npm. With that runtime active:

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:3000. The dev server binds only to loopback. In this workspace,
Node 24.21.0 was installed in a temporary directory without replacing global Node;
the current session can also run:

```sh
env PATH="/private/tmp/technonichi-runtime/node_modules/.bin:$PATH" npm run dev
```

That temporary path is machine/session-specific; new clones should activate their
own Node 24 runtime. No cloud credentials or account are required.

## Use the book

Click or tab into any hourly writing row, from 06:00 through 03:00 the following
day. Write across that row; its time is set automatically. The numbered times sit
on every third grid line, with dots for the intervening hours. Click the grid below
03:00 for a free note. The quiet **+ Note** and **+ Task** controls also work with
the keyboard. Type beside a top checkbox and toggle it without removing the text.

Entered page text uses a system monospace font. Printed labels and interface fonts
retain their existing typography. The selected row's time control still accepts
exact minutes. Earlier writing keeps its original IDs and times; multiple entries
within one hour are accessible through that row's small **+N** control or Day outline.
Existing notes keep their positions, including older notes in the timetable area.

Short lines/tasks finish with Enter; Shift+Enter inserts a newline. Notes use Enter
for newlines. Escape exits while retaining writing; **Done** exits the contextual
editor. **Edit writing** opens a larger writing editor without changing layout.
Overflow writing stays intact and has explicit reading/editing affordances.

Use **Up/Down** to move between hourly writing rows on the same page, including
empty rows. Left/Right, modified arrows and text selections retain native editing.
For multiline/overflowing writing, Up leaves at the start of the text and Down
leaves at the end; arrows otherwise move within the text. The first/last row does
not wrap or turn the page.

**Cmd/Ctrl+B**, **Cmd/Ctrl+I** and **Cmd/Ctrl+U** toggle bold, italic and underline
for selected words. With no selection, they set the style for new typing. Matching
buttons appear in the writing controls and enlarged editor, preserve the selection,
and show its active styles. Styles combine, save with the entry, and also work on
notes and top checklist tasks. Cmd/Ctrl+Z and Shift+Cmd/Ctrl+Z undo/redo edits in
the current writing field. Pasted text keeps its wording and line breaks; imported
HTML styling is not retained.

**View settings** opens the toolbar's settings dialog. Page size and controls
position apply immediately and remain saved in this browser. Quick size/side
controls remain available. **Read full writing** opens a scrollable reading
popover; Escape closes dialogs/popovers and retains drafts.

Finish a timed task with Enter (or **Done**) to reveal an empty checkbox just after
its text. Check it to add a translucent strike-through; uncheck it to remove the
line. Completion saves with the writing. Clearing the row removes its checkbox.

Occupied hours draw a bold vertical line two grid columns to the right of the
timestamps, with writing starting a quarter-square to its right, inside that same
grid column. Consecutive hours share a line
that encompasses every writing row, starting one row above the first time marker
and ending at the last. Its bold stroke aligns with and covers the faint grid line,
including on phone pages. An isolated hour has a one-row marker. Empty hours split the line; completed tasks
still count as occupied. This is a visual grouping of writing, not a duration block.

Save status is **Saving locally**, **Saved on this device**, or **Storage problem**.
A failed write keeps the draft, prevents the page turn, and exposes retry/recovery.
Storage is browser-local. Use **Backups** in the toolbar to download a versioned
JSON copy of the complete yearly book, including entries outside the current spread,
word formatting, completion and view preferences. Download waits for current drafts
to save; a failed save keeps the draft and prevents a misleading backup.

To restore, open **Backups**, choose a JSON file, review its book/year/counts, then
select **Restore backup**. Choosing a file alone changes nothing. Restore requires
an empty planner: even an empty saved task slot counts as an entry. Use a fresh
browser profile to restore while keeping your current book. Invalid or unsupported
files and failed writes leave the existing planner unchanged; successful restore
opens the imported book and resumes its saved spread after reload.

The backup contains your writing in plain text and is not encrypted or uploaded.
Version 1 supports one full yearly daily-template-v1 book (1900–2200), files up to
20 MiB, 50,000 records, one million UTF-16 text units per entry and 20,000 formatting
ranges per entry. Duplicate IDs/active checklist slots are rejected. Restore does
not merge or replace a populated book. Cloud synchronization, automatic backups
and cached offline reopening remain later work.

## Development checks

The interface uses Tailwind CSS 4, shared theme tokens and reusable native
controls, Radix dialogs/popovers/tooltips, and Lucide icons. Custom CSS retains
the paper grid and writing geometry. The full stack and component contracts are
documented in [the interface system](docs/UI_SYSTEM.md).

```sh
npm run check
npx playwright install chromium firefox webkit
npm run test:browser
```

Individual commands: `npm run format:check`, `npm run lint`, `npm run typecheck`,
`npm test`, `npm run build`, and `npm run test:browser`. Use `npm run format` for
formatting. Browser tests use isolated synthetic data and generate screenshots in
ignored `artifacts/`; they do not photograph personal planner content.

## Project documents

Read [AGENTS](AGENTS.md), [project state](PROJECT_STATE.md), [PRD](docs/PRD.md), then
[architecture and roadmap](docs/ARCHITECTURE.md) and
[template measurements](docs/PAGE_TEMPLATE_SPEC.md). The full PRD is the baseline;
M1 is merged; the authorized first M2 slice adds local JSON export/import.

Public repository: https://github.com/sre0089/TechnoNichi. M1 is tracked in
[issue #2](https://github.com/sre0089/TechnoNichi/issues/2) and merged through
[PR #3](https://github.com/sre0089/TechnoNichi/pull/3). Writing controls merged through
[PR #5](https://github.com/sre0089/TechnoNichi/pull/5); backup work is on
`feat/planner-backups`, published in [PR #9](https://github.com/sre0089/TechnoNichi/pull/9)
and tracked by [issue #8](https://github.com/sre0089/TechnoNichi/issues/8).
The original prompt files and private photo remain outside the public repository.

Kalam font assets are locally bundled under SIL OFL 1.1; the complete font copyright
and license are in [the font notice](public/licenses/kalam-OFL.txt). No repository-wide
open-source license has been chosen. No services or deployment have been provisioned.

## Reopen the workspace

Open the existing `TechnoNichi` folder and read the current state first. A fresh
bootstrap copy is available with:

```sh
git clone https://github.com/sre0089/TechnoNichi.git
cd TechnoNichi
```

The merged baseline is on `main`. Check project state for the current feature branch.
