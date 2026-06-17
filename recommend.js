/* =============================================================================
   For You — personalized recommendations + walkable itinerary
   Reads window.RECS (baked once by build-recs.mjs) and recomputes everything
   live from tunable knobs. The expensive LLM scoring is immutable; ranking,
   itinerary construction (weighted interval scheduling), track budgets, pins,
   and excludes are all cheap client-side recompute — change your mind freely.
   ============================================================================= */
(function () {
  "use strict";
  var A = window.AIE, RECS = window.RECS;
  if (!A || !RECS) return;
  var esc = A.esc;

  // track slots come from the bake (tracks.json), so a forker's taxonomy flows through
  var TRACK_ORDER = Object.keys(RECS.trackMeta || {}).filter(function (k) { return k !== "none"; });
  var DIMS = [
    { key: "relevance", label: "Relevance", hint: "fit to your active problems (counts double)" },
    { key: "depth", label: "Depth", hint: "advanced, architecture / post-mortem" },
    { key: "novelty", label: "Novelty", hint: "beyond what you know cold" },
    { key: "goalFit", label: "Goal fit", hint: "serves your conference goals" },
  ];
  var FMT_LABEL = { "war-story": "War story", mixed: "Mixed", tutorial: "Tutorial", hype: "Hype", unknown: "Unclear" };

  // ── tunable config (persisted) ──────────────────────────────────────────
  var LS = "aie-foryou-config-v1";
  var CFG = clone(RECS.config);
  var pins = new Set(), excludes = new Set();
  (function load() {
    try {
      var s = JSON.parse(localStorage.getItem(LS) || "null");
      if (s) {
        if (s.weights) CFG.weights = s.weights;
        if (typeof s.adventurousness === "number") CFG.adventurousness = s.adventurousness;
        if (s.trackBudget) CFG.trackBudget = s.trackBudget;
        if (s.pins) s.pins.forEach(function (x) { pins.add(x); });
        if (s.excludes) s.excludes.forEach(function (x) { excludes.add(x); });
      }
    } catch (e) {}
  })();
  function save() {
    try {
      localStorage.setItem(LS, JSON.stringify({
        weights: CFG.weights, adventurousness: CFG.adventurousness, trackBudget: CFG.trackBudget,
        pins: Array.from(pins), excludes: Array.from(excludes),
      }));
    } catch (e) {}
  }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  // ── scoring ─────────────────────────────────────────────────────────────
  function rec(id) { return RECS.talks[id]; }
  function trackWeight(t) {
    if (t === "none" || !t) return 0.82;
    var b = CFG.trackBudget[t] || 1;
    return 1 + 0.12 * (b - 1); // higher budget = higher priority, wins ties + fills more slots
  }
  // raw weighted score (relevance doubled per the brief). Range roughly -3..30.
  function rawScore(id) {
    var r = rec(id); if (!r) return null;
    var w = CFG.weights;
    var v = w.relevance * r.relevance * 2 + w.depth * r.depth + w.novelty * r.novelty + w.goalFit * r.goalFit;
    v += CFG.adventurousness * r.creativeAppeal;
    v += (CFG.formatBonus[r.format] || 0);
    return v;
  }
  function value(id) { var v = rawScore(id); return v == null ? null : v * trackWeight(rec(id).track); }
  var SCORE_MAX = 30;
  function matchPct(id) { var v = rawScore(id); if (v == null) return 0; return Math.max(0, Math.min(100, Math.round((v / SCORE_MAX) * 100))); }
  function tierOf(id) { var p = matchPct(id); return p >= 70 ? "must" : p >= 50 ? "strong" : p >= 33 ? "maybe" : "skip"; }
  var QUALITY_MIN = 30; // match% floor to enter the itinerary unless pinned/starred

  // ── weighted interval scheduling — max-value conflict-free set per day ───
  function buildItinerary(dayId) {
    var sessions = A.ALL.filter(function (s) { return s.day === dayId && s.room !== "Venue"; });
    var items = [];
    sessions.forEach(function (s) {
      if (excludes.has(s.id) && !A.isFav(s.id) && !pins.has(s.id)) return;
      var forced = A.isFav(s.id) || pins.has(s.id);
      var r = rec(s.id);
      if (!r && !forced) return;                 // unscored placeholder, not pinned → skip
      if (!forced && matchPct(s.id) < QUALITY_MIN) return; // quality threshold → leave a gap
      var v = forced ? 1e6 + (value(s.id) || 0) : value(s.id);
      items.push({ s: s, start: s.startMin, end: s.endMin, v: v, forced: forced });
    });
    // pool for alternates = every scored session that day (even below threshold)
    var pool = sessions.filter(function (s) { return rec(s.id) && !excludes.has(s.id); });

    items.sort(function (a, b) { return a.end - b.end || a.start - b.start; });
    var n = items.length;
    if (!n) return { picks: [], pool: pool };
    var ends = items.map(function (x) { return x.end; });
    function lastBefore(start) { // last index whose end <= start (binary search)
      var lo = 0, hi = n - 1, res = -1;
      while (lo <= hi) { var m = (lo + hi) >> 1; if (ends[m] <= start) { res = m; lo = m + 1; } else hi = m - 1; }
      return res;
    }
    var dp = new Array(n), take = new Array(n);
    for (var i = 0; i < n; i++) {
      var withItem = items[i].v + (lastBefore(items[i].start) >= 0 ? dp[lastBefore(items[i].start)] : 0);
      var without = i > 0 ? dp[i - 1] : 0;
      if (withItem >= without) { dp[i] = withItem; take[i] = true; } else { dp[i] = without; take[i] = false; }
    }
    var chosen = [];
    for (var k = n - 1; k >= 0;) {
      if (take[k]) { chosen.push(items[k]); k = lastBefore(items[k].start); } else k--;
    }
    chosen.reverse();

    // alternates = other scored sessions overlapping each pick, by score desc
    var picks = chosen.map(function (c) {
      var alts = pool.filter(function (s) {
        return s.id !== c.s.id && s.startMin < c.end && s.endMin > c.start && matchPct(s.id) >= 20;
      }).sort(function (a, b) { return matchPct(b.id) - matchPct(a.id); }).slice(0, 2);
      return { s: c.s, forced: c.forced, alts: alts };
    });
    return { picks: picks, pool: pool };
  }

  // ── weekly shortlist grouped by track (the brief's classic output) ──────
  function weeklyShortlist() {
    var byTrack = {};
    TRACK_ORDER.forEach(function (t) { byTrack[t] = []; });
    var seen = {};
    A.ALL.forEach(function (s) {
      var r = rec(s.id); if (!r || r.track === "none") return;
      if (seen[s.title]) return; seen[s.title] = 1;
      byTrack[r.track] && byTrack[r.track].push(s);
    });
    TRACK_ORDER.forEach(function (t) {
      byTrack[t].sort(function (a, b) { return matchPct(b.id) - matchPct(a.id); });
    });
    return byTrack;
  }

  // ── rendering ───────────────────────────────────────────────────────────
  var subview = "itinerary"; // 'itinerary' | 'shortlist'

  function render() {
    var day = A.DAYS.find(function (d) { return d.id === A.state.day; }) || A.DAYS[0];
    var host = document.getElementById("foryou-view");
    host.innerHTML =
      renderIntro() +
      renderKnobs() +
      '<div class="fy-tabs">' +
        '<button class="fy-tab" data-sub="itinerary" aria-selected="' + (subview === "itinerary") + '">Daily plan</button>' +
        '<button class="fy-tab" data-sub="shortlist" aria-selected="' + (subview === "shortlist") + '">Week shortlist</button>' +
      "</div>" +
      (subview === "itinerary" ? renderItinerary(day) : renderShortlist());
    wireEvents();
  }

  function renderIntro() {
    return '<div class="fy-intro">' +
      '<div class="fy-spark" aria-hidden="true"></div>' +
      "<div><h2>Tuned for you, Sean</h2>" +
      "<p>A conflict-free plan built from " + Object.keys(RECS.talks).length + " talks scored against your agent-infrastructure profile. " +
      "Everything below recomputes live as you turn the knobs, no re-scoring.</p></div></div>";
  }

  function renderKnobs() {
    var w = CFG.weights;
    var sliders = DIMS.map(function (d) {
      return '<label class="knob"><span class="knob-l">' + d.label + '<em>' + d.hint + "</em></span>" +
        '<input type="range" min="0" max="2" step="0.1" value="' + w[d.key] + '" data-w="' + d.key + '">' +
        '<span class="knob-v">' + w[d.key].toFixed(1) + "×</span></label>";
    }).join("");
    var adv = '<label class="knob"><span class="knob-l">Adventurousness<em>technical &rarr; leave room for creative picks</em></span>' +
      '<input type="range" min="0" max="1" step="0.05" value="' + CFG.adventurousness + '" data-adv="1">' +
      '<span class="knob-v">' + Math.round(CFG.adventurousness * 100) + "%</span></label>";
    var budgets = TRACK_ORDER.map(function (t) {
      var m = RECS.trackMeta[t];
      return '<div class="budget" style="--th:' + m.hue + '"><span class="budget-dot"></span>' +
        '<span class="budget-name" title="' + esc(m.name) + '">' + t + " · " + esc(shortTrack(m.name)) + "</span>" +
        '<span class="budget-step"><button data-budget="' + t + '" data-d="-1">&minus;</button>' +
        '<b>' + (CFG.trackBudget[t] || 0) + "</b>" +
        '<button data-budget="' + t + '" data-d="1">+</button></span></div>';
    }).join("");
    return '<details class="fy-knobs" open><summary><span>Tuning</span>' +
      '<button class="link-btn" id="fy-reset" type="button">Reset to brief defaults</button></summary>' +
      '<div class="knobs-grid"><div class="knobs-col">' + sliders + adv + "</div>" +
      '<div class="knobs-col"><div class="knobs-sub">Track budget (weekly slot targets)</div>' + budgets + "</div></div></details>";
  }

  function renderItinerary(day) {
    var built = buildItinerary(day.id);
    var picks = built.picks;
    // day socials worth attending
    var socials = A.ALL.filter(function (s) {
      var r = RECS.socials[s.id]; return s.day === day.id && r && (r.worthIt || r.networkingValue >= 3);
    }).sort(function (a, b) { return a.startMin - b.startMin; });

    var coverage = coverageChips(picks);
    var hours = picks.reduce(function (n, p) { return n + (p.s.endMin - p.s.startMin); }, 0) / 60;
    var allStarred = picks.length && picks.every(function (p) { return A.isFav(p.s.id); });
    var head = '<div class="fy-daysum"><div class="fy-daysum-l"><b>' + picks.length + "</b> sessions · <b>" + hours.toFixed(1) + "</b> hrs in room · " + socials.length + " social" + (socials.length === 1 ? "" : "s") +
      '</div><div class="fy-cov">' + coverage + "</div>" +
      (picks.length ? '<button class="fy-starall" id="fy-starall">' + A.starSvg() + "<span>" + (allStarred ? "All in plan" : "Star all " + picks.length) + "</span></button>" : "") +
      "</div>";

    if (!picks.length) {
      return head + '<div class="empty" style="padding:48px 16px"><div class="blob"></div><h2>Nothing clears the bar this day</h2><p>Loosen the weights or lower a track’s threshold. Better an open slot than a weak talk.</p></div>';
    }

    var rows = "";
    var prevEnd = null;
    picks.forEach(function (p) {
      if (prevEnd != null && p.s.startMin - prevEnd >= 20) rows += gapRow(prevEnd, p.s.startMin);
      rows += pickRow(p);
      prevEnd = p.s.endMin;
    });
    var socialBlock = socials.length ? '<div class="fy-social-head">Evening · worth showing up for</div>' + socials.map(socialRow).join("") : "";
    return head + '<div class="fy-timeline">' + rows + socialBlock + "</div>";
  }

  function pickRow(p) {
    var s = p.s, r = rec(s.id), pct = matchPct(s.id), tier = tierOf(s.id);
    var tm = r ? RECS.trackMeta[r.track] : null;
    var th = tm ? tm.hue : 220;
    var starred = A.isFav(s.id), pinned = pins.has(s.id);
    var spk = s.speakers.length ? s.speakers.slice(0, 2).map(function (x) { return esc(x.name) + (x.company ? " · " + esc(x.company) : ""); }).join("  ·  ") + (s.speakers.length > 2 ? " +" + (s.speakers.length - 2) : "") : "";
    var alts = p.alts.length ? '<details class="fy-alts"><summary>' + p.alts.length + " alternate" + (p.alts.length === 1 ? "" : "s") + " at this time</summary>" +
      p.alts.map(function (a) {
        return '<button class="fy-alt" data-open="' + a.id + '"><span class="fy-alt-pct" style="--th:' + (RECS.trackMeta[rec(a.id).track].hue) + '">' + matchPct(a.id) + "</span>" +
          '<span class="fy-alt-t">' + esc(a.s ? a.s.title : a.title) + "</span>" +
          '<span class="fy-swap" data-pin="' + a.id + '">Pin instead</span></button>';
      }).join("") + "</details>" : "";
    return '<div class="fy-pick' + (pinned ? " pinned" : "") + (starred ? " starred" : "") + '" style="--th:' + th + '">' +
      '<div class="fy-time"><span class="fy-t mono">' + esc(s.start) + '</span><span class="fy-te mono">' + esc(s.end) + "</span></div>" +
      '<div class="fy-card" data-open="' + s.id + '">' +
        '<div class="fy-meta">' +
          (r ? '<span class="fy-pct tier-' + tier + '">' + pct + '<small>%</small></span>'
             : '<span class="fy-pct" style="color:var(--gold)" title="Your pick — not in the scored set">★</span>') +
          (r ? '<span class="fy-track" style="--th:' + th + '"><span class="fy-track-dot"></span>' + r.track + " · " + esc(shortTrack(tm.name)) + "</span>" : "") +
          (r ? '<span class="fy-fmt fmt-' + r.format + '">' + (FMT_LABEL[r.format] || r.format) + "</span>" : "") +
          (pinned ? '<span class="fy-flag">Pinned</span>' : (starred ? '<span class="fy-flag star">Starred</span>' : "")) +
          '<span class="fy-room">' + esc(s.room) + "</span>" +
        "</div>" +
        "<h3>" + esc(s.title) + "</h3>" +
        (spk ? '<div class="fy-spk">' + spk + "</div>" : "") +
        (r && r.rationale ? '<p class="fy-why">' + esc(r.rationale) + "</p>" : "") +
        alts +
      "</div>" +
      '<div class="fy-actions">' +
        '<button class="fy-act" data-pin="' + s.id + '" title="' + (pinned ? "Unpin" : "Pin to lock this slot") + '" aria-pressed="' + pinned + '">' + pinSvg() + "</button>" +
        '<button class="fy-act" data-exclude="' + s.id + '" title="Not interested (remove and reflow)">' + xSvg() + "</button>" +
      "</div></div>";
  }

  function gapRow(fromMin, toMin) {
    var mins = toMin - fromMin;
    var label = mins >= 55 ? "Lunch / break" : "Open · expo, hallway track";
    return '<div class="fy-gap"><span class="fy-gap-line"></span><span class="fy-gap-l">' + label + " · " + mins + " min</span><span class=\"fy-gap-line\"></span></div>";
  }

  function socialRow(s) {
    var r = RECS.socials[s.id];
    return '<div class="fy-pick fy-social" style="--th:320"><div class="fy-time"><span class="fy-t mono">' + esc(s.start) + '</span><span class="fy-te mono">' + esc(s.end) + "</span></div>" +
      '<div class="fy-card" data-open="' + s.id + '"><div class="fy-meta">' +
        '<span class="fy-pct tier-' + (r.networkingValue >= 4 ? "must" : "strong") + '">' + (r.networkingValue * 20) + '<small>%</small></span>' +
        '<span class="fy-track" style="--th:320"><span class="fy-track-dot"></span>Networking</span></div>' +
        "<h3>" + esc(s.title) + "</h3>" + (r.rationale ? '<p class="fy-why">' + esc(r.rationale) + "</p>" : "") +
      "</div><div class=\"fy-actions\"></div></div>";
  }

  function coverageChips(picks) {
    var counts = {}; picks.forEach(function (p) { var r = rec(p.s.id); if (r && r.track !== "none") counts[r.track] = (counts[r.track] || 0) + 1; });
    return TRACK_ORDER.filter(function (t) { return counts[t]; }).map(function (t) {
      var m = RECS.trackMeta[t];
      return '<span class="cov-chip" style="--th:' + m.hue + '" title="' + esc(m.name) + '"><span class="budget-dot"></span>' + t + " " + counts[t] + "</span>";
    }).join("") || '<span class="cov-chip muted">no tracked picks</span>';
  }

  function renderShortlist() {
    var by = weeklyShortlist();
    return '<div class="fy-shortlist">' + TRACK_ORDER.map(function (t) {
      var m = RECS.trackMeta[t], list = by[t], budget = CFG.trackBudget[t] || 0;
      var top = list.slice(0, Math.max(budget, 2));
      var hon = list.slice(Math.max(budget, 2), Math.max(budget, 2) + 2);
      if (!top.length) return "";
      return '<section class="sl-track" style="--th:' + m.hue + '"><div class="sl-head"><span class="sl-letter">' + t + '</span><div><h3>' + esc(m.name) + "</h3>" +
        '<span class="sl-budget">' + top.length + " picks · target " + budget + "</span></div></div>" +
        top.map(function (s) { return slItem(s, false); }).join("") +
        (hon.length ? '<div class="sl-hon-label">Honorable mentions</div>' + hon.map(function (s) { return slItem(s, true); }).join("") : "") +
        "</section>";
    }).join("") + "</div>";
  }
  function slItem(s, muted) {
    var r = rec(s.id), d = A.DAYS.find(function (x) { return x.id === s.day; });
    return '<div class="sl-item' + (muted ? " muted" : "") + '" data-open="' + s.id + '">' +
      '<span class="fy-pct tier-' + tierOf(s.id) + '">' + matchPct(s.id) + "<small>%</small></span>" +
      '<div class="sl-body"><div class="sl-title">' + esc(s.title) + "</div>" +
      '<div class="sl-why">' + esc(r.rationale) + "</div></div>" +
      '<div class="sl-when mono">' + (d ? d.short : "") + "<br>" + esc(s.start) + "</div></div>";
  }

  function shortTrack(name) { return name.replace(/ &.*/, "").replace(/,.*/, ""); }
  function pinSvg() { return '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M9.5 1.1a1 1 0 0 1 1.4 0l3 3a1 1 0 0 1 0 1.4l-.3.3a2.4 2.4 0 0 1-2 .67l-2.2 2.2.02 2.3a1 1 0 0 1-.3.71l-.7.7a1 1 0 0 1-1.42 0L4.7 11.3l-2.99 3a.75.75 0 0 1-1.06-1.06l3-2.99-1.1-1.1a1 1 0 0 1 0-1.42l.7-.7a1 1 0 0 1 .71-.3l2.3.02 2.2-2.2a2.4 2.4 0 0 1 .67-2l.3-.3Z"/></svg>'; }
  function xSvg() { return '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.75.75 0 1 1 1.06 1.06L9.06 8l3.22 3.22a.75.75 0 1 1-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 0 1-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z"/></svg>'; }

  // ── events ──────────────────────────────────────────────────────────────
  function wireEvents() {
    var host = document.getElementById("foryou-view");
    host.querySelectorAll(".fy-tab").forEach(function (b) {
      b.addEventListener("click", function () { subview = b.getAttribute("data-sub"); render(); });
    });
    host.querySelectorAll("input[data-w]").forEach(function (inp) {
      inp.addEventListener("input", function () { CFG.weights[inp.getAttribute("data-w")] = parseFloat(inp.value); save(); render(); });
    });
    var advInp = host.querySelector("input[data-adv]");
    if (advInp) advInp.addEventListener("input", function () { CFG.adventurousness = parseFloat(advInp.value); save(); render(); });
    host.querySelectorAll("button[data-budget]").forEach(function (b) {
      b.addEventListener("click", function () {
        var t = b.getAttribute("data-budget"), d = +b.getAttribute("data-d");
        CFG.trackBudget[t] = Math.max(0, Math.min(8, (CFG.trackBudget[t] || 0) + d)); save(); render();
      });
    });
    var reset = host.querySelector("#fy-reset");
    if (reset) reset.addEventListener("click", function (e) { e.preventDefault(); CFG = clone(RECS.config); pins.clear(); excludes.clear(); save(); render(); });

    var starAll = host.querySelector("#fy-starall");
    if (starAll) starAll.addEventListener("click", function () {
      var built = buildItinerary(A.state.day);
      var allOn = built.picks.length && built.picks.every(function (p) { return A.isFav(p.s.id); });
      built.picks.forEach(function (p) { if (allOn ? A.isFav(p.s.id) : !A.isFav(p.s.id)) A.toggleFav(p.s.id); });
      A.syncStarCount(); render();
    });

    host.querySelectorAll("[data-open]").forEach(function (el) {
      el.addEventListener("click", function (e) {
        if (e.target.closest("[data-pin],[data-exclude],.fy-swap,.fy-act,.fy-alts summary")) return;
        A.openModal(+el.getAttribute("data-open"));
      });
    });
    host.querySelectorAll("[data-pin]").forEach(function (b) {
      b.addEventListener("click", function (e) {
        e.stopPropagation(); var id = +b.getAttribute("data-pin");
        if (pins.has(id)) pins.delete(id); else { pins.add(id); excludes.delete(id); }
        save(); render();
      });
    });
    host.querySelectorAll("[data-exclude]").forEach(function (b) {
      b.addEventListener("click", function (e) {
        e.stopPropagation(); var id = +b.getAttribute("data-exclude");
        if (excludes.has(id)) excludes.delete(id); else { excludes.add(id); pins.delete(id); }
        save(); render();
      });
    });
  }

  // expose scoring to app.js so Agenda/Grid/modal can show the same match%
  A.matchPct = matchPct;
  A.tierOf = tierOf;

  window.registerForYou(render);
})();
