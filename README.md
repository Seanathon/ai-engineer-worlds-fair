# AI Engineer World's Fair 2026 — Personalized Schedule Planner

A fast, offline-capable schedule planner for the **[AI Engineer World's Fair 2026](https://ai.engineer/worldsfair)** (June 28 – July 2, San Francisco). It doesn't just list the ~300 talks across 29 tracks — it **builds you a conflict-free daily itinerary** by scoring every session against a profile of who you are and what you care about.

It ships with one attendee's profile as a worked example. Swap in your own and re-run the pipeline to get a plan tuned to *you*.

> **Source data:** the official program at [ai.engineer/worldsfair](https://ai.engineer/worldsfair).

## What it does

- **For You** — the landing view. A back-to-back, conflict-free itinerary for each day, computed with weighted interval scheduling (a 2-hour workshop competes against the parallel talks it overlaps), plus a week-long shortlist grouped by your priority tracks.
- **Live tuning** — dimension weights, an adventurousness dial, per-track slot budgets, and pin/exclude. Everything re-ranks instantly with **no re-scoring**.
- **Grid & Agenda views** — the full program as a 2-D time grid or a scannable list, with match-% badges and day/track filters.
- **Star & Export** — star sessions and export your plan to a standard `.ics` you can import into any calendar.
- **Runs anywhere** — pure static files (vanilla JS, no build step, no backend). Opens from a double-click or any static host. Stars and tuning persist in `localStorage`.

## Make it your own

The whole point: this is a **starter you fork**. You edit two files; everything else is generated.

| File | What it is |
|---|---|
| **`profile.md`** | Who you are, what you want, and your priority tracks A–F. The scoring step reads this verbatim. |
| **`tracks.json`** | App-side name + color + weekly slot budget for each track. |

Then re-run the pipeline (one LLM scoring pass + two build scripts). The scoring step uses [Claude Code](https://claude.com/claude-code)'s Workflow tool — point your agent at **[`SETUP.md`](SETUP.md)** and it walks through the whole flow, including pointing the app at an entirely different conference.

**→ Full instructions: [SETUP.md](SETUP.md).**

Your profile is processed locally and never leaves your machine.

## Deploy to GitHub Pages

It's static, so hosting is trivial:

1. Push this repo to a public GitHub repo.
2. **Settings → Pages → Build and deployment → Source: Deploy from a branch.**
3. Pick your default branch and the `/ (root)` folder, then **Save**.
4. Your planner goes live at `https://<your-username>.github.io/<repo-name>/`.

Vercel, Cloudflare Pages, or `python3 -m http.server` work the same way — there's nothing to build. Fonts (Mona Sans) ship in `assets/fonts/`, so typography renders correctly on any host.

## How it's built

`sessions.json` + `speakers.json` → `build-data.mjs` → `data.js` (the normalized program the app reads). A pre-filter (`build-candidates.mjs`) narrows to the substantive talks, an LLM scoring workflow rates each against `profile.md`, and `build-recs.mjs` bakes the results into `recs.js`. The app (`index.html` + `app.js` + `recommend.js`) reads those baked files — no network calls at runtime.

---

Built with [Claude Code](https://claude.com/claude-code). Not affiliated with the AI Engineer World's Fair.
