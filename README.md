# thexperiment.dev

A 12-day experiment. 100 conversations with Spanish-speaking SMB founders.
Live counter, daily diary, methodology disclosed in public.

Synthesis publishes May 15, two days before applications go in.

---

## Stack

- **Astro 5** — static site, content collections for markdown
- **Tailwind CSS** — utility styling, system fonts
- **Vercel** — hosting + auto-deploy on push to `main`
- **Domain** — thexperiment.dev

## Repo structure

```
content/
  diary/          # public daily entries
  interviews/     # PRIVATE — gitignored, never pushed
  patterns.json   # 3-bullet emerging patterns (public)
  quotes.json     # anonymized, permission-cleared quotes (public)
  changed-mind.md # log of contradictions (public, sanitized)
  _state.json     # totals + last-update timestamp (public)
src/
  pages/          # routes
  components/     # reusable UI
  layouts/        # base layout
  lib/            # constants, helpers
  styles/         # global.css
.claude/skills/
  log-call/SKILL.md     # /log-call after each conversation
  publish-diary/SKILL.md # /publish-diary at end of each day
```

## Privacy firewall

`content/interviews/*` is gitignored. Full transcripts never leave local.
Only anonymized, permission-cleared content reaches the public site.

## Development

```bash
npm install
npm run dev      # http://localhost:4321
npm run build
npm run preview
```

## Deploy

Push to `main` → Vercel auto-deploys.

## Daily workflow

1. Run a customer conversation.
2. Paste the transcript into Claude Code: `/log-call`.
3. Claude extracts insights, writes interview file, updates patterns/quotes/state.
4. Approve diff → auto-commit + push → Vercel deploys (~30s).
5. End of day: `/publish-diary` synthesizes the day's calls into a public diary entry.
