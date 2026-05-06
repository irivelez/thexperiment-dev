---
name: log-call
description: After a customer conversation, process the full transcript into the experiment's data layer. Extracts structured insights, writes the private interview file, updates patterns/quotes/state, surfaces contradictions to the changed-mind log, shows a diff, and on approval commits + pushes. Triggers Vercel rebuild → live counter ticks. Use this every time Irina finishes a call during the May 4–15 sprint.
---

# /log-call

You are processing a single customer conversation transcript that Irina just
finished. The transcript may be in Spanish, English, or mixed. Your job is to
turn it into durable, analyzable, anonymizable data and update the
thexperiment.dev site.

This skill runs in the project root (the repository at the working directory).
All file paths below are relative to that root.

## Inputs

The user invokes `/log-call` and provides:
- The full transcript (pasted in, or a path to a transcript file).
- Optionally: notes about whether the founder gave permission to quote, and
  any anonymization preferences.

If the user does not provide a transcript, ask once:
*"Paste the transcript or give me the path to the transcript file."*

## Steps

### 1. Read context

Read these files (parallel):
- `content/_state.json` — current totals, day, vertical/country breakdown
- `content/patterns.json` — existing patterns
- `content/quotes.json` — existing quotes
- `content/changed-mind.md` — log of contradictions

### 2. Extract structured fields from the transcript

Parse the transcript carefully. Be conservative — if a field isn't clearly
stated, mark it `null`, don't fabricate. Required fields:

| Field | Type | Source in transcript |
|---|---|---|
| `vertical` | string (kebab-case) | What kind of business: dental-clinic, beauty-salon, real-estate, restaurant, tutoring, e-commerce, immigration-legal, other |
| `country` | ISO-2 code | MX, CO, AR, CL, PE, EC, etc. |
| `city` | string | City name as said |
| `employees` | number | Team size including owner |
| `whatsappVolume` | string | Daily message volume — capture verbatim (e.g. "~200/day", "between 50 and 100") |
| `topPain` | string | The single most painful repetitive task (one sentence) |
| `currentWorkaround` | string | What they do today instead of solving it |
| `wtpUsd` | number \| null | Stated willingness-to-pay USD/month if mentioned |
| `lostCustomersPerMonth` | number \| null | If quantified |
| `magicWandTask` | string | The task they'd most want cloned |
| `wouldPilot` | boolean | Did they say yes/maybe/no to a pilot offer? |
| `permissionToQuote` | "pending" \| "granted" \| "denied" | Default to "pending" unless the user says otherwise in their invocation |
| `quotableLine` | string \| null | The single most quotable verbatim line (in original language) |
| `contradictsHypothesis` | string \| null | If anything they said contradicts the working bet (per `private/bet.md`: AI can probably take over part of an existing business and either transform or replace it; the OS is the agentic system that operates them, not the channel they communicate through), capture the contradiction in one sentence. Otherwise null. |

### 3. Generate the filename

Format: `YYYY-MM-DD_<vertical>_NN.md`

- `YYYY-MM-DD` = today (use the current date)
- `<vertical>` = the vertical field, kebab-case
- `NN` = sequential number for that day. Count existing files in
  `content/interviews/` matching `YYYY-MM-DD_*` and add 1, zero-padded.

### 4. Write the interview file

Path: `content/interviews/<filename>.md`

This file is **private** (gitignored). Format:

```markdown
---
date: <YYYY-MM-DD>
vertical: <vertical>
country: <CO>
city: <city>
employees: <N>
whatsappVolume: "<verbatim>"
topPain: "<one sentence>"
currentWorkaround: "<one sentence>"
wtpUsd: <number or null>
lostCustomersPerMonth: <number or null>
magicWandTask: "<one sentence>"
wouldPilot: <true|false>
permissionToQuote: <pending|granted|denied>
contradictsHypothesis: <null or "one sentence">
---

# Conversation summary

<200–400 word prose summary of the call. What they said, in their own
framing. Preserve the founder's voice — quote sparingly when they say
something striking. Do NOT editorialize or add interpretation here; this
is the raw record.>

## Key insights

- <bullet 1: the thing that was most surprising or most consequential>
- <bullet 2>
- <bullet 3>

## Surprises / contradictions

<If they contradicted the working hypothesis or any earlier pattern, name
it explicitly. If nothing surprising — say "Confirms prior signal: <X>."
This section is the single most valuable analytical input — be precise.>

## Quote (verbatim, original language)

> "<the quotableLine>"

## What I'd ask differently next time

<1 sentence — the question you wish you had asked. Improves future calls.>
```

### 5. Update content/_state.json

