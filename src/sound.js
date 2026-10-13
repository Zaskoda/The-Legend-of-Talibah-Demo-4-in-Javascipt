'use strict';
/* ==========================================================================
   sound.js - SMIX (Ethan Brodsky's XMS Sound Blaster mixer, the version
   linked into the Demo 4 MAIN.EXE) and the game's sound unit that loads
   DEMO.SND.

   What the EXE shows:
     - The rate is a constant 22,025 Hz.  On a Sound Blaster 16 the mixer
       sends that number to the card (DSP 41h, 56h 09h); on older cards it
       becomes the time constant 256 - 1000000 div 22025 = 211 (22,222 Hz).
     - Samples are signed 8-bit mono.  The mixer works in 512-sample blocks,
       adds the eight voices together as signed words, and either shifts
       the sum left 5 bits for 16-bit output or clips it to -128..127 for
       8-bit output.  This port does the 16-bit path (no clipping).
     - StartSound(sound, index, loop) takes the first of 8 free voices and
       does nothing if all are busy.  StopSound(index) stops every voice
       started with that index.  SoundPlaying(index) is true while a voice
       with that index is playing.
     - DEMO.SND: word count, then count x {name[8], offset: longint,
       size: longint}, then the sample data.

   Playback uses Web Audio: one AudioBufferSourceNode per voice, all at
   22,025 Hz into one gain stage.  The browser resamples to its own rate.
   ========================================================================== */

const SMIX = {
  RATE: 22025,
  VOICES: 8,
  ctx: null,
  out: null,
  sounds: new Map(),     // name -> {data: Int8Array, buf: AudioBuffer|null}
  voices: [],            // {index, node, loop, endReal}
  on: false,             // sound.cfg found and InitSB worked
  loaded: false,
};

/* The sound unit's two flags ([0082h] music, [0083h] effects); both are set
   when sound.cfg is found. */
let MusicOn = false, SfxOn = false;

function smixContext() {
  if (SMIX.ctx) return SMIX.ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  try { SMIX.ctx = new AC(); } catch (e) { return null; }
  SMIX.out = SMIX.ctx.createGain();
  // A full-scale voice comes out of the 16-bit path at 127*32/32768 = 1/8
  // of full scale.  Keep that level relative to the other voices, but bring
  // the whole mix up so it isn't very quiet next to other tabs.
  SMIX.out.gain.value = 4;
  const comp = SMIX.ctx.createDynamicsCompressor();
  comp.threshold.value = -3; comp.knee.value = 0; comp.ratio.value = 20;
  comp.attack.value = 0.001; comp.release.value = 0.05;
  SMIX.out.connect(comp);
  comp.connect(SMIX.ctx.destination);
  return SMIX.ctx;
}
/* Browsers start audio only after a click or key press. */
function smixResume() {
  const c = smixContext();
  if (c && c.state === 'suspended') c.resume().catch(() => {});
}
function smixRunning() { return !!(SMIX.ctx && SMIX.ctx.state === 'running'); }

/* the sound unit's LoadSounds: read the DEMO.SND index */
function smixLoadSoundFile(name) {
  const f = FS.get(name);
  if (!f) { writelnDebug('Error opening ' + name); return false; }
  const dv = new DataView(f.buffer, f.byteOffset, f.byteLength);
  const count = dv.getUint16(0, true);
  for (let i = 0; i < count; i++) {
    const e = 2 + i * 16;
    let nm = '';
    for (let c = 0; c < 8; c++) { const b = f[e + c]; if (b === 0) break; nm += String.fromCharCode(b); }
    nm = nm.trim().toUpperCase();
    const off = dv.getUint32(e + 8, true), size = dv.getUint32(e + 12, true);
    SMIX.sounds.set(nm, { data: new Int8Array(f.buffer, f.byteOffset + off, size), buf: null });
  }
  SMIX.loaded = true;
  return true;
}

function smixBuffer(snd) {
  if (snd.buf) return snd.buf;
  const c = smixContext();
  if (!c) return null;
  const n = snd.data.length;
  const buf = c.createBuffer(1, Math.max(1, n), SMIX.RATE);
  const ch = buf.getChannelData(0);
  for (let i = 0; i < n; i++) ch[i] = snd.data[i] / 1024;   // (s * 32) / 32768
  snd.buf = buf;
  return buf;
}

function smixReap() {
  const now = realNow();
  SMIX.voices = SMIX.voices.filter(v => v.loop || now < v.endReal);
}

/* SMIX.StartSound */
function StartSound(name, index, loop) {
  if (!SMIX.on) return;
  smixReap();
  if (SMIX.voices.length >= SMIX.VOICES) return;
  const snd = SMIX.sounds.get(name);
  if (!snd) return;
  const v = { index, loop, node: null, endReal: realNow() + snd.data.length / SMIX.RATE * 1000 };
  const c = smixContext();
  const buf = smixBuffer(snd);
  if (c && buf) {
    const node = c.createBufferSource();
    node.buffer = buf;
    node.loop = !!loop;
    node.connect(SMIX.out);
    try { node.start(); } catch (e) { /* ignore */ }
    v.node = node;
  }
  SMIX.voices.push(v);
}
/* SMIX.StopSound */
function StopSound(index) {
  for (const v of SMIX.voices)
    if (v.index === index && v.node) { try { v.node.stop(); } catch (e) { /* ignore */ } v.node.disconnect(); }
  SMIX.voices = SMIX.voices.filter(v => v.index !== index);
}
/* SMIX.SoundPlaying */
function SoundPlaying(index) {
  smixReap();
  return SMIX.voices.some(v => v.index === index);
}
function smixStopAll() {
  for (const v of SMIX.voices) if (v.node) { try { v.node.stop(); } catch (e) { /* ignore */ } v.node.disconnect(); }
  SMIX.voices = [];
}

/* The sound unit's start-up (4f6:0287): what it printed in text mode. */
async function SoundInit(opts) {
  MusicOn = SfxOn = false;
  SMIX.on = false;
  if (!(opts && opts.sound)) {
    Writeln('Sound.Cfg NOT Found');
    return;
  }
  Writeln('Sound.Cfg Found');
  MusicOn = SfxOn = true;
  // DOSBox's default card: a Sound Blaster 16, DSP 4.05
  Writeln('DSP version 4.05:  ');
  Writeln('16-bit, ');
  Writeln('Auto-initialized');
  Write('Free XMS memory:  '); Write('15360'); Writeln('k  ');
  Write('Reguired XMS memory:  '); Write(String(0x901)); Writeln('k  ');
  Write('Loading sounds');
  SMIX.on = smixLoadSoundFile('DEMO.SND');
  // 2.3 MB from disk into XMS, one sound at a time
  for (const [, snd] of SMIX.sounds) {
    cpu(snd.data.length / 2000);        // about 2 MB/s
    await sysSync();
    Write('.');
  }
  Writeln('*');
  if (!SMIX.on) MusicOn = SfxOn = false;
}
function SoundShutdown() {
  smixStopAll();
  SMIX.on = false;
}
