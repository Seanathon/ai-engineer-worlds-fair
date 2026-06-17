// build-data.mjs — normalize sessions.json + speakers.json into data.js
//
// Why this exists: the app opens by double-click (file://), where fetch() of
// local JSON is blocked by CORS. So we bake a normalized dataset into a plain
// script that assigns window.SCHEDULE. Normalization happens HERE, once, so the
// render path in app.js has guaranteed string fields and zero null checks
// (per the schedule-design SKILL's build-time-extraction lesson).
//
// Run: node build-data.mjs   →   writes data.js

import { readFileSync, writeFileSync } from "node:fs";

const sessionsRaw = JSON.parse(readFileSync("./sessions.json", "utf8"));
const speakersRaw = JSON.parse(readFileSync("./speakers.json", "utf8"));

// ── speaker lookup: name → { role, company, twitter } ──────────────────────
const speakerByName = new Map();
for (const s of speakersRaw.speakers) {
  speakerByName.set(s.name, {
    name: s.name,
    role: s.role || "",
    company: s.company || "",
    twitter: s.twitter || "",
  });
}

// ── time parsing ───────────────────────────────────────────────────────────
// "9:00am-11:00am" → { start, end, startMin, endMin }
function toMin(clock) {
  const m = clock.trim().toLowerCase().match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/);
  if (!m) return null;
  let h = +m[1];
  const min = +m[2];
  const ap = m[3];
  if (ap === "pm" && h !== 12) h += 12;
  if (ap === "am" && h === 12) h = 0;
  return h * 60 + min;
}
function fmt(min) {
  let h = Math.floor(min / 60);
  const m = min % 60;
  const ap = h >= 12 ? "pm" : "am";
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${String(m).padStart(2, "0")}${ap}`;
}
function parseTime(time) {
  const [a, b] = String(time || "").split("-").map((s) => s.trim());
  const startMin = toMin(a);
  const endMin = b ? toMin(b) : null;
  return {
    start: startMin != null ? fmt(startMin) : a || "",
    end: endMin != null ? fmt(endMin) : b || "",
    startMin: startMin ?? 0,
    endMin: endMin ?? (startMin != null ? startMin + 20 : 0),
  };
}

const isTBD = (name) => /^tbd\b/i.test(name || "");

// ── normalize speaker sessions ─────────────────────────────────────────────
let nextId = 1;
const normalize = (s) => {
  const t = parseTime(s.time);
  const speakers = (s.speakers || []).map((name) => {
    const hit = speakerByName.get(name);
    return {
      name: name || "",
      role: hit?.role || "",
      company: hit?.company || "",
      twitter: hit?.twitter || "",
      tbd: isTBD(name),
    };
  });
  return {
    id: nextId++,
    title: (s.title || "").trim(),
    description: (s.description || "").trim(),
    day: s.day || "",
    time: `${t.start}-${t.end}`,
    start: t.start,
    end: t.end,
    startMin: t.startMin,
    endMin: t.endMin,
    room: s.room || "",
    type: s.type || "session",
    track: s.track || "",
    status: s.status || "",
    speakers,
  };
};

const sessions = sessionsRaw.sessions.map(normalize);

// ── synthetic plenary / logistics / social events (from llms.md) ───────────
// Venue-wide events an attendee plans around. room:"Venue" places them in the
// grid's sticky plenary column; they merge into the same list/filter pipeline.
const D1 = "Day 1 — Workshop Day";
const D2 = "Day 2 — Session Day 1";
const D3 = "Day 3 — Session Day 2";
const D4 = "Day 4 — Session Day 3";

const PLENARY = [
  // Day 1 — Monday, June 29
  [D1, "8:00am-5:00pm", "Registration", "expo", "Registration & Badge Pickup. Moscone West, 1st Floor."],
  [D1, "1:00pm-4:00pm", "Exhibitor Arrival", "expo", "Expo partners load in ahead of the welcome reception."],
  [D1, "4:00pm-7:30pm", "Expo + Welcome Reception", "social", "Opening of the expo hall with drinks and the official welcome reception. 100+ partners."],
  [D1, "7:00pm-8:00pm", "VIP Reception by Oxylabs", "social", "Invite-only VIP reception hosted by Oxylabs."],
  [D1, "7:00pm-9:30pm", "Qodo: AIE Opening Night VIP Event", "social", "Opening night VIP event hosted by Qodo."],
  [D1, "8:00pm-10:00pm", "Offsite Speaker Dinner", "social", "Private dinner for speakers."],
  [D1, "8:00pm-10:00pm", "Offsite Side Events & Meetups", "social", "Community-run side events and meetups across San Francisco."],
  // Day 2 — Tuesday, June 30
  [D2, "8:00am-5:00pm", "Registration", "expo", "Registration & Badge Pickup. Moscone West, 1st Floor."],
  [D2, "10:00am-7:30pm", "Expo", "expo", "Expo hall open. 100+ AI partners on the 1st floor."],
  [D2, "5:30pm-7:30pm", "Onsite Networking Night", "social", "Onsite networking with food and drinks across the venue."],
  // Day 3 — Wednesday, July 1
  [D3, "8:00am-5:00pm", "Registration", "expo", "Registration & Badge Pickup. Moscone West, 1st Floor."],
  [D3, "10:00am-5:00pm", "Expo", "expo", "Expo hall open. Last full day for many partners."],
  [D3, "4:00pm-7:00pm", "World Cup Quarterfinal VIP Suite", "social", "Invite-only World Cup Quarterfinal VIP suite at Levi's Stadium."],
  [D3, "6:00pm-9:00pm", "Stripe x Metronome Startup Night", "social", "Startup night hosted by Stripe and Metronome."],
  [D3, "6:00pm-10:00pm", "Offsite Side Events & Meetups", "social", "Community-run side events and meetups."],
  [D3, "7:30pm-10:00pm", "Vercel: AI Engineer After Dark", "social", "Evening event hosted by Vercel."],
  // Day 4 — Thursday, July 2
  [D4, "8:00am-1:00pm", "Registration", "expo", "Registration & Badge Pickup. Moscone West, 1st Floor."],
  [D4, "10:00am-4:30pm", "Expo", "expo", "Last chance expo. Hall closes mid-afternoon."],
  [D4, "6:00pm-10:00pm", "Offsite Side Events & Meetups", "social", "Closing-night community side events and meetups."],
];

for (const [day, time, title, type, description] of PLENARY) {
  const t = parseTime(time);
  sessions.push({
    id: nextId++,
    title,
    description,
    day,
    time: `${t.start}-${t.end}`,
    start: t.start,
    end: t.end,
    startMin: t.startMin,
    endMin: t.endMin,
    room: "Venue",
    type,
    track: "Venue & Logistics",
    status: "confirmed",
    speakers: [],
  });
}

// ── derived facets ─────────────────────────────────────────────────────────
const DAY_ORDER = [D1, D2, D3, D4];
const dayMeta = {
  [D1]: { short: "Day 1", label: "Workshop Day", date: "Mon, Jun 29" },
  [D2]: { short: "Day 2", label: "Keynotes + Breakouts", date: "Tue, Jun 30" },
  [D3]: { short: "Day 3", label: "World Cup + Tracks", date: "Wed, Jul 1" },
  [D4]: { short: "Day 4", label: "Final Day", date: "Thu, Jul 2" },
};
const days = DAY_ORDER.filter((d) => sessions.some((s) => s.day === d)).map((d) => ({
  id: d,
  ...dayMeta[d],
  count: sessions.filter((s) => s.day === d).length,
}));

const tracks = [...new Set(sessions.map((s) => s.track).filter(Boolean))].sort();

const out = {
  conference: sessionsRaw.conference,
  dates: sessionsRaw.dates,
  location: sessionsRaw.location,
  website: sessionsRaw.website,
  totalSessions: sessions.length,
  days,
  tracks,
  sessions,
};

writeFileSync(
  "./data.js",
  "/* AUTO-GENERATED by build-data.mjs — do not edit by hand. */\n" +
    "window.SCHEDULE = " +
    JSON.stringify(out) +
    ";\n",
);

const tbdCount = sessions.reduce((n, s) => n + s.speakers.filter((p) => p.tbd).length, 0);
console.log(
  `data.js written — ${sessions.length} sessions (${PLENARY.length} synthetic), ` +
    `${days.length} days, ${tracks.length} tracks, ${tbdCount} TBD speakers.`,
);