Increment:
- `totalCalls` += 1
- `byVertical[<vertical>]` += 1 (initialize to 1 if absent)
- `byCountry[<country>]` += 1 (initialize to 1 if absent)
- `lastUpdated` = current ISO timestamp in America/Bogota
- `day` = compute from startDate (`2026-05-04`) to today, clamped 0..12

If `wouldPilot === true` and `permissionToQuote !== "denied"`, increment
`pilotsBooked` by 1. (Confirm with user if uncertain.)

### 6. Update content/patterns.json

Read the existing patterns. Decide:

- **Does the call's `topPain` or `magicWandTask` map to an existing pattern?**
  If yes: increment `count`, append `<vertical>` to the `verticals` array
  (deduplicated). Promote `early-signal` → `confirmed` when count ≥ 3 AND
  `verticals.length` ≥ 2.
- **Or does it surface a new pattern?**
  Add a new entry with status `early-signal`, count 1, verticals: [`<vertical>`].
- **Does the call contradict an existing pattern?**
  If yes, add a new entry with status `contradicted` referencing the original,
  AND consider whether the original should be marked `contradicted` directly
  (only if you have strong reason — usually keep both, let the data accumulate).

Always update `patterns.lastUpdated` to today.

Cap the visible patterns array at the top 5 by signal strength
(confirmed > early-signal > contradicted > pending). Do not delete entries —
move lower-signal ones to a `_archived` array if needed.

### 7. Update content/quotes.json (only if permission granted)

If `permissionToQuote === "granted"` AND a `quotableLine` exists:

Append to `quotes`:
```json
{
  "text": "<quotableLine>",
  "vertical": "<vertical>",
  "city": "<city>",
  "country": "<country>",
  "staffSize": <employees>,
  "permissionGranted": true
}
```

Translate the quote to English ONLY if the user requests; otherwise preserve
original language. Update `quotes.lastUpdated`.

### 8. Update content/changed-mind.md (only if contradiction)

If `contradictsHypothesis` is non-null:

Append a new section to `content/changed-mind.md`:

```markdown
## Day <N> — <date> — <one-line headline>

**What I thought:** <prior assumption>

**What this conversation showed:** <the contradiction, in one sentence,
sourced to vertical/city/staff anonymization>

**What I'm updating:** <the new working hypothesis, or "still in tension —
need more calls">
```

### 9. Show the diff

Print to the user:
- ✓ Created `content/interviews/<filename>.md`
- ✓ Updated `content/_state.json` (calls: <old> → <new>, day <N>)
- ✓ Updated `content/patterns.json` (<which patterns changed>)
- ✓ Updated `content/quotes.json` (<added or skipped>)
- ✓ Updated `content/changed-mind.md` (<added or skipped>)

Show the actual content of the new interview file's frontmatter for
verification. Ask: *"Approve the changes? (y/n)"*

### 10. On approval — commit and push

Use one atomic commit per call:

```
git add content/_state.json content/patterns.json content/quotes.json content/changed-mind.md content/interviews/
git commit -m "call <N>: <vertical>, <city> <country> — <one-line takeaway>"
git push
```

Note: `content/interviews/<filename>.md` is **gitignored**, so it stays local.
Do NOT remove it from .gitignore. The commit will only push the public-layer
updates to state, patterns, quotes, changed-mind. That is the firewall in action.

After push, report: *"Pushed. Vercel rebuild fires in ~30s. Counter at thexperiment.dev/will tick to <N>."*

### 11. Reject path

If the user says no at step 9: revert the file changes (`git restore` for
modified, `rm` for new files in interviews/ — be careful only to remove the
single new file). Don't auto-retry; ask what to fix.

## Edge cases

- **Transcript in Spanish only:** preserve the founder's Spanish in the
  interview file (`# Conversation summary` and `Quote` section). Translate
  only the structured fields and the "Key insights" bullets to English (since
  patterns.json is consumed in English on the public site).
- **Multiple verticals in one call:** pick the dominant one for the file's
  `vertical` field. Mention secondary in the prose summary.
- **Founder is wishy-washy on willingness-to-pay:** record `null`. Don't
  pressure-extract a number.
- **Pilot offered but founder said "let me think":** record `wouldPilot: false`,
  note in the summary they're a follow-up.
- **Founder fully off-topic / not actually an SMB owner:** flag in the prose
  summary, do NOT increment counters. Save the file but suffix vertical with
  `-OFFTOPIC` (e.g. `other-OFFTOPIC`). Don't push.

## Tone of the prose summary

Lab notebook, not marketing. Use present tense. Quote sparingly. Do not
editorialize. The skill captures the data; analytical synthesis happens later
via `/publish-diary` and the day-14 cross-call review.
