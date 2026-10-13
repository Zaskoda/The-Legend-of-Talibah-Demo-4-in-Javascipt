'use strict';
/* ==========================================================================
   bitmaps.js - the BITMAPS unit: blitting, the side panel, the pop-up text
   box background, the map renderer and the rain.

   This is the 1999 BITMAPS.PAS (the 220x200 "fs" view, wading and tree
   cut-off, hills), used with Demo 4's data.  Demo 4's own unit drew a
   180x160 view inside a border; DrawGrid320 below stands in for its
   DrawGrid+DrawOverLay where the Demo 4 code builds a whole screen in
   TheScreen.

   The "fs" blitters address TheScreen as a 260-pixel-wide buffer (y*260 is
   computed as y*4 + y*256 in the original assembly); the plain ones use the
   normal 320-pixel rows.
   ========================================================================== */

const Num_Of_Drops = 35;
let RainOn = false, FogOn = false;
let Rain = null;
let Drops = new Array(12).fill(null);

/* bitmaps.StatLine: an HP/MP bar, val pixels in col1, the rest in col2 */
function StatLine(x, y, val, max, col1, col2) {
  val &= 255;
  if (val > 0) for (let c1 = 0; c1 <= val; c1++) TheScreen[x + y * 320 + c1] = col1;
  if (val < max) for (let c1 = val; c1 <= max; c1++) TheScreen[x + y * 320 + c1] = col2;
}

/* bitmaps.DrawSmallMap (Demo 4 7b0:0000), the M debug key's mini map: one
   pixel per cell, 80x80 on the panel.  The fs view keeps the map in
   TheScreen, so this draws straight into video memory beside it. */
function DrawSmallMap() {
  for (let c2 = 0; c2 <= 79; c2++)
    for (let c3 = 0; c3 <= 79; c3++)
      TheRealScreen[(10 + c3) * 320 + 230 + c2] = TileLUT[owmBack(GlobalStats.c1x - 39 + c2, GlobalStats.c1y - 39 + c3)];
  TheRealScreen[49 * 320 + 269] = random(256);
}

function LoadRainBits() {
  LoadSprite(Drops, Drops_Loc);
  RainOn = true;
}
function InitRain() {
  LoadRainBits();
  if (Rain === null) Rain = Array.from({ length: Num_Of_Drops + 1 }, () => ({ x: 0, y: 0, frame: 0 }));
  for (let c1 = 0; c1 <= Num_Of_Drops; c1++) {
    Rain[c1].x = random(200) + 20;
    Rain[c1].y = (random(200) + 10 + 11) & 255;   // byte
    Rain[c1].frame = random(23);
  }
}
function UpDateRain() {
  for (let c1 = 0; c1 <= Num_Of_Drops; c1++) {
    const d = Rain[c1];
    if (d.frame > 0) { d.frame--; d.x = (d.x + 1) & 255; }
    else {
      d.x = random(210) + 10;
      d.y = random(190) + 23;
      d.frame = random(5) + 18;
    }
    PutSmallTranBitFastfs(d.x, d.y - d.frame, 0, Drops[d.frame >> 2], 'R' + c1);
  }
}
function CloseRain() {
  RainOn = false;
  Rain = null;
  KillSprite(Drops);
}

/* bitmaps.PopLoadBacks: four LGB.GRD strips behind the game-select menu */
function PopLoadBacks() {
  const lgb = FS.get('LGB.GRD');
  if (!lgb) return;
  for (let c2 = 0; c2 <= 3; c2++)
    for (let c1 = 0; c1 <= 29; c1++)
      TheScreen.set(lgb.subarray(c1 * 220, c1 * 220 + 220), 50 + (c1 + 5 + c2 * 40) * 320);
}

/* .BTM = BtmRec: 768-byte palette, then 64001 bytes of screen */
function DispGrdBuf(what) {
  const f = FS.get(what);
  if (f) TheScreen.set(f.subarray(768, 768 + 64001));
}
function DispFullBtmBuf(what) {
  const f = FS.get(what);
  if (f) {
    TheScreen.set(f.subarray(768, 768 + 64001));
    for (let c1 = 0; c1 <= 255; c1++) ASetRGBPalette(c1, f[c1 * 3], f[c1 * 3 + 1], f[c1 * 3 + 2]);
    cpu(8);   // reading 64K from disk
  } else writelnDebug('Error opening ' + what);
}
/* bitmaps.DispFullBtmFull: show a picture straight on screen until a key */
async function DispFullBtmFull(what, speed) {
  const f = FS.get(what);
  if (f) {
    cpu(8);
    for (let c1 = 0; c1 <= 255; c1++) ASetRGBPalette(c1, 0, 0, 0);
    TheRealScreen.set(f.subarray(768, 768 + 64000));
    vgaDirty();
    await FadeIn(speed, f.subarray(0, 768));
    while (SomethingDown()) await idle();
    while (!SomethingDown()) await idle();
    while (SomethingDown()) await idle();
    await FadeOut(speed);
  }
}

