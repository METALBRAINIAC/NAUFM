# NAU FM Charts Backend

A small backend service that scrapes three public music chart
websites and serves their current Top 10 (song, artist, album art)
as JSON — because browsers can't fetch these sites directly from
client-side JavaScript.

## What it does

- `GET /api/charts/aria` → ARIA Top 10 (Australia)
- `GET /api/charts/uk` → UK Official Charts Top 10
- `GET /api/charts/nz` → Aotearoa (NZ) Charts Top 10
- `GET /api/charts/all` → all three at once
- `GET /health` → uptime check

Results are cached for 30 minutes per chart (see `CACHE_TTL_MS` in
`server.js`) so the source sites aren't hit on every page load.

## Running it locally

```bash
npm install
npm start
```

Then visit `http://localhost:3001/api/charts/all` in a browser to
confirm it's returning data.

## Deploying it (so the live website can reach it)

Any Node hosting service works. Two easy free-tier options:

### Option A — Render.com
1. Push this folder to a GitHub repo.
2. On Render, click **New Web Service**, connect the repo.
3. Build command: `npm install`
4. Start command: `npm start`
5. Once deployed, Render gives you a URL like
   `https://naufm-charts-backend.onrender.com`.

### Option B — Railway.app
1. Push this folder to a GitHub repo.
2. On Railway, **New Project → Deploy from GitHub repo**.
3. Railway auto-detects Node and runs `npm start`.
4. It gives you a public URL similar to the above.

## Wiring it into the website

In `naufm.html`, find this line near the top of the `CHARTS`
JavaScript section:

```js
const CHARTS_API_BASE = ''; // <-- set this to your deployed backend URL
```

Set it to your deployed URL, e.g.:

```js
const CHARTS_API_BASE = 'https://naufm-charts-backend.onrender.com';
```

Once set, the site will call `${CHARTS_API_BASE}/api/charts/all` on
load and refresh every few minutes, replacing the placeholder sample
data with live results.

## A note on reliability

These three sites don't offer public APIs, so this service works by
parsing their page HTML (web scraping). That means:

- It can break if any of the three sites redesigns their chart page.
  If a chart stops updating, open `server.js` and look for the
  `SELECTOR NOTE` comments in `scrapeAria`, `scrapeUk`, or `scrapeNz`
  — you'll likely need to adjust the CSS selectors to match the
  site's current markup.
- Please keep the cache TTL reasonable (30+ minutes) so this doesn't
  hammer the source sites with requests.
- This is intended for a single internal use case (populating NAU
  FM's own website) — it isn't built to handle heavy public traffic.
