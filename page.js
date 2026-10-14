'use strict';
/* ==========================================================================
   page.js - the web page around the game: loading, the presenter loop,
   keyboard and focus handling, full screen, and the setup panel that stands
   in for the command line.
   ========================================================================== */

const PAGE = { opts: { nojoy: false, sound: true }, running: null };

/* Put the machine back the way it is when MAIN.EXE starts. */
function resetMachine() {
  SYS.f_clk.fill(0); SYS.s_clk.fill(0);
  SYS.rate = -1; setrate(18);
  sysReleaseAllKeys();
  last_key = 0;
  TheScreen.fill(0);
  VGA.mem.fill(0);
  VGA.scenes.length = 0; VGA.building = null; VGA.realGen++;
  RainOn = false; Rain = null; KillSprite(Drops);
  Font1 = Font2 = Font3 = Font4 = null;
  for (const s of NPCBitMaps) KillSprite(s);
  KillSprite(C1BitMaps); KillSprite(C2BitMaps); KillSprite(C3BitMaps); KillSprite(ObjBitMaps);
  OWM = null; MapWarpLUT = null; TileLUT = null; MapTiles.fill(null); NPCs.fill(null); Boxes.fill(null);
  OverLay = null; PopBack = null; MenuInfo = null; Words = null; GlobalStats = null; maplut = null;
  IntroStep = 0;
  smixStopAll(); SMIX.on = false; MusicOn = SfxOn = false;
  crtReset();
}

async function runForever() {
  for (;;) {
    SYS.aborted = null;
    resetMachine();
    try {
      await TalibahProgram(PAGE.opts);
    } catch (e) {
      if (e instanceof AbortRun) return;
      try { console.error(e); } catch (e2) { /* ignore */ }
      document.getElementById('status').textContent = 'The game stopped with an error: ' + e.message;
      smixStopAll();
      return;
    }
  }
}

function startRun() {
  PAGE.running = runForever();
}

async function restartWith(opts) {
  PAGE.opts = opts;
  SYS.aborted = new AbortRun();
  try { await PAGE.running; } catch (e) { /* already reported */ }
  document.getElementById('status').textContent = '';
  startRun();
}

function frame() {
  vgaPresent();
  requestAnimationFrame(frame);
}

function toggleFullscreen() {
  const el = document.getElementById('screenwrap');
  if (document.fullscreenElement) document.exitFullscreen();
  else if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
  focusGame();
}
function focusGame() { document.getElementById('screen').focus({ preventScroll: true }); }

function setupInput() {
  const canvas = document.getElementById('screen');
  const isFormField = (t) => t && (t.tagName === 'INPUT' || t.tagName === 'SELECT' || t.tagName === 'TEXTAREA');
  window.addEventListener('keydown', (e) => {
    if (isFormField(e.target) && e.target.type !== 'checkbox') return;
    if (e.code === 'KeyF' && !e.ctrlKey && !e.altKey && !e.metaKey) {
      if (!e.repeat) toggleFullscreen();
      e.preventDefault();
      return;
    }
    if (e.ctrlKey && e.code !== 'ControlLeft' && e.code !== 'ControlRight') return;   // leave browser shortcuts alone
    if (e.target !== canvas && e.target !== document.body) {
      // a page button has focus: let Space/Enter go to the game instead
      if (e.code === 'Space' || e.code === 'Enter' || e.code === 'NumpadEnter') { e.preventDefault(); focusGame(); }
      else return;
    }
    smixResume();
    if (starKey(e, true)) { e.preventDefault(); return; }
    if (sysKeyEvent(e.code, true)) e.preventDefault();
  });
  window.addEventListener('keyup', (e) => {
    if (starKey(e, false)) { e.preventDefault(); return; }
    if (sysKeyEvent(e.code, false)) e.preventDefault();
  });
  window.addEventListener('blur', sysReleaseAllKeys);
  canvas.addEventListener('pointerdown', () => { smixResume(); focusGame(); });
  window.addEventListener('pointerdown', smixResume);
}

/* The menu is the * on the number pad.  A keyboard without one can use
   the * on the main keys (Shift+8) instead. */
let starHeld = false;
function starKey(e, down) {
  if (down && e.key === '*' && e.code !== 'NumpadMultiply') {
    starHeld = true; keydown[key_NPMult] = 1; return true;
  }
  if (!down && starHeld && (e.code === 'Digit8' || e.key === '*')) {
    starHeld = false; keydown[key_NPMult] = 0; return true;
  }
  return false;
}