function LoadPopTxtBk() { PopBack = FS.get('PopTxtBk.Grd'); }
function KillPopTxtBk() { PopBack = null; }

/* OverLayType: top[20][220], bot[20][220], left[160][20], right[160][20],
   panel[200][100] */
function LoadOverLay() {
  const f = FS.get('OverLay.Grd');
  if (!f) { writelnDebug('Error opening OverLay.Grd'); return; }
  OverLay = {
    top: (i) => f.subarray(i * 220, i * 220 + 220),
    bot: (i) => f.subarray(4400 + i * 220, 4400 + i * 220 + 220),
    left: (i) => f.subarray(8800 + (i - 20) * 20, 8800 + (i - 20) * 20 + 20),
    right: (i) => f.subarray(12000 + (i - 20) * 20, 12000 + (i - 20) * 20 + 20),
    panel: (i) => f.subarray(15200 + i * 100, 15200 + i * 100 + 100),
  };
}
function KillOverLay() { OverLay = null; }

/* Where the leader's view starts in the 260-wide buffer (shared by
   DrawGridFs and DrawGridFS_nosprites). */
function gridView() {
  const G = GlobalStats;
  const v = { firstX: G.c1x - 5, firstY: G.c1y - 5, startX: 20, startY: 20, lastX: 10, lastY: 9 };
  if (G.c1offset !== 0) {
    const o = G.c1offset;
    if (G.c1dir === 1) Object.assign(v, { firstX: G.c1x - 5, firstY: G.c1y - 6, startX: 20, startY: o, lastX: 10, lastY: 10 });
    if (G.c1dir === 2) Object.assign(v, { firstX: G.c1x - 6, firstY: G.c1y - 5, startX: o, startY: 20, lastX: 11, lastY: 9 });
    if (G.c1dir === 3) Object.assign(v, { firstX: G.c1x - 5, firstY: G.c1y - 5, startX: 20, startY: 20 - o, lastX: 10, lastY: 10 });
    if (G.c1dir === 4) Object.assign(v, { firstX: G.c1x - 5, firstY: G.c1y - 5, startX: 20 - o, startY: 20, lastX: 11, lastY: 9 });
  }
  return v;
}
function FinalX(v, x, offset, dir) {
  if (dir === 1) return v.startX + (x - v.firstX) * 20;
  if (dir === 2) return v.startX + (x - v.firstX) * 20 - offset;
  if (dir === 3) return v.startX + (x - v.firstX) * 20;
  if (dir === 4) return v.startX + (x - v.firstX) * 20 + offset;
  return 0;   // unassigned function result
}
function FinalY(v, y, offset, height, dir) {
  if (dir === 1) return v.startY + (y - v.firstY) * 20 - offset - height;
  if (dir === 2) return v.startY + (y - v.firstY) * 20 - height;
  if (dir === 3) return v.startY + (y - v.firstY) * 20 + offset - height;
  if (dir === 4) return v.startY + (y - v.firstY) * 20 - height;
  return 0;
}
function PutSprite(v, x, y, offset, height, dir, where, key) {
  const G = GlobalStats;
  if (Math.abs(x - G.c1x) < 8 && Math.abs(y - G.c1y) < 8) {
    const fx = FinalX(v, x, offset, dir), fy = FinalY(v, y, offset, height, dir);
    if (fx > 0 && fy > 0 && fx < 240 && fy < 220) PutSmallTranBitFastfs(fx, fy, 0, where, key);
  }
}

/* The map tiles of the view (the 1999 build also drew chests here; Demo 4
   has none) */
function drawGridTiles(v) {
  const G = GlobalStats;
  for (let c1 = 0; c1 <= v.lastX; c1++)
    for (let c2 = 0; c2 <= v.lastY; c2++) {
      const X = c1 + v.firstX, Y = c2 + v.firstY;
      const px = c1 * 20 + v.startX, py = c2 * 20 + v.startY;
      PutSmallBitFasterFs(px, py, MapTiles[owmBack(X, Y)], 'T' + X + ',' + Y);
    }
}

/* NPCs standing in rows c2from..c2to of the view */
function drawGridThings(v, c2from, c2to) {
  for (let c1 = -1; c1 <= 13; c1++)
    for (let c2 = c2from; c2 <= c2to; c2++) {
      const X = c1 + v.firstX, Y = c2 + v.firstY;
      const f = owmForth(X, Y);
      if (f > 193 && f < 194 + NUM_OF_NPCS) {
        const n = NPCs[f - 194];
        if (n !== null && n.x === X && n.y === Y)
          PutSprite(v, X, Y, n.offset, 5, n.dir, NPCBitMaps[n.sprt][n.frame], 'N' + (f - 194));
      }
    }
}

