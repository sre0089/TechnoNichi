# Decisions

## 2026-10-05 — Bootstrap destination and visibility

Status: approved by the user; public remote created and bootstrap push verified.

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

- Visual approval and any measurement refinements: review the M1 fixtures.
- License: requires the user's choice; public visibility does not select one.
- Branch protection: revisit after the first real GitHub CI result.

## 2026-10-05 — Product baseline received

Status: PRD read and preserved in `docs/PRD.md`; M1 implemented locally.

Follow the independent digital book planner baseline with Next.js, React,
TypeScript, and Dexie/IndexedDB. Begin with M1's persisted daily spread rather
than cloud services or curl integration. Use Daily Book as the neutral working
title and 2026 for synthetic fixtures. The original PRD source remains local;
the derived product documents are included in the approved M1 publication.

## 2026-10-05 — Runtime and reference preparation

Status: runtime installed temporarily, references received, M1 locally verified.

Use npm with one lockfile and project-specific Node 24.21.0 rather than the
global Node 25.6.0. The [official Node release table](https://nodejs.org/en/about/previous-releases)
lists Node 24 as LTS and Node 25 as EOL. The global runtime was preserved.

The private real spread and mockup were attached in this conversation. The real
page is the primary geometry reference; the mockup's stretched timetable and
misaligned written times are not authoritative. Preserve 148:210 proportions,
approximate 3.7 mm pitch, and midnight offsets. Approximate bounds and uncertainty
are documented in the page-template spec; visual approval remains pending.

## 2026-10-05 — M1 tools and boundaries

Status: implemented and locally verified; commit/push/PR publication approved
by the user on 2026-10-05. Merge and M2 are not authorized.

Pinned Next.js 16.3.8, React 19.3.0, Dexie 4.4.6, TypeScript 6.0.3, Vitest 5.0.3,
Playwright 1.63.0, Prettier 3.9.9, and ESLint 10.12.0. Verified official docs and
registry engines/peer requirements; a clean `npm ci` succeeded.

Next's bundled React lint preset failed under supported ESLint 10. Use compatible
standalone TypeScript, React Hooks, and Next.js plugins rather than an unsupported
ESLint 9 or forced peer overrides. The final lint run passed.

Use locally bundled Kalam Regular under OFL 1.1; retain its complete font notice
in `public/licenses/kalam-OFL.txt`. Paper and book layers are independently drawn
in CSS. No photographic background or quotations are bundled.

Serialized IndexedDB writes check expected revisions. Navigation flushes before
unmounting; failed writes block the turn and retain a recoverable draft. A best-effort
localStorage buffer helps reload recovery but is not a backup. Full cross-tab
notifications, conflict choices, export/import, and movement/undo stay in M2.

Use a simple CSS transition for M1. Curl/cover work stays in M3; offline shell
caching stays in M4. CI has read-only permissions and verified commit-pinned
checkout/setup-node actions; no deployment credentials or production services.
The first published CI verification passed on Ubuntu in
[run 37390840274](https://github.com/sre0089/TechnoNichi/actions/runs/37390840274).

Generate route/environment declarations with `next typegen` before strict type
checks and ignore the generated `next-env.d.ts`, following the
[official Next.js CLI documentation](https://nextjs.org/docs/app/api-reference/cli/next).
This keeps type checks usable in a fresh clone before a dev server or build exists.
