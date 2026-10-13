'use strict';
/* ==========================================================================
   graphics.js - port of GRAPHICS.PAS (very basic graphic routines).

   TheScreen is the 64001-byte back buffer the game draws into; TheRealScreen
   is video memory.  While walking, the game draws the map into TheScreen as
   a 260-pixel-wide buffer ("fs" routines) and copies the visible part with
   PushSmallScreenFs.

   Costs passed to cpu() approximate a 486 DX66 with a VESA local bus card.
   ========================================================================== */

const TheScreen = new Uint8Array(64001);
const TheRealScreen = VGA.mem;

const COST_PUSH = 2.6;        // 64000 bytes to video memory (rep movsd)
const COST_PUSH_SMALL = 2.0;  // 220x200 window (movsw)
const COST_CLEAR = 0.6;       // 64000 bytes of RAM (rep stosd)

/* graphics.PutPixel (x,y are words: the offset wraps at 64K) */
function putpixel(x, y, color) {
  const o = ((y & 0xffff) * 320 + (x & 0xffff)) & 0xffff;
  if (o < 64001) TheScreen[o] = color & 255;
}

/* ASMSTUFF.OBJ AsmPush: copy 64000 bytes */
function AsmPush(src, dst) {
  dst.set(src.subarray(0, 64000), 0);
  if (dst === TheRealScreen) { vgaDirty(); cpu(COST_PUSH); }
  else cpu(COST_CLEAR);
}
/* ASMSTUFF.OBJ AsmClear */
function AsmClear(scr) {
  scr.fill(0, 0, 64000);
  if (scr === TheRealScreen) vgaDirty();
  cpu(COST_CLEAR);
}
function PushScreen() { AsmPush(TheScreen, TheRealScreen); }
function ClearScreen() { AsmClear(TheScreen); }

/* graphics.PushSmallScreenfs: buffer offset 5220 = (20,20) in the 260-wide
   map buffer, 220 bytes x 200 rows to the left of the screen. */
function PushSmallScreenFs() {
  let si = 5220, di = 0;
  for (let r = 0; r < 200; r++) {
    TheRealScreen.set(TheScreen.subarray(si, si + 220), di);
    si += 260; di += 320;
  }
  sceneCommit();
  cpu(COST_PUSH_SMALL);
}
/* graphics.PushSmallScreen (unused by the 1999 build) */
function PushSmallScreen() {
  let o = 6420;
  for (let r = 0; r < 160; r++) {
    TheRealScreen.set(TheScreen.subarray(o, o + 180), o);
    o += 320;
  }
  vgaDirty();
}
/* graphics.PushMenu: the right-hand 100 columns */
function PushMenu() {
  for (let r = 0; r < 200; r++) {
    const o = r * 320 + 220;
    TheRealScreen.set(TheScreen.subarray(o, o + 100), o);
  }
  cpu(1.0);
}

/* graphics.SetCycle / TopCap: rotate entries 128..255 of a saved palette */
function TopCap(what) {
  what &= 255;
  if (what < 128) what = what + 128;
  return what;
}
function SetCycle(base, pal) {
  for (let c1 = 128; c1 <= 255; c1++)
    ASetRGBPalette(TopCap(c1 + base), pal[c1 * 3], pal[c1 * 3 + 1], pal[c1 * 3 + 2]);
}

/* Menu choice colours: three entries per choice from 10 */
function HiText(wich) {
  ASetRGBPalette(wich * 3 + 10, 63, 55, 33);
  ASetRGBPalette(wich * 3 + 11, 50, 45, 25);
  ASetRGBPalette(wich * 3 + 12, 41, 36, 21);
}
function DisText(wich) {
  ASetRGBPalette(wich * 3 + 10, 12, 11, 10);
  ASetRGBPalette(wich * 3 + 11, 9, 8, 7);
  ASetRGBPalette(wich * 3 + 12, 6, 5, 4);
}
function DulText(wich) {
  ASetRGBPalette(wich * 3 + 10, 41, 36, 21);
  ASetRGBPalette(wich * 3 + 11, 35, 30, 18);
  ASetRGBPalette(wich * 3 + 12, 30, 25, 15);
}

/* A PaletteType is a 768-byte array of r,g,b */
function newPal() { return new Uint8Array(768); }
function FetchPal(pal) { pal.set(VGA.dac); }

