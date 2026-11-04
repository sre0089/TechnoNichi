# TechnoNichi

I use a Hobonichi Techo Cousin every day, but being left-handed means ink can
smudge as I write. I started TechnoNichi to keep the familiar feeling of planning
on paper while making it easier to write and edit digitally.

Inspired by the Cousin’s grid pages and daily spreads, TechnoNichi is a digital
planner where you can write tasks directly on hourly rows, check them off, and
leave free notes. You can format individual words, move between pages, and back
up your book, with your writing saved automatically on your device—all within an
interface that feels like an open notebook.

[Try TechnoNichi](https://technonichi.netlify.app).

## Run locally

Use Node.js 24 LTS, then:

```sh
npm ci
npm run dev
```

Open <http://127.0.0.1:3000>. No account or application environment variables are
required. In free notes, type `/` at a new line for to-dos, bullets or numbered
lists; use Tab and Shift+Tab to indent and outdent.

Books save in the current browser profile. Keep independent JSON backups using
**Backups**; books do not automatically synchronize between devices or addresses.

See [CONTRIBUTING.md](CONTRIBUTING.md) for checks, browser tests and the installable
offline preview.
