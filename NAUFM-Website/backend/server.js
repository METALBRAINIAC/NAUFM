/**
 * NAU FM — Charts Backend
 * ------------------------------------------------------------
 * Scrapes the three public chart websites NAU FM tracks and
 * exposes their current Top 10 (rank, song, artist, album art)
 * as simple JSON the website's frontend can fetch.
 *
 * Why a backend is needed at all:
 * Browsers cannot fetch these chart pages directly from client-side
 * JavaScript (CORS blocks it, and none of the three sites publish a
 * public API). This small server fetches the pages instead, parses
 * out the Top 10, caches the result, and serves it over a simple
 * REST API with CORS enabled so the NAU FM website can call it.
 *
 * IMPORTANT — scraping is inherently fragile:
 * These are NOT official APIs. Each site can change its HTML at any
 * time, which will break the selectors below. Each scraper function
 * is written defensively (falls back to the last good cache instead
 * of crashing), but expect to revisit the selectors occasionally —
 * search each function for "SELECTOR" comments if a chart stops
 * updating.
 *
 * Endpoints:
 *   GET /api/charts/aria   -> ARIA Top 10 (Australia)
 *   GET /api/charts/uk     -> UK Official Charts Top 10
 *   GET /api/charts/nz     -> Aotearoa (NZ) Charts Top 10
 *   GET /api/charts/all    -> all three, combined
 *   GET /health            -> simple uptime check
 */

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
app.use(cors()); // allow the NAU FM site (any origin) to call this API

const PORT = process.env.PORT || 3001;

// How long to trust a scraped result before re-fetching (ms).
// Charts update weekly, but we re-check periodically in case of a
// mid-week correction. 30 minutes is a reasonable, polite default —
// don't set this too low, or you'll hammer the source sites.
const CACHE_TTL_MS = 30 * 60 * 1000;

const cache = {
  aria: { data: null, fetchedAt: 0 },
  uk: { data: null, fetchedAt: 0 },
  nz: { data: null, fetchedAt: 0 }
};

const HEADERS = {
  // A normal browser User-Agent avoids some basic bot-blocking.
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'
};

// ---------------------------------------------------------------
// ARIA Top 50 Singles (Australia) — https://www.aria.com.au/charts/singles-chart
// ---------------------------------------------------------------
async function scrapeAria() {
  const url = 'https://www.aria.com.au/charts/singles-chart';
  const { data: html } = await axios.get(url, { headers: HEADERS, timeout: 15000 });
  const $ = cheerio.load(html);

  const tracks = [];

  // SELECTOR NOTE: ARIA renders each chart row as a list item containing
  // a rank number, a song title link, an artist name, and a cover image
  // (hosted on cdn.aria.com.au/coverart/...). We select on the chart
  // list container and pull the pieces out of each row. If ARIA changes
  // their markup, re-inspect the page (View Source) and update this.
  $('.chart-list li, .chart-item, li').each((i, el) => {
    if (tracks.length >= 10) return;
    const $el = $(el);
    const img = $el.find('img').first();
    const art = img.attr('src') || img.attr('data-src') || '';
    // Only treat this as a chart row if it actually has ARIA cover art
    if (!art.includes('cdn.aria.com.au/coverart')) return;

    const song = $el.find('h3, .track-title, .title').first().text().trim()
      || $el.find('a').first().text().trim();
    const artist = $el.find('.artist, .track-artist, p').first().text().trim();

    if (song) {
      tracks.push({
        rank: tracks.length + 1,
        song,
        artist: artist || 'Unknown Artist',
        art
      });
    }
  });

  return tracks.slice(0, 10);
}

