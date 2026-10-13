'use strict';
/* ==========================================================================
   vga.js - mode 13h: video memory at A000:0000 (TheRealScreen), the DAC
   palette, and the presenter that turns them into pixels on a 4x canvas.

   The play window (the left 220x200 of the screen while walking) is also
   kept as a "scene": the list of tiles and sprites DrawGridFs blitted, with
   their positions.  The presenter redraws that window from the last two
   scenes at quarter-pixel positions interpolated to the display's own frame
   time, so scrolling is smooth on any monitor while the game itself still
   steps exactly once per 70 Hz retrace.  Anything else that writes into the
   window (a text box, a menu, a fade to another screen) invalidates the
   scene and the presenter falls back to the plain framebuffer.
   ========================================================================== */

const VGA = {
  mem: new Uint8Array(64000),       // TheRealScreen^ (A000:0000)
  dac: new Uint8Array(768),         // 6-bit DAC registers
  textMode: true,
  realGen: 0,                       // bumps whenever the play window is overwritten
  scenes: [],                       // last committed scenes, newest last
  building: null,                   // scene being recorded by DrawGridFs
  canvas: null, ctx: null,
  img: null, img32: null,
  big: null, big32: null,           // 880x800 play window at 4x
  lut: new Uint32Array(256),
};

/* graphics.ASetRGBPalette: out 3C8h/3C9h - the DAC keeps 6 bits */
function ASetRGBPalette(c, r, g, b) {
  c &= 255;
  VGA.dac[c * 3] = r & 63; VGA.dac[c * 3 + 1] = g & 63; VGA.dac[c * 3 + 2] = b & 63;
}
/* graphics.GetRgbPalette: returns [r,g,b] */
function GetRgbPalette(c) {
  c &= 255;
  return [VGA.dac[c * 3], VGA.dac[c * 3 + 1], VGA.dac[c * 3 + 2]];
}

/* graphics.SetVideoMode */
function SetVideoMode(mode) {
  VGA.textMode = (mode !== 0x13);
  if (mode === 0x13) {
    VGA.mem.fill(0);
    vgaDefaultPalette();
  } else vgaTextPalette();
  VGA.realGen++;
}

/* The BIOS loads the default 256-colour palette on a mode set; only the
   first 16 entries ever show here before the game sets its own. */
function vgaDefaultPalette() {
  const ega = [0,0,0, 0,0,42, 0,42,0, 0,42,42, 42,0,0, 42,0,42, 42,21,0, 42,42,42,
    21,21,21, 21,21,63, 21,63,21, 21,63,63, 63,21,21, 63,21,63, 63,63,21, 63,63,63];
  VGA.dac.fill(0);
  VGA.dac.set(ega, 0);
}

/* The BIOS's text-mode DAC: the 64 EGA colours (rgbRGB bits). */
function vgaTextPalette() {
  VGA.dac.fill(0);
  for (let i = 0; i < 64; i++)
    ASetRGBPalette(i, ((i >> 2) & 1) * 42 + ((i >> 5) & 1) * 21,
      ((i >> 1) & 1) * 42 + ((i >> 4) & 1) * 21, (i & 1) * 42 + ((i >> 3) & 1) * 21);
}

/* Called by anything that writes the play window of video memory other
   than PushSmallScreenFs. */
function vgaDirty() { VGA.realGen++; }

/* --- scene recording (used by DrawGridFs / PushSmallScreenFs) ---
   A scene keeps the camera (the world pixel at buffer 0,0), every blit
   DrawGridFs made, and a copy of the map drawn one tile wider all round, so
   a slightly shifted view never shows unpainted buffer. */
