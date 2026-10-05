# Daily page template specification

Status: version 1 implemented with estimates from the two attachments received on
2026-10-05. Visual approval remains pending. The real spread is the primary geometry
reference; the mockup informs the filled-page feel. Neither attachment is bundled
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

| Region          | Estimated version 1 geometry                                                   |
| --------------- | ------------------------------------------------------------------------------ |
| Page            | Width 148, height 210                                                          |
| Grid            | Origin (10, 27.4), pitch 3.7, extent 132 × 159.1                               |
| Header          | (10, 8), 48 × 14.8; month, large date, English weekday, quiet ordinal metadata |
| Tasks           | Five anchors starting (63, 8), vertical pitch 3.7                              |
| Timeline labels | x ≈ 14; 6 at y 33.3, 9 at 44.4, 12 at 55.5, 15 at 66.6                         |
| Midnight wrap   | 18 at 77.7, 21 at 88.8, 0 (+1 day) at 99.9, 3 (+1 day) at 111                  |
| Schedule text   | Starts x 24; interpolation between explicit timetable anchors                  |
| Divider         | x 18.3, y 27.4 through 116.2; does not stretch timetable through memo area     |
| Note default    | 62.9 × 14.8; position snaps to the writing grid and remains inside the page    |
| Footer          | Reserved at y 190, height 14; no copied quotations                             |
| Month marker    | Outer edge near y 139, width 7.8, height 10.8                                  |
| Mini calendar   | Spread-owned, rendered once at the right page footer; decorative in M1         |

Civil time is authoritative for scheduled entries. Pointer creation snaps to 15
minutes, and the contextual time control accepts exact minutes from 06:00 to 03:00
on the following day. Free notes use document geometry and never acquire a time
implicitly. Bounds restrict new notes without resizing paper or moving other entries.

## Typography and themes

Paper `#f7f2e7`, writing `#514560`, October accent `#897293`, faint grid
`rgba(99, 82, 71, 0.105)`. These are original approximations, not sampled print colors.
Writing uses locally bundled Kalam Regular, 3.4 logical mm with 3.7 mm line height.
The native text controls preserve ordinary editing, selection, and IME behavior.
Printed labels use system sans-serif; large dates use system Georgia.

Kalam is licensed under SIL OFL 1.1; its complete copyright/license is served at
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
stored coordinates fixed. The enlarged native dialog offers readable writing at
18 px without changing the note's stored box or font geometry. Overflow text is
preserved, with explicit reading/editing affordances. A linear day outline uses
the same entries. The toolbar can sit on either side.

## Visual fixtures and remaining approval

Chromium at 1440 × 1120 with the bundled font captures blank, normally filled,
and dense spreads. A 390 × 844 viewport captures focused-page and enlarged-editor
views. All use synthetic text and isolated test stores. Screenshots are generated
into ignored `artifacts/` and manually inspected; no changed baseline is auto-approved.

Approximate margins, header ratios, time spacing, grid tone, and font choice still
need the user's visual approval. Physical tablet, touch-keyboard, and real IME
behavior remain unverified. M3 evaluates cover/curl motion against the actual editor;
M1 uses only a restrained transition and explicit navigation.
