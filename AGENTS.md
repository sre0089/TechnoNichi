# Working agreement

## Reading order

Read this file, `PROJECT_STATE.md`, `docs/PRD.md`, then documents relevant to
the active task. M1 preparation is in `docs/ARCHITECTURE.md`; template requirements
and unresolved reference measurements are in `docs/PAGE_TEMPLATE_SPEC.md`.
Do not read private references or
unapproved documents without authorization. The original local preface is
`01_AGENT_AND_GITHUB_PREFACE.md`; surface contradictions with these instructions.
The PRD defines product scope; this file defines working behavior.

## Operating rules

- Build a useful, maintainable product in small, end-to-end milestones. Do not
  invent requirements or implement the application before receiving the PRD.
- Inspect existing files and Git state before editing; preserve user changes.
  Distinguish requirements, assumptions, proposals, and verified behavior.
- Keep explanations concise. Ask only blocking questions; use reversible,
  documented defaults otherwise. Record consequential choices in
  `docs/DECISIONS.md` and surface contradictory requirements.
- Research current official documentation before selecting unfamiliar
  dependencies or configuring external services. Do not install unreviewed
  skills, plugins, scripts, or services without approval.
- Respect environment permissions. Report blocked actions accurately; never
  invent test results, features, issue numbers, URLs, or deployment status.
- Application code, tests, and approved documents must agree.

## Git and GitHub

- Confirm Git status, branch, remotes, identity, and GitHub authentication before
  repository operations. Never reinitialize an existing repository, replace an
  origin, or modify global Git settings.
- Use one short-lived branch per coherent task after bootstrap, such as
  `docs/product-spec`, `chore/app-foundation`, or `feat/daily-editor`.
- Reconcile with the appropriate base. Fetch when authorized; fast-forward a
  clean local main when needed. Never blindly pull, stash, rebase, or switch
  branches over unrelated changes.
- The user confirmed `sre0089/TechnoNichi`, public, for initial setup. This
  authorizes creating/connecting the repository and committing/pushing reviewed
  setup files only. An initial documentation commit on empty main is allowed.
- After bootstrap, request approval before committing, pushing, or opening a PR
  unless explicitly authorized for that task. Never merge, force-push, rewrite
  shared history, publish a release, or change visibility without separate
  permission. Never overwrite existing remote history.
- Use GitHub Issues for actionable milestones and bugs; link PRs to real issues
  and keep issue status and project documents consistent.
- Stage specific reviewed paths, inspect the staged diff, and exclude private
  content. GitHub stores source, specifications, tests, and decisions, not
  personal application data. Never upload credentials, private screenshots,
  personal data, environment files, or unreviewed generated artifacts.
- Use official interactive authentication when needed. Never request tokens,
  passwords, or private keys in chat or tracked files.

## Milestone completion checklist

1. Read current state and relevant requirements.
2. State scope, acceptance criteria, and a short implementation plan.
3. Implement only the active milestone.
4. Add meaningful tests and inspect the actual user experience.
5. Run available checks and review the diff.
6. Update project state and affected documentation.
7. Summarize changes and propose a focused commit and PR.
8. Stop before the next milestone.

End tasks with changes and the requirement satisfied, changed files, existing
branch/commit/PR references, exact checks and outcomes, limitations/manual checks,
and the next bounded action. Setup reporting must include repository destination,
visibility, branch, authentication/push status, and workspace reopening instructions.

## Quality and security

After the PRD establishes the stack, use supported tool versions and reproducible
dependencies with lockfiles. Add formatting, linting, type checks, meaningful unit
tests, browser tests where appropriate, and CI running real checks. Do not add
placeholder workflows. Use minimally privileged GitHub Actions pinned to verified
commit SHAs with readable version comments; maintain them and never expose
deployment credentials to untrusted PR code.

Recommend branch protection once checks exist; verify availability before claiming
it is enabled and avoid impossible self-approval requirements for solo development.
Preserve sanitized fixtures, lockfiles, migrations, and `.env.example` files. Do not
choose an open-source license, purchase services, or configure production
deployments without authorization.

## Commands

- Inspect work: `git status --short --branch`
- Review changes: `git diff` and `git diff --cached`
- Check whitespace: `git diff --check` and `git diff --cached --check`
- Inspect GitHub authentication: `gh auth status` (requires GitHub CLI).
- Product baseline: Next.js, React, TypeScript, and Dexie/IndexedDB as specified
  in `docs/PRD.md`. Use Node 24 LTS and the exact npm lockfile.
- Install: `npm ci`; local app: `npm run dev` (http://127.0.0.1:3000).
- Combined checks: `npm run check` (format, lint, strict types, units, production build).
- Individual checks: `npm run format:check`, `npm run lint`, `npm run typecheck`,
  `npm test`, `npm run build`.
- Browser engines: `npx playwright install chromium firefox webkit`;
  browser journeys: `npm run test:browser`.
- Format changes: `npm run format`; production local preview: `npm run start`.
- Screenshots and traces are ignored local artifacts and must use synthetic data.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
