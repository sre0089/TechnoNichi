# Daily page template specification

Status: version 1 implemented with estimates from the two attachments received on
2026-10-05, revised following the user's grid/row/font review. Visual approval
remains pending. The real spread is the primary geometry reference; the latest
upright empty-spread image clarifies line/intersection alignment and the monospace
sample informs entered text only. The mockup informs the filled-page feel. No reference is bundled
as an application asset or published. They are available in this conversation;
there is no local reference file to reproduce the measurement process automatically.

## Measurement method and uncertainty

The real photo is rotated relative to an upright spread. I visually normalized each
page to the PRD's 148:210 proportions, compared repeated grid spacing and timetable
marks, and estimated bounds. These are visual estimates from a perspective image,
not rectified image-analysis measurements or verified printer specifications.
Use roughly ±1.5–2 logical mm uncertainty for region placement and ±1 grid row
near curved/obscured edges. The nominal 3.7 mm pitch comes from the PRD.

The real page's successive 6, 9, 12, 15, 18, 21, 0, and 3 marks appear separated by
about three grid rows: approximately one hour per row. Midnight is on the following
day. The mockup stretches the timetable farther down the page and includes written
times that do not consistently match their printed positions. Those inconsistencies
are not copied into time semantics.

## Implemented logical geometry

Source of truth: `src/templates/daily-v1.ts`, template ID `daily-a5`, version 1.
Coordinates use logical millimetres; rendering converts them to percentages and
container units, not physical CSS millimetres.

| Region          | Estimated version 1 geometry                                                                                             |
| --------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Page            | Width 148, height 210                                                                                                    |
| Grid            | Origin (10, 27.4), pitch 3.7, extent 132 × 159.1                                                                         |
| Header          | (10, 8), 48 × 14.8; month, large date, English weekday, quiet ordinal metadata                                           |
| Tasks           | Five anchors starting (63, 8), vertical pitch 3.7                                                                        |
| Timeline labels | x 13.7 on a vertical grid line; 6 at y 34.8, 9 at 45.9, 12 at 57, 15 at 68.1                                             |
| Midnight wrap   | 18 at 79.2, 21 at 90.3, 0 (+1 day) at 101.4, 3 (+1 day) at 112.5                                                         |
| Schedule text   | Starts x 22.025; 22 editable hourly fields spanning one row each, ending at its time line                                |
| Occupied line   | x 21.1, two grid columns right of the timestamps; writing starts one quarter-square to its right, within the same column |
| Hour marks      | Numbers centered on every third horizontal line; dots at the other hourly intersections; no extra vertical divider       |
| Memo area       | Below the final 03:00 line at y 112.5; new notes start here or farther down                                              |
| Note default    | 62.9 × 14.8; position snaps to the writing grid and remains inside the page                                              |
| Footer          | Reserved at y 190, height 14; no copied quotations                                                                       |
| Month marker    | Outer edge near y 139, width 7.8, height 10.8                                                                            |
| Mini calendar   | Spread-owned, rendered once at the right page footer; decorative in M1                                                   |

Civil time is authoritative for scheduled entries. Each hourly row is directly
editable across its writing width; focusing/typing uses that hour without a creation
button or event form. The contextual time control still accepts exact minutes from
06:00 to 03:00 on the following day. Exact-time entries render in their containing
hour's row without changing the stored time. Multiple existing entries within one
hour are accessible through a small cycling control and the day outline; none are
merged or discarded. New rows use deterministic IDs with collision-safe suffixes,
so moving an entry does not make its old ID available for reuse and two tabs cannot
silently overwrite an initially empty row.

Finishing a nonblank timed task with Enter or Done reveals an unchecked checkbox
after the visible first-line text. Completion adds a 40%-opacity strike-through
while preserving the writing and its ink color. Checkbox placement follows text
width and is bounded inside the row, leaving room for the full-text/alternate-entry
controls. Clearing to blank text resets completion and hides the checkbox.
The timed checkbox is centered in the clear band between horizontal grid strokes;
its checked mark is centered within the checkbox. The top checklist keeps its
existing printed placement.

