'use strict';
/* ==========================================================================
   vars.js - the VARS unit of the Demo 4 MAIN.EXE (November 1997): global
   variables, the key and joystick tests, map loading and map changes.

   Demo 4's source is lost.  This follows the EXE (unit segment A19h),
   with the 1999 VARS.PAS as the guide to names.  The party record keeps
   the fields the 1999 walking code needs (cut, height, lastmove).
   ========================================================================== */

const SpriteTextFileName = 'SPRITES.WRD';
const Master_Sprite_File = 'ALL_SPR.69';

const Drops_Loc = 34;            // the rain drops in ALL_SPR.69 (RAIN.SPR holds the same 12 frames)
const NUM_OF_MAP_WARPS = 50;
const NUM_OF_NPCS = 32;
const NUM_OF_BOXES = 32;
const NUM_OF_TREASURE = 16;
const key_repeat_speed = 4;
const Num_of_SmallBits = 255;

/* sprite sets in ALL_SPR.69 that the Demo 4 code names */
const SFARM = 2, GERWIN = 6, VENETIA = 8, BOAT = 19;

let last_key = 0;
let down_bound = 0, up_bound = 0, right_bound = 0, left_bound = 0;

/* ---------- Pascal strings ----------
   A string[38] is 39 bytes: a length byte and 38 characters.  PopText draws
   all 38 whatever the length, so the bytes are kept raw. */
function pstrAssign(buf, s, max) {
  const n = Math.min(s.length, max);
  buf[0] = n;
  for (let i = 0; i < n; i++) buf[i + 1] = s.charCodeAt(i) & 255;
}
/* StoryTextBlock = array[0..4] of string[38] */
function newWords() { return [0, 1, 2, 3, 4].map(() => new Uint8Array(39)); }

/* ---------- GlobalStats ----------
   Demo 4's record is 51 bytes: TalkRate, WalkRate, Map, then per party
   member Name: string[8], Alive, X, Y, Offset, Dir, Frame, Sprt.  Nothing
   saves it, so it's kept as plain fields.  cut, height and lastmove are
   the 1999 fields for wading/trees, hills and the party following. */
function makeGlobalStats() {
  const gs = { talkrate: 0, walkrate: 0, map: 0 };
  for (const c of ['c1', 'c2', 'c3']) {
    Object.assign(gs, {
      [c + 'name']: '', [c + 'alive']: 0, [c + 'x']: 0, [c + 'y']: 0, [c + 'offset']: 0,
      [c + 'dir']: 1, [c + 'frame']: 1, [c + 'sprt']: 0,
      [c + 'cut']: 20, [c + 'height']: 5, [c + 'lastmove']: 1, [c + 'effect']: 0,
    });
  }
  gs.alive = (n) => !!gs['c' + n + 'alive'];
  return gs;
}

/* ---------- global variables ---------- */
let Words = null;                 // STBPtr
let maplut = null;
let GlobalStats = null;
let C1BitMaps = new Array(12).fill(null);   // SpriteFrames = array[0..11] of SmallBlock
let C2BitMaps = new Array(12).fill(null);
let C3BitMaps = new Array(12).fill(null);
const NPCBitMaps = Array.from({ length: 256 }, () => new Array(12).fill(null));
let ObjBitMaps = new Array(12).fill(null);   // Demo 4 has no boxes or chests
let EffectSprite = new Array(12).fill(null); // nor the 1999 sparkle

let OverLay = null;               // {top, bot, left, right, panel}: rows of bytes
let PopBack = null;               // 60 rows of 310
let OWM = null;                   // {back, forth, NPCMAPData, TreasureData}
let TileLUT = null;
let MapWarpLUT = null;            // index 6..50 -> {x,y}
const MapTiles = new Array(Num_of_SmallBits).fill(null);
const NPCs = new Array(NUM_OF_NPCS).fill(null);
const Boxes = new Array(NUM_OF_BOXES).fill(null);

/* the MapRec arrays are [x,y]: element (x,y) is at x*180+y */
function owmBack(x, y) {
  if (x < 0 || y < 0 || x > 179 || y > 179) return 0;
  return OWM.back[x * 180 + y];
}
function owmForth(x, y) {
  if (x < 0 || y < 0 || x > 179 || y > 179) return 0;
  return OWM.forth[x * 180 + y];
}
function setForth(x, y, v) {
  if (x < 0 || y < 0 || x > 179 || y > 179) return;
  OWM.forth[x * 180 + y] = v & 255;
}
function treasureTaken() { return false; }

