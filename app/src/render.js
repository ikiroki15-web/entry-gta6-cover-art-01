// Draws the cover onto a 2D canvas context at the context's own pixel size:
// the photos in their panels, the colour grade, the frame, and the bold
// poster caption. Every size the app exports goes through this one function,
// so the preview and the PNG are the same drawing.

import { SIZES, currentPanels, clampFraming } from './state.js';

const GUTTER = 0.012; // white gap between panels, as a fraction of the width
const FRAME = 0.018; // white frame around the whole cover, same unit
const INK = '#160a24'; // near-black violet used for outlines and the frame text

/** Draws the whole cover for `state` onto `canvas` (resized to the size). */
export function drawCover(canvas, state) {
  const size = SIZES[state.size];
  canvas.width = size.w;
  canvas.height = size.h;
  const ctx = canvas.getContext('2d');
  const w = size.w;
  const h = size.h;

  ctx.fillStyle = '#f5efe8';
  ctx.fillRect(0, 0, w, h);

  const panels = currentPanels(state);
  const gap = w * GUTTER;
  for (let i = 0; i < panels.length; i++) {
    const p = panels[i];
    const framing = clampFraming(state.framings[i]);
    const px = p.x * w + gap / 2;
    const py = p.y * h + gap / 2;
    const pw = p.w * w - gap;
    const ph = p.h * h - gap;
    drawPanel(ctx, state, framing, px, py, pw, ph);
  }

  paintGrade(ctx, state.grade, w, h);
  drawFrame(ctx, w, h);
  drawCaption(ctx, state, w, h);
}

/** One photo, cover-fitted into its panel rect, zoomed and panned. */
function drawPanel(ctx, state, framing, px, py, pw, ph) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(px, py, pw, ph);
  ctx.clip();

  const photo = state.photos[framing.photo];
  if (photo && photo.img) {
    const img = photo.img;
    const base = Math.max(pw / img.naturalWidth, ph / img.naturalHeight);
    const scale = base * framing.zoom;
    const dw = img.naturalWidth * scale;
    const dh = img.naturalHeight * scale;
    const dx = px + (pw - dw) / 2 + framing.ox * pw;
    const dy = py + (ph - dh) / 2 + framing.oy * ph;
    ctx.drawImage(img, dx, dy, dw, dh);
  } else {
    paintEmptyPanel(ctx, px, py, pw, ph);
  }
  ctx.restore();

  // Thin inner edge so panels read as separate shots.
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = Math.max(2, pw * 0.004);
  ctx.strokeRect(px, py, pw, ph);
}

