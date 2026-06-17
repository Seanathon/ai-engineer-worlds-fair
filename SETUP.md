# Make this your own conference plan

This repo is a personalized schedule planner for the **AI Engineer World's Fair 2026**.
It ships with one person's profile as a worked example. To get **your own** plan, you
swap in your profile and re-run the pipeline. Everything runs locally — your profile
never leaves your machine.

## What you edit

| File | What it is |
|---|---|
| **`profile.md`** | Who you are, what you want, what you already know cold, and your priority tracks A–F. **This is the main file you edit.** |
| **`tracks.json`** | The app-side name + color + weekly slot budget for each track A–F. Mirror the track meanings from `profile.md`. |

You do **not** edit any `.js`, `data.js`, or `recs.js` — those are generated.

## The pipeline (run once)

You need [Claude Code](https://claude.com/claude-code) (the scoring step uses its Workflow tool).

```bash
# 1. Normalize the conference data -> data.js
node build-data.mjs

# 2. Pre-filter to the ~200 talks worth scoring -> candidates.json + socials.json
node build-candidates.mjs        # note the "N unique talks" count it prints
```

```text
# 3. Score every candidate against YOUR profile.md (the personalization pass).
#    In Claude Code, just ask:
#       "run the scoring workflow score-talks.workflow.js with count <N>"
#    Claude runs the fan-out, then saves the result to recs-raw.json for you.
#    (N = the count printed in step 2.)
```

```bash
# 4. Bake the scores + your tracks.json into recs.js
node build-recs.mjs

# 5. Open it
open index.html        # or: python3 -m http.server 8765  and visit localhost:8765
```

Re-run steps 3–4 whenever you revise `profile.md`. Steps 1–2 only change if the
conference data changes.

> **Manual fallback for step 3** (no Claude Code, or scripting it): run the workflow
> however you like, then write its returned `{ "technical": [...], "socials": [...] }`
> object to `recs-raw.json`. `build-recs.mjs` reads that file.

## Using the app

- **For You** is the landing view: a conflict-free, back-to-back daily itinerary tuned to you, plus a week shortlist grouped by your tracks.
- **Tuning** knobs (weights, adventurousness, per-track budget, pin/exclude) recompute live — no re-scoring.
- **Star all / Export** writes your starred plan to an `.ics` you can import into any calendar.
- Stars and tuning persist in your browser's localStorage (per browser/device; the `.ics` is your portable backup).

## Deploying / sharing

It's pure static files. Push to GitHub Pages, Vercel, or Cloudflare Pages as-is.

**Fonts are bundled:** the app loads Mona Sans from `assets/fonts/` via relative
paths, so they ship with the repo and any static host renders correctly.

`data.js` / `recs.js` are snapshots taken when you ran the pipeline — re-run if the
schedule shifts.

## Pointing it at a different conference

Replace `sessions.json` + `speakers.json` with the new event's data (same shape:
see `build-data.mjs` for the fields), edit the synthetic plenary/logistics events and
day labels in `build-data.mjs`, then run the full pipeline. The app, scoring, and
itinerary logic are conference-agnostic.