/* Demo 4 had no debug.txt and ignored files it couldn't open (GameSelect asks
   for GRID.BTM, which wasn't in the release).  Such notes are kept here, out
   of the console: read debugLines in the browser's console to see them. */
const debugLines = [];
function writelnDebug(s) { debugLines.push(s); }

/* ---------- key entry functions (a19:0000..025f) ---------- */
function ButtonDown() {
  PollSticks();
  const s = gSticks[1];
  return GlobalKeyDown() || s.button1 || s.button2 || s.button3 || s.button4;
}
function SomethingDown() {
  PollSticks();
  const s = gSticks[1];
  return GlobalKeyDown() || s.y < up_bound || s.y > down_bound ||
    s.x < left_bound || s.x > right_bound ||
    s.button1 || s.button2 || s.button3 || s.button4;
}

/* Each test accepts the key once, then again only after s_clk[3] (key
   repeat, about 4/18 s) runs out or a different key is used. */
function keyTest(code, stick) {
  PollSticks();
  if (!((last_key === code) && (SYS.s_clk[3] !== 0))) {
    if (keydown[code] || stick()) {
      last_key = code;
      SYS.s_clk[3] = key_repeat_speed;
      return true;
    }
  }
  return false;
}
/* Demo 4 has one "power key": Enter or button 1 (the README says Space as
   well, but the EXE only tests Enter) */
function EscapeKey() { return keyTest(key_Esc, () => gSticks[1].button4); }
function PowerKey() { return keyTest(key_Enter, () => gSticks[1].button1); }
function Up() { return keyTest(key_UpArrow, () => gSticks[1].y < up_bound); }
function Down() { return keyTest(key_DownArrow, () => gSticks[1].y > down_bound); }
function Left() { return keyTest(key_LeftArrow, () => gSticks[1].x < left_bound); }
function Right() { return keyTest(key_RightArrow, () => gSticks[1].x > right_bound); }

/* main.Frame: walking frame for a position and direction */
function Frame(x, y, offset, dir) {
  const mid = (offset > 5) && (offset < 15);
  if (dir === 1) return mid ? ((y & 1) ? 0 : 2) : 1;
  if (dir === 2) return mid ? ((x & 1) ? 3 : 5) : 4;
  if (dir === 3) return mid ? ((y & 1) ? 6 : 8) : 7;
  return mid ? ((x & 1) ? 9 : 11) : 10;
}

/* vars.SetUpSticks.  The original calibrated the stick in text mode
   ("Press Button 1 (A) while holding joystick UP and LEFT"...); a browser
   pad reports calibrated axes already, so this sets the bounds that
   calibration would have produced (a dead zone of half the travel). */
function SetUpSticks(opts) {
  right_bound = 4000; down_bound = 4000; left_bound = 0; up_bound = 0;
  joystick.nojoy = !!(opts && opts.nojoy);
  if (!joystick.nojoy) {
    InitSticks();
    if (gSticks[1].present) Writeln('Joystick/pad detected...');
    else Writeln('No joystick/pad detected...');
    left_bound = 50; right_bound = 150; up_bound = 50; down_bound = 150;
  }
}

/* ---------- file loading ---------- */
function smallBtm(bytes, index) {
  const o = index * 400;
  if (!bytes || o + 400 > bytes.length) return null;
  return bytes.subarray(o, o + 400);
}

/* vars.LoadSprite: 12 frames from ALL_SPR.69 */
function LoadSprite(who, number) {
  const f = FS.get(Master_Sprite_File);
  if (!f) { writelnDebug('Error opening ' + Master_Sprite_File); return; }
  for (let c1 = 0; c1 < 12; c1++) {
    const b = smallBtm(f, number * 12 + c1);
    who[c1] = b ? Uint8Array.from(b) : (who[c1] || new Uint8Array(400));
  }
}
function KillSprite(who) { for (let c1 = 0; c1 < 12; c1++) who[c1] = null; }
function KillAllNPCSprites() {
  for (let c1 = 0; c1 < NUM_OF_NPCS; c1++) KillSprite(NPCBitMaps[c1]);
}