function sceneBegin(v) {
  VGA.building = { ops: [], t: 0, gen: 0, v,
    camX: v.firstX * 20 - v.startX, camY: v.firstY * 20 - v.startY };
}
function sceneOp(key, x, y, bmp, trans, rows) {
  if (VGA.building) VGA.building.ops.push({ key, x, y, bmp, trans, rows });
}
const EXT_W = 300, EXT_H = 280;     // the 260-wide buffer plus 20 all round
function sceneExtBlit(buf, x, y, bmp, trans, rows) {
  for (let r = 0; r < rows; r++) {
    const yy = y + r;
    if (yy < 0 || yy >= EXT_H) continue;
    for (let c = 0; c < 20; c++) {
      const xx = x + c;
      if (xx < 0 || xx >= EXT_W) continue;
      const val = bmp[r * 20 + c];
      if (trans && val === 0) continue;
      buf[yy * EXT_W + xx] = val;
    }
  }
}
function sceneCommit() {
  const s = VGA.building;
  VGA.building = null;
  if (!s) return;
  s.t = SYS.vt;
  s.gen = VGA.realGen;
  s.map = (typeof GlobalStats !== 'undefined' && GlobalStats) ? GlobalStats.map : -1;
  // the world layer: a ring of tiles, then the tiles and chests as drawn
  const buf = new Uint8Array(EXT_W * EXT_H);
  const v = s.v;
  for (let c1 = -1; c1 <= v.lastX + 1; c1++)
    for (let c2 = -1; c2 <= v.lastY + 1; c2++) {
      const t = MapTiles[owmBack(c1 + v.firstX, c2 + v.firstY)];
      if (t) sceneExtBlit(buf, c1 * 20 + v.startX + 20, c2 * 20 + v.startY + 20, t, false, 20);
    }
  s.sprites = [];
  for (const op of s.ops) {
    if (op.key && (op.key[0] === 'T' || op.key[0] === 'C'))
      sceneExtBlit(buf, op.x + 20, op.y + 20, op.bmp, op.trans, op.rows);
    else s.sprites.push(op);
  }
  s.buf = buf;
  s.ops = null;
  VGA.scenes.push(s);
  if (VGA.scenes.length > 3) VGA.scenes.shift();
}
function sceneDrop() { VGA.building = null; }

function vgaInit(canvas) {
  VGA.canvas = canvas;
  canvas.width = 1280; canvas.height = 800;
  VGA.ctx = canvas.getContext('2d', { alpha: false });
  VGA.ctx.imageSmoothingEnabled = false;
  VGA.small = document.createElement('canvas');
  VGA.small.width = 320; VGA.small.height = 200;
  VGA.sctx = VGA.small.getContext('2d', { alpha: false });
  VGA.img = VGA.sctx.createImageData(320, 200);
  VGA.img32 = new Uint32Array(VGA.img.data.buffer);
  VGA.big = VGA.ctx.createImageData(880, 800);
  VGA.big32 = new Uint32Array(VGA.big.data.buffer);
}

VGA.onRetrace = function () {};

VGA.lastDac = new Uint8Array(768);
function vgaBuildLut() {
  const d = VGA.dac, lut = VGA.lut;
  let same = true;
  for (let i = 0; i < 768; i++) if (d[i] !== VGA.lastDac[i]) { same = false; break; }
  if (same && VGA.lutReady) return;
  VGA.lastDac.set(d);
  VGA.lutReady = true;
  VGA.spriteCache.clear();
  for (let i = 0; i < 256; i++) {
    // 6-bit DAC to 8-bit the way the RAMDAC's output is usually captured
    const r = (d[i * 3] << 2) | (d[i * 3] >> 4);
    const g = (d[i * 3 + 1] << 2) | (d[i * 3 + 1] >> 4);
    const b = (d[i * 3 + 2] << 2) | (d[i * 3 + 2] >> 4);
    lut[i] = 0xff000000 | (b << 16) | (g << 8) | r;
  }
}

/* Draw the current frame.  Called from requestAnimationFrame. */
function vgaPresent() {
  const ctx = VGA.ctx;
  if (!ctx) return;
  if (VGA.textMode) {
    if (typeof textPresent === 'function') textPresent(ctx);
    return;
  }
  vgaBuildLut();
  const m = VGA.mem, out = VGA.img32, lut = VGA.lut;
  for (let i = 0; i < 64000; i++) out[i] = lut[m[i]];
  VGA.sctx.putImageData(VGA.img, 0, 0);
  ctx.drawImage(VGA.small, 0, 0, 1280, 800);
  vgaPresentScene();
}

/* Redraw the play window from the scenes at interpolated positions.
   The map moves with the camera; each sprite moves on its own path. */
