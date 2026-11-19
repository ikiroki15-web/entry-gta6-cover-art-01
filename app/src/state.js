// The cover's state: which photos are loaded, which layout and grade are
// picked, what the caption says, and how each panel frames its photo.
// Panels are rectangles in fractions of the cover (x, y, w, h); the gutter
// between them is drawn by the renderer, not stored here.

export const SIZES = {
  square: { label: 'Square 1080 x 1080', w: 1080, h: 1080 },
  portrait: { label: 'Portrait 1080 x 1350', w: 1080, h: 1350 },
  wide: { label: 'Wide 1920 x 1080', w: 1920, h: 1080 },
};

export const LAYOUTS = {
  hero3: {
    label: 'Hero + 3',
    panels: [
      { x: 0, y: 0, w: 0.62, h: 1 },
      { x: 0.62, y: 0, w: 0.38, h: 0.333 },
      { x: 0.62, y: 0.333, w: 0.38, h: 0.334 },
      { x: 0.62, y: 0.667, w: 0.38, h: 0.333 },
    ],
  },
  grid4: {
    label: 'Four Panel',
    panels: [
      { x: 0, y: 0, w: 0.5, h: 0.5 },
      { x: 0.5, y: 0, w: 0.5, h: 0.5 },
      { x: 0, y: 0.5, w: 0.5, h: 0.5 },
      { x: 0.5, y: 0.5, w: 0.5, h: 0.5 },
    ],
  },
  full: {
    label: 'Full Bleed',
    panels: [{ x: 0, y: 0, w: 1, h: 1 }],
  },
  nine: {
    label: 'Nine Panel',
    panels: [
      { x: 0, y: 0, w: 0.333, h: 0.333 },
      { x: 0.333, y: 0, w: 0.334, h: 0.333 },
      { x: 0.667, y: 0, w: 0.333, h: 0.333 },
      { x: 0, y: 0.333, w: 0.333, h: 0.334 },
      { x: 0.333, y: 0.333, w: 0.334, h: 0.334 },
      { x: 0.667, y: 0.333, w: 0.333, h: 0.334 },
      { x: 0, y: 0.667, w: 0.333, h: 0.333 },
      { x: 0.333, y: 0.667, w: 0.334, h: 0.333 },
      { x: 0.667, y: 0.667, w: 0.333, h: 0.333 },
    ],
  },
};

export const GRADES = {
  sunset: { label: 'Sunset', swatch: 'linear-gradient(135deg,#ff7a3c,#e83e8c)' },
  neon: { label: 'Neon Nights', swatch: 'linear-gradient(135deg,#ff2fb3,#19d3ff)' },
  golden: { label: 'Golden Hour', swatch: 'linear-gradient(135deg,#ffd166,#ff9e00)' },
  noir: { label: 'Noir', swatch: 'linear-gradient(135deg,#e8e8e8,#222)' },
};

// One framing per panel slot (the layouts use at most nine slots): which
// photo fills it, how far it is zoomed in, and how far it is panned.
function freshFraming() {
  return { photo: 0, zoom: 1, ox: 0, oy: 0 };
}

export function freshState() {
  return {
    size: 'wide',
    layout: 'hero3',
    grade: 'sunset',
    title: 'SUNSET HEIST',
    tagline: 'PALM BOULEVARD',
    captionPlace: 'bottom',
    photos: [], // { img, name }
    framings: Array.from({ length: 9 }, freshFraming),
    selected: 0,
  };
}

/** Panels of the state's current layout, as fraction rectangles. */
export function currentPanels(state) {
  return LAYOUTS[state.layout].panels;
}

/** The framing of the panel the user is editing right now. */
export function selectedFraming(state) {
  return state.framings[state.selected] ?? state.framings[0];
}

/** Clamps a framing's pan so the photo never leaves an empty gap behind. */
export function clampFraming(framing) {
  framing.zoom = Math.min(3, Math.max(1, framing.zoom));
  const reach = (framing.zoom - 1) / 2;
  framing.ox = Math.min(reach, Math.max(-reach, framing.ox));
  framing.oy = Math.min(reach, Math.max(-reach, framing.oy));
  return framing;
}
