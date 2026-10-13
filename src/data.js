'use strict';
/* ==========================================================================
   data.js - the game's directory, as a case-insensitive file system.

   DOS paths in the code ('str01.btm', 'ALL_SPR.69', 'overdm.map')
   are normalised to upper case with forward slashes.  The files come either
   from window.TALIBAH_FILES (the single-file build, gzip+base64) or are
   fetched from data/ (the served project).
   ========================================================================== */

/* Every file the Demo 4 build opens.  GRID.BTM is asked for by GameSelect
   but was not in the release (the picture after it covers the screen
   anyway), and BW9X9.FNT is in the zip but never opened. */
const DATA_FILES = [
  'CL7X9.FNT', 'CL7X8.FNT', 'BW26X22.FNT',
  'LGB.GRD', 'POPTXTBK.GRD', 'OVERLAY.GRD', 'RAIN.SPR',
  'ZASELEC.BTM', 'RT.BTM', 'ICEBK.BTM', 'WRPBK2.BTM', 'ASEDS.BTM', 'STR01.BTM', 'SFARSTAT.BTM',
  'ALL_SPR.69', 'SPRITES.WRD', 'DEMO.SND',
  'OVERDM.MAP', 'OVERDMT.MAP', 'CENTERDM.MAP', 'CAVEDM.MAP', 'ITOWNDM.MAP', 'TEMPDM.MAP',
  'DTOWNDM.MAP', 'FTOWNDM.MAP', 'VTOWNDM.MAP',
  'OVER99.SET', 'CAVENTER.SET', 'CAVE4-7.SET', 'INDTOWN.SET', 'TEMP6-22.SET',
  'DESTOWN.SET', 'FORTOWN.SET', 'VILTOWN.SET',
];

const FS = {
  files: new Map(),
  norm(p) { return p.replace(/\\/g, '/').toUpperCase(); },
  get(p) { return this.files.get(this.norm(p)) || null; },
  put(p, bytes) { this.files.set(this.norm(p), bytes); },
};

async function gunzip(bytes) {
  const ds = new DecompressionStream('gzip');
  const stream = new Blob([bytes]).stream().pipeThrough(ds);
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

function b64bytes(s) {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function loadAllData(progress) {
  if (window.TALIBAH_FILES) {
    const names = Object.keys(window.TALIBAH_FILES);
    let n = 0;
    for (const name of names) {
      FS.put(name, await gunzip(b64bytes(window.TALIBAH_FILES[name])));
      if (progress) progress(++n, names.length);
    }
    return;
  }
  let n = 0;
  await Promise.all(DATA_FILES.map(async name => {
    const r = await fetch('data/' + name);
    if (!r.ok) throw new Error('missing data/' + name);
    FS.put(name, new Uint8Array(await r.arrayBuffer()));
    if (progress) progress(++n, DATA_FILES.length);
  }));
}