Word-level bold/italic/underline uses the current writing font and geometry;
font size and baseline stay fixed. The checkbox's text-width measurement applies
the same per-word bold/italic styling. Underline and completion strike-through can coexist.

Every occupied hour contributes to a derived bold vertical line at x 21.1, even
while typing or after completion. Adjacent hours share a line from one grid row
above the first time marker to the last marker, encompassing the first entry's
writing as well as every following entry. A singleton spans the one grid row
above its own marker. The bold stroke replaces the faint stroke visually: both
share the same center, half the one-pixel grid stroke right of its tile edge.
The bold stroke is at least two CSS pixels wide, including on narrow pages. Blank
hours split runs; exact-minute duplicates within one hour contribute only once.
Midnight uses the explicit day offset so 23:00, 00:00 (+1), and 01:00 (+1) join.
These are decorative lines, not stored duration blocks, and never intercept input.

Free notes use document geometry and never acquire a time implicitly. New notes
snap within the lower memo area, including its left margin. Existing note positions
remain unchanged, even when above the new memo boundary. These are corrections to
the unmerged M1 template v1, with no database schema migration or record rewrites.

## Typography and themes

Paper `#f7f2e7`, writing `#514560`, October accent `#897293`, faint grid
`rgba(99, 82, 71, 0.105)`. These are original approximations, not sampled print colors.
Entered page writing uses a system monospace stack (SFMono-Regular, Consolas,
Liberation Mono, monospace). Notes/checklist text stays about 3.1 logical mm with
3.7 mm line height. Hourly writing is about 2.5 logical mm (19% smaller), with a
3.03 mm line box and 0.67 mm top inset inside the unchanged 3.7 mm row. The smaller
glyphs sit lower, just above the grid line; descenders retain a little clearance.
This approximates the user's sample without claiming its exact font identity.
Scoped writing editors preserve ordinary editing, selection, and IME behavior.
Printed labels use system sans-serif; large dates use system Georgia.

Kalam remains in the existing checkmark and enlarged editor, whose fonts were not
part of the requested page-text change. It is licensed under SIL OFL 1.1; its complete copyright/license is served at
`public/licenses/kalam-OFL.txt`. No repository-wide open-source license was selected.
The moon-like header mark is an original decorative glyph, not a computed lunar phase.
Other month colors remain provisional; October purple is the M1 sample theme.

## Spread and accessibility behavior

Facing pages have independent headers and entries, with original CSS gutter,
cover edge, shadows, and stack depth. Month markers use the outer edge on either
side. The mini calendar and decorative layers are separate from editable objects
and excluded from accessibility/input hit testing. Navigation follows manifest
order, not odd/even date numbers.

Small screens focus one page. Browser zoom is preserved; page-size controls keep
stored coordinates fixed. The enlarged Radix dialog with a scoped writing field offers readable writing at
18 px without changing the note's stored box or font geometry. Overflow text is
preserved, with explicit reading/editing affordances. A linear day outline uses
the same entries. The toolbar can sit on either side. Shared Tailwind controls and
Radix floating interfaces surround the paper without changing its grid or writing
coordinates; Tailwind Preflight is omitted to preserve these metrics.

## Visual fixtures and remaining approval

Chromium on macOS at 1440 × 1120 with local/system fonts captures blank, normally filled,
and dense spreads. A 390 × 844 viewport captures focused-page and enlarged-editor
views. All use synthetic text and isolated test stores. Screenshots are generated
into ignored `artifacts/` and manually inspected; no changed baseline is auto-approved.

The user approved the current UI appearance and latest checkbox alignment on
2026-10-05. Geometry and colors remain independent approximations rather than a
claim of exact physical fidelity. Physical tablet, touch-keyboard, and real IME
behavior remain unverified. M3 evaluates cover/curl motion against the actual editor;
M1 uses only a restrained transition and explicit navigation.