// ---------------------------------------------------------------
// UK Official Singles Chart Top 100 — https://www.officialcharts.com/charts/singles-chart/
// ---------------------------------------------------------------
async function scrapeUk() {
  const url = 'https://www.officialcharts.com/charts/singles-chart/';
  const { data: html } = await axios.get(url, { headers: HEADERS, timeout: 15000 });
  const $ = cheerio.load(html);

  const tracks = [];

  // SELECTOR NOTE: Official Charts renders each entry as a chart-item
  // block containing a "Number N" label, a cover image (two sizes —
  // we want the larger "_medium" one), a song title link, and an
  // artist link. Re-check officialcharts.com's markup if this breaks.
  $('.chart-item, .chart-content li, article').each((i, el) => {
    if (tracks.length >= 10) return;
    const $el = $(el);
    const imgs = $el.find('img');
    // prefer the larger artwork image if two sizes are present
    let art = '';
    imgs.each((j, imgEl) => {
      const src = $(imgEl).attr('src') || '';
      if (src.includes('artwork_medium') || (!art && src)) art = src;
    });
    if (!art) return;

    const song = $el.find('a[href*="/songs/"]').first().text().trim();
    const artist = $el.find('a[href*="/artist/"]').first().text().trim();

    if (song) {
      tracks.push({
        rank: tracks.length + 1,
        song,
        artist: artist || 'Unknown Artist',
        art
      });
    }
  });

  return tracks.slice(0, 10);
}

// ---------------------------------------------------------------
// Aotearoa (NZ) Official Top 40 Singles — https://aotearoamusiccharts.co.nz/charts/singles
// ---------------------------------------------------------------
async function scrapeNz() {
  const url = 'https://aotearoamusiccharts.co.nz/charts/singles';
  const { data: html } = await axios.get(url, { headers: HEADERS, timeout: 15000 });
  const $ = cheerio.load(html);

  const tracks = [];

  // SELECTOR NOTE: Aotearoa Music Charts hosts cover art at
  // aotearoamusiccharts.co.nz/images/covers/..., each paired with a
  // rank number, song title, and "Song - Artist" text nearby. Re-check
  // the site's markup if this stops matching.
  $('img[src*="/images/covers/"]').each((i, imgEl) => {
    if (tracks.length >= 10) return;
    const $img = $(imgEl);
    const art = $img.attr('src') || '';
    // The surrounding block usually contains the title/artist text
    const $row = $img.closest('div, li, article');
    const text = $row.text().replace(/\s+/g, ' ').trim();
    // Text often looks like "1 Choosin' Texas Choosin' Texas - Ella Langley ..."
    const match = text.match(/([^-]+)-\s*([^\d]+?)(?:Last week|Peak|$)/);
    let song = '';
    let artist = '';
    if (match) {
      song = match[1].trim();
      artist = match[2].trim();
    }
    if (art && song) {
      tracks.push({ rank: tracks.length + 1, song, artist: artist || 'Unknown Artist', art });
    }
  });

  return tracks.slice(0, 10);
}

// ---------------------------------------------------------------
// Cache + fetch helper shared by all three charts
// ---------------------------------------------------------------
async function getChart(key, scrapeFn) {
  const entry = cache[key];
  const isStale = Date.now() - entry.fetchedAt > CACHE_TTL_MS;

  if (!isStale && entry.data) return entry.data;

  try {
    const tracks = await scrapeFn();
    if (tracks.length) {
      entry.data = tracks;
      entry.fetchedAt = Date.now();
    }
  } catch (err) {
    console.error(`[${key}] scrape failed:`, err.message);
    // fall through — we'll return whatever's cached (even if stale)
  }

  return entry.data || [];
}

// ---------------------------------------------------------------
// Routes
// ---------------------------------------------------------------
app.get('/health', (req, res) => res.json({ ok: true }));

app.get('/api/charts/aria', async (req, res) => {
  res.json({ chart: 'aria', tracks: await getChart('aria', scrapeAria) });
});

app.get('/api/charts/uk', async (req, res) => {
  res.json({ chart: 'uk', tracks: await getChart('uk', scrapeUk) });
});

app.get('/api/charts/nz', async (req, res) => {
  res.json({ chart: 'nz', tracks: await getChart('nz', scrapeNz) });
});

app.get('/api/charts/all', async (req, res) => {
  const [aria, uk, nz] = await Promise.all([
    getChart('aria', scrapeAria),
    getChart('uk', scrapeUk),
    getChart('nz', scrapeNz)
  ]);
  res.json({ aria, uk, nz, updatedAt: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`NAU FM charts backend running on port ${PORT}`);
});
