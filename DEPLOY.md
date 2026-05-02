# Deploy thexperiment.dev to Vercel

One-time setup. After this, every `git push origin main` auto-deploys in ~30s.

## 1. Push the repo to GitHub

```bash
# Create a new repo at github.com/<you>/thexperiment-dev (private or public)
# Then:
git remote add origin git@github.com:<you>/thexperiment-dev.git
git push -u origin main
```

**Make the repo public** if you want the open-lab-notebook signal — full
methodology + commit history visible. Private interview transcripts
remain gitignored regardless.

## 2. Connect to Vercel

Option A — web UI (recommended, 90 seconds):
1. Go to vercel.com → New Project → Import the GitHub repo
2. Vercel auto-detects Astro. No config needed.
3. Click Deploy.

Option B — CLI:
```bash
npm i -g vercel
vercel
```

## 3. Point thexperiment.dev to Vercel

In your domain registrar (Namecheap/Cloudflare/etc.), add:
- `A` record: `@` → `76.76.21.21`
- `CNAME` record: `www` → `cname.vercel-dns.com`

In Vercel → Project Settings → Domains:
- Add `thexperiment.dev`
- Add `www.thexperiment.dev` (set to redirect to apex)

SSL provisions automatically in ~10 minutes.

## 4. Verify

```bash
curl -I https://thexperiment.dev
# Should return 200 OK with x-vercel-id header
```

## Daily workflow after setup

```
1. Run a customer call.
2. Open Claude Code in this repo.
3. /log-call  ← paste transcript
4. Approve diff
5. Auto-commit + push happens
6. Vercel rebuild fires; site updated in ~30s
```

End-of-day: `/publish-diary` to ship the day's public diary entry.

## Local development

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # verify production build
npm run preview  # preview the production build locally
```

## Troubleshooting

**Build failing?** Run `npm run build` locally first. Astro reports
schema errors clearly when content collection entries don't match the zod schema.

**Counter not updating?** Counter reads `content/_state.json` at build
time. If `/log-call` updated it locally but the site shows old numbers,
check that the commit was pushed and Vercel rebuild fired.

**Missing diary entry?** Check the frontmatter passes the schema in
`src/content.config.ts`. `day` must be 0-20, `date` must parse as a Date,
`excerpt` is required.