/* Demo 4's "DrawGrid; DrawOverLay" when the screen is being built in
   TheScreen (talking, menus, fades): the map view as the fs renderer draws
   it, placed in TheScreen's left 220 columns; the panel columns are kept. */
function DrawGrid320() {
  const keep = TheScreen.slice(0, 64000);
  DrawGridFs();
  sceneDrop();
  for (let r = 0; r < 200; r++) keep.set(TheScreen.subarray(5220 + r * 260, 5220 + r * 260 + 220), r * 320);
  TheScreen.set(keep);
}

/* bitmaps.DrawGridFS: draw the visible map, with the party drawn in the
   middle of the NPC rows so people north of them stand behind them */
function DrawGridFs() {
  const v = gridView();
  sceneBegin(v);
  drawGridTiles(v);
  drawGridThings(v, -1, 5);
  PutPartySprites(v);
  drawGridThings(v, 6, 11);
  if (RainOn) UpDateRain();
  cpu(3.0);
}
/* bitmaps.DrawGridFS_nosprites - despite the name, everyone but the party */
function DrawGridFS_nosprites() {
  const v = gridView();
  sceneBegin(v);
  drawGridTiles(v);
  drawGridThings(v, -1, 11);
  if (RainOn) UpDateRain();
  cpu(3.0);
}

function PutPartySprites(v) {
  const G = GlobalStats;
  const c1x = 120;
  const c1y = 120 - G.c1height;
  let c2x = 0, c2y = 0, c3x = 0, c3y = 0;
  if (G.c2alive) {
    c2x = FinalX(v, G.c2x, G.c2offset, G.c2dir);
    c2y = FinalY(v, G.c2y, G.c2offset, G.c2height, G.c2dir);
    if (!(c2x > 0 && c2x < 200 && c2y > 0 && c2y < 180)) { c2x = 0; c2y = 0; }
  }
  if (G.c3alive) {
    c3x = FinalX(v, G.c3x, G.c3offset, G.c3dir);
    c3y = FinalY(v, G.c3y, G.c3offset, G.c3height, G.c3dir);
    if (!(c3x > 0 && c3x < 200 && c3y > 0 && c3y < 180)) { c3x = 0; c3y = 0; }
  }
  const p1 = () => { if (G.c1alive) PutSmallTranBitFastHalffs(c1x, c1y, 0, G.c1cut, C1BitMaps[G.c1frame], 'P1'); };
  const p2 = () => { if (G.c2alive) PutSmallTranBitFastHalffs(c2x, c2y, 0, G.c2cut, C2BitMaps[G.c2frame], 'P2'); };
  const p3 = () => { if (G.c3alive) PutSmallTranBitFastHalffs(c3x, c3y, 0, G.c3cut, C3BitMaps[G.c3frame], 'P3'); };
  if (c2y > c1y) {
    if (c3y > c2y) { p1(); p2(); p3(); }
    else if (c3y > c1y) { p1(); p3(); p2(); }
    else { p3(); p1(); p2(); }
  } else {
    if (c3y > c1y) { p2(); p1(); p3(); }
    else if (c3y > c2y) { p2(); p3(); p1(); }
    else { p3(); p2(); p1(); }
  }
}

/* bitmaps.DrawPopTxtBk: the text box background, rows 138..197 */
function DrawPopTxtBk() {
  for (let c2 = 59; c2 >= 0; c2--)
    TheScreen.set(PopBack.subarray(c2 * 310, c2 * 310 + 310), 5 + (c2 + 138) * 320);
}
function DrawOverLay() {
  for (let c1 = 0; c1 <= 19; c1++) {
    TheScreen.set(OverLay.top(c1), c1 * 320);
    TheScreen.set(OverLay.bot(c1), (c1 + 180) * 320);
  }
  for (let c1 = 20; c1 <= 179; c1++) {
    TheScreen.set(OverLay.left(c1), c1 * 320);
    TheScreen.set(OverLay.right(c1), c1 * 320 + 200);
  }
}
/* bitmaps.DrawPanel: the right-hand panel from row y down */
function DrawPanel(y) {
  for (let c1 = 0; c1 <= 199 - y; c1++) TheScreen.set(OverLay.panel(c1), (c1 + y) * 320 + 220);
}
/* bitmaps.PanelClose: the panel's top and bottom edges slide to the
   middle, one row per tick of the 512 Hz clock */
