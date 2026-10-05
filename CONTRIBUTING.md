# Contributing

Read `AGENTS.md` and `PROJECT_STATE.md` before starting. Product requirements,
stack selection, and application commands are pending the PRD.

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
```

Application build, formatting, lint, type-check, and test commands are pending.
No contribution license or open-source license has been selected.
