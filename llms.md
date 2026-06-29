<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>AI Engineer World's Fair 2026 — llms.md</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: #000;
      color: #e6edf3;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
      line-height: 1.6;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    a { color: #58a6ff; text-decoration: none; }
    a:hover { text-decoration: underline; }

    /* Header */
    header {
      border-bottom: 1px solid rgba(255,255,255,0.1);
      padding: 16px 0;
    }
    .header-inner {
      max-width: 900px;
      margin: 0 auto;
      padding: 0 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .header-brand {
      display: flex;
      align-items: center;
      gap: 12px;
      color: #fff;
      font-weight: 600;
      font-size: 16px;
    }
    .header-brand svg { height: 28px; width: auto; }
    .header-nav { display: flex; gap: 20px; font-size: 14px; }
    .header-nav a { color: rgba(255,255,255,0.7); }
    .header-nav a:hover { color: #fff; text-decoration: none; }

    /* Content */
    main {
      max-width: 900px;
      margin: 0 auto;
      padding: 40px 24px;
      flex: 1;
      width: 100%;
    }

    /* View / format toggles */
    .view-toggle {
      display: flex;
      gap: 20px;
      align-items: center;
      flex-wrap: wrap;
      margin-bottom: 32px;
      font-size: 13px;
    }
    .toggle-group { display: flex; gap: 8px; align-items: center; }
    .toggle-group .group-label {
      color: rgba(255,255,255,0.35);
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      margin-right: 2px;
    }
    .view-toggle button {
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.15);
      color: rgba(255,255,255,0.7);
      padding: 6px 14px;
      border-radius: 6px;
      cursor: pointer;
      font-family: inherit;
      font-size: 13px;
    }
    .view-toggle button.active {
      background: rgba(88,166,255,0.15);
      border-color: rgba(88,166,255,0.4);
      color: #58a6ff;
    }
    .view-toggle button:hover { border-color: rgba(255,255,255,0.3); }

    /* Document panes */
    .doc { display: none; }
    .doc.active { display: block; }
    .doc-loading { color: rgba(255,255,255,0.5); padding: 48px 0; font-size: 14px; }

    /* Rendered markdown */
    .rendered h1 { font-size: 2em; font-weight: 700; margin: 0 0 16px; color: #fff; }
    .rendered h2 { font-size: 1.5em; font-weight: 600; margin: 32px 0 12px; color: #fff; padding-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.1); }
    .rendered h3 { font-size: 1.2em; font-weight: 600; margin: 24px 0 8px; color: #e6edf3; }
    .rendered p { margin: 0 0 16px; }
    .rendered blockquote {
      border-left: 3px solid rgba(88,166,255,0.4);
      padding: 8px 16px;
      margin: 0 0 16px;
      color: rgba(255,255,255,0.7);
      background: rgba(255,255,255,0.03);
      border-radius: 0 6px 6px 0;
    }
    .rendered ul, .rendered ol { margin: 0 0 16px; padding-left: 24px; }
    .rendered li { margin: 4px 0; }
    .rendered hr { border: none; border-top: 1px solid rgba(255,255,255,0.1); margin: 24px 0; }
    .rendered strong { color: #fff; }
    .rendered table {
      width: 100%;
      border-collapse: collapse;
      margin: 0 0 16px;
      font-size: 14px;
    }
    .rendered th {
      text-align: left;
      padding: 10px 12px;
      border-bottom: 2px solid rgba(255,255,255,0.15);
      color: #fff;
      font-weight: 600;
    }
    .rendered td {
      padding: 8px 12px;
      border-bottom: 1px solid rgba(255,255,255,0.06);
    }
    .rendered tr:hover td { background: rgba(255,255,255,0.02); }

    /* Raw source */
    .raw-source {
      display: none;
      background: #0d1117;
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 8px;
      padding: 24px;
      overflow-x: auto;
      font-family: 'SF Mono', 'Fira Code', 'Fira Mono', Menlo, Consolas, monospace;
      font-size: 13px;
      line-height: 1.6;
      color: #8b949e;
      white-space: pre-wrap;
      word-break: break-word;
    }

    /* Curl hint */
    .curl-hint {
      margin-bottom: 24px;
      padding: 12px 16px;
      background: rgba(34,197,94,0.08);
      border: 1px solid rgba(34,197,94,0.2);
      border-radius: 8px;
      font-family: 'SF Mono', 'Fira Code', 'Fira Mono', Menlo, Consolas, monospace;
      font-size: 13px;
      color: #22c55e;
    }
    .curl-hint code { color: #22c55e; }

    /* Footer */
    footer {
      border-top: 1px solid rgba(255,255,255,0.1);
      padding: 24px 0;
      font-size: 13px;
      color: rgba(255,255,255,0.4);
    }
    .footer-inner {
      max-width: 900px;
      margin: 0 auto;
      padding: 0 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
    }
    .footer-links { display: flex; gap: 16px; }
    .footer-links a { color: rgba(255,255,255,0.5); }
    .footer-links a:hover { color: #fff; }

    @media (max-width: 640px) {
      main { padding: 24px 16px; }
      .header-nav { display: none; }
      .rendered table { font-size: 12px; }
      .rendered th, .rendered td { padding: 6px 8px; }
    }
  </style>
</head>
<body>
  <header>
    <div class="header-inner">
      <a href="/worldsfair" class="header-brand">
        <svg viewBox="0 0 120 28" fill="none" xmlns="http://www.w3.org/2000/svg">
          <text x="0" y="20" fill="white" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif" font-size="16" font-weight="700">AI Engineer</text>
        </svg>
      </a>
      <nav class="header-nav">
        <a href="/worldsfair">World&rsquo;s Fair 2026</a>
        <a href="/llms.md">All Conferences</a>
        <a href="https://youtube.com/@aidotengineer">YouTube</a>
        <a href="https://x.com/aiDotEngineer">Twitter/X</a>
      </nav>
    </div>
  </header>

  <main>
    <div class="curl-hint">
      <span style="color:rgba(255,255,255,0.4)">$</span> curl ai.engineer/wf/llms.md
    </div>

    <div class="view-toggle">
      <div class="toggle-group">
        <span class="group-label">View</span>
        <button class="active" data-doc="0" data-slug="overview" onclick="setDoc(0)">Overview</button>
        <button data-doc="1" data-slug="full-details" onclick="setDoc(1)">Full Details</button>
      </div>
      <div class="toggle-group">
        <span class="group-label">Format</span>
        <button class="active" data-fmt="rendered" onclick="setFmt('rendered')">Rendered</button>
        <button data-fmt="raw" onclick="setFmt('raw')">Raw Markdown</button>
      </div>
    </div>

    <div class="doc active" data-doc="0" data-slug="overview">
      <div class="rendered"><h1>AI Engineer World's Fair 2026</h1>
<blockquote><p>The largest technical AI conference in the world, with 29 tracks, 300 speakers, 100 expo partners, 6,000+ AI Engineers, founders, and VPs of AI.</p></blockquote>
<ul>
<li><strong>Website:</strong> https://ai.engineer/worldsfair</li>
<li><strong>Dates:</strong> June 28 – July 2, 2026 (5 days)</li>
<li><strong>Location:</strong> San Francisco, CA</li>
<li><strong>Venue:</strong> Moscone West Convention Center</li>
<li><strong>Tickets:</strong> <a href="https://app.ai.engineer/e/ai-engineer-worlds-fair-2026/portal">https://app.ai.engineer/e/ai-engineer-worlds-fair-2026/portal</a></li>
<li><strong>Newsletter:</strong> <a href="https://ai.engineer/newsletter">https://ai.engineer/newsletter</a></li>
<li><strong>YouTube:</strong> <a href="https://youtube.com/@aidotengineer">https://youtube.com/@aidotengineer</a></li>
<li><strong>Twitter/X:</strong> <a href="https://x.com/aiDotEngineer">https://x.com/aiDotEngineer</a></li>
<li><strong>LinkedIn:</strong> <a href="https://www.linkedin.com/company/aidotengineer/">https://www.linkedin.com/company/aidotengineer/</a></li>
</ul>
<hr />
<h2>Schedule Overview</h2>
<h3>Day 0 — Sunday, June 28: New Engineer Orientation (NEO)</h3>
<table>
<thead><tr><th>Time</th><th>Event</th></tr></thead>
<tbody>
<tr><td>5:00PM – 9:00PM</td><td>Early Registration & Badge Pickup</td></tr>
<tr><td>7:00PM – 9:00PM</td><td>New Engineer Orientation</td></tr>
</tbody></table>
<blockquote><p><strong>Sign up for NEO:</strong> <a href="https://luma.com/aie-neo-irl">https://luma.com/aie-neo-irl</a></p></blockquote>
<h3>Day 1 — Monday, June 29: Workshop Day + Welcome Reception</h3>
<table>
<thead><tr><th>Time</th><th>Event</th></tr></thead>
<tbody>
<tr><td>8:00AM – 7:00PM</td><td>Registration</td></tr>
<tr><td>9:00AM – 1:00PM</td><td>10 Rooms of Workshops</td></tr>
<tr><td>1:00PM – 4:00PM</td><td>Exhibitor Arrival</td></tr>
<tr><td>1:15PM – 2:15PM</td><td>Lunch & Learn Workshops</td></tr>
<tr><td>2:30PM – 5:30PM</td><td>10 Rooms of Workshops</td></tr>
<tr><td>4:00PM – 7:30PM</td><td>Expo + Sonar x Extend Welcome Reception</td></tr>
<tr><td>6:00PM – 9:00PM</td><td>Oxylabs VIP Reception</td></tr>
<tr><td>7:00PM – 10:30PM</td><td>Firecrawl Speaker Dinner</td></tr>
<tr><td>7:00PM – 9:30PM</td><td>Qodo: AIE Opening Night VIP Event</td></tr>
<tr><td>8:00PM – 10:00PM</td><td>Offsite Side Events & Meetups</td></tr>
</tbody></table>
<h3>Day 2 — Tuesday, June 30: Keynotes + Breakouts</h3>
<table>
<thead><tr><th>Time</th><th>Event</th></tr></thead>
<tbody>
<tr><td>8:00AM – 5:00PM</td><td>Registration</td></tr>
<tr><td>9:00AM – 10:30AM</td><td>90m Keynotes</td></tr>
<tr><td>10:00AM – 7:30PM</td><td>Expo</td></tr>
<tr><td>10:45AM – 12:25PM</td><td>10 Parallel Tracks + Leadership</td></tr>
<tr><td>1:30PM – 4:05PM</td><td>10 Parallel Tracks + Leadership</td></tr>
<tr><td>4:30PM – 5:30PM</td><td>60m Keynotes</td></tr>
<tr><td>5:00PM – 7:30PM</td><td>Onsite Networking Night</td></tr>
<tr><td>7:30PM – 10:30PM</td><td>Optiver: The Agentic SDLC Loop</td></tr>
</tbody></table>
<h3>Day 3 — Wednesday, July 1: World Cup + Multi-Track Programming</h3>
<table>
<thead><tr><th>Time</th><th>Event</th></tr></thead>
<tbody>
<tr><td>8:00AM – 5:00PM</td><td>Registration</td></tr>
<tr><td>9:00AM – 10:30AM</td><td>90m Keynotes</td></tr>
<tr><td>10:00AM – 5:00PM</td><td>Expo</td></tr>
<tr><td>10:45AM – 12:25PM</td><td>10 Parallel Tracks + Leadership</td></tr>
<tr><td>1:30PM – 4:05PM</td><td>10 Parallel Tracks + Leadership</td></tr>
<tr><td>4:00PM – 7:00PM</td><td>World Cup Quarterfinal VIP Suite</td></tr>
<tr><td>4:30PM – 5:30PM</td><td>60m Keynotes</td></tr>
<tr><td>6:00PM – 9:00PM</td><td>Stripe x Metronome Startup Night</td></tr>
<tr><td>6:00PM – 10:00PM</td><td>Offsite Side Events & Meetups</td></tr>
<tr><td>6:30PM – 9:30PM</td><td>Vercel x Merge x Factory: AI Engineer After Dark</td></tr>
</tbody></table>
<h3>Day 4 — Thursday, July 2: Final Day + Last Chance Expo</h3>
<table>
<thead><tr><th>Time</th><th>Event</th></tr></thead>
<tbody>
<tr><td>8:00AM – 1:00PM</td><td>Registration</td></tr>
<tr><td>9:00AM – 10:30AM</td><td>90m Keynotes</td></tr>
<tr><td>10:00AM – 4:30PM</td><td>Expo</td></tr>
<tr><td>10:45AM – 12:25PM</td><td>10 Parallel Tracks + Leadership</td></tr>
<tr><td>1:30PM – 4:05PM</td><td>10 Parallel Tracks + Leadership</td></tr>
<tr><td>4:30PM – 5:30PM</td><td>60m Keynotes</td></tr>
<tr><td>6:00PM – 10:00PM</td><td>Offsite Side Events & Meetups</td></tr>
</tbody></table>
<hr />
<h2>Tracks</h2>
<p>39 tracks across 4 days, covering the full breadth of AI engineering.</p>
<h3>Day 1 — Workshop Day</h3>
<p>Full-day hands-on workshops across all tracks.</p>
<h3>Day 2 — Session Day 1</h3>
<table>
<thead><tr><th>Track</th><th>Room</th></tr></thead>
<tbody>
<tr><td>Software Factories</td><td>Keynote</td></tr>
<tr><td>Claws & Personal Agents</td><td>Track 1</td></tr>
<tr><td>Vision & OCR</td><td>Track 2</td></tr>
<tr><td>Search & Retrieval</td><td>Track 3</td></tr>
<tr><td>Workshops Day 2</td><td>Track 4</td></tr>
<tr><td>Security</td><td>Track 5</td></tr>
<tr><td>Voice & Realtime AI</td><td>Track 6</td></tr>
<tr><td>LLM Recsys</td><td>Track 7</td></tr>
<tr><td>Forward Deployed Engineering</td><td>Track 8</td></tr>
<tr><td>Data Quality</td><td>Track 9</td></tr>
<tr><td>AI-Native Enterprises</td><td>Leadership 1</td></tr>
<tr><td>AI Architects: Show my Workflow</td><td>Leadership 2</td></tr>
<tr><td>CTO Circle</td><td>Leadership Lounge</td></tr>
</tbody></table>
<h3>Day 3 — Session Day 2</h3>
<table>
<thead><tr><th>Track</th><th>Room</th></tr></thead>
<tbody>
<tr><td>Autoresearch</td><td>Keynote</td></tr>
<tr><td>Sandbox & Platform Engineering</td><td>Track 1</td></tr>
<tr><td>Robotics & World Models</td><td>Track 2</td></tr>
<tr><td>Memory & Continual Learning</td><td>Track 3</td></tr>
<tr><td>Workshops Day 3</td><td>Track 4</td></tr>
<tr><td>Evals</td><td>Track 5</td></tr>
<tr><td>Design Engineering</td><td>Track 6</td></tr>
<tr><td>Computer Use</td><td>Track 7</td></tr>
<tr><td>Context Engineering</td><td>Track 8</td></tr>
<tr><td>Posttraining & Midtraining</td><td>Track 9</td></tr>
<tr><td>AI-Native Enterprises</td><td>Leadership 1</td></tr>
<tr><td>AI Architects: Tokenmaxxing</td><td>Leadership 2</td></tr>
<tr><td>CTO Circle</td><td>Leadership Lounge</td></tr>
</tbody></table>
<h3>Day 4 — Session Day 3</h3>
<table>
<thead><tr><th>Track</th><th>Room</th></tr></thead>
<tbody>
<tr><td>Harness Engineering</td><td>Keynote</td></tr>
<tr><td>Generative Media</td><td>Track 1</td></tr>
<tr><td>Agentic Commerce</td><td>Track 2</td></tr>
<tr><td>AI in Finance</td><td>Track 3</td></tr>
<tr><td>Local AI</td><td>Track 4</td></tr>
<tr><td>Graphs</td><td>Track 5</td></tr>
<tr><td>AI in GTM</td><td>Track 6</td></tr>
<tr><td>AI in Healthcare</td><td>Track 7</td></tr>
<tr><td>Agentic Engineering</td><td>Track 8</td></tr>
<tr><td>Inference</td><td>Track 9</td></tr>
<tr><td>AI-Native Enterprises</td><td>Leadership 1</td></tr>
<tr><td>AI Architects: AI Factories</td><td>Leadership 2</td></tr>
<tr><td>CTO Circle</td><td>Leadership Lounge</td></tr>
</tbody></table>
<hr />
<h2>Venue</h2>
<p><strong>Moscone West Convention Center</strong>, San Francisco, CA</p>
<p>Three levels of programming:</p>
<table>
<thead><tr><th>Floor</th><th>What</th></tr></thead>
<tbody>
<tr><td>1st Floor</td><td>Registration, Expo, Food, Evening Socials</td></tr>
<tr><td>2nd Floor</td><td>Breakout Rooms</td></tr>
<tr><td>3rd Floor</td><td>Keynotes + VIP Rooms</td></tr>
</tbody></table>
<h2>Hotels</h2>
<p>Discounted room blocks close June 6, 2026. Book early — World Cup in the US means rooms sell out fast.</p>
<table>
<thead><tr><th>Hotel</th><th>Status</th></tr></thead>
<tbody>
<tr><td><a href="https://book.passkey.com/e/51164469">San Francisco Marriott Marquis</a></td><td>Available</td></tr>
<tr><td>Parc 55 San Francisco</td><td><strong>SOLD OUT</strong></td></tr>
<tr><td><a href="https://www.ihg.com/hotels/us/en/find-hotels/select-roomrate?fromRedirect=true&qSrt=sAV&qIta=99801505&icdv=99801505&qSlH=sfohb&qCiD=27&qCiMy=052026&qCoD=04&qCoMy=062026&qGrpCd=ae3&qAAR=6CBARC&qRtP=6CBARC&setPMCookies=true&qSHBrC=IC&qDest=888%20Howard%20Street,%20San%20Francisco,%20CA,%20US&showApp=true&adjustMonth=false&srb_u=1&qRmFltr=">InterContinental San Francisco</a></td><td>Available</td></tr>
</tbody></table>
<hr />
<h2>Tickets</h2>
<p>Full refunds available up to one month before the event.</p>
<table>
<thead><tr><th>Tier</th><th>Price</th><th>Access</th></tr></thead>
<tbody>
<tr><td>Leadership</td><td>$2,399</td><td>Keynote + leadership tracks + expo + workshops</td></tr>
<tr><td>Engineering + Workshops</td><td>$1,999</td><td>All engineering tracks + workshops + expo</td></tr>
<tr><td>Engineering</td><td>$1,499</td><td>All engineering tracks + expo</td></tr>
<tr><td>Expo Explorer</td><td>$299</td><td>Expo hall access only</td></tr>
</tbody></table>
<p><strong>Group discounts</strong> (applied automatically):</p>
<table>
<thead><tr><th>Quantity</th><th>Discount</th></tr></thead>
<tbody>
<tr><td>5+ tickets</td><td>10% off</td></tr>
<tr><td>10+ tickets</td><td>15% off</td></tr>
<tr><td>15+ tickets</td><td>20% off</td></tr>
<tr><td>30+ tickets</td><td>Email info@ai.engineer</td></tr>
</tbody></table>
<p><strong>Purchase:</strong> <a href="https://app.ai.engineer/e/ai-engineer-worlds-fair-2026/portal">https://app.ai.engineer/e/ai-engineer-worlds-fair-2026/portal</a></p>
<hr />
<h2>Highlights</h2>
<ul>
<li>Startup Battlefield on July 2nd</li>
<li>100+ expo partners throughout</li>
<li>10 engineering tracks per day + 2 Leadership Tracks on main days</li>
<li>World Cup Quarterfinal VIP Suite (July 1, Levi's Stadium — invite only, sponsorships available)</li>
<li>No afterparties July 1 & 2 — side events encouraged</li>
</ul>
<hr />
<h2>For AI Agents</h2>
<p>Open endpoints for building apps, agents, and tools on conference data.</p>
<ul>
<li>llms.md (this overview): https://ai.engineer/worldsfair/llms.md</li>
<li>llms-full.md (every session + all speakers): https://ai.engineer/worldsfair/llms-full.md</li>
<li>Sessions JSON: https://ai.engineer/worldsfair/sessions.json</li>
<li>Speakers JSON: https://ai.engineer/worldsfair/speakers.json</li>
<li>MCP Server: https://ai.engineer/worldsfair/mcp</li>
<li>iCal Calendar: https://ai.engineer/worldsfair/calendar.ics</li>
</ul>
<hr />
<h2>Links</h2>
<ul>
<li><strong>Website:</strong> https://ai.engineer/worldsfair</li>
<li><strong>Tickets:</strong> <a href="https://app.ai.engineer/e/ai-engineer-worlds-fair-2026/portal">https://app.ai.engineer/e/ai-engineer-worlds-fair-2026/portal</a></li>
<li><strong>YouTube:</strong> <a href="https://youtube.com/@aidotengineer">https://youtube.com/@aidotengineer</a></li>
<li><strong>Twitter/X:</strong> <a href="https://x.com/aiDotEngineer">https://x.com/aiDotEngineer</a></li>
<li><strong>LinkedIn:</strong> <a href="https://www.linkedin.com/company/aidotengineer/">https://www.linkedin.com/company/aidotengineer/</a></li>
<li><strong>Newsletter:</strong> <a href="https://ai.engineer/newsletter">https://ai.engineer/newsletter</a></li>
<li><strong>NEO Sign-up:</strong> <a href="https://luma.com/aie-neo-irl">https://luma.com/aie-neo-irl</a></li>
</ul>
</div>
      <pre class="raw-source" hidden># AI Engineer World's Fair 2026

&gt; The largest technical AI conference in the world, with 29 tracks, 300 speakers, 100 expo partners, 6,000+ AI Engineers, founders, and VPs of AI.

- **Website:** https://ai.engineer/worldsfair
- **Dates:** June 28 – July 2, 2026 (5 days)
- **Location:** San Francisco, CA
- **Venue:** Moscone West Convention Center
- **Tickets:** &lt;https://app.ai.engineer/e/ai-engineer-worlds-fair-2026/portal&gt;
- **Newsletter:** &lt;https://ai.engineer/newsletter&gt;
- **YouTube:** &lt;https://youtube.com/@aidotengineer&gt;
- **Twitter/X:** &lt;https://x.com/aiDotEngineer&gt;
- **LinkedIn:** &lt;https://www.linkedin.com/company/aidotengineer/&gt;

---

## Schedule Overview

### Day 0 — Sunday, June 28: New Engineer Orientation (NEO)

| Time | Event |
|------|-------|
| 5:00PM – 9:00PM | Early Registration &amp; Badge Pickup |
| 7:00PM – 9:00PM | New Engineer Orientation |

&gt; **Sign up for NEO:** &lt;https://luma.com/aie-neo-irl&gt;

### Day 1 — Monday, June 29: Workshop Day + Welcome Reception

| Time | Event |
|------|-------|
| 8:00AM – 7:00PM | Registration |
| 9:00AM – 1:00PM | 10 Rooms of Workshops |
| 1:00PM – 4:00PM | Exhibitor Arrival |
| 1:15PM – 2:15PM | Lunch &amp; Learn Workshops |
| 2:30PM – 5:30PM | 10 Rooms of Workshops |
| 4:00PM – 7:30PM | Expo + Sonar x Extend Welcome Reception |
| 6:00PM – 9:00PM | Oxylabs VIP Reception |
| 7:00PM – 10:30PM | Firecrawl Speaker Dinner |
| 7:00PM – 9:30PM | Qodo: AIE Opening Night VIP Event |
| 8:00PM – 10:00PM | Offsite Side Events &amp; Meetups |

### Day 2 — Tuesday, June 30: Keynotes + Breakouts

| Time | Event |
|------|-------|
| 8:00AM – 5:00PM | Registration |
| 9:00AM – 10:30AM | 90m Keynotes |
| 10:00AM – 7:30PM | Expo |
| 10:45AM – 12:25PM | 10 Parallel Tracks + Leadership |
| 1:30PM – 4:05PM | 10 Parallel Tracks + Leadership |
| 4:30PM – 5:30PM | 60m Keynotes |
| 5:00PM – 7:30PM | Onsite Networking Night |
| 7:30PM – 10:30PM | Optiver: The Agentic SDLC Loop |

### Day 3 — Wednesday, July 1: World Cup + Multi-Track Programming

| Time | Event |
|------|-------|
| 8:00AM – 5:00PM | Registration |
| 9:00AM – 10:30AM | 90m Keynotes |
| 10:00AM – 5:00PM | Expo |
| 10:45AM – 12:25PM | 10 Parallel Tracks + Leadership |
| 1:30PM – 4:05PM | 10 Parallel Tracks + Leadership |
| 4:00PM – 7:00PM | World Cup Quarterfinal VIP Suite |
| 4:30PM – 5:30PM | 60m Keynotes |
| 6:00PM – 9:00PM | Stripe x Metronome Startup Night |
| 6:00PM – 10:00PM | Offsite Side Events &amp; Meetups |
| 6:30PM – 9:30PM | Vercel x Merge x Factory: AI Engineer After Dark |

### Day 4 — Thursday, July 2: Final Day + Last Chance Expo

| Time | Event |
|------|-------|
| 8:00AM – 1:00PM | Registration |
| 9:00AM – 10:30AM | 90m Keynotes |
| 10:00AM – 4:30PM | Expo |
| 10:45AM – 12:25PM | 10 Parallel Tracks + Leadership |
| 1:30PM – 4:05PM | 10 Parallel Tracks + Leadership |
| 4:30PM – 5:30PM | 60m Keynotes |
| 6:00PM – 10:00PM | Offsite Side Events &amp; Meetups |

---

## Tracks

39 tracks across 4 days, covering the full breadth of AI engineering.

### Day 1 — Workshop Day

Full-day hands-on workshops across all tracks.

### Day 2 — Session Day 1

| Track | Room |
|-------|------|
| Software Factories | Keynote |
| Claws &amp; Personal Agents | Track 1 |
| Vision &amp; OCR | Track 2 |
| Search &amp; Retrieval | Track 3 |
| Workshops Day 2 | Track 4 |
| Security | Track 5 |
| Voice &amp; Realtime AI | Track 6 |
| LLM Recsys | Track 7 |
| Forward Deployed Engineering | Track 8 |
| Data Quality | Track 9 |
| AI-Native Enterprises | Leadership 1 |
| AI Architects: Show my Workflow | Leadership 2 |
| CTO Circle | Leadership Lounge |

### Day 3 — Session Day 2

| Track | Room |
|-------|------|
| Autoresearch | Keynote |
| Sandbox &amp; Platform Engineering | Track 1 |
| Robotics &amp; World Models | Track 2 |
| Memory &amp; Continual Learning | Track 3 |
| Workshops Day 3 | Track 4 |
| Evals | Track 5 |
| Design Engineering | Track 6 |
| Computer Use | Track 7 |
| Context Engineering | Track 8 |
| Posttraining &amp; Midtraining | Track 9 |
| AI-Native Enterprises | Leadership 1 |
| AI Architects: Tokenmaxxing | Leadership 2 |
| CTO Circle | Leadership Lounge |

### Day 4 — Session Day 3

| Track | Room |
|-------|------|
| Harness Engineering | Keynote |
| Generative Media | Track 1 |
| Agentic Commerce | Track 2 |
| AI in Finance | Track 3 |
| Local AI | Track 4 |
| Graphs | Track 5 |
| AI in GTM | Track 6 |
| AI in Healthcare | Track 7 |
| Agentic Engineering | Track 8 |
| Inference | Track 9 |
| AI-Native Enterprises | Leadership 1 |
| AI Architects: AI Factories | Leadership 2 |
| CTO Circle | Leadership Lounge |

---

## Venue

**Moscone West Convention Center**, San Francisco, CA

Three levels of programming:

| Floor | What |
|-------|------|
| 1st Floor | Registration, Expo, Food, Evening Socials |
| 2nd Floor | Breakout Rooms |
| 3rd Floor | Keynotes + VIP Rooms |

## Hotels

Discounted room blocks close June 6, 2026. Book early — World Cup in the US means rooms sell out fast.

| Hotel | Status |
|-------|--------|
| [San Francisco Marriott Marquis](https://book.passkey.com/e/51164469) | Available |
| Parc 55 San Francisco | **SOLD OUT** |
| [InterContinental San Francisco](https://www.ihg.com/hotels/us/en/find-hotels/select-roomrate?fromRedirect=true&amp;qSrt=sAV&amp;qIta=99801505&amp;icdv=99801505&amp;qSlH=sfohb&amp;qCiD=27&amp;qCiMy=052026&amp;qCoD=04&amp;qCoMy=062026&amp;qGrpCd=ae3&amp;qAAR=6CBARC&amp;qRtP=6CBARC&amp;setPMCookies=true&amp;qSHBrC=IC&amp;qDest=888%20Howard%20Street,%20San%20Francisco,%20CA,%20US&amp;showApp=true&amp;adjustMonth=false&amp;srb_u=1&amp;qRmFltr=) | Available |

---

## Tickets

Full refunds available up to one month before the event.

| Tier | Price | Access |
|------|-------|--------|
| Leadership | $2,399 | Keynote + leadership tracks + expo + workshops |
| Engineering + Workshops | $1,999 | All engineering tracks + workshops + expo |
| Engineering | $1,499 | All engineering tracks + expo |
| Expo Explorer | $299 | Expo hall access only |

**Group discounts** (applied automatically):

| Quantity | Discount |
|----------|----------|
| 5+ tickets | 10% off |
| 10+ tickets | 15% off |
| 15+ tickets | 20% off |
| 30+ tickets | Email info@ai.engineer |

**Purchase:** &lt;https://app.ai.engineer/e/ai-engineer-worlds-fair-2026/portal&gt;

---

## Highlights

- Startup Battlefield on July 2nd
- 100+ expo partners throughout
- 10 engineering tracks per day + 2 Leadership Tracks on main days
- World Cup Quarterfinal VIP Suite (July 1, Levi's Stadium — invite only, sponsorships available)
- No afterparties July 1 &amp; 2 — side events encouraged

---

## For AI Agents

Open endpoints for building apps, agents, and tools on conference data.

- llms.md (this overview): https://ai.engineer/worldsfair/llms.md
- llms-full.md (every session + all speakers): https://ai.engineer/worldsfair/llms-full.md
- Sessions JSON: https://ai.engineer/worldsfair/sessions.json
- Speakers JSON: https://ai.engineer/worldsfair/speakers.json
- MCP Server: https://ai.engineer/worldsfair/mcp
- iCal Calendar: https://ai.engineer/worldsfair/calendar.ics

---

## Links

- **Website:** https://ai.engineer/worldsfair
- **Tickets:** &lt;https://app.ai.engineer/e/ai-engineer-worlds-fair-2026/portal&gt;
- **YouTube:** &lt;https://youtube.com/@aidotengineer&gt;
- **Twitter/X:** &lt;https://x.com/aiDotEngineer&gt;
- **LinkedIn:** &lt;https://www.linkedin.com/company/aidotengineer/&gt;
- **Newsletter:** &lt;https://ai.engineer/newsletter&gt;
- **NEO Sign-up:** &lt;https://luma.com/aie-neo-irl&gt;</pre>
    </div>
    <div class="doc" data-doc="1" data-slug="full-details" data-url="/worldsfair/2026/llms-full.md">
      <div class="doc-loading">Loading Full Details…</div>
      <div class="rendered" hidden></div>
      <pre class="raw-source" hidden></pre>
    </div>
  </main>

  <footer>
    <div class="footer-inner">
      <span>&copy; Software 3.0 Inc 2026</span>
      <div class="footer-links">
        <a href="/worldsfair">World&rsquo;s Fair</a>
        <a href="/europe/2026">Europe</a>
        <a href="https://ai.engineer/newsletter">Newsletter</a>
        <a href="https://github.com/aiDotEngineer">GitHub</a>
      </div>
    </div>
  </footer>

  <script>
    var activeDoc = 0;
    var activeFmt = 'rendered';

    function applyView() {
      var docs = document.querySelectorAll('.doc');
      docs.forEach(function (d) {
        d.classList.toggle('active', Number(d.dataset.doc) === activeDoc);
      });
      var active = document.querySelector('.doc.active');
      if (active) {
        var rendered = active.querySelector('.rendered');
        var raw = active.querySelector('.raw-source');
        if (rendered) rendered.toggleAttribute('hidden', activeFmt !== 'rendered');
        if (raw) raw.toggleAttribute('hidden', activeFmt !== 'raw');
      }
      document.querySelectorAll('button[data-doc]').forEach(function (b) {
        b.classList.toggle('active', Number(b.dataset.doc) === activeDoc);
      });
      document.querySelectorAll('button[data-fmt]').forEach(function (b) {
        b.classList.toggle('active', b.dataset.fmt === activeFmt);
      });
    }

    function setFmt(fmt) {
      activeFmt = fmt;
      applyView();
    }

    async function loadDoc(el) {
      if (el.dataset.loaded) return;
      el.dataset.loaded = '1';
      try {
        var res = await fetch(el.dataset.url, { headers: { Accept: 'text/html' } });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        var doc = new DOMParser().parseFromString(await res.text(), 'text/html');
        var rendered = doc.querySelector('.doc[data-doc="0"] .rendered') || doc.querySelector('.rendered');
        var raw = doc.querySelector('.doc[data-doc="0"] .raw-source') || doc.querySelector('.raw-source');
        el.querySelector('.rendered').innerHTML = rendered ? rendered.innerHTML : 'Failed to load.';
        el.querySelector('.raw-source').textContent = raw ? raw.textContent : '';
        var loading = el.querySelector('.doc-loading');
        if (loading) loading.remove();
      } catch (e) {
        el.dataset.loaded = '';
        var loading = el.querySelector('.doc-loading');
        if (loading) loading.textContent = 'Failed to load. Tap to retry.';
      }
    }

    function docIndexFromSlug(slug) {
      if (!slug) return null;
      var el = document.querySelector('.doc[data-slug="' + CSS.escape(slug) + '"]');
      return el ? Number(el.dataset.doc) : null;
    }

    function syncHash() {
      var el = document.querySelector('.doc[data-doc="' + activeDoc + '"]');
      var slug = el && el.dataset.slug;
      // Only the non-default tab carries a hash, so the canonical URL stays clean.
      var newHash = activeDoc === 0 ? '' : '#' + slug;
      if (newHash !== location.hash) {
        history.replaceState(null, '', newHash || location.pathname + location.search);
      }
    }

    async function setDoc(i, opts) {
      activeDoc = i;
      var el = document.querySelector('.doc[data-doc="' + i + '"]');
      if (el && el.dataset.url) await loadDoc(el);
      applyView();
      if (!opts || !opts.fromHash) syncHash();
    }

    window.addEventListener('hashchange', function () {
      var i = docIndexFromSlug(location.hash.replace(/^#/, ''));
      if (i != null && i !== activeDoc) setDoc(i, { fromHash: true });
    });

    var initial = docIndexFromSlug(location.hash.replace(/^#/, ''));
    if (initial != null && initial !== 0) {
      setDoc(initial, { fromHash: true });
    } else {
      applyView();
    }
  </script>
</body>
</html>