function vgaPresentScene() {
  const sc = VGA.scenes;
  if (!sc.length) return;
  const cur = sc[sc.length - 1];
  if (cur.gen !== VGA.realGen) return;          // something else is on screen
  const prev = sc.length > 1 ? sc[sc.length - 2] : null;
  // Show the state one retrace behind the clock so there is always a
  // "next" frame to interpolate toward.
  let alpha = 1;
  const linked = prev && prev.gen === cur.gen && prev.map === cur.map;
  if (linked) {
    const span = cur.t - prev.t;
    const now = realNow() - SYS.retracePeriod;
    if (span > 0 && span < SYS.retracePeriod * 1.5)
      alpha = Math.max(0, Math.min(1, (now - prev.t) / span));
  }
  let camX = cur.camX, camY = cur.camY;
  if (linked && alpha < 1 && Math.abs(prev.camX - cur.camX) <= 8 && Math.abs(prev.camY - cur.camY) <= 8) {
    camX = prev.camX + (cur.camX - prev.camX) * alpha;
    camY = prev.camY + (cur.camY - prev.camY) * alpha;
  }
  const ctx = VGA.ctx, lut = VGA.lut;
  // world layer
  if (!VGA.world) {
    VGA.world = document.createElement('canvas');
    VGA.world.width = EXT_W; VGA.world.height = EXT_H;
    VGA.wctx = VGA.world.getContext('2d', { alpha: false });
    VGA.wimg = VGA.wctx.createImageData(EXT_W, EXT_H);
    VGA.w32 = new Uint32Array(VGA.wimg.data.buffer);
  }
  const b = cur.buf, w32 = VGA.w32;
  for (let i = 0; i < b.length; i++) w32[i] = lut[b[i]];
  VGA.wctx.putImageData(VGA.wimg, 0, 0);
  ctx.save();
  ctx.beginPath(); ctx.rect(0, 0, 880, 800); ctx.clip();
  ctx.imageSmoothingEnabled = false;
  // ext pixel ex is buffer ex-20, screen ex-40, shifted by the camera
  const ox = Math.round((-40 - (camX - cur.camX)) * 4), oy = Math.round((-40 - (camY - cur.camY)) * 4);
  ctx.drawImage(VGA.world, ox, oy, EXT_W * 4, EXT_H * 4);
  // sprites, in the order they were drawn
  const pmap = new Map();
  if (linked && alpha < 1) for (const op of prev.sprites) if (op.key) pmap.set(op.key, op);
  for (const op of cur.sprites) {
    let wx = op.x + cur.camX, wy = op.y + cur.camY;
    const p = op.key && pmap.get(op.key);
    if (p) {
      const px = p.x + prev.camX, py = p.y + prev.camY;
      if (Math.abs(px - wx) <= 8 && Math.abs(py - wy) <= 8) {
        wx = px + (wx - px) * alpha;
        wy = py + (wy - py) * alpha;
      }
    }
    const sx = Math.round((wx - camX - 20) * 4), sy = Math.round((wy - camY - 20) * 4);
    ctx.drawImage(vgaSpriteCanvas(op.bmp, op.trans, op.rows), sx, sy, 80, op.rows * 4);
  }
  ctx.restore();
}

/* 20-wide bitmaps as small canvases in the current palette */
VGA.spriteCache = new Map();
VGA.lutKey = '';
function vgaSpriteCanvas(bmp, trans, rows) {
  let m = VGA.spriteCache.get(bmp);
  if (!m) { m = new Map(); VGA.spriteCache.set(bmp, m); }
  const k = (trans ? 't' : 'o') + rows;
  let c = m.get(k);
  if (c) return c;
  c = document.createElement('canvas');
  c.width = 20; c.height = Math.max(1, rows);
  const x = c.getContext('2d');
  const img = x.createImageData(20, Math.max(1, rows));
  const d32 = new Uint32Array(img.data.buffer);
  for (let i = 0; i < rows * 20; i++) {
    const val = bmp[i];
    d32[i] = (trans && val === 0) ? 0 : VGA.lut[val];
  }
  x.putImageData(img, 0, 0);
  m.set(k, c);
  return c;
}
