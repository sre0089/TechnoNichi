# Decisions

## 2026-10-05 — Bootstrap destination and visibility

Status: approved by the user; remote setup pending.

Use GitHub owner `sre0089`, repository name `TechnoNichi`, and public visibility.
Private visibility was recommended initially; the user explicitly chose public.
The repository name does not finalize product branding. Publication is limited
to reviewed setup files. Keep the unread local PRD outside the bootstrap commit.

## 2026-10-05 — Defer product and stack decisions

Status: accepted working agreement.

Prepare only repository documentation, ignore rules, and GitHub templates during
setup. Wait for the product PRD before choosing dependencies, scaffolding an
application, adding CI, or configuring services. This preserves the PRD as the
source of product scope and avoids speculative implementation.

## Pending decisions

- Product scope and stack: await PRD review.
- License: requires the user's choice; public visibility does not select one.
- CI and branch protection: revisit once real application checks exist.
