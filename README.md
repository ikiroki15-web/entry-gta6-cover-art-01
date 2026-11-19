# Poster Studio — GTA-style cover maker

Turn your own photos into a multi-panel poster cover, in the style of a
GTA 6 poster, and export it as a PNG to share.

## What it does

- **Your photos:** upload one or several from your machine (nothing is
  uploaded anywhere — photos are read locally), or try the two bundled
  samples. Click a photo, then click a panel, to place it.
- **Crop and position:** click a panel to select it, drag it to pan the
  photo, scroll over it (or use the zoom slider) to zoom in, centre it
  again with one button.
- **Layouts:** Hero + 3, Four Panel, Full Bleed, and Nine Panel — fill
  several panels with one photo or several.
- **Colour grades:** Sunset, Neon Nights, Golden Hour, and Noir.
- **Caption:** a bold poster title (Anton, SIL Open Font License — see
  `app/fonts/OFL.txt`) with a dark outline and a slight tilt, plus a
  spaced tagline, top or bottom.
- **Export sizes:** 1080 × 1080, 1080 × 1350, and 1920 × 1080, as PNG.

## Run it

```sh
node serve.ts
```

then open http://localhost:8080. No build step, no network request: every
file the page loads lives under `app/`.

## Files

- `app/index.html`, `app/style.css` — the editor page.
- `app/src/app.js` — wiring: upload, tray, pickers, drag-to-pan, export.
- `app/src/state.js` — sizes, layouts, grades, and the cover's state.
- `app/src/render.js` — the one drawing function: panels, grade, frame,
  caption. Preview and export are the same drawing.
- `app/src/shots.js` — fixed scenes for screenshots (`?shot=cover` /
  `?shot=editor`).
- `app/fonts/Anton-Regular.ttf` — Anton by the Anton Project Authors,
  SIL Open Font License 1.1 (`app/fonts/OFL.txt`).
- `app/samples/` — two photos made with an image model for make.fun,
  free to use.
- `main.ts` — hands the entry in: copies `app/` and `screenshots/` to
  `/output` and writes `dossier.json`.
- `shots.json` — the screenshot scenes.

Original work — no Rockstar Games logo, wordmark, artwork, or font.