function setupPanel() {
  const joy = document.getElementById('opt-joy');
  const snd = document.getElementById('opt-sound');
  const crt = document.getElementById('opt-43');
  const wrap = document.getElementById('screenwrap');
  const apply43 = () => wrap.classList.toggle('square', !crt.checked);
  crt.addEventListener('change', () => { apply43(); try { localStorage.setItem('talibah.43', crt.checked ? '1' : '0'); } catch (e) {} focusGame(); });
  try { if (localStorage.getItem('talibah.43') === '0') crt.checked = false; } catch (e) {}
  apply43();
  document.getElementById('btn-play').addEventListener('click', () => {
    smixResume();
    restartWith({ nojoy: !joy.checked, sound: snd.checked });
    focusGame();
  });
  document.getElementById('btn-full').addEventListener('click', toggleFullscreen);
  joy.addEventListener('change', focusGame);
  snd.addEventListener('change', focusGame);
}


/* On-screen controls: a d-pad and the three keys the game needs.  They
   press and release the same scancodes as the keyboard. */
function setupTouch() {
  const det = document.getElementById('touch');
  if (!det) return;
  try { if (localStorage.getItem('talibah.touch') === '1') det.open = true; } catch (e) {}
  det.addEventListener('toggle', () => {
    try { localStorage.setItem('talibah.touch', det.open ? '1' : '0'); } catch (e) {}
  });
  const setKey = (code, down) => { sysKeyEvent(code, down); };

  /* d-pad: one area; the direction follows the finger, so you can slide
     from one arrow to another without lifting */
  const pad = document.getElementById('dpad');
  const arrows = { ArrowUp: pad.querySelector('.u'), ArrowDown: pad.querySelector('.d'),
    ArrowLeft: pad.querySelector('.l'), ArrowRight: pad.querySelector('.r') };
  let cur = null, padPointer = null;
  const setDir = (dir) => {
    if (dir === cur) return;
    if (cur) { setKey(cur, false); arrows[cur].classList.remove('on'); }
    cur = dir;
    if (cur) { setKey(cur, true); arrows[cur].classList.add('on'); }
  };
  const dirAt = (e) => {
    const r = pad.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
    if (Math.hypot(dx, dy) < r.width * 0.12) return null;     // dead centre
    return Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'ArrowLeft' : 'ArrowRight') : (dy < 0 ? 'ArrowUp' : 'ArrowDown');
  };
  pad.addEventListener('pointerdown', (e) => {
    e.preventDefault(); smixResume();
    padPointer = e.pointerId; pad.setPointerCapture(e.pointerId); setDir(dirAt(e));
  });
  pad.addEventListener('pointermove', (e) => { if (e.pointerId === padPointer) setDir(dirAt(e)); });
  const padUp = (e) => { if (e.pointerId === padPointer) { padPointer = null; setDir(null); } };
  pad.addEventListener('pointerup', padUp);
  pad.addEventListener('pointercancel', padUp);
  pad.addEventListener('lostpointercapture', padUp);

  /* buttons: held while the finger is down */
  for (const b of document.querySelectorAll('.tbtn')) {
    const code = b.dataset.key;
    const up = () => { b.classList.remove('on'); setKey(code, false); };
    b.addEventListener('pointerdown', (e) => {
      e.preventDefault(); smixResume();
      b.setPointerCapture(e.pointerId);
      b.classList.add('on'); setKey(code, true);
    });
    b.addEventListener('pointerup', up);
    b.addEventListener('pointercancel', up);
    b.addEventListener('lostpointercapture', up);
    b.addEventListener('contextmenu', (e) => e.preventDefault());
    b.addEventListener('click', (e) => e.preventDefault());
  }
  pad.addEventListener('contextmenu', (e) => e.preventDefault());
}

async function boot() {
  const status = document.getElementById('status');
  const canvas = document.getElementById('screen');
  vgaInit(canvas);
  setupInput();
  setupPanel();
  setupTouch();
  requestAnimationFrame(frame);
  try {
    await loadAllData((n, t) => { status.textContent = 'Loading ' + n + ' / ' + t; });
  } catch (e) {
    status.textContent = 'Could not load the game data: ' + e.message +
      ' (open the single-file TALIBAH.html, or serve this folder over HTTP).';
    return;
  }
  status.textContent = '';
  // Browsers keep sound off until the page is clicked or a key is pressed.
  // If it is off, wait for that before starting, so the opening logo's
  // sound plays as it should.
  smixContext();
  if (!smixRunning() && document.getElementById('opt-sound').checked) {
    const gate = document.getElementById('gate');
    gate.hidden = false;
    await new Promise(res => {
      const go = () => {
        window.removeEventListener('keydown', go, true);
        window.removeEventListener('pointerdown', go, true);
        smixResume();
        res();
      };
      window.addEventListener('keydown', go, true);
      window.addEventListener('pointerdown', go, true);
    });
    gate.hidden = true;
  }
  sysReleaseAllKeys();
  SYS.base = performance.now();
  SYS.vt = 0; SYS.nextF = SYS.fPeriod;
  focusGame();
  startRun();
}

window.addEventListener('load', boot);