/* The two overworld maps get the 1999 tree marking: forth code 69 (wade
   into the trees, no battles) on every full forest tile (OVER.SET tile 1)
   whose cell is empty.  The 1999 OVER.MAP marks its forests this way; the
   Demo 4 maps predate the effect.  The files themselves are not changed. */
const TREE_MAPS = new Set(['OVERDM', 'OVERDMT']);
const TREE_TILE = 1, TREE_CODE = 69;
function markTrees(name) {
  if (!TREE_MAPS.has(name.toUpperCase())) return;
  for (let i = 0; i < 32400; i++)
    if (OWM.back[i] === TREE_TILE && OWM.forth[i] === 0) OWM.forth[i] = TREE_CODE;
}

/* vars.LoadOWM (a19:0616): the Demo 4 MapRec is back[180,180],
   forth[180,180], NPCMAPData[128] - 64928 bytes, no treasure table */
function LoadOWM(filename) {
  if (MapWarpLUT === null) MapWarpLUT = Array.from({ length: NUM_OF_MAP_WARPS + 1 }, () => ({ x: 0, y: 0 }));
  if (OWM === null) OWM = {
    back: new Uint8Array(32400), forth: new Uint8Array(32400),
    NPCMAPData: new Uint8Array(128), TreasureData: new Uint8Array(32),
  };
  const f = FS.get(filename + '.map');
  if (f) {
    OWM.back.set(f.subarray(0, 32400));
    OWM.forth.set(f.subarray(32400, 64800));
    OWM.NPCMAPData.set(f.subarray(64800, 64928));
  } else writelnDebug('File not found ' + filename);
  markTrees(filename);

  /* warps: forth 6..50 */
  for (let c1 = 0; c1 <= 179; c1++)
    for (let c2 = 0; c2 <= 179; c2++) {
      const v = owmForth(c1, c2);
      if (v < NUM_OF_MAP_WARPS + 1 && v > 5) { MapWarpLUT[v].x = c1; MapWarpLUT[v].y = c2; }
    }
  /* NPCs: forth 194..225 */
  for (let c1 = 0; c1 <= 179; c1++)
    for (let c2 = 0; c2 <= 179; c2++) {
      const v = owmForth(c1, c2);
      if (v > 193 && v < 194 + NUM_OF_NPCS) {
        const n = v - 194;
        if (NPCs[n] === null) NPCs[n] = {};
        NPCs[n].x = c1; NPCs[n].y = c2; NPCs[n].dir = 1; NPCs[n].offset = 0; NPCs[n].frame = 1;
        NPCs[n].sprt = OWM.NPCMAPData[n];
        if (NPCBitMaps[NPCs[n].sprt][1] === null) LoadSprite(NPCBitMaps[NPCs[n].sprt], NPCs[n].sprt);
      }
    }
}

/* vars.LoadMapTiles: 255 tiles of a .SET, and TileLUT = each tile's most
   common colour (for the debug mini map) */
function LoadMapTiles(filename) {
  const f = FS.get(filename + '.set');
  for (let c1 = 0; c1 < Num_of_SmallBits; c1++) {
    if (MapTiles[c1] === null) MapTiles[c1] = new Uint8Array(400);
    if (f) { const b = smallBtm(f, c1); if (b) MapTiles[c1].set(b); }
  }
  if (!f) writelnDebug('Error opening file ' + filename + '.set');
  if (TileLUT === null) TileLUT = new Uint8Array(Num_of_SmallBits);
  const totals = new Uint8Array(256);   // byte counters, as in the original
  for (let c1 = 0; c1 < Num_of_SmallBits; c1++) {
    totals.fill(0);
    for (let i = 0; i < 400; i++) totals[MapTiles[c1][i]]++;
    let c3 = 0;
    for (let c2 = 0; c2 <= 255; c2++) if (totals[c2] > totals[c3]) c3 = c2;
    TileLUT[c1] = c3;
  }
}

function KillOWM() {
  MapWarpLUT = null;
  OWM = null;
  KillAllNPCSprites();
  for (let c3 = 0; c3 < NUM_OF_NPCS; c3++) NPCs[c3] = null;
}
function KillMapTiles() {
  for (let c1 = 0; c1 < Num_of_SmallBits; c1++) MapTiles[c1] = null;
  TileLUT = null;
}

