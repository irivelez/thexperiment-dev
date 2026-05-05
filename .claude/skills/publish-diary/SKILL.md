---
name: publish-diary
description: At the end of each sprint day (or when the user explicitly invokes it), synthesize the day's customer conversations into a public-facing diary entry for thexperiment.dev. Reads private interview files, distills a 250–400 word lab-notebook entry, anonymizes everything, writes content/diary/day-NN.md, commits + pushes. Use this once per day during May 4–15 — typically after the last call, before bed.
---

# /publish-diary

You're synthesizing a day's worth of customer conversations into a public diary
entry. This is the LinkedIn / X / thexperiment.dev daily content engine. Each
entry compounds the audience, signals discipline to a16z partners, and serves
as a "what changed today" receipt.

## Inputs

The user invokes `/publish-diary`. Optional argument: a specific day number
(default = current day, computed from today vs `2026-05-04`).

## Steps

### 1. Determine the day

Read `content/_state.json` for current `day`.
If the user supplied a day argument, use that instead.

### 2. Gather the day's calls

Read all files in `content/interviews/` whose date in the filename or
frontmatter equals today's calendar date (America/Bogota timezone).

If zero calls today: report *"No interviews recorded for today. Did you
mean to invoke `/log-call` first, or is this a synthesis-only / setup
day?"* and ask before continuing. (Pre-launch days, weekly review days,
and synthesis days are valid reasons to publish a diary entry without calls.)

### 3. Read the running context

In parallel, read:
- `content/patterns.json` — what's currently surfacing
- `content/changed-mind.md` — recent contradictions
- The 3 most-recent diary entries from `content/diary/` (sorted by day desc)
  to keep voice + cadence consistent

### 4. Draft the entry

A diary entry is a **lab notebook page**, not a LinkedIn-style hot take.
Voice rules:

- **First person, present tense.** "I spoke with...", "I'm noticing...",
  "I changed my mind today on..."
- **Specific, never vague.** Numbers. Verbatim phrases (anonymized).
  Concrete businesses by vertical/city/staff size.
- **Honest about the unknown.** "I don't know what to make of this yet"
  is a valid sentence in this voice.
- **No CTAs in the body.** No "subscribe to my newsletter." The site's
  layout already does that work.
- **Anonymity is non-negotiable.** Never name a founder. Never name a
  business. Vertical + city + staff size only — and only if multiple
  founders share that combination, otherwise generalize further.

Length: 250–400 words. If you need more, split into a follow-up entry
the next day.

Structure (flexible):

1. **Lede** — one or two sentences. The single thing that sticks from today.
2. **The detail** — 1–2 vignettes from specific calls (anonymized) that
   illustrate it. Past behavior, not promises.
3. **What's sharpening / what's blurring** — connect to the running patterns.
   Did today confirm an early-signal? Contradict one? Surface a new candidate?
4. **What I'm doing about it tomorrow** — one sentence on the next concrete move.

Do NOT include the day number, date, or "Day X of 12" in the body — those go
in the frontmatter and render in the layout.

### 5. Write the file

Path: `content/diary/day-<NN>.md` (zero-padded, two digits)

Frontmatter schema (must validate against `src/content.config.ts`):

```yaml
---
day: <N>
title: "<6–10 word headline that sets the day's takeaway>"
date: <YYYY-MM-DD>
conversations: <total calls cumulative — read from _state.json totalCalls>
excerpt: "<single-sentence teaser, ≤180 chars, used on /diary index and OG description>"
lang: en
---
```

Title rules:
- No "Day X of 12" prefix — that's in the frontmatter.
- Active voice, specific. Bad: "Some interesting findings today."
  Good: "Three founders said the same thing about Saturday nights."
- For day-6 contradiction post: title should make the change of mind
  legible. Example: "I was wrong about price."

Body: 250–400 words, the structure above.

### 6. Update _state.json

If `state.day < <N>` for the day being published, update `day = <N>` and
`lastUpdated = current ISO timestamp` (America/Bogota).

### 7. Show the draft

Print the full draft to the user, formatted as it would render. Include
the frontmatter. Ask:

*"Approve and publish? (y / edit / no)"*

If `edit`: ask what to change, redraft, re-show.
If `no`: save as `content/diary/_draft-day-<NN>.md` (note the underscore
prefix excludes it from the glob loader) and exit. The user can come back
later.

### 8. On approval — commit and push

```
git add content/diary/day-<NN>.md content/_state.json
git commit -m "diary: day <N> — <6–10 word headline>"
git push
```

If a draft existed, also `git rm` the `_draft-*` file and include it in the
commit.

After push, report:
*"Pushed. day-<NN> publishes at thexperiment.dev/diary/day-<NN> in ~30s.
Total calls: <N>. Day <D> of 12."*

### 9. Suggest the LinkedIn post

After publishing, generate a LinkedIn-ready version:
- Spanish first (LATAM audience), English second
- 1300-character target (LinkedIn's sweet spot for reach)
- Hook in the first 2 lines (before the "...see more" fold)
- Same lede as the diary, expanded with more concrete detail
- End with: "Día <D>/12 · <calls>/100 conversaciones · thexperiment.dev"
- Add `#construyendoenpúblico` (es) and `#buildinginpublic` (en) hashtags
  ONLY in the very last line

Output as two markdown blocks (es / en) with copy-ready formatting. The user
manually posts to LinkedIn.

## Special days

- **Day 0 (pre-launch, May 3):** "The bet" entry already exists.
  This skill should refuse to overwrite it.
- **Day 6 (~May 9, mid-sprint):** The "I changed my mind" post is the highest-
  leverage entry of the entire sprint. Spend extra effort here. Pull from
  `content/changed-mind.md` for the substance. The headline must include the
  contradiction (e.g., "I was wrong about ___.").
- **Day 10 (May 13, synthesis prep):** Lower call volume; entry should preview
  the POV being assembled. Tease without revealing.
- **Day 11 (May 14, synthesis):** Same. Build anticipation for May 15.
- **Day 12 (May 15, ship day):** This entry coincides with the POV launch.
  Title: "The thesis." Body: brief — point to /pov. The POV doc itself does
  the heavy lifting.

## Tone calibration — examples

✗ *"Today I spoke with five amazing entrepreneurs and I learned so much! It's
incredible what these brave founders are building."* — generic, performative.

✓ *"Three salons in Mexico City. All three said the same sentence within 60
seconds of starting: 'no contesto en la noche, pierdo clientes.' Same exact
phrasing. I don't think this is a vibe — it's the operating layer."* — specific,
auditory, lab-notebook honest.

✗ *"AI is going to revolutionize how SMBs operate, and Trynoa is positioned
to lead that revolution."* — investor pitch language. Wrong site.

✓ *"I went into today thinking the wedge was scheduling. Tonight I think it
might be after-hours response and scheduling is downstream of that. Tomorrow
I'm asking the question differently — testing the inversion."* — earned,
updating, honest.
