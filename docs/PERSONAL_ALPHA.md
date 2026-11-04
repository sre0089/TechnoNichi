# Personal alpha use and readiness

The app is live at <https://technonichi.netlify.app>; no terminal is needed.
Writing stays on your device. PROJECT_STATE.md records current checks.
Acceptance as a personal alpha still needs a week of actual planning and
the physical-device/accessibility checks below. Accounts, cloud synchronization
and automatic cross-device backup are not provided.

## Use the hosted app and bring your existing book

1. Open your existing localhost or staging book in its original browser/app.
   Choose **Backups → Download backup**. Keep that file and the original book.
2. Open <https://technonichi.netlify.app> online in your preferred browser.
   On **Create your book**, choose **Backups** and restore the downloaded backup
   **before creating a book**. Review the file, then choose **Restore backup**.
   If you already created a production book, keep it and use another empty browser
   profile for the import; restore never overwrites an existing book.
3. Check the restored dates and writing. Make a small edit, wait for **Saved on
   this device**, and reopen to confirm it persisted.
4. Open **App setup** and install this production address as a separate app.
   Keep the backup: if the installed copy opens an empty store, restore there
   before creating a book. Wait for **Available offline**.
5. Disconnect networking, reopen the production app, write a test entry and reopen
   once more. Confirm both the imported writing and new edit remain. Reconnect
   afterward and continue keeping regular independent backups.

For a brand-new book, skip the export/import and use **Create your book** instead.
Localhost, staging and production have separate stores; changing browsers,
profiles or devices does not transfer writing. The website hosts the application,
not a cloud copy of your book. Keep the original until the new copy is verified.
The standalone window and purple theme remain; exact title-bar appearance is
controlled by the browser and operating system.

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

## Try hosted staging with synthetic writing

The approved Netlify Free draft is at <https://staging--technonichi.netlify.app>.
It is publicly reachable and has passed synthetic desktop save/offline/restore
checks in three engines. This preview is for test entries; use the stable
production address above for your ongoing book. Staging, localhost and production
have separate stores. Keep your original book and retained backup when transferring.

On a real phone/tablet or desktop, open this URL online, create a synthetic book,
and follow App setup to install it. Wait for Available offline, add a test entry,
disconnect networking, reopen from the icon, add another entry and reopen again.
Report OS/browser versions, install behavior and whether both entries survived.
On Safari, use the guide's separate-store backup/restore steps if needed. Do not
clear your original book. Hosted update/refusal/compatible rollback has passed
automated checks in three engines. Physical-device/accessibility and week-of-use
acceptance remain separate checks before any invitations.

On desktop Chrome, also confirm that launching the installed icon keeps the
separate app window and purple title bar the user wants to preserve. Resize the
window and check that navigation and writing remain usable. Report visual or
window-behavior changes separately from save/offline results.

To repeat automated staging checks using fresh synthetic browser stores:

```sh
HOSTED_BASE_URL=https://staging--technonichi.netlify.app npm run test:hosted
```

No persistent browser profile or personal backup is used by that command.

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

Localhost is useful for desktop testing only. Use the stable production HTTPS
address above for physical-phone installation. Keep synthetic testing on staging.

## Plan a day

- Type directly in hourly rows. Enter finishes a timed task; its checkbox marks
  completion. Arrow keys move between rows while ordinary text selection works.
- Select words and use Cmd/Ctrl+B, I or U. Focused writing keeps native text undo.
  Outside writing, Cmd/Ctrl+Z undoes page actions; Shift+Z redoes them.
- In a free note, type `/` at a line's start for **To-do checkbox**, **Bullet list**
  or **Numbered list**. Choose with the pointer or arrows and Enter; typing filters
  the menu. Escape dismisses it and retains the slash. Boxes appear before text.
  Enter continues the list; Enter on an empty item ends it. Tab/Shift+Tab changes
  list depth (up to six levels). Shift+Enter starts a plain line; Backspace at the
  start removes one indent or marker. Completed to-dos keep their wording with a
  light strike-through. This feature requires the note-list build; the current
  public release does not include it until separately approved publication.
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

For hosted use, reopen online to receive an approved published update. No terminal
or Git command is needed. Developers testing a local build instead pull approved
changes, install exact dependencies, rebuild and restart the local server.
The app offers **Save and update** when the new shell is cached. It saves current
drafts before activation/reload and refuses if saving fails. Close other planner
tabs and app windows before applying;
updates never reload another open editor automatically. If all old tabs are
closed, a waiting worker
can activate normally without interrupting an editor. Current and previous shell
caches are retained; older shell caches can be removed during activation. No
database stores or archive version change in this batch.

