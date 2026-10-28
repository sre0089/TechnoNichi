# Personal alpha use and readiness

The app is ready for a local planning trial once the final five-step PR checks
pass. Acceptance as a personal alpha still needs a week of actual planning and
the physical-device/accessibility checks below. There is no hosted deployment,
account, cloud synchronization or cross-device backup.

## Open it locally

Use Node 24 (`nvm use`), then install the exact dependencies with `npm ci` if needed.
For everyday development, run `npm run dev` and open
<http://127.0.0.1:3000>. Development does not register the offline worker.

For the production offline version:

```sh
npm run build
npm run start -- --port 3100
```

Open <http://127.0.0.1:3100> and wait for **Available offline**. Keep using the same
address, port and browser profile. Once cached, it can reopen and save locally
without a network/server connection, provided the browser retains its storage.
The shell caches only this production build's public HTML, JavaScript, CSS and
licensed font assets. Writing stays in IndexedDB. Protect local storage requests
browser persistence where supported; a grant still permits deliberate clearing.

Browser storage belongs to an origin. The development book on port 3000 and the
production book on 3100 are separate. To bring existing writing over, export a
JSON backup from 3000 and explicitly import it into the empty planner at 3100.
Keep the exported backup. Changing browsers, hostnames or profiles also creates
a separate local store; nothing synchronizes automatically.

If production was previously opened on the development address, its cached
shell can keep appearing there. Unregister that origin's worker in browser
developer tools, close its tabs, then reopen it with the development server
running. Unregistering a worker does not require clearing IndexedDB. Do not use
“clear all site data” to switch modes: that removes the book too.

## Plan a day

- Type directly in hourly rows. Enter finishes a timed task; its checkbox marks
  completion. Arrow keys move between rows while ordinary text selection works.
- Select words and use Cmd/Ctrl+B, I or U. Focused writing keeps native text undo.
  Outside writing, Cmd/Ctrl+Z undoes page actions; Shift+Z redoes them.
- Add duration or free notes, then use selected handles or keyboard/contextual
  controls to move/resize. One completed gesture makes one page action.
- Today uses the book's saved timezone. Date and the miniature calendar open a
  readable month/date chooser. The chosen phone side and resume page persist.
- Search book finds active writing in this book by words, type or date. Results
  open and focus the original item; search does not create copies.
- Close book saves first and shows the cover. Open book resumes the same date.
  View settings can turn animation off; device reduced motion is respected.
- Watch **Saved on this device**. On a storage problem, keep the recoverable
  draft, retry or explicitly review tab conflicts. Export JSON backups regularly;
  restore them into an empty browser store to verify recovery.

## Apply an app update

After pulling an approved update, install its exact dependencies, build and start
the production server again. The existing app offers **Save and update** when the
new shell is cached. It saves current drafts before activation/reload and refuses
if saving fails. Close other planner tabs before applying; updates never reload
another open editor automatically. If all old tabs are closed, a waiting worker
can activate normally without interrupting an editor. Current and previous shell
caches are retained; older shell caches can be removed during activation. No
database stores or archive version change in this batch.

Missing cache files can repair on a later online opening. A first uncached load
requires the server/network. Browser eviction, private browsing or clearing site
data can remove local writing or offline files, so retain JSON backups separately.

## Acceptance still requiring a person

- Review the cover/transitions and use the real tablet/phone: touch movement,
  resizing, zoom, scrolling and single-page focus.
- Use a real IME and a screen reader such as VoiceOver, including the day outline,
  dialogs, search and keyboard-only operation. Synthetic composition/keyboard
  browser tests are narrower evidence.
- Plan for a week, including an offline reopen/edit, a real browser restart, a
  JSON export and a restore in an empty profile. Confirm the original book and
  restored content both remain usable.

Automated desktop timings and synthetic browser engines are recorded separately;
they do not establish tablet performance or physical Safari/PWA behavior. Stop
after the approved fifth implementation step and perform this bounded trial
before selecting another feature or authorizing deployment.

## Automated desktop measurement — 2026-10-28

One serial run on macOS arm64 / Apple M2 Pro, Node 24.16.0 and Playwright 1.64.0,
using `npm run test:browser -- tests/browser/book-scale.spec.ts --workers=1`:

| Engine   | Synthetic entries | Live editors | Reload to saved state | Open/filter search |
| -------- | ----------------- | ------------ | --------------------- | ------------------ |
| Chromium | 1,825             | 54           | 182 ms                | 198 ms             |
| Firefox  | 1,825             | 54           | 281 ms                | 211 ms             |
| WebKit   | 1,825             | 54           | 157 ms                | 300 ms             |

Search rendered 20 results per page and pagination retained the full count.
These are single development-mode automated samples, including test-driver/UI
latency; they are not averages, production benchmarks, typing-latency or FPS
measurements. They establish bounded rendering for this fixture, not performance
on the user's actual tablet. Raw synthetic metrics/screenshots remain ignored
local artifacts; each test run also attaches the measurement for review.
