'use strict';
/* ==========================================================================
   sys.js - the DOS machine underneath the game.

   Replaces what the original got from the hardware and from three units:
     - SPX_TIM (Scott D. Ramsay): f_clk[]/s_clk[] countdown clocks driven by
       the 8253 timer interrupt, and setrate().
     - MULTKEYS (Scott Earnest): keydown[] scancode table and GlobalKeyDown.
     - JOYSTICK (Ronny Wester): gSticks[] read from port 201h.
   plus the VGA retrace (port 3DAh) and Turbo Pascal's Random.

   Everything runs on a virtual clock (SYS.vt, milliseconds) that is kept in
   step with real time.  Parts of the game that waited on the timer chip or
   the vertical retrace are exact; parts that ran as fast as the CPU allowed
   are given costs approximating a 486 DX66 (see SYS.cpu calls).
   ========================================================================== */

const SYS = {
  vt: 0,                 // virtual time, ms since boot
  base: 0,               // performance.now() at vt = 0
  // 8253 channel 0 as programmed by SPX_TIM.setrate
  rate: 18,
  fPeriod: 65536 / 1193180 * 1000,
  nextF: 0,
  sDiv: 1,               // SPX_TIM word at 38C2h: rate div 18
  sCount: 0,             // SPX_TIM word at 38D2h
  f_clk: new Uint16Array(6),
  s_clk: new Uint16Array(6),
  // VGA mode 13h vertical refresh: 25.175 MHz / (800 * 449)
  retracePeriod: 1000 / (25175000 / (800 * 449)),
  gen: 0,                // bumped to abort the running program
  aborted: null,
};

class AbortRun extends Error {}

/* ---- the timer interrupt (SPX_TIM ISR, 1999 EXE d8d:002f) ---- */
function sysTimerTick() {
  if (SYS.sCount > 0) SYS.sCount--;
  for (let i = 0; i < 6; i++) if (SYS.f_clk[i] > 0) SYS.f_clk[i]--;
  if (SYS.sCount === 0) {
    SYS.sCount = SYS.sDiv;
    for (let i = 0; i < 6; i++) if (SYS.s_clk[i] > 0) SYS.s_clk[i]--;
  }
}

function sysAdvance(t) {
  if (t < SYS.vt) return;
  while (SYS.nextF <= t) {
    sysTimerTick();
    SYS.nextF += SYS.fPeriod;
  }
  SYS.vt = t;
}

/* SPX_TIM.setrate (1999 EXE d8d:00f3) */
function setrate(r) {
  if (r === SYS.rate) return;
  SYS.rate = r;
  SYS.sDiv = Math.floor(r / 18);
  SYS.sCount = 0;
  let div = Math.floor(0x1234dc / r) & 0xffff;
  if (r === 18) div = 0;
  SYS.fPeriod = (div === 0 ? 65536 : div) / 1193180 * 1000;
  SYS.nextF = SYS.vt + SYS.fPeriod;   // the PIT restarts its count
}

/* time the CPU spends on something that wasn't waiting for anything */
function cpu(ms) { sysAdvance(SYS.vt + ms); }

function realNow() { return performance.now() - SYS.base; }

function checkAbort() {
  if (SYS.aborted) throw SYS.aborted;
}

/* Let real time catch up with the virtual clock. */
async function sysSync() {
  checkAbort();
  let r = realNow();
  if (r - SYS.vt > 250) {          // tab was hidden or the machine stalled:
    SYS.base += (r - SYS.vt);      // skip the lost time instead of racing
    r = SYS.vt;
  }
  const ahead = SYS.vt - r;
  if (ahead > 3) await new Promise(res => setTimeout(res, ahead));
  else if (++SYS._yield > 50) {    // keep the browser responsive
    SYS._yield = 0;
    await new Promise(res => setTimeout(res, 0));
  }
  checkAbort();
}
SYS._yield = 0;

/* One pass of a busy-wait loop: nothing changes until the next timer tick
   or retrace, so jump the clock there. */
async function idle() {
  const nr = (Math.floor(SYS.vt / SYS.retracePeriod) + 1) * SYS.retracePeriod;
  const t = Math.min(SYS.nextF, nr) + 0.001;
  sysAdvance(t);
  await sysSync();
}

/* graphics.WaitScreen: wait for the start of the next vertical retrace. */
async function WaitScreen() {
  const nr = (Math.floor(SYS.vt / SYS.retracePeriod) + 1) * SYS.retracePeriod;
  sysAdvance(nr + 0.064);          // the sync pulse is two scan lines long
  VGA.onRetrace();
  await sysSync();
}

/* ---------------- Turbo Pascal Random ---------------- */
let RandSeed = 0;
function randomize() { RandSeed = (Math.random() * 0x100000000) >>> 0; }
/* System.Random(word): seed := seed*08088405h+1; result := seed*range shr 32 */
function random(range) {
  RandSeed = (Math.imul(RandSeed, 0x08088405) + 1) >>> 0;
  return Math.floor(RandSeed * (range & 0xffff) / 4294967296);
}

