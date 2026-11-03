# Personal alpha use and readiness

The app supports a local planning trial; PROJECT_STATE.md records current checks.
Acceptance as a personal alpha still needs a week of actual planning and
the physical-device/accessibility checks below. There is no hosted deployment,
account, cloud synchronization or cross-device backup.

## Open it locally

Use Node 24 (`nvm use`), then install the exact dependencies with `npm ci` if needed.
For everyday development, run `npm run dev` and open
<http://127.0.0.1:3000>. Development does not register the offline worker or show
installation controls.

For the production offline version:

```sh
npm run build
npm run start -- --port 3100
```

Open <http://127.0.0.1:3100> and wait for **Available offline**. Keep using the same
address, port and browser profile. Once cached, it can reopen and save locally
without a network/server connection, provided the browser retains its storage.
The shell caches only this production build's public HTML, JavaScript, CSS,
licensed fonts, manifest and six original icon files. Writing stays in IndexedDB.
Protect local storage requests browser persistence where supported; a grant still
permits deliberate clearing.

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

## Create or restore your book

A fresh browser store shows **Create your book**. Choose a name, year, timezone
for Today, and whether reopening should show Today or your last page. The year
can include leap days; written times stay as entered. When Today is outside the
book's year, the last visited page opens (January 1 in a new book).
Change the opening choice later in **View settings**. Older books keep their
saved position by default and retain their original IDs, dates and writing.

To import an existing JSON backup, choose **Backups** on the setup screen before
creating a book. Review the file, then choose **Restore backup**. Restore requires
a completely empty store, including no existing empty book. It never replaces
an existing book. Retained emergency drafts prevent creating an unrelated book;
restore their original book first. Invalid recovery buffers remain untouched.
Only one yearly book is active in this slice; annual switching is later work.

## Install and bring your book

In the production app, open **App setup** from the setup screen, open book or
closed cover. It explains installation even when the browser offers no native
prompt. If the browser offers **Install Daily Book**, the button saves pending
writing first. A failed save keeps the offer available for retry; accepting the
browser prompt is recorded as a request, not proof of installation. Installation
and **Available offline** are separate states.

Safari Home Screen and Dock apps use separate storage from browser tabs. Before
installing, choose **Backups → Download backup** and retain that file and the
original book. On iPhone/iPad, use Safari's **Share → Add to Home Screen**; on
Mac Safari, use **File → Add to Dock**. In Chrome/Edge, look for **Install app**
or **Add to Home Screen** in the browser menu/address bar. Availability varies.

Open the new icon online. If it shows **Create your book**, use **Backups →
Restore backup** before creating a new book. Wait for **Available offline**,
then test a saved edit and offline reopening. The guide says **App info** in
standalone mode; this identifies the current window's display mode, not every
installation on the device. Other browsers may share a book within a profile;
separate stores do not synchronize. Removing an app or clearing its data may
remove its book. Keep regular independent backups.

Localhost is useful for desktop testing only. Physical-phone installation needs
a reachable secure origin; no hosted deployment is configured by this milestone.
Do not treat a preview origin as the permanent home of a real book.

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
if saving fails. Close other planner tabs and app windows before applying;
updates never reload another open editor automatically. If all old tabs are
closed, a waiting worker
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
- On real desktop Chrome/Edge and Safari, then iPhone/iPad Safari against an
  approved secure origin: install from the browser menu, launch the icon, follow
  the separate-store restore guidance, edit/reopen offline and apply a saved
  update. Test another open browser/app window refuses that update. Verify icon
  appearance and actual storage sharing/separation; synthetic mode/prompt tests
  do not establish these OS behaviors.

Automated desktop timings and synthetic browser engines are recorded separately;
they do not establish tablet performance or physical Safari/PWA behavior.
Complete this bounded trial before selecting another feature or authorizing
deployment.

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
