/* =============================================================================
   AI Engineer World's Fair 2026 — schedule app
   Vanilla JS. Reads window.SCHEDULE (baked by build-data.mjs).
   Patterns follow the schedule-design SKILL: day tabs, multi-axis Set filters
   with always-visible active state, favorites in localStorage, a room×time grid
   built from the per-day union of start times, and a shareable detail modal.
   ============================================================================= */
(function () {
  "use strict";

  var DATA = window.SCHEDULE;
  if (!DATA) { document.body.innerHTML = '<p style="padding:40px;color:#9198a1">Could not load schedule data. Run <code>node build-data.mjs</code> first.</p>'; return; }

  var ALL = DATA.sessions;
  var DAYS = DATA.days;

  // ── persistent favorites ───────────────────────────────────────────────
  var FAV_KEY = "aie-schedule-favorites";
  var favorites = new Set();
  try { var raw = localStorage.getItem(FAV_KEY); if (raw) JSON.parse(raw).forEach(function (id) { favorites.add(id); }); } catch (e) {}
  function persistFavorites() { try { localStorage.setItem(FAV_KEY, JSON.stringify([].concat.apply([], [Array.from(favorites)]))); } catch (e) {} }
  function isFav(id) { return favorites.has(id); }
  function toggleFav(id) { if (favorites.has(id)) favorites.delete(id); else favorites.add(id); persistFavorites(); }

  // ── view/filter state ──────────────────────────────────────────────────
  var state = {
    day: DAYS[0].id,
    view: (function () { try { var v = localStorage.getItem("aie-view"); return (v === "grid" || v === "agenda" || v === "foryou") ? v : "foryou"; } catch (e) { return "foryou"; } })(),
    types: new Set(),
    tracks: new Set(),
    query: "",
    starredOnly: false,
  };

  var foryouRenderer = null; // registered by recommend.js

  // ── type metadata (order = display order) ──────────────────────────────
  var TYPE_META = {
    keynote:  { label: "Keynotes",  cls: "keynote",  hue: "--t-keynote" },
    session:  { label: "Talks",     cls: "session",  hue: "--t-session" },
    workshop: { label: "Workshops", cls: "workshop", hue: "--t-workshop" },
    sponsor:  { label: "Sponsors",  cls: "sponsor",  hue: "--t-sponsor" },
    expo:     { label: "Expo",      cls: "expo",     hue: "--t-expo" },
    social:   { label: "Socials",   cls: "social",   hue: "--t-social" },
  };
  var TYPE_ORDER = Object.keys(TYPE_META).filter(function (t) { return ALL.some(function (s) { return s.type === t; }); });
  function typeShort(t) { return ({ keynote: "Keynote", session: "Talk", workshop: "Workshop", sponsor: "Sponsor", expo: "Expo", social: "Social" })[t] || t; }

  // ── room sort order for the grid ───────────────────────────────────────
  function roomRank(room) {
    if (room === "Main Stage" || room === "Keynote") return 0;
    if (room === "Leadership 1") return 1;
    if (room === "Leadership 2") return 2;
    var tm = room.match(/^Track (\d+)$/); if (tm) return 10 + +tm[1];
    if (room === "Track M") return 25;
    var em = room.match(/^Expo Stage (\d+)$/); if (em) return 30 + +em[1];
    return 50;
  }

  // ── deterministic color from a string (pastel for grid, vivid for dots) ─
  function hashHue(str) { var h = 0; for (var i = 0; i < str.length; i++) { h = (h * 31 + str.charCodeAt(i)) >>> 0; } return h % 360; }
  var colorCache = {};
  function trackColor(track) {
    if (colorCache[track]) return colorCache[track];
    var c;
    if (track === "Venue & Logistics") {
      c = { dot: "#768390", grid: "#c9d1d9", glow: "rgba(145,203,255,.18)" };
    } else {
      var h = hashHue(track);
      c = { dot: "hsl(" + h + " 65% 68%)", grid: "hsl(" + h + " 70% 82%)", glow: "hsla(" + h + ",80%,70%,.28)" };
    }
    colorCache[track] = c; return c;
  }
  function avatarColor(name) { var h = hashHue(name + "·av"); return "hsl(" + h + " 52% 58%)"; }
  function initials(name) {
    var p = name.trim().split(/\s+/);
    return ((p[0] || "")[0] || "") + (p.length > 1 ? (p[p.length - 1][0] || "") : "");
  }

  // ── helpers ─────────────────────────────────────────────────────────────
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]; }); }
  function $(sel, root) { return (root || document).querySelector(sel); }
  function speakerOrg(sp) { return [sp.company, sp.role].filter(Boolean).join(" · "); }
  // For-you fit badges — match% comes from recommend.js (live-weighted); guarded so
  // the app still works if recs.js / recommend.js are absent.
  function recFor(id) { return (window.RECS && window.RECS.talks) ? window.RECS.talks[id] : null; }
  function fitBadge(id, compact) {
    if (!window.AIE || !window.AIE.matchPct || !recFor(id)) return "";
    var p = window.AIE.matchPct(id), t = window.AIE.tierOf(id);
    return compact
      ? '<span class="gc-fit tier-' + t + '" title="Your match: ' + p + '%">' + p + "</span>"
      : '<span class="fit-badge tier-' + t + '" title="Match for your profile">' + p + "<small>%</small></span>";
  }
  var FMT_WORD = { "war-story": "war story", tutorial: "tutorial", hype: "hype", mixed: "mixed", unknown: "unclear" };
  function fitPanel(id) {
    var r = recFor(id); if (!r || !window.AIE || !window.AIE.matchPct) return "";
    var p = window.AIE.matchPct(id), t = window.AIE.tierOf(id);
    var tm = (window.RECS.trackMeta && window.RECS.trackMeta[r.track]) || null;
    return '<div class="fit-panel tier-' + t + '" style="--th:' + (tm ? tm.hue : 220) + '">' +
      '<span class="fit-score">' + p + "<small>%</small></span>" +
      '<div class="fit-text"><div class="fit-head">For you · ' + (tm ? esc(tm.name) : "match") + " · " + esc(FMT_WORD[r.format] || r.format) + "</div>" +
      (r.rationale ? '<div class="fit-why">' + esc(r.rationale) + "</div>" : "") + "</div></div>";
  }
  function speakerNames(s) { return s.speakers.map(function (p) { return p.name; }).join(" "); }
  var STAR_PATH = "M8 .25a.75.75 0 0 1 .67.42l1.93 3.9 4.31.63a.75.75 0 0 1 .42 1.28l-3.12 3.04.74 4.28a.75.75 0 0 1-1.09.79L8 12.85l-3.85 2.02a.75.75 0 0 1-1.09-.79l.74-4.28L.68 6.76a.75.75 0 0 1 .42-1.28l4.31-.63L7.33.67A.75.75 0 0 1 8 .25Z";
  function starSvg() { return '<svg viewBox="0 0 16 16" fill="currentColor"><path d="' + STAR_PATH + '"/></svg>'; }
  function pinSvg() { return '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M7.25 1.75A.75.75 0 0 1 8 1h.06a2 2 0 0 1 1.45.7l3.79 4.4a.75.75 0 0 1-.32 1.2l-2.4.74-2.1 4.95a.75.75 0 0 1-1.28.16L4.6 9.93l-2.6 2.6a.75.75 0 1 1-1.06-1.06l2.6-2.6L1.2 6.4a.75.75 0 0 1 .16-1.28l4.95-2.1.94-1.27Z"/></svg>'; }

  // ── filtering pipeline ─────────────────────────────────────────────────
  function daySessions() { return ALL.filter(function (s) { return s.day === state.day; }); }
  function matchesQuery(s, q) {
    if (!q) return true;
    return (s.title + " " + s.track + " " + s.room + " " + speakerNames(s) + " " + s.type).toLowerCase().indexOf(q) !== -1;
  }
  function applyFilters(list) {
    var q = state.query.trim().toLowerCase();
    return list.filter(function (s) {
      if (state.types.size && !state.types.has(s.type)) return false;
      if (state.tracks.size && !state.tracks.has(s.track)) return false;
      if (state.starredOnly && !isFav(s.id)) return false;
      if (!matchesQuery(s, q)) return false;
      return true;
    });
  }
  function filterCount() { return state.types.size + state.tracks.size + (state.query.trim() ? 1 : 0) + (state.starredOnly ? 1 : 0); }

  // =========================================================================
  // render: day tabs
  // =========================================================================
  function renderDayTabs() {
    var wrap = $("#daytabs");
    wrap.innerHTML = DAYS.map(function (d) {
      return '<button class="daytab" role="tab" data-day="' + esc(d.id) + '" aria-selected="' + (d.id === state.day) + '">' +
        '<span class="d1">' + esc(d.short) + '</span>' +
        '<span class="d2">' + esc(d.date) + " · " + esc(d.label) + "</span></button>";
    }).join("");
    wrap.querySelectorAll(".daytab").forEach(function (b) {
      b.addEventListener("click", function () {
        state.day = b.getAttribute("data-day");
        state.tracks.clear(); // tracks are day-specific; carrying them over matches nothing
        $("#track-search").value = "";
        renderDayTabs(); rerender(); window.scrollTo({ top: 0, behavior: "smooth" });
      });
    });
  }

  // =========================================================================
  // render: filter toolbar
  // =========================================================================
  function renderTypePills() {
    var counts = {}; daySessions().forEach(function (s) { counts[s.type] = (counts[s.type] || 0) + 1; });
    var present = TYPE_ORDER.filter(function (t) { return counts[t]; });
    $("#type-pills").innerHTML = present.map(function (t) {
      var m = TYPE_META[t], on = state.types.has(t);
      return '<button class="pill" data-type="' + t + '" aria-pressed="' + on + '" style="--pill-on:var(' + m.hue + ');' + (on ? "color:var(" + m.hue + ");border-color:transparent" : "") + '">' +
        '<span class="dot" style="background:var(' + m.hue + ')"></span>' + esc(m.label) +
        ' <span class="n">' + counts[t] + "</span></button>";
    }).join("");
    $("#type-pills").querySelectorAll(".pill").forEach(function (b) {
      b.addEventListener("click", function () { toggleSet(state.types, b.getAttribute("data-type")); rerender(); });
    });
  }

  function renderTrackPopover() {
    var counts = {}; daySessions().forEach(function (s) { if (s.track) counts[s.track] = (counts[s.track] || 0) + 1; });
    var tracks = Object.keys(counts).sort(function (a, b) {
      if (a === "Venue & Logistics") return 1; if (b === "Venue & Logistics") return -1;
      return counts[b] - counts[a] || a.localeCompare(b);
    });
    var q = ($("#track-search").value || "").toLowerCase();
    var list = $("#track-list");
    list.innerHTML = tracks.filter(function (t) { return t.toLowerCase().indexOf(q) !== -1; }).map(function (t) {
      var on = state.tracks.has(t), c = trackColor(t);
      return '<button class="pop-item" data-track="' + esc(t) + '" aria-pressed="' + on + '" role="menuitemcheckbox">' +
        '<span class="chk"><svg viewBox="0 0 16 16" fill="currentColor"><path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-6.5 6.5a.75.75 0 0 1-1.06 0L2.72 8.28a.75.75 0 0 1 1.06-1.06L6.75 10.19l5.97-5.97a.75.75 0 0 1 1.06 0Z"/></svg></span>' +
        '<span class="tr-dot" style="background:' + c.dot + '"></span>' +
        '<span class="tr-name">' + esc(t) + "</span>" +
        '<span class="tr-n">' + counts[t] + "</span></button>";
    }).join("") || '<div style="padding:12px;color:var(--text-dim);font-size:13px">No tracks match.</div>';
    list.querySelectorAll(".pop-item").forEach(function (b) {
      b.addEventListener("click", function () { toggleSet(state.tracks, b.getAttribute("data-track")); rerender(); });
    });
    var badge = $("#track-badge");
    if (state.tracks.size) { badge.style.display = ""; badge.textContent = state.tracks.size; $("#track-btn").classList.add("on"); }
    else { badge.style.display = "none"; $("#track-btn").classList.remove("on"); }
  }

  function renderSummary() {
    var sm = $("#summary"); var chips = [];
    state.types.forEach(function (t) { chips.push(chip(TYPE_META[t].label, "type", t, "var(" + TYPE_META[t].hue + ")")); });
    state.tracks.forEach(function (t) { chips.push(chip(t, "track", t, trackColor(t).dot)); });
    if (state.starredOnly) chips.push(chip("Starred only", "starred", "", "var(--gold)"));
    if (state.query.trim()) chips.push(chip('“' + state.query.trim() + '”', "query", "", "var(--accent)"));
    if (!chips.length) { sm.style.display = "none"; sm.innerHTML = ""; return; }
    sm.style.display = "flex"; sm.innerHTML = chips.join("");
    sm.querySelectorAll(".chip button").forEach(function (b) {
      b.addEventListener("click", function () {
        var k = b.getAttribute("data-k"), v = b.getAttribute("data-v");
        if (k === "type") state.types.delete(v);
        else if (k === "track") { state.tracks.delete(v); renderTrackPopover(); }
        else if (k === "starred") { state.starredOnly = false; syncStarBtn(); }
        else if (k === "query") { state.query = ""; $("#search-input").value = ""; $("#search").classList.remove("has-text"); }
        rerender();
      });
    });
  }
  function chip(label, k, v, color) {
    return '<span class="chip">' + (color ? '<span class="tr-dot" style="background:' + color + '"></span>' : "") + esc(label) +
      '<button data-k="' + esc(k) + '" data-v="' + esc(v) + '" aria-label="Remove filter"><svg viewBox="0 0 16 16" fill="currentColor"><path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.75.75 0 1 1 1.06 1.06L9.06 8l3.22 3.22a.75.75 0 1 1-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 0 1-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z"/></svg></button></span>';
  }

  function toggleSet(set, val) { if (set.has(val)) set.delete(val); else set.add(val); }

  function renderCount(shown, total) {
    var r = $("#count-readout");
    var filtered = shown < total;
    r.className = "count-readout" + (filtered ? " filtered" : "");
    r.innerHTML = "<b>" + shown + "</b> of " + total + " session" + (total === 1 ? "" : "s");
    $("#clear-filters").style.display = filterCount() ? "" : "none";
  }

  // =========================================================================
  // render: agenda (timeline)
  // =========================================================================
  function renderAgenda(sessions) {
    var view = $("#agenda-view");
    var bySlot = {};
    sessions.forEach(function (s) { (bySlot[s.startMin] = bySlot[s.startMin] || []).push(s); });
    var times = Object.keys(bySlot).map(Number).sort(function (a, b) { return a - b; });

    view.innerHTML = times.map(function (mins) {
      var group = bySlot[mins].slice().sort(function (a, b) {
        if (a.room === "Venue" && b.room !== "Venue") return -1;
        if (b.room === "Venue" && a.room !== "Venue") return 1;
        return roomRank(a.room) - roomRank(b.room) || a.title.localeCompare(b.title);
      });
      var first = group[0];
      return '<div class="slot"><div class="slot-rail"><div class="slot-rail-inner">' +
        '<div class="slot-time mono">' + esc(first.start) + "</div>" +
        '<div class="slot-end mono">→ ' + esc(latestEnd(group)) + "</div>" +
        "</div></div><div class=\"slot-body\">" + group.map(cardHtml).join("") + "</div></div>";
    }).join("");

    view.querySelectorAll("[data-star]").forEach(bindStar);
    view.querySelectorAll("[data-card]").forEach(function (el) {
      el.addEventListener("click", function () { openModal(+el.getAttribute("data-card")); });
    });
  }
  function latestEnd(group) { return group.map(function (s) { return s.end; }).sort(function (a, b) { return endMinOf(a) - endMinOf(b); }).pop(); }
  function endMinOf(t) { var s = ALL.find(function (x) { return x.end === t; }); return s ? s.endMin : 0; }

  function cardHtml(s) {
    var c = trackColor(s.track), fav = isFav(s.id);
    var cls = "card" + (fav ? " starred" : "") + (s.type === "keynote" ? " is-keynote" : "") + (s.room === "Venue" ? " is-venue" : "");
    var spk = "";
    if (s.speakers.length) {
      spk = '<div class="card-speakers">' + s.speakers.slice(0, 2).map(function (p) {
        var org = speakerOrg(p);
        return '<div class="speaker-line' + (p.tbd ? " tbd" : "") + '">' +
          '<span class="avatar" style="background:' + avatarColor(p.name) + '">' + esc(initials(p.name)) + "</span>" +
          '<span class="s-name">' + esc(p.name) + "</span>" +
          (org ? '<span class="s-org">' + esc(org) + "</span>" : "") + "</div>";
      }).join("") + (s.speakers.length > 2 ? '<div class="speaker-more">+ ' + (s.speakers.length - 2) + " more speaker" + (s.speakers.length - 2 === 1 ? "" : "s") + "</div>" : "") + "</div>";
    }
    var status = (s.status === "tentative" || s.status === "hold") ? '<span class="status-tag ' + s.status + '">' + s.status + "</span>" : "";
    return '<article class="' + cls + '" data-card="' + s.id + '" style="--track-c:' + c.dot + '" tabindex="0" role="button" aria-label="' + esc(s.title) + '">' +
      '<button class="star ' + (fav ? "on" : "") + '" data-star="' + s.id + '" aria-pressed="' + fav + '" aria-label="' + (fav ? "Unstar" : "Star") + ' session" title="Star">' + starSvg() + "</button>" +
      '<div class="card-top">' + fitBadge(s.id) + '<span class="badge badge--' + TYPE_META[s.type].cls + '"><span class="bdot"></span>' + esc(typeShort(s.type)) + "</span>" +
        (s.track && s.track !== "Venue & Logistics" ? '<span class="card-track"><span class="tr-dot" style="background:' + c.dot + '"></span><span>' + esc(s.track) + "</span></span>" : "") + status + "</div>" +
      "<h3>" + esc(s.title) + "</h3>" + spk +
      '<div class="card-foot">' +
        (s.room && s.room !== "Venue" ? '<span class="room"><svg viewBox="0 0 16 16" fill="currentColor"><path d="M2 2.75A.75.75 0 0 1 2.75 2h10.5a.75.75 0 0 1 .75.75v10.5a.75.75 0 0 1-.75.75H2.75a.75.75 0 0 1-.75-.75V2.75ZM3.5 3.5v9h9v-9h-9Z"/></svg>' + esc(s.room) + "</span>" : '<span class="room">Venue-wide</span>') +
        '<span class="dur mono">' + esc(s.start) + "–" + esc(s.end) + "</span></div></article>";
  }

  // =========================================================================
  // render: grid (room × time)
  // =========================================================================
  function renderGrid(sessions) {
    var wrap = $("#grid-view");
    if (!sessions.length) { wrap.innerHTML = ""; return; }

    var venueEvents = sessions.filter(function (s) { return s.room === "Venue"; });
    var roomSessions = sessions.filter(function (s) { return s.room !== "Venue"; });
    var rooms = Array.from(new Set(roomSessions.map(function (s) { return s.room; }))).sort(function (a, b) { return roomRank(a) - roomRank(b) || a.localeCompare(b); });
    var rowTimes = Array.from(new Set(sessions.map(function (s) { return s.startMin; }))).sort(function (a, b) { return a - b; });
    var rowOf = {}; rowTimes.forEach(function (t, i) { rowOf[t] = i; });

    // column model: for each room build aligned cells with rowSpans
    function buildColumn(items) {
      var cells = new Array(rowTimes.length).fill(null); // {session,span} | "covered" | null
      items.slice().sort(function (a, b) { return a.startMin - b.startMin; }).forEach(function (s) {
        var start = rowOf[s.startMin]; if (start == null) return;
        var span = rowTimes.filter(function (t) { return t >= s.startMin && t < s.endMin; }).length || 1;
        cells[start] = { session: s, span: span };
        for (var k = start + 1; k < start + span && k < cells.length; k++) if (cells[k] == null) cells[k] = "covered";
      });
      return cells;
    }
    // Venue lane holds parallel socials (overlapping at the same time), so it
    // can't use the one-cell-per-row rowspan model — that would drop events.
    // Instead stack every venue event that starts at a given row in one cell.
    var venueByRow = rowTimes.map(function (t) {
      return venueEvents.filter(function (s) { return s.startMin === t; }).sort(function (a, b) { return a.endMin - b.endMin; });
    });
    var roomCols = rooms.map(function (r) { return buildColumn(roomSessions.filter(function (s) { return s.room === r; })); });

    // room subtitle = the day's track if the room hosts a single track
    function roomSub(r) { var ts = Array.from(new Set(roomSessions.filter(function (s) { return s.room === r; }).map(function (s) { return s.track; }).filter(Boolean))); return ts.length === 1 ? ts[0] : (ts.length + " tracks"); }

    var head = '<thead><tr><th class="corner">Time</th><th class="venue-col">Venue &amp; Socials</th>' +
      rooms.map(function (r) { return '<th><span>' + esc(r) + '</span><span class="room-sub">' + esc(roomSub(r)) + "</span></th>"; }).join("") + "</tr></thead>";

    var body = "<tbody>" + rowTimes.map(function (t, i) {
      var cells = "";
      // venue column (stacked — preserves overlapping socials)
      cells += venueCellHtml(venueByRow[i]);
      // room columns
      roomCols.forEach(function (col) { cells += gridCellTd(col[i], false); });
      return '<tr><td class="timecell">' + esc(fmtMin(t)) + "</td>" + cells + "</tr>";
    }).join("") + "</tbody>";

    wrap.innerHTML = '<div class="grid-scroll"><table class="grid">' + head + body + "</table></div>";
    wrap.querySelectorAll("[data-card]").forEach(function (el) { el.addEventListener("click", function () { openModal(+el.getAttribute("data-card")); }); });
  }
  function venueCellHtml(events) {
    if (!events || !events.length) return '<td class="venuecell empty-slot"></td>';
    var inner = events.map(function (s) {
      var fav = isFav(s.id);
      return '<div class="gcell venue-ev ' + (fav ? "starred" : "") + '" data-card="' + s.id + '" title="' + esc(s.title) + '">' +
        '<span class="gc-star">' + starSvg() + "</span>" +
        '<span class="gc-title">' + esc(s.title) + "</span>" +
        '<span class="gc-spk mono">' + esc(s.start) + "–" + esc(s.end) + "</span></div>";
    }).join("");
    return '<td class="venuecell venue-stack">' + inner + "</td>";
  }
  function gridCellTd(cell, isVenue) {
    var cls = isVenue ? "venuecell" : "";
    if (cell == null) return '<td class="' + cls + ' empty-slot"></td>';
    if (cell === "covered") return ""; // spanned by a rowSpan above
    var s = cell.session, c = trackColor(s.track), fav = isFav(s.id);
    var topSpk = s.speakers.length ? s.speakers[0].name + (s.speakers.length > 1 ? " +" + (s.speakers.length - 1) : "") : "";
    var inner = '<div class="gcell ' + (isVenue ? "venue-ev " : "") + (fav ? "starred" : "") + '" data-card="' + s.id + '" style="' + (isVenue ? "" : "background:" + c.grid) + '" title="' + esc(s.title) + '">' +
      '<span class="gc-star">' + starSvg() + "</span>" + fitBadge(s.id, true) +
      '<span class="gc-title">' + esc(s.title) + "</span>" +
      (topSpk ? '<span class="gc-spk">' + esc(topSpk) + "</span>" : "") + "</div>";
    return '<td class="' + cls + '" rowspan="' + cell.span + '">' + inner + "</td>";
  }
  function fmtMin(min) { var h = Math.floor(min / 60), m = min % 60, ap = h >= 12 ? "pm" : "am"; h = h % 12; if (h === 0) h = 12; return h + ":" + String(m).padStart(2, "0") + ap; }

  // =========================================================================
  // star binding (shared)
  // =========================================================================
  function bindStar(btn) {
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      var id = +btn.getAttribute("data-star");
      toggleFav(id);
      var on = isFav(id);
      btn.classList.toggle("on", on);
      btn.setAttribute("aria-pressed", on);
      var card = btn.closest(".card"); if (card) card.classList.toggle("starred", on);
      syncStarCount();
      if (state.starredOnly) rerender();
    });
  }

  // =========================================================================
  // modal
  // =========================================================================
  var modalOpenId = null;
  function openModal(id) {
    var s = ALL.find(function (x) { return x.id === id; }); if (!s) return;
    modalOpenId = id;
    var c = trackColor(s.track), fav = isFav(s.id);
    var m = $("#modal");
    var spk = s.speakers.length ? '<div class="modal-section-label">' + (s.speakers.length > 1 ? "Speakers" : "Speaker") + '</div>' + s.speakers.map(function (p) {
      var org = speakerOrg(p);
      return '<div class="speaker-card' + (p.tbd ? " tbd" : "") + '">' +
        '<span class="avatar" style="background:' + avatarColor(p.name) + '">' + esc(initials(p.name)) + "</span>" +
        "<span><span class=\"sc-name\">" + esc(p.name) + "</span><br><span class=\"sc-org\">" + esc(org || "Speaker") + "</span></span>" +
        (p.twitter ? '<a class="sc-tw" href="https://x.com/' + esc(p.twitter.replace(/^@/, "")) + '" target="_blank" rel="noopener" aria-label="X / Twitter"><svg viewBox="0 0 16 16" fill="currentColor"><path d="M9.52 6.78 14.78 1h-1.25L8.96 6.02 5.32 1H1l5.52 7.86L1 15h1.25l4.83-5.3L11 15h4.32L9.52 6.78ZM7.7 9.02l-.56-.78L2.7 1.9h1.9l3.6 5.02.56.78 4.67 6.5h-1.9L7.7 9.02Z"/></svg></a>' : "") + "</div>";
    }).join("") : "";
    var status = (s.status === "tentative" || s.status === "hold") ? '<span class="status-tag ' + s.status + '" style="font-size:11px">' + s.status + "</span>" : (s.status === "confirmed" ? '<span class="status-tag" style="color:var(--t-workshop)">confirmed</span>' : "");

    m.style.setProperty("--track-glow", c.glow);
    m.innerHTML =
      '<div class="modal-head"><div class="glow"></div>' +
        '<button class="modal-close" id="modal-close" aria-label="Close"><svg viewBox="0 0 16 16" fill="currentColor"><path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.75.75 0 1 1 1.06 1.06L9.06 8l3.22 3.22a.75.75 0 1 1-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 0 1-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z"/></svg></button>' +
        '<div class="modal-kicker"><span class="badge badge--' + TYPE_META[s.type].cls + '"><span class="bdot"></span>' + esc(typeShort(s.type)) + "</span>" +
          (s.track && s.track !== "Venue & Logistics" ? '<span class="card-track"><span class="tr-dot" style="background:' + c.dot + '"></span><span>' + esc(s.track) + "</span></span>" : "") + status + "</div>" +
        '<h2 id="modal-title">' + esc(s.title) + "</h2>" +
        '<div class="modal-sub">' +
          '<span class="ms"><svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0Zm.75 4.25a.75.75 0 0 0-1.5 0V8c0 .2.08.39.22.53l2.5 2.5a.75.75 0 1 0 1.06-1.06L8.75 7.69V4.25Z"/></svg>' + esc(dayLabel(s.day)) + " · " + esc(s.start) + "–" + esc(s.end) + "</span>" +
          '<span class="ms"><svg viewBox="0 0 16 16" fill="currentColor"><path d="M2 2.75A.75.75 0 0 1 2.75 2h10.5a.75.75 0 0 1 .75.75v10.5a.75.75 0 0 1-.75.75H2.75a.75.75 0 0 1-.75-.75V2.75ZM3.5 3.5v9h9v-9h-9Z"/></svg>' + esc(s.room === "Venue" ? "Venue-wide" : s.room) + "</span>" +
        "</div></div>" +
      '<div class="modal-body">' + fitPanel(s.id) + (s.description ? '<div class="desc">' + renderDesc(s.description) + "</div>" : '<div class="desc" style="color:var(--text-dim)">No description provided yet.</div>') + spk + "</div>" +
      '<div class="modal-foot">' +
        '<button class="btn btn-primary ' + (fav ? "on" : "") + '" id="modal-star">' + starSvg() + "<span>" + (fav ? "Starred — in your plan" : "Add to my plan") + "</span></button>" +
        '<button class="btn btn-ghost" id="modal-copy" title="Copy link to this session">' + pinSvg() + "<span>Copy link</span></button>" +
      "</div>";

    $("#modal-close").addEventListener("click", closeModal);
    $("#modal-star").addEventListener("click", function () {
      toggleFav(id); var on = isFav(id);
      this.classList.toggle("on", on);
      $("span", this).textContent = on ? "Starred — in your plan" : "Add to my plan";
      syncStarCount(); refreshStarStates(id, on);
      if (state.starredOnly) { /* keep modal open; list refresh happens on close */ }
    });
    $("#modal-copy").addEventListener("click", function () {
      var url = location.origin + location.pathname + "?session=" + id;
      var btn = this;
      var done = function () { $("span", btn).textContent = "Link copied"; setTimeout(function () { var sp = $("span", btn); if (sp) sp.textContent = "Copy link"; }, 1600); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(done, done); else done();
    });

    var root = $("#modal-root");
    root.classList.add("open"); root.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    try { history.replaceState(null, "", "?session=" + id); } catch (e) {}
  }
  function closeModal() {
    var root = $("#modal-root");
    root.classList.remove("open"); root.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    modalOpenId = null;
    try { history.replaceState(null, "", location.pathname); } catch (e) {}
    rerender(); // reflect any starring done inside the modal
  }
  function dayLabel(id) { var d = DAYS.find(function (x) { return x.id === id; }); return d ? d.short + " — " + d.date : id; }
  function renderDesc(text) {
    return esc(text).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").split(/\n{2,}/).map(function (p) { return "<p style=\"margin:0 0 12px\">" + p.replace(/\n/g, "<br>") + "</p>"; }).join("");
  }
  function refreshStarStates(id, on) {
    document.querySelectorAll('[data-star="' + id + '"]').forEach(function (b) { b.classList.toggle("on", on); b.setAttribute("aria-pressed", on); var card = b.closest(".card"); if (card) card.classList.toggle("starred", on); });
    document.querySelectorAll('.gcell[data-card="' + id + '"]').forEach(function (g) { g.classList.toggle("starred", on); });
  }

  // =========================================================================
  // star count + starred-only toggle
  // =========================================================================
  function syncStarCount() {
    var n = favorites.size;
    $("#star-count-n").textContent = n;
    $("#starred-toggle").classList.toggle("active", n > 0 && !state.starredOnly);
  }
  function syncStarBtn() { $("#starred-toggle").setAttribute("aria-pressed", state.starredOnly); syncStarCount(); }

  // =========================================================================
  // view switching + master rerender
  // =========================================================================
  function setView(v) {
    state.view = v;
    try { localStorage.setItem("aie-view", v); } catch (e) {}
    $("#view-foryou").setAttribute("aria-pressed", v === "foryou");
    $("#view-agenda").setAttribute("aria-pressed", v === "agenda");
    $("#view-grid").setAttribute("aria-pressed", v === "grid");
    rerender();
  }

  function rerender() {
    // For You owns its own toolbar (the tuning knobs), so the filter bar hides.
    if (state.view === "foryou") {
      document.querySelector(".toolbar").style.display = "none";
      $("#agenda-view").style.display = "none";
      $("#grid-view").style.display = "none";
      $("#empty-view").style.display = "none";
      $("#foryou-view").style.display = "";
      if (foryouRenderer) foryouRenderer();
      else $("#foryou-view").innerHTML = '<div class="empty"><div class="blob"></div><h2>Recommendations loading…</h2><p>If this persists, run <code>node build-recs.mjs</code> and reload.</p></div>';
      return;
    }
    document.querySelector(".toolbar").style.display = "";
    $("#foryou-view").style.display = "none";
    renderTypePills();
    renderTrackPopover(); // keep the track list + counts in sync with the current day
    renderSummary();
    syncStarBtn();
    var total = daySessions().length;
    var filtered = applyFilters(daySessions());
    renderCount(filtered.length, total);

    var empty = $("#empty-view");
    if (!filtered.length) {
      empty.style.display = "block";
      $("#agenda-view").style.display = "none";
      $("#grid-view").style.display = "none";
      return;
    }
    empty.style.display = "none";
    if (state.view === "agenda") { $("#agenda-view").style.display = ""; $("#grid-view").style.display = "none"; renderAgenda(filtered); }
    else { $("#grid-view").style.display = ""; $("#agenda-view").style.display = "none"; renderGrid(filtered); }
  }

  // =========================================================================
  // wiring
  // =========================================================================
  function clearAll() {
    state.types.clear(); state.tracks.clear(); state.query = ""; state.starredOnly = false;
    $("#search-input").value = ""; $("#search").classList.remove("has-text");
    $("#track-search").value = "";
    renderTrackPopover(); syncStarBtn(); rerender();
  }

  function wire() {
    $("#meta-count").textContent = DATA.totalSessions;
    $("#meta-dates").textContent = "Jun 28 – Jul 2";
    $("#foot-count").textContent = DATA.totalSessions + " sessions · " + DAYS.length + " days · " + DATA.tracks.length + " tracks";

    $("#view-foryou").addEventListener("click", function () { setView("foryou"); });
    $("#view-agenda").addEventListener("click", function () { setView("agenda"); });
    $("#view-grid").addEventListener("click", function () { setView("grid"); });

    // search
    var si = $("#search-input"), sb = $("#search");
    si.addEventListener("input", function () { state.query = si.value; sb.classList.toggle("has-text", !!si.value); rerender(); });
    $("#search-clear").addEventListener("click", function () { si.value = ""; state.query = ""; sb.classList.remove("has-text"); si.focus(); rerender(); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "/" && document.activeElement !== si && !/^(input|textarea)$/i.test((document.activeElement || {}).tagName || "")) { e.preventDefault(); si.focus(); }
      if (e.key === "Escape") { if (modalOpenId != null) closeModal(); else if ($("#track-pop").classList.contains("open")) closeTrackPop(); }
    });

    // starred-only toggle
    $("#starred-toggle").addEventListener("click", function () { state.starredOnly = !state.starredOnly; syncStarBtn(); rerender(); });

    // export plan to .ics
    $("#export-ics").addEventListener("click", function () {
      var btn = this, n = exportICS();
      var label = btn.querySelector(".export-label");
      if (label) {
        var was = label.textContent;
        label.textContent = n ? "Saved " + n + " to .ics" : "Star some first";
        setTimeout(function () { label.textContent = was; }, 1800);
      }
    });

    // clear
    $("#clear-filters").addEventListener("click", clearAll);
    $("#empty-clear").addEventListener("click", clearAll);

    // track popover
    var pop = $("#track-pop"), tbtn = $("#track-btn");
    tbtn.addEventListener("click", function (e) { e.stopPropagation(); if (pop.classList.contains("open")) closeTrackPop(); else openTrackPop(); });
    $("#track-search").addEventListener("input", renderTrackPopover);
    document.addEventListener("click", function (e) { if (pop.classList.contains("open") && !pop.contains(e.target) && e.target !== tbtn && !tbtn.contains(e.target)) closeTrackPop(); });
    function openTrackPop() { pop.classList.add("open"); tbtn.setAttribute("aria-expanded", "true"); setTimeout(function () { $("#track-search").focus(); }, 30); }
    window.closeTrackPop = function () { pop.classList.remove("open"); tbtn.setAttribute("aria-expanded", "false"); };

    // modal scrim
    $("#modal-scrim").addEventListener("click", closeModal);
  }
  function closeTrackPop() { window.closeTrackPop && window.closeTrackPop(); }

  // =========================================================================
  // boot
  // =========================================================================
  // ── export plan to .ics ─────────────────────────────────────────────────
  // Conference is in San Francisco (PDT = UTC-7 in late Jun / early Jul), so we
  // emit absolute UTC times (+7h) — unambiguous in every calendar client.
  var DAY_DATE = {
    "Day 1 — Workshop Day": [2026, 6, 29], "Day 2 — Session Day 1": [2026, 6, 30],
    "Day 3 — Session Day 2": [2026, 7, 1], "Day 4 — Session Day 3": [2026, 7, 2],
  };
  function pad2(n) { return String(n).padStart(2, "0"); }
  function icsTime(dayId, min) {
    var d = DAY_DATE[dayId]; if (!d) return null;
    var dt = new Date(Date.UTC(d[0], d[1] - 1, d[2], Math.floor(min / 60) + 7, min % 60, 0));
    return dt.getUTCFullYear() + pad2(dt.getUTCMonth() + 1) + pad2(dt.getUTCDate()) + "T" + pad2(dt.getUTCHours()) + pad2(dt.getUTCMinutes()) + "00Z";
  }
  function icsEsc(s) { return String(s == null ? "" : s).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n"); }
  function icsFold(line) { var out = ""; while (line.length > 73) { out += line.slice(0, 73) + "\r\n "; line = line.slice(73); } return out + line; }

  function exportICS() {
    var dayIx = {}; DAYS.forEach(function (d, i) { dayIx[d.id] = i; });
    var picks = ALL.filter(function (s) { return isFav(s.id); })
      .sort(function (a, b) { return (dayIx[a.day] - dayIx[b.day]) || (a.startMin - b.startMin); });
    if (!picks.length) return 0;
    var now = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    var L = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//AI Engineer//World's Fair 2026 — My Plan//EN",
      "CALSCALE:GREGORIAN", "METHOD:PUBLISH", "X-WR-CALNAME:AIE World's Fair 2026 — My Plan"];
    picks.forEach(function (s) {
      var dt = icsTime(s.day, s.startMin), de = icsTime(s.day, s.endMin); if (!dt) return;
      var desc = [];
      if (s.speakers.length) desc.push(s.speakers.map(function (p) { return [p.name, p.company, p.role].filter(Boolean).join(", "); }).join("; "));
      if (s.track && s.track !== "Venue & Logistics") desc.push("Track: " + s.track);
      var r = recFor(s.id);
      if (r && window.AIE && window.AIE.matchPct) { desc.push("For-you match: " + window.AIE.matchPct(s.id) + "%"); if (r.rationale) desc.push(r.rationale); }
      L.push("BEGIN:VEVENT", "UID:aie-" + s.id + "@ai.engineer", "DTSTAMP:" + now, "DTSTART:" + dt, "DTEND:" + de,
        icsFold("SUMMARY:" + icsEsc(s.title)),
        icsFold("LOCATION:" + icsEsc((s.room && s.room !== "Venue" ? s.room + ", " : "") + "Moscone West, San Francisco, CA")));
      if (desc.length) L.push(icsFold("DESCRIPTION:" + icsEsc(desc.join("\n"))));
      L.push("STATUS:CONFIRMED", "END:VEVENT");
    });
    L.push("END:VCALENDAR");
    var blob = new Blob([L.join("\r\n")], { type: "text/calendar;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url; a.download = "aie-worldsfair-my-plan.ics";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    return picks.length;
  }

  // ── expose internals for the recommendation module (recommend.js) ───────
  window.AIE = {
    ALL: ALL, DAYS: DAYS, state: state,
    esc: esc, trackColor: trackColor, avatarColor: avatarColor, initials: initials,
    typeShort: typeShort, TYPE_META: TYPE_META, speakerOrg: speakerOrg,
    isFav: isFav, toggleFav: toggleFav, openModal: openModal,
    syncStarCount: syncStarCount, starSvg: starSvg, setView: setView,
    exportICS: exportICS, rerenderActive: function () { rerender(); },
  };
  window.registerForYou = function (fn) { foryouRenderer = fn; if (state.view === "foryou") fn(); };

  function boot() {
    wire();
    renderDayTabs();
    renderTrackPopover();
    setView(state.view); // triggers first rerender
    syncStarCount();

    // restore modal from URL (?session=ID), and jump to that session's day
    var m = location.search.match(/[?&]session=(\d+)/);
    if (m) { var id = +m[1]; var s = ALL.find(function (x) { return x.id === id; }); if (s) { state.day = s.day; renderDayTabs(); rerender(); openModal(id); } }
  }
  boot();
})();