/* the first forth[] cell (column by column) holding v */
function findForth(v) {
  for (let c1 = 0; c1 <= 179; c1++)
    for (let c2 = 0; c2 <= 179; c2++)
      if (owmForth(c1, c2) === v) return [c1, c2];
  return null;
}
function partyTo(x, y) {
  const G = GlobalStats;
  G.c1x = x; G.c1y = y; G.c2x = x; G.c2y = y; G.c3x = x; G.c3y = y;
}
/* the 1999 ChangeMap and ExitMap also put everyone back on their feet */
function resetCutHeight() {
  const G = GlobalStats;
  G.c1cut = 20; G.c2cut = 20; G.c3cut = 20;
  G.c1height = 5; G.c2height = 5; G.c3height = 5;
}

/* vars.ChangeMap (a19:0de3): the whole party stands on the entrance mark
   for the way the leader is facing (3 down, 2 right, 5 up, 4 left) */
function ChangeMap(wich) {
  const G = GlobalStats;
  resetCutHeight();
  G.map = wich;
  KillOWM();
  LoadOWM(maplut.mapname[G.map]);
  LoadMapTiles(maplut.tileset[G.map]);
  const d = G.c1dir;
  const mark = d === 1 ? 3 : d === 2 ? 2 : d === 3 ? 5 : d === 4 ? 4 : -1;
  const p = mark >= 0 ? findForth(mark) : null;
  if (p) partyTo(p[0], p[1]);
}

/* vars.ExitMap (a19:10ab): back to the map this one leads from, on the
   cell that leads here, with the leader one step on */
function ExitMap() {
  const G = GlobalStats;
  resetCutHeight();
  const fromap = G.map;
  G.map = maplut.mapfrom[G.map];
  KillOWM();
  LoadOWM(maplut.mapname[G.map]);
  LoadMapTiles(maplut.tileset[G.map]);
  const p = findForth(fromap);
  if (p) partyTo(p[0], p[1]);
  if (G.c1dir === 1) G.c1y = (G.c1y + 1) & 255;
  else if (G.c1dir === 2) G.c1x = (G.c1x + 1) & 255;
  else if (G.c1dir === 3) G.c1y = (G.c1y - 1) & 255;
  else if (G.c1dir === 4) G.c1x = (G.c1x - 1) & 255;
}

/* vars.init_maplut (a19:1286) */
function init_maplut() {
  maplut = { mapname: {}, mapfrom: {}, tileset: {} };
  const set = (n, name, tiles) => {
    maplut.mapname[n] = name; maplut.mapfrom[n] = 127; maplut.tileset[n] = tiles;
  };
  set(127, 'overdm', 'over99');      // the 1999 OVER.SET (see README)
  set(128, 'centerdm', 'caventer');
  set(129, 'cavedm', 'cave4-7');
  set(130, 'itowndm', 'indtown');      // Nilta
  set(131, 'tempdm', 'temp6-22');
  set(132, 'dtowndm', 'destown');      // Eldurop
  set(133, 'ftowndm', 'fortown');
  set(134, 'vtowndm', 'viltown');
  set(135, 'caventer', 'caventer');    // no such map in the demo; nothing links here
  set(136, 'overdmt', 'over99');       // the sea the boat crosses at the start
}
function kill_maplut() { maplut = null; }

/* LoadTextBlock (main, 000:1e86): record 'wich' of SPRITES.WRD */
function LoadTextBlock(wich) {
  pstrAssign(Words[0], '                                      ', 38);
  pstrAssign(Words[1], '                                      ', 38);
  pstrAssign(Words[2], ' nothing at all                       ', 38);
  pstrAssign(Words[3], '                                      ', 38);
  pstrAssign(Words[4], '                                      ', 38);
  const f = FS.get(SpriteTextFileName);
  if (!f) return;
  const o = wich * 195;
  if (o > f.length) return;              // the seek fails; the text stays "nothing at all"
  if (o + 195 > f.length) {              // the read fails
    pstrAssign(Words[0], '                                      ', 38);
    pstrAssign(Words[1], '                                      ', 38);
    pstrAssign(Words[2], ' no text!!!!!!!                       ', 38);
    pstrAssign(Words[3], '                                      ', 38);
    pstrAssign(Words[4], '                                      ', 38);
    return;
  }
  for (let l = 0; l < 5; l++) Words[l].set(f.subarray(o + l * 39, o + l * 39 + 39));
}