/** The placeholder a panel shows before any photo is loaded. */
function paintEmptyPanel(ctx, px, py, pw, ph) {
  const g = ctx.createLinearGradient(px, py, px + pw, py + ph);
  g.addColorStop(0, '#3a2350');
  g.addColorStop(1, '#12081d');
  ctx.fillStyle = g;
  ctx.fillRect(px, py, pw, ph);
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.font = `700 ${Math.max(14, ph * 0.07)}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('ADD A PHOTO', px + pw / 2, py + ph / 2);
  ctx.textBaseline = 'alphabetic';
}

/** The colour grade: a wash of light and colour over the whole cover. */
function paintGrade(ctx, grade, w, h) {
  ctx.save();
  if (grade === 'sunset') {
    const g = ctx.createLinearGradient(0, h * 0.3, 0, h);
    g.addColorStop(0, 'rgba(255,122,60,0)');
    g.addColorStop(0.65, 'rgba(255,110,80,0.22)');
    g.addColorStop(1, 'rgba(232,62,140,0.5)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    const top = ctx.createLinearGradient(0, 0, 0, h * 0.25);
    top.addColorStop(0, 'rgba(255,190,80,0.28)');
    top.addColorStop(1, 'rgba(255,190,80,0)');
    ctx.fillStyle = top;
    ctx.fillRect(0, 0, w, h * 0.25);
  } else if (grade === 'neon') {
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, 'rgba(255,47,179,0.30)');
    g.addColorStop(0.5, 'rgba(120,40,220,0.12)');
    g.addColorStop(1, 'rgba(25,211,255,0.30)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  } else if (grade === 'golden') {
    const glow = ctx.createRadialGradient(w * 0.5, 0, 0, w * 0.5, 0, w * 0.9);
    glow.addColorStop(0, 'rgba(255,214,102,0.42)');
    glow.addColorStop(1, 'rgba(255,214,102,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);
    const g = ctx.createLinearGradient(0, h * 0.55, 0, h);
    g.addColorStop(0, 'rgba(255,158,0,0)');
    g.addColorStop(1, 'rgba(255,140,0,0.38)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  } else if (grade === 'noir') {
    ctx.globalCompositeOperation = 'saturation';
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'source-over';
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, 'rgba(10,10,30,0.12)');
    g.addColorStop(1, 'rgba(10,10,30,0.42)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }
  // A soft vignette pulls the eye to the middle in every grade.
  const v = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.42, w / 2, h / 2, Math.max(w, h) * 0.75);
  v.addColorStop(0, 'rgba(0,0,0,0)');
  v.addColorStop(1, 'rgba(0,0,0,0.28)');
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

/** The white poster frame and a small corner mark. */
function drawFrame(ctx, w, h) {
  const f = w * FRAME;
  ctx.strokeStyle = '#f5efe8';
  ctx.lineWidth = f;
  ctx.strokeRect(f / 2, f / 2, w - f, h - f);
  ctx.fillStyle = INK;
  ctx.font = `700 ${Math.max(12, w * 0.011)}px system-ui, sans-serif`;
  ctx.textAlign = 'left';
  ctx.fillText('POSTER STUDIO', f * 1.6, f * 1.9);
  ctx.textAlign = 'right';
  ctx.fillText('EST. 2026', w - f * 1.6, f * 1.9);
}

/** The big poster caption: title in Anton with a dark outline, tagline under it. */
function drawCaption(ctx, state, w, h) {
  const title = state.title.trim().toUpperCase();
  const tagline = state.tagline.trim().toUpperCase();
  if (!title && !tagline) return;

  const f = w * FRAME;
  const bandH = h * 0.24;
  const bandY = state.captionPlace === 'top' ? f : h - f - bandH;
  const cx = w / 2;

  ctx.save();
  ctx.translate(cx, bandY + bandH / 2);
  ctx.rotate(-0.02); // a slight poster tilt
  ctx.translate(-cx, -(bandY + bandH / 2));

  if (title) {
    let size = h * 0.115;
    ctx.font = `${size}px Anton, 'Arial Black', sans-serif`;
    while (ctx.measureText(title).width > w * 0.88 && size > 16) {
      size -= 2;
      ctx.font = `${size}px Anton, 'Arial Black', sans-serif`;
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = INK;
    ctx.lineWidth = size * 0.16;
    ctx.shadowColor = 'rgba(0,0,0,0.45)';
    ctx.shadowBlur = size * 0.14;
    ctx.shadowOffsetY = size * 0.05;
    const ty = bandY + bandH * 0.42;
    ctx.strokeText(title, cx, ty);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(title, cx, ty);
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
  }

  if (tagline) {
    const spaced = tagline.split('').join('  ');
    let size = h * 0.032;
    ctx.font = `700 ${size}px system-ui, sans-serif`;
    while (ctx.measureText(spaced).width > w * 0.8 && size > 10) {
      size -= 1;
      ctx.font = `700 ${size}px system-ui, sans-serif`;
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = INK;
    ctx.lineWidth = size * 0.22;
    const yy = bandY + bandH * (title ? 0.8 : 0.5);
    ctx.strokeText(spaced, cx, yy);
    ctx.fillStyle = '#ffd166';
    ctx.fillText(spaced, cx, yy);
  }
  ctx.restore();
}
