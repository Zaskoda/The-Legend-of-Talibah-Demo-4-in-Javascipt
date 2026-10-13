'use strict';
/* ==========================================================================
   crt.js - the bits of Turbo Pascal's CRT unit the program uses before and
   after mode 13h: an 80x25 text screen with Window, TextBackGround,
   TextColor, ClrScr, Write and Writeln.

   In text mode, colours 0..5 go through the attribute controller to DAC
   entries 0..5, which the program reprograms into greens; 6 is DAC 20 and
   8..15 are DAC 56..63.
   ========================================================================== */

const CRT = {
  cells: new Uint16Array(80 * 25),   // char | attr << 8
  win: [1, 1, 80, 25],
  x: 1, y: 1,                         // cursor, relative to the window
  attr: 0x07,
  font: null,
  img: null,
};
const ATTR_TO_DAC = [0, 1, 2, 3, 4, 5, 20, 7, 56, 57, 58, 59, 60, 61, 62, 63];

function crtReset() {
  CRT.cells.fill(0x0720);
  CRT.win = [1, 1, 80, 25]; CRT.x = 1; CRT.y = 1; CRT.attr = 0x07;
}
function Window(x1, y1, x2, y2) { CRT.win = [x1, y1, x2, y2]; CRT.x = 1; CRT.y = 1; }
function TextBackGround(c) { CRT.attr = (CRT.attr & 0x8f) | ((c & 7) << 4); }
function TextColor(c) { CRT.attr = (CRT.attr & 0x70) | (c & 15) | (c & 128); }
function ClrScr() {
  const [x1, y1, x2, y2] = CRT.win;
  for (let y = y1; y <= y2; y++)
    for (let x = x1; x <= x2; x++) CRT.cells[(y - 1) * 80 + x - 1] = 0x20 | (CRT.attr << 8);
  CRT.x = 1; CRT.y = 1;
}
function crtScroll() {
  const [x1, y1, x2, y2] = CRT.win;
  for (let y = y1; y < y2; y++)
    for (let x = x1; x <= x2; x++) CRT.cells[(y - 1) * 80 + x - 1] = CRT.cells[y * 80 + x - 1];
  for (let x = x1; x <= x2; x++) CRT.cells[(y2 - 1) * 80 + x - 1] = 0x20 | (CRT.attr << 8);
}
function crtNewline() {
  const [, y1, , y2] = CRT.win;
  CRT.x = 1;
  if (CRT.y + y1 - 1 >= y2) crtScroll(); else CRT.y++;
}
function Write(s) {
  const [x1, y1, x2] = CRT.win;
  const w = x2 - x1 + 1;
  for (let i = 0; i < s.length; i++) {
    CRT.cells[(CRT.y + y1 - 2) * 80 + CRT.x + x1 - 2] = (s.charCodeAt(i) & 255) | (CRT.attr << 8);
    CRT.x++;
    if (CRT.x > w) crtNewline();
  }
}
function Writeln(s) { Write(s || ''); crtNewline(); }

/* draw the text screen (640x400, scaled 2x onto the canvas) */
function textPresent(ctx) {
  if (!CRT.font) CRT.font = b64bytes(VGA_FONT_8X16);
  if (!CRT.img) {
    CRT.canvas = document.createElement('canvas');
    CRT.canvas.width = 640; CRT.canvas.height = 400;
    CRT.ctx = CRT.canvas.getContext('2d');
    CRT.img = CRT.ctx.createImageData(640, 400);
    CRT.img32 = new Uint32Array(CRT.img.data.buffer);
  }
  vgaBuildLut();
  const out = CRT.img32, f = CRT.font, lut = VGA.lut;
  for (let cy = 0; cy < 25; cy++)
    for (let cx = 0; cx < 80; cx++) {
      const cell = CRT.cells[cy * 80 + cx];
      const ch = cell & 255, a = cell >> 8;
      const fg = lut[ATTR_TO_DAC[a & 15]], bg = lut[ATTR_TO_DAC[(a >> 4) & 7]];
      for (let r = 0; r < 16; r++) {
        const bits = f[ch * 16 + r];
        const o = (cy * 16 + r) * 640 + cx * 8;
        for (let b = 0; b < 8; b++) out[o + b] = (bits & (0x80 >> b)) ? fg : bg;
      }
    }
  CRT.ctx.putImageData(CRT.img, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(CRT.canvas, 0, 0, 1280, 800);
}

/* The start of the program block (000:4aa2), up to the second frame; the
   rest of the start-up text is written as the program goes. */
function textModeBanner() {
  crtReset();
  vgaTextPalette();
  ASetRGBPalette(1, 0, 5, 0);
  ASetRGBPalette(2, 2, 10, 2);
  ASetRGBPalette(3, 4, 20, 4);
  ASetRGBPalette(4, 8, 60, 8);
  ASetRGBPalette(5, 38, 63, 38);
  VGA.textMode = true;
  Window(1, 1, 80, 25); TextBackGround(2); ClrScr();
  Window(5, 3, 78, 5); TextBackGround(1); ClrScr();
  Window(4, 2, 77, 4); TextBackGround(3); ClrScr();
  TextColor(4);
  Writeln(' Snazzy Engine (tm)                                      v.01 (pre alpha)');
  Writeln(' Copyright 1997 by Scott Dudley                       All Rights Reserved');
  Write('                                                             Zaskoda Soft');
  Window(5, 8, 78, 24); TextBackGround(1); ClrScr();
  Window(4, 7, 77, 23); TextBackGround(3); ClrScr();
  TextColor(4);
  Write('-=*=-                                                                -=*=-');
  Writeln(' THE LEGEND OF TALIBAH Chapter 1: A Past Forgotten          Zaskoda Soft');
  Write('-=*=-                                                                -=*=-');
}

/* Back in text mode after OverAll: a plain screen for the closing lines. */
function textModeExitScreen() {
  crtReset();
  Window(1, 1, 80, 25); TextBackGround(0); TextColor(7); ClrScr();
}
