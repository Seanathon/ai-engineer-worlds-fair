// build-candidates.mjs — Stage A of the recommendation pipeline.
//
// Heuristic pre-filter: from the full schedule, isolate the sessions actually
// worth LLM-scoring against Sean's profile, and dedupe identical talks so the
// expensive scoring pass runs once per unique abstract (the score maps back to
// every slot that shares it). Socials are split out — they get a networking
// lens, not the technical rubric.
//
// Run: node build-candidates.mjs  →  writes candidates.json + socials.json

import { readFileSync, writeFileSync } from "node:fs";

global.window = {};
await import("./data.js");
const ALL = window.SCHEDULE.sessions;

const PLACEHOLDER = /^(TBA|TBD|HOLD\b|HOLD —|TENTATIVE\b)/i;
const TECHNICAL = new Set(["session", "keynote", "workshop", "sponsor"]);

// content key: identical title+abstract = the same talk given in another slot
const keyOf = (s) => (s.title + "||" + s.description.slice(0, 80)).toLowerCase().replace(/\s+/g, " ").trim();

const techByKey = new Map();
const socials = [];

for (const s of ALL) {
  if (s.type === "social") {
    socials.push({ id: s.id, title: s.title, day: s.day, time: s.time, description: s.description, host: s.track });
    continue;
  }
  if (s.type === "expo") continue;             // venue logistics — always available, not scored
  if (!TECHNICAL.has(s.type)) continue;
  if (PLACEHOLDER.test(s.title.trim())) continue;
  if ((s.description || "").length < 60) continue; // nothing substantive to judge

  const k = keyOf(s);
  if (!techByKey.has(k)) {
    techByKey.set(k, {
      key: k,
      ids: [],
      title: s.title,
      type: s.type,
      track: s.track,
      day: s.day,
      time: s.time,
      speakers: s.speakers.map((p) => [p.name, p.company, p.role].filter(Boolean).join(", ")),
      description: s.description.slice(0, 1400),
    });
  }
  techByKey.get(k).ids.push(s.id);
}

const candidates = Array.from(techByKey.values());

writeFileSync("./candidates.json", JSON.stringify({ count: candidates.length, candidates }, null, 0));
writeFileSync("./socials.json", JSON.stringify({ count: socials.length, socials }, null, 0));

// reporting
const byType = {};
candidates.forEach((c) => (byType[c.type] = (byType[c.type] || 0) + 1));
const slotsCovered = candidates.reduce((n, c) => n + c.ids.length, 0);
console.log(`candidates.json — ${candidates.length} unique talks (covering ${slotsCovered} schedule slots)`);
console.log("  by type:", JSON.stringify(byType));
console.log(`socials.json — ${socials.length} social/networking events`);