Missing cache files can repair on a later online opening. A first uncached load
requires the server/network. Browser eviction, private browsing or clearing site
data can remove local writing or offline files, so retain JSON backups separately.

## Repeat the hosted update/rollback exercise

This is an operator-driven synthetic staging test. Preserve the working isolated
checkout's `.next`, `public/sw.js` and complete `.netlify` output before building
an update in a second isolated tracked-source checkout. Retain fingerprints of
the processed static files and packaged internal function. Never use a failed
draft as the baseline or rebuild the retained checkout during this exercise.

1. Verify the retained output on a separate preview alias first. With reviewed
   CLI 27.16.2, `netlify deploy --no-build --dir .netlify/static --alias rollback-check`
   uses the processed static files plus the retained internal function manifest.
   Run it from the baseline checkout with its site linkage and complete generated
   output. Verify the actual worker bytes, root Next build ID and every precache
   resource over HTTPS. A bare no-build deploy uses the wrong `.next` directory.
2. Create a local baseline JSON containing `origin`, `deploymentId`,
   `workerVersion` and `buildId`, taken from the verified baseline. Retain its
   source SHA and artifact fingerprints with the local report. Start the harness:

   ```sh
   HOSTED_BASE_URL=https://staging--technonichi.netlify.app \
   HOSTED_BASELINE_FILE=/path/to/verified-baseline.json \
   HOSTED_LIFECYCLE_DIR=artifacts/new-lifecycle-run \
   npm run test:hosted:lifecycle
   ```

   The output directory must be new; its parent must exist. The harness opens
   three disposable synthetic books and writes `ready.json` when they are saved.

3. Keep the harness running. From the second clean checkout, use one reviewed
   `netlify deploy --context deploy-preview --alias staging` build-and-upload
   command. Verify the resulting worker/build identities differ from baseline,
   all resources work, and the schema is compatible. Atomically write
   `update-ready.json` into the run directory with `origin`, `deploymentId`,
   `workerVersion` and `buildId` from that verified deployment. The harness tests
   other-client refusal, failed-save retention/retry, actual new client loading
   and offline editing. Wait for `updated.json` before continuing.
4. Recheck baseline artifact fingerprints. From the retained checkout, deploy
   with `--no-build --dir .netlify/static --alias staging`. Verify the hosted
   worker and root build ID match baseline and resources remain available.
   Atomically write `rollback-ready.json` with the new provider deployment ID
   and baseline worker/build IDs. The harness activates that shell through Save
   and update and verifies all newer data and offline writing survive.
5. Require `result.json` with `passed`, all three engines and no errors. If the
   harness exits or writes `failure.json`, inspect the report and restore/verify
   a known-good staging deployment before proceeding. Keep reports/screenshots
   local and synthetic. The script never deploys or publishes on its own.

The 2026-11-03 run passed Chromium, Firefox and WebKit through A → B → A. It
checked actual loaded Next build IDs and preserved all four database tables after
rollback, including newer offline writing. This validates compatible artifact
republication to staging. It does not establish schema downgrades, Netlify's
production atomic-restore operation or native OS window behavior. Production
publication and remaining real-device/accessibility trial evidence stay separate.

## Reported desktop check — 2026-11-03

The user installed the production app with Chrome. Its existing book appeared
without restoring a backup. After writing, closing the terminal server and book,
and reopening the installed app without restarting the server, the edits remained.
This establishes the reported local Chrome installation/offline reopening path;
it does not establish synchronization or a cloud copy. Browser/OS versions were
not supplied. Offline editing after reopening, restore into a fresh profile,
installed-app updates, Safari/phone checks and a full week of use remain unverified.
No real writing or screenshots are included in this record.

## Reported hosted check — 2026-11-03

The user confirmed that the supplied hosted staging test flow works: installation
and the app-window experience, normal editing/reopening, and offline editing with
retained writing on their tested setup. This records the user's overall result;
device/OS/browser versions and the optional phone/tablet repeat were not specified.
It does not establish every target device, hosted updates/rollback, a full week of
use or assistive-technology acceptance. Those remaining gates still apply before
production release and invitations.

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
