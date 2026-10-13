'use strict';
/* ==========================================================================
   fonts.js - the FONTS unit (the 1999 FONTS.PAS; PopText is Demo 4's).

   Font files are arrays [32..126] of letters stored column by column:
     CL7X9.FNT  Font1  7x9   shade values 1..4  (drawn as base+shade-1)
     BW26X22.FNT Font2 26x22 shade values 1..7  (proportional)
     CL7X8.FNT  Font4  7x8   shade values 1..7
   ========================================================================== */

let Font1 = null, Font2 = null, Font3 = null, Font4 = null;

function fontPix(font, w, h, ch, c1, c2) {
  const i = ch - 32;
  if (i < 0 || i > 94) return 0;       // outside the set: nothing drawn
  return font[i * w * h + c1 * h + c2];
}

function PutLetRange1(x, y, base, ch) {
  for (let c1 = 0; c1 <= 6; c1++)
    for (let c2 = 0; c2 <= 8; c2++) {
      const v = fontPix(Font1, 7, 9, ch, c1, c2);
      if (v !== 0 && (x + c1) > -1 && (x + c1) < 320 && (y + c2) > -1 && (y + c2) < 200)
        putpixel(x + c1, y + c2, v + base - 1);
    }
}
function PutLetNorm4(x, y, base, ch) {
  for (let c1 = 0; c1 <= 6; c1++)
    for (let c2 = 0; c2 <= 7; c2++) {
      const v = fontPix(Font4, 7, 8, ch, c1, c2);
      if (v !== 0) putpixel(x + c1, y + c2, v + base - 1);
    }
}
function PutLetNorm4Fast(x, y, base, ch) {
  for (let c1 = 0; c1 <= 6; c1++)
    for (let c2 = 0; c2 <= 7; c2++)
      if (fontPix(Font4, 7, 8, ch, c1, c2) !== 0) putpixel(x + c1, y + c2, base);
}
function PutLetNorm1(x, y, base, ch) {
  for (let c1 = 0; c1 <= 6; c1++)
    for (let c2 = 0; c2 <= 8; c2++) {
      const v = fontPix(Font1, 7, 9, ch, c1, c2);
      if (v !== 0) putpixel(x + c1, y + c2, v + base - 1);
    }
}
const chars = (s) => { const a = []; for (let i = 0; i < s.length; i++) a.push(s.charCodeAt(i) & 255); return a; };

function OutTextXyRange1(x, y, base, what) {
  chars(what).forEach((ch, i) => PutLetRange1(x + i * 8, y, base, ch));
}
function OutTextXyNorm1(x, y, base, what) {
  chars(what).forEach((ch, i) => PutLetNorm1(x + i * 8, y, base, ch));
}
function OutTextXyNorm4(x, y, base, what) {
  chars(what).forEach((ch, i) => PutLetNorm4(x + i * 8, y, base, ch));
}
/* fonts.OutTextXy3d4: a bevelled outline drawn by stamping the text eight
   times around the middle */
function OutTextXy3d4(x, y, vhi, hi, mid, lo, vlo, what) {
  OutTextXyNorm4(x + 1, y - 1, hi, what);
  OutTextXyNorm4(x - 1, y + 1, lo, what);
  OutTextXyNorm4(x - 1, y - 1, vhi, what);
  OutTextXyNorm4(x + 1, y + 1, vlo, what);
  OutTextXyNorm4(x, y + 1, lo, what);
  OutTextXyNorm4(x + 1, y, lo, what);
  OutTextXyNorm4(x, y - 1, hi, what);
  OutTextXyNorm4(x - 1, y, hi, what);
  OutTextXyNorm4(x, y, mid, what);
}
/* fonts.OutTextXyChoise: menu text, middle colour col*3+10 */
function OutTextXyChoise(x, y, col, what) {
  OutTextXy3d1(x, y, 6, 5, col * 3 + 10, 2, 1, what);
}
function OutTextXy3d1(x, y, vhi, hi, mid, lo, vlo, what) {
  OutTextXyNorm1(x + 1, y - 1, hi, what);
  OutTextXyNorm1(x - 1, y + 1, lo, what);
  OutTextXyNorm1(x - 1, y - 1, vhi, what);
  OutTextXyNorm1(x + 1, y + 1, vlo, what);
  OutTextXyNorm1(x, y + 1, lo, what);
  OutTextXyNorm1(x + 1, y, lo, what);
  OutTextXyNorm1(x, y - 1, hi, what);
  OutTextXyNorm1(x - 1, y, hi, what);
  OutTextXyNorm1(x, y, mid, what);
}

