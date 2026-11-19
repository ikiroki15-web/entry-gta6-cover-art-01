// Wires the editor: photos in, layout / grade / size picked, caption typed,
// panels clicked and dragged to frame each photo, and the cover exported
// as a PNG. A `?shot=` query hands control to ./shots.js instead, which
// sets up a fixed scene for a screenshot.

import { SIZES, LAYOUTS, GRADES, freshState, currentPanels, selectedFraming, clampFraming } from './state.js';
import { drawCover } from './render.js';
import { runShot } from './shots.js';

const state = freshState();
const canvas = document.getElementById('cover');
const status = document.getElementById('status');
const tray = document.getElementById('tray');
const zoom = document.getElementById('zoom');
const zoomOut = document.getElementById('zoomOut');
const panelLabel = document.getElementById('panelLabel');

let fontsReady = false;

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${url}`));
    img.src = url;
  });
}

/** Redraws the preview from the current state. */
export function redraw() {
  drawCover(canvas, state);
  panelLabel.textContent = `Panel ${state.selected + 1} of ${currentPanels(state).length}`;
  const framing = selectedFraming(state);
  zoom.value = String(framing.zoom);
  zoomOut.textContent = `${Math.round(framing.zoom * 100)}%`;
}

function say(text) {
  status.textContent = text;
}

/** Adds loaded photos to the tray; the first photo fills every panel. */
export async function addPhotos(files) {
  const fresh = [];
  for (const file of files) {
    try {
      const img = await loadImage(URL.createObjectURL(file));
      fresh.push({ img, name: file.name });
    } catch {
      say(`Could not read ${file.name}.`);
    }
  }
  if (!fresh.length) return;
  const firstNew = state.photos.length;
  state.photos.push(...fresh);
  if (firstNew === 0) {
    for (const framing of state.framings) framing.photo = 0;
  }
  buildTray();
  redraw();
  say(`${state.photos.length} photo${state.photos.length === 1 ? '' : 's'} loaded. Click a photo, then a panel, to place it.`);
}

/** Loads one of the bundled sample photos (made for this app, free to use). */
export async function addSample(name) {
  try {
    const img = await loadImage(`samples/${name}.jpg`);
    state.photos.push({ img, name: `${name}.jpg` });
    if (state.photos.length === 1) {
      for (const framing of state.framings) framing.photo = 0;
    }
    buildTray();
    redraw();
    say(`Sample ${name} loaded.`);
  } catch {
    say(`Could not load sample ${name}.`);
  }
}

/** Rebuilds the photo tray thumbnails from the loaded photos. */
function buildTray() {
  tray.innerHTML = '';
  state.photos.forEach((photo, i) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'thumb';
    button.title = photo.name;
    const thumb = document.createElement('img');
    thumb.src = photo.img.src;
    thumb.alt = photo.name;
    button.appendChild(thumb);
    button.addEventListener('click', () => {
      selectedFraming(state).photo = i;
      buildTray();
      redraw();
      say(`Photo ${i + 1} placed in panel ${state.selected + 1}.`);
    });
    tray.appendChild(button);
  });
  if (!state.photos.length) {
    const hint = document.createElement('p');
    hint.className = 'tray-hint';
    hint.textContent = 'No photos yet — upload your own or try a sample below.';
    tray.appendChild(hint);
  }
}

/** Builds a row of picker buttons from a definition map. */
function buildPicker(container, entries, current, onPick) {
  container.innerHTML = '';
  for (const [key, def] of Object.entries(entries)) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'pick';
    button.dataset.key = key;
    button.textContent = def.label;
    if (def.swatch) button.style.setProperty('--swatch', def.swatch);
    if (key === current) button.classList.add('on');
    button.addEventListener('click', () => {
      onPick(key);
      container.querySelectorAll('.pick').forEach((b) => b.classList.remove('on'));
      button.classList.add('on');
    });
    container.appendChild(button);
  }
}

function buildPickers() {
  buildPicker(document.getElementById('layouts'), LAYOUTS, state.layout, (key) => {
    state.layout = key;
    state.selected = 0;
    redraw();
  });
  buildPicker(document.getElementById('grades'), GRADES, state.grade, (key) => {
    state.grade = key;
    redraw();
  });
  buildPicker(document.getElementById('sizes'), SIZES, state.size, (key) => {
    state.size = key;
    redraw();
  });
}

/** Re-marks the picker buttons from the state (a shot scene may set it). */
function syncPickers() {
  const mark = (id, current) => {
    document.getElementById(id).querySelectorAll('.pick').forEach((b) => {
      b.classList.toggle('on', b.dataset.key === current);
    });
  };
  mark('layouts', state.layout);
  mark('grades', state.grade);
  mark('sizes', state.size);
}

/** Which panel (if any) sits under a point on the preview canvas. */
function panelAt(clientX, clientY) {
  const box = canvas.getBoundingClientRect();
  const fx = (clientX - box.left) / box.width;
  const fy = (clientY - box.top) / box.height;
  const panels = currentPanels(state);
  for (let i = 0; i < panels.length; i++) {
    const p = panels[i];
    if (fx >= p.x && fx < p.x + p.w && fy >= p.y && fy < p.y + p.h) return i;
  }
  return -1;
}

/** Drag on the canvas: click picks a panel, dragging pans its photo. */
function wireCanvas() {
  let dragging = false;
  let lastX = 0;
  let lastY = 0;

  canvas.addEventListener('pointerdown', (e) => {
    const i = panelAt(e.clientX, e.clientY);
    if (i < 0) return;
    state.selected = i;
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    canvas.setPointerCapture(e.pointerId);
    redraw();
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const box = canvas.getBoundingClientRect();
    const panels = currentPanels(state);
    const p = panels[state.selected];
    const framing = selectedFraming(state);
    framing.ox += (e.clientX - lastX) / box.width / p.w;
    framing.oy += (e.clientY - lastY) / box.height / p.h;
    clampFraming(framing);
    lastX = e.clientX;
    lastY = e.clientY;
    redraw();
  });
  const stop = () => { dragging = false; };
  canvas.addEventListener('pointerup', stop);
  canvas.addEventListener('pointercancel', stop);
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const framing = selectedFraming(state);
    framing.zoom *= e.deltaY < 0 ? 1.08 : 1 / 1.08;
    clampFraming(framing);
    redraw();
  }, { passive: false });
}

/** Renders the cover at full export size and downloads it as a PNG. */
export function exportPng() {
  const off = document.createElement('canvas');
  drawCover(off, state);
  const size = SIZES[state.size];
  off.toBlob((blob) => {
    if (!blob) {
      say('Export failed — the browser could not make the PNG.');
      return;
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `cover-${size.w}x${size.h}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    say(`Saved cover-${size.w}x${size.h}.png (${Math.round(blob.size / 1024)} KiB).`);
  }, 'image/png');
}

