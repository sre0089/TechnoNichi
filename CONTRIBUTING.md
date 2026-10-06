# Contributing

Read `AGENTS.md`, `PROJECT_STATE.md`, and `docs/PRD.md` before starting.
The PRD establishes the product and stack. Use Node 24 LTS and `npm ci`.
See `docs/ARCHITECTURE.md` for the M1 checklist and the README for editing behavior.

Inspect the working tree before a task and preserve unrelated changes. After
bootstrap, use a short-lived branch for one coherent milestone. State scope and
acceptance criteria, implement it, run the available meaningful checks, review
the diff, and update project state and affected documents.

Stage only specific reviewed files. Keep secrets, private references, personal
runtime data, and exports outside Git. Preserve approved specifications,
sanitized fixtures, dependency lockfiles, migrations, and environment examples.

Request approval before committing, pushing, or opening a PR unless the user
explicitly authorized those actions for the task. Link PRs to actual GitHub
Issues when applicable; do not invent issue numbers or completed checks.

Stop after the milestone and report changed files, existing branch/commit/PR
references, exact check outcomes, limitations, and the next bounded action.

## Available checks

```sh
git diff --check
git diff --cached --check
npm run check
npm run test:browser
```

Install Playwright's Chromium, Firefox, and WebKit engines before the browser
suite. CI runs real formatting, lint, type, unit, build, and browser checks;
GitHub execution is unverified until the workflow is approved and pushed.
No contribution license or open-source license has been selected.