/* The 26x22 font is proportional: empty columns are skipped. */
function font2Text(x, y, what, startStep, pix) {
  let c3 = -2;
  for (const ch of chars(what)) {
    let ink = true;
    c3 = c3 + startStep;
    if (ch === 32) c3 = c3 + 5;
    for (let c1 = 0; c1 <= 25; c1++) {
      if (ink) c3 = c3 + 1;
      ink = false;
      for (let c2 = 0; c2 <= 21; c2++) {
        const v = fontPix(Font2, 26, 22, ch, c1, c2);
        if (v !== 0) { ink = true; pix(x + c3, y + c2, v, c2); }
      }
    }
  }
}
function OutTextXyNORM2(x, y, col, what) {
  font2Text(x, y, what, 1, (px, py, v) => putpixel(px, py, v + col));
}
function OutTextXyBW2(x, y, col, what) {
  font2Text(x, y, what, 1, (px, py) => putpixel(px, py, col));
}
function OutTextXyWide2(x, y, col, what) {
  font2Text(x, y, what, 2, (px, py) => putpixel(px, py, col));
}
function OutTextXy3d2(x, y, vhi, hi, mid, lo, vlo, what) {
  OutTextXyWide2(x + 1, y - 1, hi, what);
  OutTextXyWide2(x - 1, y + 1, lo, what);
  OutTextXyWide2(x - 1, y - 1, vhi, what);
  OutTextXyWide2(x + 1, y + 1, vlo, what);
  OutTextXyWide2(x, y + 1, lo, what);
  OutTextXyWide2(x + 1, y, lo, what);
  OutTextXyWide2(x, y - 1, hi, what);
  OutTextXyWide2(x - 1, y, hi, what);
  OutTextXyWide2(x, y, mid, what);
}

function LoadFont1() { if (!Font1) Font1 = FS.get('CL7X9.Fnt') || new Uint8Array(5985); }
function KillFont1() { Font1 = null; }
function LoadFont2() { if (!Font2) Font2 = FS.get('BW26X22.Fnt') || new Uint8Array(54340); }
function KillFont2() { Font2 = null; }
function LoadFont4() { if (!Font4) Font4 = FS.get('CL7X8.Fnt') || new Uint8Array(5320); }
function KillFont4() { Font4 = null; }

/* fonts.PopText (Demo 4 700:0a0c): type the five lines into the text box
   in font 1, one letter every TalkRate ticks of the 512 Hz clock (f_clk[0])
   unless a key is held, then wait for a key press and release. */
async function PopText(words, col) {
  for (let c1 = 0; c1 <= 4; c1++)
    for (let c2 = 1; c2 <= 38; c2++) {
      const ch = words[c1][c2];
      if (ch > 32) {
        PutLetNorm1(c2 * 8, 145 + c1 * 10, col, ch);
        cpu(0.03);
        if (!SomethingDown()) {
          if (GlobalStats.talkrate !== 0) {
            SYS.f_clk[0] = GlobalStats.talkrate;
            while (SYS.f_clk[0] !== 0) await idle();
            PushScreen();
          }
        }
      }
    }
  PushScreen();
  while (ButtonDown()) await idle();
  while (!ButtonDown()) await idle();
  while (ButtonDown()) await idle();
}
