# Interface system

The current app uses Tailwind CSS 4, a shared theme, small local components,
Radix primitives for floating interfaces, and Lucide icons. The user's approved
scope is the UI throughout the existing app. Later document features and external
services stay in their original milestones.

## Rendering boundaries

| Responsibility                    | Implementation                                                                      |
| --------------------------------- | ----------------------------------------------------------------------------------- |
| Routes and client editor          | Next.js 16.3.8, React 19.3.0, TypeScript 6.0.3                                      |
| Interface theme and layout        | Tailwind 4.3.3 through `@tailwindcss/postcss`; tokens in `src/app/globals.css`      |
| Buttons and fields                | Local components in `src/components/ui/`, native browser elements                   |
| Dialogs, popovers, keyboard hints | Radix Dialog 1.2.0, Popover 1.2.0, Tooltip 1.3.0                                    |
| Icons                             | Named imports from Lucide React 1.52.0; decorative SVGs hidden from accessibility   |
| Conditional classes               | `clsx` 2.1.1 and `tailwind-merge` 3.7.0 through `cn()`                              |
| Paper, grid and entered writing   | Existing template coordinates, custom CSS, container units and scoped Tiptap fields |
| Persistence                       | Existing Dexie 4.4.6/IndexedDB and serialized revision-checked writes               |
| Validation                        | Prettier, ESLint, TypeScript, Vitest and Playwright                                 |

All dependencies are exact-pinned in `package.json` and the npm lockfile. No
shadcn CLI/generated component pack, Base UI or direct Floating
UI dependency was added. Word formatting now uses exact-pinned Tiptap 3.31.4
(core, React, ProseMirror adapter, document/paragraph/text, bold/italic/underline,
hard-break and undo/redo packages), under MIT licenses. Radix provides the needed floating placement behavior.

## Theme and component contracts

`globals.css` imports Tailwind's theme and utilities, omitting Preflight. This
preserves the reviewed paper/native-field metrics instead of applying a new
global reset. Our existing base styles occupy the `base` layer; Tailwind utilities
can override those defaults. Paper geometry remains in custom selectors, with
its explicit proportions, grid pitch, baselines and stroke alignment.

Shared tokens cover ink, paper, interface surfaces, borders, muted text, status
colors, fonts, radii and floating shadows. Interface controls use the system
sans-serif font; display titles keep Georgia. Entered page writing keeps the
smaller monospace font, while the existing enlarged editor keeps Kalam.

- `Button`: primary, secondary and ghost variants; standard, small, icon and
  paper sizes. Native disabled behavior, visible keyboard focus and forwarded
  refs work with Radix `asChild`. Phone interface actions are at least 44 px high;
  tiny paper affordances retain their existing geometry.
- `Input`, `NativeSelect`, `Textarea`: shared field styling with native editing,
  labels, focus and disabled behavior. Page-writing fields retain their dedicated
  CSS rather than adopting an interface field box. `InkCheckbox` preserves the
  native checkbox and the existing on-paper completion styling.
- `DialogContent`: required title/description, viewport-bounded scrolling,
  modal overlay, close button and Radix focus containment. Escape during IME
  composition does not dismiss the dialog. Ordinary Escape and dismissal
  retain writing. The writing dialog focuses its textarea and restores the page
  row after closing; settings restores its trigger.
- `PopoverContent`: reading panel with collision-aware placement, constrained
  width/height, scrolling and Escape/trigger focus restoration. It reads the
  selected entry's full text without altering the document.
- `Hint`: delayed pointer hints and immediate keyboard hints for icon actions.
  The trigger keeps its accessible name and owns focus; hints never navigate.
- `SaveStatus`: renders the existing save queue state in a quiet live-status
  pill. It does not introduce a separate success timer or optimistic save claim.

`ViewSettings` exposes the existing page size and toolbar side preferences, using
the same persistence path as the quick toolbar controls. Choices apply immediately.
The app's controls, contextual writing panel, enlarged editor, day outline,
opening retry, storage recovery and small paper actions use the shared components.

