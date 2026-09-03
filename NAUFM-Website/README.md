# NAU FM Website

This is the full project folder for the NAU FM online radio website.

## Folder structure

```
NAUFM-Website/
├── index.html          <- the website itself (Home / About Us / Team tabs)
├── Team Photos/         <- individual host profile photos (Team tab)
├── Home Photos/         <- crew slideshow photos (Home tab)
└── backend/             <- optional live charts backend (see its README)
    ├── server.js
    ├── package.json
    └── README.md
```

## Why the file is named `index.html`

Web servers and GitHub Pages automatically look for a file named
exactly `index.html` and load it as the homepage when someone visits
your site's root URL. If it were named anything else (like
`naufm.html`), visitors would need to type the full filename in the
URL to see the site. Keep this name as-is.

## How the photos work now

Both photo folders sit right next to `index.html`, and the code
references them with simple relative paths — no GitHub links, branch
names, or commit SHAs needed. As long as `index.html` and both photo
folders stay together (same repo, same folder level), everything
just works, including once it's live online.

- **Team Photos/** — see that folder's README for the exact filenames
  needed (must match each host's name).
- **Home Photos/** — see that folder's README for the slideshow
  filenames.

## What's already working out of the box

- The Nau FM logo — embedded directly in the file, no separate file needed.
- The live radio stream, volume/mute controls, and listening timer.
- The Top 10/Top 20 world charts (ARIA, UK, Aotearoa) — currently
  running on real sample data captured at build time.
- On-air glow on whichever show is currently broadcasting.

## What still needs your input

1. **Team Photos/ and Home Photos/** — add the actual image files
   (see each folder's README for exact filenames expected).
2. **Charts backend** (optional, for the charts to auto-update) —
   deploy the `backend/` folder (instructions inside), then set
   `CHARTS_API_BASE` near the top of the chart script in `index.html`
   to your deployed backend's URL.
3. **Social media links** — the Facebook/Instagram/TikTok/YouTube
   buttons on the Home tab still use placeholder `href="#"` links.
   Search for `social-btn` in `index.html` and swap in your real URLs.

## Note: the About Us cutout photo was removed

An earlier version of this site had a team cutout photo above the
stats blocks on the About Us tab, with a scroll effect. That's been
fully removed (markup, styling, and script) per your request — the
About Us tab is back to just the frequency banner and stats blocks.

## Uploading to GitHub

1. Delete the old files currently in your repo.
2. Upload everything **inside** this `NAUFM-Website` folder to the
   **root** of your repo — `index.html`, `Team Photos/`,
   `Home Photos/`, and `backend/` should all sit directly in the repo
   root, not nested inside another folder.
3. If using GitHub Pages: repo **Settings → Pages → Deploy from
   branch**, pick your branch (usually `main`) and root folder, save.
   GitHub will give you a live URL a minute or two later.
4. The `backend/` folder is a separate Node service — it does not
   need to go on GitHub Pages (which only serves static files). Deploy
   it separately (Render, Railway, etc.) per its own README, since
   Pages can't run a Node server.
