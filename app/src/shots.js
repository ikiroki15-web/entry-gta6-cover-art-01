// Fixed scenes for screenshots: ?shot=cover shows the cover alone, filling
// the viewport; ?shot=editor shows the editor with photos loaded. The query
// picks the scene: layout, grade, size, title, tagline and photos (sample
// names, comma separated). window.__shotReady is set once it has painted.

import { LAYOUTS, GRADES, SIZES } from './state.js';

/** Sets up the scene named by `query` and paints it. */
export async function runShot(query, state, api) {
  const shot = query.get('shot');
  if (shot === 'cover') document.body.classList.add('shot-cover');

  const layout = query.get('layout');
  if (layout && LAYOUTS[layout]) state.layout = layout;
  const grade = query.get('grade');
  if (grade && GRADES[grade]) state.grade = grade;
  const size = query.get('size');
  if (size && SIZES[size]) state.size = size;
  if (query.get('title') !== null) {
    state.title = query.get('title');
    const titleInput = document.getElementById('title');
    if (titleInput) titleInput.value = state.title;
  }
  if (query.get('tagline') !== null) {
    state.tagline = query.get('tagline');
    const tagInput = document.getElementById('tagline');
    if (tagInput) tagInput.value = state.tagline;
  }

  // Load the named samples, then spread them across the panels in turn so
  // a multi-panel cover shows more than one photo.
  const names = (query.get('photos') ?? query.get('photo') ?? 'pier').split(',').filter(Boolean);
  for (const name of names) {
    await api.addSample(name.trim());
  }
  const panels = state.framings;
  for (let i = 0; i < panels.length; i++) {
    panels[i].photo = i % Math.max(1, state.photos.length);
  }
  const zoom = Number(query.get('zoom') ?? '1');
  if (Number.isFinite(zoom) && zoom >= 1) {
    for (const framing of panels) framing.zoom = zoom;
  }

  api.redraw();
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  window.__shotReady = true;
}