function DownGamePal() {
  const pal = newPal(); FetchPal(pal);
  for (let c1 = 64; c1 <= 128 + 63; c1++)
    ASetRGBPalette(c1, (pal[c1 * 3] * 9) / 10 | 0, (pal[c1 * 3 + 1] * 9) / 10 | 0, (pal[c1 * 3 + 2] * 9) / 10 | 0);
}
function HalfPal() {
  const pal = newPal(); FetchPal(pal);
  for (let c1 = 0; c1 <= 255; c1++)
    ASetRGBPalette(c1, pal[c1 * 3] >> 1, pal[c1 * 3 + 1] >> 1, pal[c1 * 3 + 2] >> 1);
}
function BWPal() {
  const pal = newPal(); FetchPal(pal);
  for (let c1 = 0; c1 <= 255; c1++) {
    const v = ((pal[c1 * 3] + pal[c1 * 3 + 1] + pal[c1 * 3 + 2]) / 3) | 0;
    ASetRGBPalette(c1, v, v, v);
  }
}
function ClearPal() {
  for (let c1 = 0; c1 <= 255; c1++) ASetRGBPalette(c1, 0, 0, 0);
}
/* graphics.BrownPal: grey the palette, then tint it brown */
function BrownPal() {
  const pal = newPal(); FetchPal(pal);
  for (let c1 = 0; c1 <= 255; c1++) {
    const v = ((pal[c1 * 3] + pal[c1 * 3 + 1] + pal[c1 * 3 + 2]) / 3) | 0;
    ASetRGBPalette(c1, v, v >> 1, v >> 2);
  }
}
function PushPalDeg(deg, pal) {
  for (let c1 = 255; c1 >= 0; c1--)
    ASetRGBPalette(c1, Math.trunc(pal[c1 * 3] * deg / 255), Math.trunc(pal[c1 * 3 + 1] * deg / 255),
      Math.trunc(pal[c1 * 3 + 2] * deg / 255));
}

/* graphics.PushFadeIn: black the DAC, show TheScreen, fade up */
async function PushFadeIn(speed) {
  if (speed === 0) speed = 1;
  const pal = newPal(); FetchPal(pal);
  for (let c1 = 0; c1 <= 255; c1++) ASetRGBPalette(c1, 0, 0, 0);
  PushScreen();
  for (let c2 = 0; c2 <= speed; c2++) {
    for (let c1 = 0; c1 <= 255; c1++)
      ASetRGBPalette(c1, Math.trunc(pal[c1 * 3] * c2 / speed),
        Math.trunc(pal[c1 * 3 + 1] * c2 / speed), Math.trunc(pal[c1 * 3 + 2] * c2 / speed));
    await WaitScreen();
  }
}
/* graphics.Fadeto: cross-fade the DAC from its current state to pal */
async function Fadeto(speed, palIn) {
  const pal = Uint8Array.from(palIn);
  const oldpal = newPal(); FetchPal(oldpal);
  if (speed === 0) speed = 1;
  for (let c2 = 0; c2 <= speed; c2++) {
    for (let c1 = 0; c1 <= 255; c1++)
      ASetRGBPalette(c1,
        ((oldpal[c1 * 3] * (speed - c2) + pal[c1 * 3] * c2) / speed) | 0,
        ((oldpal[c1 * 3 + 1] * (speed - c2) + pal[c1 * 3 + 1] * c2) / speed) | 0,
        ((oldpal[c1 * 3 + 2] * (speed - c2) + pal[c1 * 3 + 2] * c2) / speed) | 0);
    await WaitScreen();
  }
}
async function FadeIn(speed, palIn) {
  const pal = Uint8Array.from(palIn);
  if (speed === 0) speed = 1;
  for (let c2 = 0; c2 <= speed; c2++) {
    for (let c1 = 0; c1 <= 255; c1++)
      ASetRGBPalette(c1, Math.trunc(pal[c1 * 3] * c2 / speed),
        Math.trunc(pal[c1 * 3 + 1] * c2 / speed), Math.trunc(pal[c1 * 3 + 2] * c2 / speed));
    await WaitScreen();
  }
}
/* graphics.FadeOutPartial: fade only 64..188 (the map colours); pal is a
   var parameter and returns the palette as it was before the fade. */
async function FadeOutPartial(speed, pal) {
  if (speed === 0) speed = 1;
  FetchPal(pal);
  for (let c2 = speed; c2 >= 0; c2--) {
    for (let c1 = 64; c1 <= 188; c1++)
      ASetRGBPalette(c1, Math.trunc(pal[c1 * 3] * c2 / speed),
        Math.trunc(pal[c1 * 3 + 1] * c2 / speed), Math.trunc(pal[c1 * 3 + 2] * c2 / speed));
    await WaitScreen();
  }
}
async function FadeOut(speed) {
  if (speed === 0) speed = 1;
  const pal = newPal(); FetchPal(pal);
  for (let c2 = speed; c2 >= 0; c2--) {
    for (let c1 = 0; c1 <= 255; c1++)
      ASetRGBPalette(c1, Math.trunc(pal[c1 * 3] * c2 / speed),
        Math.trunc(pal[c1 * 3 + 1] * c2 / speed), Math.trunc(pal[c1 * 3 + 2] * c2 / speed));
    await WaitScreen();
  }
}

/* graphics.ClearFunk1 (only TitleScreen used it; kept for completeness) */
async function ClearFunk1() {
  for (let c2 = 20; c2 >= 5; c2--) {
    ClearScreen();
    for (let c1 = 0; c1 <= 199; c1++) {
      const t1 = (199 - (((c1 * (((c2 * 10) / 20) | 0)) / 10) | 0)) * 320;
      const t2 = (199 - c1) * 320;
      TheScreen.set(TheRealScreen.subarray(t2, t2 + 320), t1);
    }
    PushScreen();
    await sysSync();
  }
}