async function PanelClose() {
  const blank = new Uint8Array(100);
  SYS.f_clk[3] = 1;
  for (let c2 = 5; c2 <= 99; c2++) {
    while (SYS.f_clk[3] !== 0) await idle();
    SYS.f_clk[3] = 1;
    for (let c1 = 1; c1 <= 4; c1++) {
      TheRealScreen.set(OverLay.panel(5 - c1), (c2 - c1) * 320 + 220);
      TheRealScreen.set(OverLay.panel(199 - (5 - c1)), (199 - (c2 - c1)) * 320 + 220);
    }
    TheRealScreen.set(blank, (199 - (c2 - 5)) * 320 + 220);
    TheRealScreen.set(blank, (c2 - 5) * 320 + 220);
  }
}
/* bitmaps.PanelUp: the edges slide back out, uncovering TheScreen's panel */
async function PanelUp() {
  SYS.f_clk[3] = 1;
  for (let c2 = 99; c2 >= 5; c2--) {
    while (SYS.f_clk[3] !== 0) await idle();
    SYS.f_clk[3] = 1;
    for (let c1 = 1; c1 <= 5; c1++) {
      TheRealScreen.set(OverLay.panel(5 - c1), (c2 - c1) * 320 + 220);
      TheRealScreen.set(OverLay.panel(199 - (5 - c1)), (199 - (c2 - c1)) * 320 + 220);
    }
    let o = (199 - c2) * 320 + 220;
    TheRealScreen.set(TheScreen.subarray(o, o + 100), o);
    o = c2 * 320 + 220;
    TheRealScreen.set(TheScreen.subarray(o, o + 100), o);
  }
}
function PanelUp_instant() {
  for (let c2 = 199; c2 >= 0; c2--) {
    const o = c2 * 320 + 220;
    TheRealScreen.set(TheScreen.subarray(o, o + 100), o);
  }
}
function DrawPanelDirect(y) {
  for (let c1 = 0; c1 <= 199 - y; c1++) TheRealScreen.set(OverLay.panel(c1), (c1 + y) * 320 + 220);
}

/* bitmaps.PutSmallBitOutline: colour the transparent pixels next to the
   sprite's edge */
function PutSmallBitOutLine(x, y, col, where) {
  for (let c1 = 0; c1 <= 19; c1++)
    for (let c2 = 0; c2 <= 19; c2++) {
      if (where[c2 * 20 + c1] === 0) {
        if ((c1 !== 0 && where[c2 * 20 + c1 - 1] !== 0) || (c1 !== 19 && where[c2 * 20 + c1 + 1] !== 0) ||
          (c2 !== 0 && where[(c2 - 1) * 20 + c1] !== 0) || (c2 !== 19 && where[(c2 + 1) * 20 + c1] !== 0))
          putpixel(x + c1, y + c2, col);
      }
    }
}
function PutSmallBit3Dedge(x, y, mid, where) {
  for (let c1 = 0; c1 <= 19; c1++)
    for (let c2 = 0; c2 <= 19; c2++) {
      if (where[c2 * 20 + c1] !== 0) continue;
      const l = c1 !== 0 && where[c2 * 20 + c1 - 1] !== 0, r = c1 !== 19 && where[c2 * 20 + c1 + 1] !== 0;
      const u = c2 !== 0 && where[(c2 - 1) * 20 + c1] !== 0, d = c2 !== 19 && where[(c2 + 1) * 20 + c1] !== 0;
      if (l || r || u || d) {
        let col = mid;
        if (l) col -= 2; if (r) col += 2; if (u) col -= 2; if (d) col += 2;
        putpixel(x + c1, y + c2, col);
      }
    }
}

/* ---- the assembly blitters ---- */
function blit(x, y, stride, where, trans, rows) {
  if (!where) return;
  let di = ((y * stride + x) & 0xffff);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < 20; c++) {
      const v = where[r * 20 + c];
      if (!(trans && v === 0) && di + c < 64001) TheScreen[di + c] = v;
    }
    di += stride;
  }
}
function PutSmallBitFaster(x, y, where) { blit(x, y, 320, where, false, 20); }
function PutSmallBitFasterFs(x, y, where, key) {
  blit(x, y, 260, where, false, 20);
  if (where) sceneOp(key, x, y, where, false, 20);
}
function PutSmallTranBitFastfs(x, y, trans, where, key) {
  blit(x, y, 260, where, true, 20);
  if (where) sceneOp(key, x, y, where, true, 20);
}
/* draws only the top 'cutter' rows: people wading in water or grass */
function PutSmallTranBitFastHalffs(x, y, trans, cutter, where, key) {
  blit(x, y, 260, where, true, cutter);
  if (where) sceneOp(key, x, y, where, true, cutter);
}
function PutSmallTranBitFastHalf(x, y, trans, cutter, where) { blit(x, y, 320, where, true, cutter); }
function PutSmallTranBitFast(x, y, trans, where) { blit(x, y, 320, where, true, 20); }
