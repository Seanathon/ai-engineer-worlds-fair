// score-talks.workflow.js — the personalization pass (Claude Code Workflow).
//
// Scores every candidate talk against YOUR profile.md and bakes the rich
// per-dimension records the app needs. Profile-driven: agents read profile.md
// at run time, so you never edit this file — just edit profile.md + tracks.json.
//
// HOW TO RUN (inside Claude Code, from the repo root):
//   1. node build-data.mjs && node build-candidates.mjs     (produces candidates.json)
//   2. Ask Claude Code: "run the scoring workflow score-talks.workflow.js"
//      (it invokes this via the Workflow tool; pass args {count: <candidates count>})
//   3. Save the workflow's .result to recs-raw.json, then: node build-recs.mjs
// See SETUP.md for the full flow.

export const meta = {
  name: 'score-talks',
  description: "Score conference talks against profile.md, banking rich per-dimension records",
  phases: [
    { title: 'Score talks', detail: 'fan out over candidate batches, apply the rubric in profile.md' },
    { title: 'Score socials', detail: 'networking lens for evening events' },
  ],
}

// The scoring METHODOLOGY is fixed; WHO it scores against lives in profile.md.
const RUBRIC = `
You are scoring conference talks for one person. Read ./profile.md FIRST — it
defines who they are, their strong-match signals, their negative list (things
they already know cold), their creative/maker side, their goals, and their
priority Tracks (labelled A–F, plus "none"). Score every assigned talk against
THAT profile, not a generic engineer.

For each talk score these 0–5 integers:
- relevance: fit to the person's ACTIVE problems / current focus (strong-match signals). Heaviest axis.
- depth: advanced, decision/architecture/post-mortem oriented. Penalize intro/101 HARD (0–1).
- novelty: teaches something beyond their negative list. If it overlaps the negative list, novelty = 0.
- goalFit: serves one of the person's stated goals.
- creativeAppeal: appeal to their creative/maker side (from profile.md). Independent of technical score.
Also:
- format: one of "war-story" (post-mortem / what-broke / production lessons / real numbers), "tutorial" (how-to / walkthrough / intro), "hype" (vision, no substance), "mixed", "unknown".
- track: the best-fit letter from the profile's Tracks (A/B/C/D/E/F) or "none".
- trackName: the profile's name for that track.
- keywords: up to 5 of the person's keywords/themes the talk actually matches.
- rationale: ONE specific sentence, "why it fits (or doesn't)". No fluff, no em-dashes.
- confidence: "high" | "med" | "low" (low if the abstract is vague/marketing-only).
Be skeptical: vendor abstracts oversell. Reward concrete production substance; penalize marketing.
`

const SCHEMA = {
  type: 'object', additionalProperties: false, required: ['scores'],
  properties: {
    scores: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false,
        required: ['idx', 'relevance', 'depth', 'novelty', 'goalFit', 'creativeAppeal', 'format', 'track', 'trackName', 'keywords', 'rationale', 'confidence'],
        properties: {
          idx: { type: 'integer' },
          relevance: { type: 'integer', minimum: 0, maximum: 5 },
          depth: { type: 'integer', minimum: 0, maximum: 5 },
          novelty: { type: 'integer', minimum: 0, maximum: 5 },
          goalFit: { type: 'integer', minimum: 0, maximum: 5 },
          creativeAppeal: { type: 'integer', minimum: 0, maximum: 5 },
          format: { type: 'string', enum: ['war-story', 'tutorial', 'hype', 'mixed', 'unknown'] },
          track: { type: 'string', enum: ['A', 'B', 'C', 'D', 'E', 'F', 'none'] },
          trackName: { type: 'string' },
          keywords: { type: 'array', items: { type: 'string' }, maxItems: 5 },
          rationale: { type: 'string' },
          confidence: { type: 'string', enum: ['high', 'med', 'low'] },
        },
      },
    },
  },
}

const SOCIAL_SCHEMA = {
  type: 'object', additionalProperties: false, required: ['scores'],
  properties: {
    scores: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false,
        required: ['idx', 'networkingValue', 'rationale', 'worthIt'],
        properties: {
          idx: { type: 'integer' },
          networkingValue: { type: 'integer', minimum: 0, maximum: 5 },
          worthIt: { type: 'boolean' },
          rationale: { type: 'string' },
        },
      },
    },
  },
}

const COUNT = args && args.count ? args.count : 218
const BATCH = 16
const batches = []
for (let start = 0; start < COUNT; start += BATCH) batches.push([start, Math.min(start + BATCH, COUNT) - 1])

phase('Score talks')
log(`Scoring ${COUNT} talks across ${batches.length} batches of ${BATCH} against profile.md`)

const techResults = await parallel(batches.map(function (b) {
  return function () {
    const [start, end] = b
    const prompt = RUBRIC +
      `\n\nTASK: Use the Read tool to read ./profile.md (the person), then ./candidates.json (object with a .candidates array; each entry has title, type, track, day, time, speakers, description). ` +
      `Score ONLY the candidates at array indices ${start} through ${end} inclusive (${end - start + 1} talks). Set idx = the array index. Return one record per index in [${start}, ${end}].`
    return agent(prompt, { label: `score:${start}-${end}`, phase: 'Score talks', schema: SCHEMA, agentType: 'general-purpose' })
      .then(function (r) { return r && r.scores ? r.scores : [] })
  }
}))

phase('Score socials')
const socialResult = await agent(
  RUBRIC +
  `\n\nTASK: Use the Read tool to read ./profile.md, then ./socials.json (object with a .socials array of evening/networking events: title, day, time, description, host). ` +
  `These are NOT technical talks — score each ONLY on NETWORKING / peer-connection value for this person's goals (0–5). worthIt = true if they should attend. idx = array index. One-sentence rationale, no em-dashes.`,
  { label: 'score:socials', phase: 'Score socials', schema: SOCIAL_SCHEMA, agentType: 'general-purpose' }
)

const technical = [].concat.apply([], techResults.filter(Boolean))
const socials = (socialResult && socialResult.scores) ? socialResult.scores : []
log(`Scored ${technical.length} talk records + ${socials.length} socials`)

return { technical: technical, socials: socials }