function wireControls() {
  document.getElementById('upload').addEventListener('change', (e) => {
    addPhotos([...e.target.files]);
    e.target.value = '';
  });
  document.querySelectorAll('[data-sample]').forEach((button) => {
    button.addEventListener('click', () => addSample(button.dataset.sample));
  });
  document.getElementById('title').addEventListener('input', (e) => {
    state.title = e.target.value;
    redraw();
  });
  document.getElementById('tagline').addEventListener('input', (e) => {
    state.tagline = e.target.value;
    redraw();
  });
  document.getElementById('place').addEventListener('change', (e) => {
    state.captionPlace = e.target.value;
    redraw();
  });
  zoom.addEventListener('input', () => {
    selectedFraming(state).zoom = Number(zoom.value);
    clampFraming(selectedFraming(state));
    redraw();
  });
  document.getElementById('centre').addEventListener('click', () => {
    const framing = selectedFraming(state);
    framing.ox = 0;
    framing.oy = 0;
    framing.zoom = 1;
    redraw();
    say(`Panel ${state.selected + 1} centred.`);
  });
  document.getElementById('export').addEventListener('click', exportPng);
  wireCanvas();
}

/** Draws once the poster font is in, so the caption never falls back. */
async function boot() {
  buildPickers();
  buildTray();
  wireControls();
  try {
    await document.fonts.load('100px Anton');
    await document.fonts.ready;
    fontsReady = true;
  } catch {
    fontsReady = false;
  }
  const query = new URLSearchParams(location.search);
  if (query.get('shot')) {
    await runShot(query, state, { loadImage, addSample, redraw });
    syncPickers();
  }
  redraw();
  window.__posterReady = () => fontsReady;
}

boot();