Writing fields own their keyboard handlers; there is no global shortcut listener.
Unmodified Up/Down switches hourly rows within the current page. Selection,
composition, read-only fields and modified arrows retain native behavior. Multiline
or overflowing fields leave only at their text endpoints. No arrow turns pages.
Cmd/Ctrl+B/I/U formats selected words; with a collapsed selection it sets stored
marks for subsequent typing. Contextual buttons expose pressed states and shortcut
hints, preserve the selected range, and use the same commands in enlarged editing.
Each bounded entry editor uses Tiptap/ProseMirror with only plain paragraphs,
line breaks, bold, italic, underline and field-local undo/redo. No headings, lists,
links, images, HTML storage or editor-wide notebook contenteditable is introduced.
Input/paste rules are disabled; paste inserts plain clipboard text as text nodes.

The saved model retains plaintext `text` plus optional sorted, nonoverlapping
`formatRuns`, using UTF-16 offsets and controlled boolean styles. Old plain records
remain plain. Old whole-entry flags are rendered as equivalent ranges without a
record rewrite; the first edit saves explicit ranges. Both text and ranges follow
the existing revision-checked save and draft recovery path. Tiptap's Next.js client
boundary uses `immediatelyRender: false`. Semantic comparisons avoid resetting
content, selection, pending marks or undo on every React draft update. Editors are
re-created when their entry identity changes, preventing history crossing entries.
React echoes of a field's own writes cannot replace newer live content. Editability
updates only when it changes, avoiding repeated view updates during native typing.

The checkbox text measurement renders the same styled segments as the field.
Underline combines with completion's translucent strike-through. The reading
popover and day outline render controlled React spans from the same ranges.

## Backup controls

The toolbar's **Backups** action opens a shared Radix dialog with two sections:
download the complete book, or choose a native JSON file and review its book/year,
page/entry counts and export date before restoring. Files are read locally. Export
waits for current drafts to save; restore refuses saved writing. The dialog announces
progress, completion and validation/storage errors, prevents dismissal while busy,
and returns focus to its trigger when closed. The toolbar wraps on narrow screens;
the dialog stays within the existing bounded, scrollable viewport contract.
Typography on planner writing is unchanged. See the README for limits and operation.

## Verification and limits

Browser journeys cover preference persistence at desktop and phone widths,
dialog focus containment and restoration, long-text popover bounds, keyboard
submission, retained drafts and keyboard hints. Existing journeys still cover
completion, grid-line alignment, exact times, legacy entries, notes, IME events,
failed writes and stale tabs. Native Safari tab order follows its full keyboard
access preference; the tests verify focus containment and explicit keyboard
activation without imposing another platform's tab order.

Synthetic captures in ignored `artifacts/` include the normal/dense spread,
phone page, writing editor, settings at both widths and phone reading popover.
Project state records actual final results. Physical tablet/touch/IME and
assistive-technology review remain pending; no performance benchmark is claimed.

During installation, npm audit reported one existing development dependency
chain: Next's ESLint plugin → fast-glob → micromatch → braces 3.0.3. Those exact
versions also occur in the published lockfile. The
[braces stack-exhaustion advisory](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)
listed no patched version on 2026-10-05. npm's proposed automatic fix would
downgrade the Next lint plugin across major versions, so it was not applied.
The production-only audit returned zero reported vulnerabilities on that date.

## Official references

- [Tailwind PostCSS installation](https://tailwindcss.com/docs/installation/using-postcss)
- [Tailwind Preflight and how to omit it](https://tailwindcss.com/docs/preflight)
- [Radix Dialog](https://www.radix-ui.com/primitives/docs/components/dialog)
- [Radix Popover](https://www.radix-ui.com/primitives/docs/components/popover)
- [Radix Tooltip](https://www.radix-ui.com/primitives/docs/components/tooltip)
- [Tiptap Next.js integration](https://tiptap.dev/docs/editor/getting-started/install/nextjs)
- [Tiptap editor API](https://tiptap.dev/docs/editor/api/editor)
- [Tiptap undo/redo](https://tiptap.dev/docs/editor/extensions/functionality/undo-redo)
- [Lucide React](https://lucide.dev/guide/packages/lucide-react)

The installed Next.js CSS, client-boundary and CLI guides were also consulted.
Production still uses the default Turbopack build; the sandbox-related cached
PostCSS worker failure encountered during validation was resolved by clearing
only generated production Turbopack cache and retrying with worker permissions.