/* ---------------- keyboard (MULTKEYS) ---------------- */
const keydown = new Uint8Array(128);
function GlobalKeyDown() {
  for (let i = 0; i < 128; i++) if (keydown[i]) return true;
  return false;
}
const key_Esc = 0x01, key_1 = 0x02, key_2 = 0x03, key_3 = 0x04, key_4 = 0x05,
  key_Q = 0x10, key_W = 0x11, key_E = 0x12, key_R = 0x13, key_T = 0x14,
  key_Enter = 0x1c, key_Control = 0x1d, key_A = 0x1e, key_S = 0x1f, key_D = 0x20,
  key_Z = 0x2c, key_X = 0x2d, key_C = 0x2e, key_N = 0x31, key_M = 0x32, key_Space = 0x39,
  key_UpArrow = 0x48, key_LeftArrow = 0x4b, key_RightArrow = 0x4d,
  key_DownArrow = 0x50, key_NP0 = 0x52, key_NPMult = 0x37;

/* KeyboardEvent.code -> set 1 scancode (low 7 bits, as MULTKEYS stores it) */
const SCANCODES = {
  Escape: 0x01, Digit1: 0x02, Digit2: 0x03, Digit3: 0x04, Digit4: 0x05, Digit5: 0x06,
  Digit6: 0x07, Digit7: 0x08, Digit8: 0x09, Digit9: 0x0a, Digit0: 0x0b, Minus: 0x0c,
  Equal: 0x0d, Backspace: 0x0e, Tab: 0x0f, KeyQ: 0x10, KeyW: 0x11, KeyE: 0x12,
  KeyR: 0x13, KeyT: 0x14, KeyY: 0x15, KeyU: 0x16, KeyI: 0x17, KeyO: 0x18, KeyP: 0x19,
  BracketLeft: 0x1a, BracketRight: 0x1b, Enter: 0x1c, NumpadEnter: 0x1c,
  ControlLeft: 0x1d, ControlRight: 0x1d, KeyA: 0x1e, KeyS: 0x1f, KeyD: 0x20,
  KeyF: 0x21, KeyG: 0x22, KeyH: 0x23, KeyJ: 0x24, KeyK: 0x25, KeyL: 0x26,
  Semicolon: 0x27, Quote: 0x28, Backquote: 0x29, ShiftLeft: 0x2a, Backslash: 0x2b,
  KeyZ: 0x2c, KeyX: 0x2d, KeyC: 0x2e, KeyV: 0x2f, KeyB: 0x30, KeyN: 0x31, KeyM: 0x32,
  Comma: 0x33, Period: 0x34, Slash: 0x35, NumpadDivide: 0x35, ShiftRight: 0x36,
  NumpadMultiply: 0x37, AltLeft: 0x38, AltRight: 0x38, Space: 0x39, CapsLock: 0x3a,
  F1: 0x3b, F2: 0x3c, F3: 0x3d, F4: 0x3e, F5: 0x3f, F6: 0x40, F7: 0x41, F8: 0x42,
  F9: 0x43, F10: 0x44, NumLock: 0x45, ScrollLock: 0x46,
  Numpad7: 0x47, Home: 0x47, Numpad8: 0x48, ArrowUp: 0x48, Numpad9: 0x49, PageUp: 0x49,
  NumpadSubtract: 0x4a, Numpad4: 0x4b, ArrowLeft: 0x4b, Numpad5: 0x4c,
  Numpad6: 0x4d, ArrowRight: 0x4d, NumpadAdd: 0x4e, Numpad1: 0x4f, End: 0x4f,
  Numpad2: 0x50, ArrowDown: 0x50, Numpad3: 0x51, PageDown: 0x51,
  Numpad0: 0x52, Insert: 0x52, NumpadDecimal: 0x53, Delete: 0x53, F11: 0x57, F12: 0x58,
};

function sysKeyEvent(code, down) {
  const sc = SCANCODES[code];
  if (sc === undefined) return false;
  keydown[sc] = down ? 1 : 0;
  return true;
}
function sysReleaseAllKeys() { keydown.fill(0); }

/* ---------------- joystick (JOYSTICK unit) via the Gamepad API ---------- */
const gSticks = [null,
  { present: false, x: 0, y: 0, button1: false, button2: false, button3: false, button4: false },
  { present: false, x: 0, y: 0, button1: false, button2: false, button3: false, button4: false }];
const joystick = { nojoy: false };
let lastPadPoll = -1;

/* A pad reads like a calibrated analog stick: centre 100, range 0..200. */
function PollSticks() {
  if (joystick.nojoy) return;
  if (SYS.vt - lastPadPoll < 2 && lastPadPoll >= 0) return;
  lastPadPoll = SYS.vt;
  const s = gSticks[1];
  // no pad: read as a centred stick, so the calibrated bounds don't fire
  s.present = false; s.x = 100; s.y = 100;
  s.button1 = s.button2 = s.button3 = s.button4 = false;
  const pads = (navigator.getGamepads ? navigator.getGamepads() : []) || [];
  for (const p of pads) {
    if (!p || !p.connected) continue;
    let ax = p.axes[0] || 0, ay = p.axes[1] || 0;
    const b = i => !!(p.buttons[i] && p.buttons[i].pressed);
    if (b(14)) ax = -1; if (b(15)) ax = 1;
    if (b(12)) ay = -1; if (b(13)) ay = 1;
    s.present = true;
    s.x = Math.round(100 + ax * 100);
    s.y = Math.round(100 + ay * 100);
    s.button1 = b(0);
    s.button2 = b(1) || b(9);
    s.button3 = b(2);
    s.button4 = b(3) || b(8);
    break;
  }
}
function InitSticks() { PollSticks(); }
