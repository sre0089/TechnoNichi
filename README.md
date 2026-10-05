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

Click beside a timetable mark for a line, or elsewhere on the grid for a note.
The page's quiet **+ Timed line**, **+ Note**, and **+ Task** controls also work with
the keyboard. Type beside a top checkbox and toggle it without removing the text.

Short lines/tasks finish with Enter; Shift+Enter inserts a newline. Notes use Enter
for newlines. Escape exits while retaining writing; **Done** exits the contextual
editor. **Edit writing** opens a larger native text editor without changing layout.
Overflow writing stays intact and has explicit reading/editing affordances.

Save status is **Saving locally**, **Saved on this device**, or **Storage problem**.
A failed write keeps the draft, prevents the page turn, and exposes retry/recovery.
Storage is browser-local: it is not cloud synchronization or a backup. Export/import
and cached offline reopening are later milestones.

## Development checks

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
the implementation currently stops at M1.

Public repository: https://github.com/sre0089/TechnoNichi. M1 is tracked in
[issue #2](https://github.com/sre0089/TechnoNichi/issues/2) and available for review in
[PR #3](https://github.com/sre0089/TechnoNichi/pull/3) on `feat/m1-daily-spread`.
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

To review M1 before its PR is merged, also run:

```sh
git switch --track origin/feat/m1-daily-spread
```
