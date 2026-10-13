'use strict';
/* ==========================================================================
   main.js - the main program of The Legend of Talibah Demo 4 (MAIN.EXE,
   30 November 1997, "Snazzy Engine (tm) v.01 (pre alpha)").

   Demo 4's source is lost.  Every procedure here was read from the EXE's
   main code segment, with LAB.PAS (29 November 1997, the nearest surviving
   source) for the names and the shape of the code.  Addresses in the
   comments are segment:offset in that EXE.

   The walking screen uses the 1999 engine: the 220x200 view, the party
   following in single file, wading into trees and hills.  Everything the
   player sees and hears apart from that - the screens, the menus, the
   text, the boat trip, the music and sounds and their timing - is Demo 4.
   ========================================================================== */

/* main.MoveAni (000:00b1): rotate the water reds 179..183 and blues 184..188 */
function MoveAni() {
  let t = GetRgbPalette(179);
  for (let c1 = 0; c1 <= 3; c1++) { const p = GetRgbPalette(c1 + 180); ASetRGBPalette(c1 + 179, ...p); }
  ASetRGBPalette(183, ...t);
  t = GetRgbPalette(184);
  for (let c1 = 0; c1 <= 3; c1++) { const p = GetRgbPalette(c1 + 185); ASetRGBPalette(c1 + 184, ...p); }
  ASetRGBPalette(188, ...t);
}

/* main.SetUpPal (000:019f): the map and sprite colours */
function SetUpPal() {
  for (let c1 = 0; c1 <= 9; c1++) ASetRGBPalette(c1 + 64, c1 * 4 + 17, c1 * 4 + 17, c1 * 4 + 17);
  for (let c1 = 0; c1 <= 9; c1++) ASetRGBPalette(c1 + 74, c1, c1 * 4 + 25, c1);
  for (let c1 = 0; c1 <= 9; c1++) ASetRGBPalette(c1 + 84, c1, c1, c1 * 4 + 25);
  for (let c1 = 0; c1 <= 9; c1++) ASetRGBPalette(c1 + 94, c1 * 3 + 30, c1 * 2 + 15, c1 + 7);
  for (let c1 = 0; c1 <= 4; c1++) ASetRGBPalette(c1 + 104, c1 * 3 + 30, c1, c1);
  for (let c1 = 0; c1 <= 1; c1++) ASetRGBPalette(c1 + 109, c1 * 3 + 7, c1 * 3 + 7, c1 * 3 + 10);
  for (let c1 = 2; c1 <= 3; c1++) ASetRGBPalette(c1 + 109, c1 * 6 + 40, c1 * 6 + 40, 63);
  ASetRGBPalette(113, 63, 63, 63);
  for (let c1 = 0; c1 <= 2; c1++) ASetRGBPalette(c1 + 114, c1 * 6 + 15, c1 * 3 + 7, c1 * 2 + 2);
  for (let c1 = 0; c1 <= 1; c1++) ASetRGBPalette(c1 + 117, 23 + c1 * 5, 23 + c1 * 5, 35 + c1 * 6);
  for (let c1 = 0; c1 <= 4; c1++) ASetRGBPalette(c1 + 119, c1 * 5 + 35, c1 * 6 + 35, c1 * 2);
  for (let c1 = 0; c1 <= 4; c1++) ASetRGBPalette(c1 + 124, c1 * 5 + 35, c1 * 2, c1 * 6 + 35);
  for (let c1 = 0; c1 <= 4; c1++) ASetRGBPalette(c1 + 124, c1 * 2, c1 * 5 + 35, c1 * 6 + 35);
  for (let c1 = 0; c1 <= 4; c1++) ASetRGBPalette(c1 + 129, c1 * 6 + 10, c1 * 3 + 4, c1 * 7 + 10);
  for (let c1 = 0; c1 <= 4; c1++) ASetRGBPalette(c1 + 134, 8 + c1 * 3, 4, 4);
  for (let c1 = 0; c1 <= 4; c1++) ASetRGBPalette(c1 + 139, 4, 8 + c1 * 3, 4);
  for (let c1 = 0; c1 <= 4; c1++) ASetRGBPalette(c1 + 144, 4, 4, 8 + c1 * 3);
  for (let c1 = 0; c1 <= 4; c1++) ASetRGBPalette(c1 + 149, c1 * 5 + 11, c1 * 5 + 15, c1 * 5 + 30);
  for (let c1 = 0; c1 <= 4; c1++) ASetRGBPalette(c1 + 154, 5 + c1 * 2, 5 + c1 * 2, 5 + c1 * 2);
  for (let c1 = 0; c1 <= 4; c1++) ASetRGBPalette(c1 + 159, c1 * 3 + 15, c1 * 2 + 7, c1 + 2);
  for (let c1 = 0; c1 <= 4; c1++) ASetRGBPalette(c1 + 164, 50 - c1 * 2, 46 - c1 * 5, 36 - c1 * 6);
  for (let c1 = 0; c1 <= 4; c1++) ASetRGBPalette(c1 + 169, c1 * 2, c1 * 5, c1 * 4);
  ASetRGBPalette(174, 33, 14, 7);
  ASetRGBPalette(175, 30, 11, 5);
  ASetRGBPalette(176, 26, 9, 4);
  for (let c1 = 0; c1 <= 2; c1++) ASetRGBPalette(c1 + 179, c1 * 5 + 46, c1 * 3 + 10, c1 * 2 + 10);
  for (let c1 = 3; c1 <= 4; c1++) ASetRGBPalette(c1 + 179, (5 - c1) * 5 + 46, (5 - c1) * 3 + 10, (5 - c1) * 2 + 10);
  for (let c1 = 0; c1 <= 2; c1++) ASetRGBPalette(c1 + 184, c1 * 2 + 5, c1 * 2 + 5, c1 * 5 + 35);
  for (let c1 = 3; c1 <= 4; c1++) ASetRGBPalette(c1 + 184, (4 - c1) * 2 + 5, (4 - c1) * 2 + 5, (4 - c1) * 5 + 35);
}

/* the "dark sky" for rain: the map colours at half brightness */
function DarkenMapPal(pal) {
  FetchPal(pal);
  for (let c1 = 64; c1 <= 188; c1++)
    ASetRGBPalette(c1, pal[c1 * 3] >> 1, pal[c1 * 3 + 1] >> 1, pal[c1 * 3 + 2] >> 1);
}
/* the text-box colours */
function SetBoxColors() {
  for (let c1 = 0; c1 <= 2; c1++) ASetRGBPalette(c1 + 10, 63 - c1 * 7, 59 - c1 * 10, 54 - c1 * 14);
}
/* the brown (1..20) the walking screen starts with */
function SetBrowns() {
  for (let c1 = 1; c1 <= 20; c1++) ASetRGBPalette(c1, c1 * 3 + 10, c1 * 2 + 5, c1);
}
/* the side panel's greens (24..37) */
function SetPanelGreens() {
  for (let c1 = 1; c1 <= 7; c1++) ASetRGBPalette(c1 + 23, c1 + 30, c1 * 3 + 40, c1 * 5 + 20);
  for (let c1 = 1; c1 <= 7; c1++) ASetRGBPalette(c1 + 30, c1 * 3 + 40, c1 * 5 + 20, c1 + 30);
}

/* main.Credits (000:08d9) */
async function Credits() {
  await FadeOut(20);
  ClearScreen();
  PushScreen();
  DispFullBtmBuf('aseds.Btm');
  const temp = Uint8Array.from(TheScreen);
  for (let c1 = 1; c1 <= 5; c1++) ASetRGBPalette(c1, 63 - c1 * 7, 63 - c1 * 7, 63 - c1 * 2);
  for (let c1 = 1; c1 <= 5; c1++) ASetRGBPalette(c1 + 5, 63 - c1 * 8, 63 - c1 * 4, 63 - c1 * 9);
  for (let c1 = 1; c1 <= 5; c1++) ASetRGBPalette(c1 + 10, 63 - c1 * 2, 63 - c1 * 7, 63 - c1 * 7);
  await PushFadeIn(20);
  if (SfxOn) StartSound('INSOC', 2, false);

  let c1 = 0;
  while (ButtonDown()) await idle();
  while (!ButtonDown()) {
    if (c1 < 10) {
      c1++;
      AsmPush(temp, TheScreen);
      OutTextXyRange1(40, 15 * c1, 1, 'This game is dedicated to:');
      OutTextXyRange1(60, 17 * c1, 7, '        Amanda June Eldridge');
      cpu(1.0);
      PushScreen();
      await sysSync();
    } else await idle();
  }
  if (SfxOn) StartSound('INSOC', 2, false);
  while (c1 > 0) {
    c1--;
    AsmPush(temp, TheScreen);
    OutTextXyRange1(50, 5 * c1, 11, 'Production-');
    OutTextXyRange1(60, 6 * c1, 1, 'Scott Dudley');
    OutTextXyRange1(200, 6 * c1, 6, 'Zaskoda');
    OutTextXyRange1(50, 10 * c1, 11, 'Art-');
    OutTextXyRange1(60, 11 * c1, 1, 'Scott Dudley');
    OutTextXyRange1(200, 11 * c1, 6, 'Zaskoda');
    OutTextXyRange1(50, 14 * c1, 11, 'Code-');
    OutTextXyRange1(60, 15 * c1, 1, 'Scott Dudley');
    OutTextXyRange1(200, 15 * c1, 6, 'Zaskoda');
    cpu(1.0);
    PushScreen();
    await sysSync();
  }
  await FadeOut(20);
  while (GlobalKeyDown()) await idle();
}

/* main.RUSure (000:0be8): the yes/no box in the middle of the screen */
async function RUSure(text) {
  const buffer = new Uint8Array(99 * 30);
  for (let c1 = 0; c1 <= 98; c1++)
    for (let c2 = 0; c2 <= 29; c2++)
      buffer[c1 * 30 + c2] = TheScreen[(c1 + 110) + 320 * 50 + c2 * 320];

  for (let c3 = 0; c3 <= 5; c3++) {
    for (let c2 = 0; c2 <= 29; c2++)
      for (let c1 = 0; c1 <= 98; c1++)
        if (random(5) === 1) putpixel(c1 + 110, c2 + 50, 9 - ((c2 / 4) | 0));
    cpu(1.5);
    await WaitScreen();
    PushScreen();
  }
  for (let c1 = 0; c1 <= 98; c1++)
    for (let c2 = 0; c2 <= 29; c2++) putpixel(c1 + 110, c2 + 50, 9 - ((c2 / 4) | 0));
  for (let c3 = 0; c3 <= 3; c3++) {
    for (let c2 = 2; c2 <= 27; c2++)
      for (let c1 = 2; c1 <= 96; c1++)
        if (random(3) === 1) putpixel(c1 + 110, c2 + 50, ((c2 + 1) / 3) | 0);
    cpu(1.5);
    await WaitScreen();
    PushScreen();
  }
  for (let c1 = 2; c1 <= 96; c1++)
    for (let c2 = 2; c2 <= 27; c2++) putpixel(c1 + 110, c2 + 50, ((c2 + 1) / 3) | 0);

  OutTextXyChoise(160 - (text.length + 1) * 4, 55, 11, text + '?');
  OutTextXyChoise(122, 67, 12, 'yes');
  OutTextXyChoise(180, 67, 13, 'no');
  let convar = 12;
  HiText(12); DulText(13); HiText(11);
  await WaitScreen();
  PushScreen();
  while (ButtonDown()) await idle();

  let chosen = false;
  do {
    if (!SomethingDown()) last_key = 255;
    chosen = false;
    if (Left()) { HiText(12); DulText(13); convar = 12; }
    if (Right()) { DulText(12); HiText(13); convar = 13; }
    if (PowerKey()) chosen = true;
    if (EscapeKey()) {
      convar = 13; chosen = true;
      while (ButtonDown()) await idle();
    }
    if (!chosen) await idle();
  } while (!chosen);

  for (let c1 = 0; c1 <= 98; c1++)
    for (let c2 = 0; c2 <= 29; c2++)
      TheScreen[(c1 + 110) + 320 * 50 + c2 * 320] = buffer[c1 * 30 + c2];
  PushScreen();
  return convar === 12;
}

/* main.PreScreens (000:0fa8): the Zaskoda Electronics logo, held until its
   sound has played, then washed out to white */
async function PreScreens() {
  const pal1 = new Uint8Array(768).fill(63);
  ClearScreen(); PushScreen();
  DispFullBtmBuf('ZasElec.Btm');
  await PushFadeIn(200);
  if (SfxOn) StartSound('OPEN', 1, false);
  while (SoundPlaying(1)) await idle();
  await Fadeto(70, pal1);
  await FadeOut(50);
}

/* main.TitleScreen (000:109e) */
async function TitleScreen() {
  LoadPopTxtBk();
  LoadFont4();
  ClearScreen(); PushScreen();
  DispFullBtmBuf('RT.Btm');
  for (let c1 = 1; c1 <= 7; c1++) ASetRGBPalette(c1, c1, c1 * 3, c1 * 4);
  for (let c1 = 1; c1 <= 7; c1++) ASetRGBPalette(c1 + 7, c1 + 30, c1 * 3 + 40, c1 * 5 + 20);
  for (let c1 = 1; c1 <= 7; c1++) ASetRGBPalette(c1 + 14, c1 * 3 + 40, c1 * 5 + 20, c1 + 30);
  const pal = newPal(); FetchPal(pal);
  for (let c1 = 1; c1 <= 255; c1++) ASetRGBPalette(c1, (c1 / 6) | 0, (c1 / 10) | 0, (c1 / 20) | 0);
  await PushFadeIn(40);
  OutTextXy3d4(85, 7, 1, 1, 8, 1, 1, 'Zaskoda Soft presents:');
  OutTextXy3d4(261, 191, 1, 1, 15, 1, 1, ' C 1995');
  OutTextXy3d4(261, 191, 1, 1, 8, 1, 1, '[ ]');
  await Fadeto(70, pal);
  for (let c1 = 1; c1 <= 7; c1++) { ASetRGBPalette(c1, 0, 0, 0); ASetRGBPalette(c1 + 7, 0, 0, 0); ASetRGBPalette(c1 + 14, 0, 0, 0); }
  PushScreen();
  await Fadeto(30, pal);
  const tempscr = Uint8Array.from(TheScreen);
  const ts = 'Chapter 1: A Past Forgotten';
  for (let c2 = 0; c2 <= 8; c2++) {
    TheScreen.set(tempscr);
    // for c1:=0 to length(ts): ts[0] is the length byte, drawn as a letter
    for (let c1 = 0; c1 <= ts.length; c1++)
      OutTextXy3d4(90 + c1 * c2, 162, 1, 1, 15, 1, 1, c1 === 0 ? String.fromCharCode(ts.length) : ts[c1 - 1]);
    await WaitScreen();
    PushScreen();
  }
  while (ButtonDown()) await idle();
  while (!ButtonDown()) await idle();
  while (ButtonDown()) await idle();
  if (SfxOn) StartSound('INSOC', 1, false);
  await ClearFunk1();
  await FadeOut(1);
  KillFont4();
}

/* main.MainMenu (000:3a9c) */
async function MainMenu(conVar) {
  ClearScreen();
  PushScreen();
  DispFullBtmBuf('icebk.Btm');
  BrownPal();
  for (let c1 = 1; c1 <= 9; c1++) ASetRGBPalette(c1, 5 + c1, 5 + c1, 5 + c1 * 2);
  ASetRGBPalette(110, 10, 5, 0);
  for (let c1 = 1; c1 <= 7; c1++) ASetRGBPalette(c1 + 110, c1 * 8 + 4, c1 * 6 + 4, c1 * 3 + 5);
  DulText(0); DulText(1); DulText(2);
  HiText(conVar);

  LoadFont2();
  OutTextXyBW2(81, 9, 110, 'Main  Menu');
  OutTextXyBW2(79, 9, 110, 'Main  Menu');
  OutTextXyBW2(81, 11, 110, 'Main  Menu');
  OutTextXyBW2(79, 11, 110, 'Main  Menu');
  OutTextXyNORM2(80, 10, 110, 'Main  Menu');
  KillFont2();

  OutTextXyChoise(120, 70, 0, 'Enter Game');
  OutTextXyChoise(124, 90, 1, ' Credits');
  OutTextXyChoise(120, 110, 2, '   Quit');
  cpu(4);

  const pal = newPal(); FetchPal(pal);
  await PushFadeIn(10);
  while (ButtonDown()) await idle();

  let cycle = 0;
  SYS.f_clk[0] = 20;
  let chosen = false;
  do {
    if (!SomethingDown()) last_key = 255;
    chosen = false;
    if (SYS.f_clk[0] === 0) {
      SYS.f_clk[0] = 20;
      cycle = TopCap(cycle + 1);
      SetCycle(cycle, pal);
    }
    if (Up()) {
      DulText(conVar); conVar = conVar === 0 ? 2 : conVar - 1; HiText(conVar);
      if (SfxOn) StartSound('PLINK', 2, false);
    }
    if (Down()) {
      DulText(conVar); conVar = conVar === 2 ? 0 : conVar + 1; HiText(conVar);
      if (SfxOn) StartSound('PLINK', 2, false);
    }
    if (PowerKey()) chosen = true;
    if (EscapeKey()) {
      if (SfxOn) StartSound('PLINK', 2, false);
      DulText(conVar); conVar = 2; chosen = true; HiText(conVar);
      while (ButtonDown()) await idle();
    }
    if (chosen && conVar === 2) if (!(await RUSure('DOS'))) chosen = false;
    if (!chosen) await idle();
  } while (!chosen);
  if (SfxOn) StartSound('PLINK', 2, false);
  await FadeOut(2);
  return conVar;
}

/* main.StoryScene (000:3fd6): Seth leaves the mainland */
async function StoryScene() {
  LoadPopTxtBk();
  const words = newWords();
  await FadeOut(10);
  ClearScreen();
  PushScreen();
  DispFullBtmBuf('str01.btm');
  for (let c1 = 1; c1 <= 9; c1++) ASetRGBPalette(c1, c1 * 3 + 10, c1 * 2 + 5, c1);
  SetBoxColors();
  if (MusicOn) StartSound('M_LEAVE', 0x10, false);
  await PushFadeIn(200);
  DrawPopTxtBk();
  await WaitScreen();
  PushScreen();
  const page = (lines) => lines.forEach((s, i) => pstrAssign(words[i], s, 38));
  page(['Seth takes one last look back toward  ',
        'the mainland. He has decided that his ',
        'farming skills are better put to work ',
        'elsewhere in the world. Perhaps he    ',
        'will learn to grow hemp?              ']);
  await PopText(words, 10);
  page(['He is about to take the last boat out ',
        'of town. His destiny lies in Nilta.   ',
        'There he will take you on a tour of   ',
        'several small towns and other various ',
        'enviornments.     Have fun.....       ']);
  DrawPopTxtBk();
  await PopText(words, 10);
  await FadeOut(50);
  StopSound(0x10);
  ClearScreen();
  PushScreen();
  KillPopTxtBk();
}

/* main.GameSelect (000:41c2): the walking speed; 0..3, or 5 for Exit Menu
   (Demo 4 always calls it with New = false, so there is no Start NEW Game) */
async function GameSelect(isNew) {
  let convar = 3;
  ClearScreen();
  PushScreen();
  DispFullBtmBuf('grid.Btm');      // not in the demo's files; nothing is shown
  DispFullBtmBuf('wrpbk2.Btm');
  BrownPal();
  PopLoadBacks();
  for (let c1 = 0; c1 <= 19; c1++) ASetRGBPalette(c1 + 34, c1 * 3, c1 * 2, c1);
  for (let c1 = 1; c1 <= 9; c1++) ASetRGBPalette(c1, 5 + c1, 5 + c1, 5 + c1 * 2);
  for (let c1 = 0; c1 <= 10; c1++) ASetRGBPalette(c1 + 110, c1 * 2 + 30, 0, 0);
  for (let i = 0; i <= 5; i++) DulText(i);
  HiText(convar);

  OutTextXyChoise(85, 16, 0, 'Too Fast      ****');
  OutTextXyChoise(85, 56, 1, 'Fast          ***');
  OutTextXyChoise(85, 96, 2, 'Normal        **');
  OutTextXyChoise(85, 136, 3, 'Slow          *');
  if (isNew) {
    OutTextXyChoise(107, 165, 4, 'Start NEW Game');
    OutTextXyChoise(127, 185, 5, 'Exit Menu');
  } else OutTextXyChoise(127, 175, 5, 'Exit Menu');
  cpu(3);

  const pal = newPal(); FetchPal(pal);
  await PushFadeIn(10);
  while (ButtonDown()) await idle();

  let cycle = 0;
  SYS.f_clk[0] = 20;
  let chosen;
  do {
    if (!SomethingDown()) last_key = 255;
    chosen = false;
    if (SYS.f_clk[0] === 0) {
      SYS.f_clk[0] = 20;
      cycle = TopCap(cycle + 1);
      SetCycle(cycle, pal);
    }
    if (Up()) {
      DulText(convar);
      convar = convar === 0 ? 5 : convar - 1;
      if (!isNew && convar === 4) convar = 3;
      HiText(convar);
      if (SfxOn) StartSound('PLINK', 2, false);
    }
    if (Down()) {
      DulText(convar);
      convar = convar === 5 ? 0 : convar + 1;
      if (!isNew && convar === 4) convar = 5;
      HiText(convar);
      if (SfxOn) StartSound('PLINK', 2, false);
    }
    if (PowerKey()) chosen = true;
    if (EscapeKey()) {
      if (SfxOn) StartSound('PLINK', 2, false);
      convar = 5; chosen = true;
      while (ButtonDown()) await idle();
    }
    if (!chosen) await idle();
  } while (!chosen);
  if (SfxOn) StartSound('PLINK', 2, false);
  await FadeOut(2);
  return convar;
}

/* ---------- loading / unloading ---------- */

/* main.LoadGameConst (000:44eb) */
function LoadGameConst() {
  LoadOverLay();
  LoadPopTxtBk();
  LoadSprite(C1BitMaps, GlobalStats.c1sprt);
  LoadSprite(C2BitMaps, GlobalStats.c2sprt);
  LoadSprite(C3BitMaps, GlobalStats.c3sprt);
  LoadOWM(maplut.mapname[GlobalStats.map]);
  LoadMapTiles(maplut.tileset[GlobalStats.map]);
  MenuInfo = newMenuInfo();
}
/* main.KillGameConst (000:4585) */
function KillGameConst() {
  KillOverLay();
  KillPopTxtBk();
  KillSprite(C1BitMaps);
  KillOWM();
  KillMapTiles();
  MenuInfo = null;
}

/* main.LoadGame (000:45db): Seth is the boat, out at sea on map 136 */
function LoadGame(play) {
  GlobalStats = makeGlobalStats();
  const G = GlobalStats;
  G.map = 136;
  G.c1name = 'Seth'; G.c1x = 77; G.c1y = 54; G.c1offset = 0; G.c1dir = 4; G.c1frame = 10;
  G.c1alive = 1; G.c1sprt = BOAT;
  G.c2name = 'Gerwin'; G.c2x = 42; G.c2y = 56; G.c2offset = 0; G.c2dir = 3; G.c2frame = 7;
  G.c2alive = 0; G.c2sprt = GERWIN;
  G.c3name = 'Venetia'; G.c3x = 42; G.c3y = 57; G.c3offset = 0; G.c3dir = 3; G.c3frame = 7;
  G.c3alive = 0; G.c3sprt = VENETIA;
  G.walkrate = 2;
  G.talkrate = 10;
}
/* main.KillGame (000:4710).  Dispose leaves the pointer as it was, so the
   next StoryScene's PopText reads TalkRate from the freed record. */
function KillGame() { GlobalStats.disposed = true; }

/* Before the first game, GlobalStats is nil and StoryScene's PopText reads
   TalkRate from 0000:0000: the low byte of the INT 0 vector, which the
   Turbo Pascal runtime points at its handler at offset 010Ch. */
function nilGlobalStats() { const g = makeGlobalStats(); g.talkrate = 0x0c; return g; }

/* ---------- the walking screen ---------- */

/* The boat trip: Test's local procedure 000:226e, called whenever the
   leader stands still until the counter reaches 39.  It steers the boat,
   brings up the storm, and then cuts to Nilta. */
let IntroStep = 0;     // [007Dh]

/* main.DrawSmallStatus (000:204c): the side panel's party list.  The
   numbers are placeholders in the demo. */
function DrawSmallStatus() {
  const G = GlobalStats;
  LoadFont4();
  const one = (n, y, bm, hp, mp) => {
    if (!G.alive(n)) return;
    PutSmallBit3Dedge(296, y, 3, bm[1]);
    PutSmallTranBitFast(296, y, 0, bm[1]);
    OutTextXy3d4(227, y + 9, 2, 3, 24, 1, 0, G['c' + n + 'name'] + ':');
    OutTextXy3d4(233, y + 21, 2, 3, 31, 1, 0, hp);
    OutTextXy3d4(233, y + 33, 2, 3, 31, 1, 0, mp);
  };
  one(1, 5, C1BitMaps, 'HP:175/187', 'MP: 37/57');
  one(2, 45, C2BitMaps, 'HP:115/297', 'MP: 10/22');
  one(3, 85, C3BitMaps, 'HP: 75/99', 'MP: 40/91');
  OutTextXy3d4(227, 170, 2, 3, 24, 1, 0, 'Gold');
  OutTextXy3d4(233, 182, 2, 3, 31, 1, 0, '64123');
  KillFont4();
  cpu(1.5);
}

/* the music for each map (000:2c17 and 000:2d9a) */
const MAP_MUSIC = { 127: 'M_OVER', 128: 'M_STORY', 129: 'M_CAVE', 130: 'M_TOWN', 131: 'M_SMALL',
  132: 'M_TOWN', 133: 'M_TOWN', 134: 'M_TOWN', 135: 'M_STORY' };
function StartMapMusic(map) {
  if (MusicOn && MAP_MUSIC[map]) StartSound(MAP_MUSIC[map], 0x0f, true);
}

/* The 1999 tree and hill check, half way into a step.  The 1999 code
   tests offset = 10, which "Fast" (walk rate 4: 16, 12, 8...) never hits;
   this tests the step crossing 10 instead, which is the same moment at
   the other speeds. */
function MidStepCheck(before, after) {
  if (!(before > 10 && after <= 10)) return;
  const G = GlobalStats;
  for (const n of [1, 2, 3]) {
    const f = owmForth(G['c' + n + 'x'], G['c' + n + 'y']);
    G['c' + n + 'cut'] = (f > 68 && f < 74) ? 11 - random(3) : 20;
  }
  for (const n of [1, 2, 3]) {
    const f = owmForth(G['c' + n + 'x'], G['c' + n + 'y']);
    if (f === 65) G['c' + n + 'height'] = 5;
    if (f === 66) G['c' + n + 'height'] = 7;
    if (f === 67) G['c' + n + 'height'] = 9;
    if (f === 68) G['c' + n + 'height'] = 10;
  }
}

/* main.Test (000:25fb), the walking screen; one pass per vertical retrace */
async function Test() {
  const G = GlobalStats;
  const pal = newPal();
  let exit = false, mapon = false, c1;
  Words = newWords();

  /* 1999 MoveParty: the followers step into the places ahead of them
     (Demo 4's Stupid walked each one toward the one in front) */
  const MoveParty = () => {
    if (G.c3x !== G.c2x || G.c3y !== G.c2y) {
      G.c3dir = G.c2lastmove;
      G.c3x = G.c2x; G.c3y = G.c2y;
      G.c3offset = 20;
    }
    if (G.c2x !== G.c1x || G.c2y !== G.c1y) {
      G.c2dir = G.c1lastmove;
      G.c2x = G.c1x; G.c2y = G.c1y;
      G.c2offset = 20;
    }
    G.c2lastmove = G.c1lastmove;
    G.c1lastmove = G.c1dir;
    G.c1offset = 20;
  };

  /* UpDateNPCs (000:13cd): wandering townsfolk */
  const UpDateNPCs = () => {
    const blocked = (x, y, c3check) =>
      (G.c1alive && G.c1x === x && G.c1y === y) ||
      (G.c2alive && G.c2x === x && G.c2y === y) ||
      ((c3check ? G.c3alive : true) && G.c3x === x && G.c3y === y);
    for (let i = 0; i < NUM_OF_NPCS; i++) {
      const n = NPCs[i];
      if (n === null) continue;
      if (n.offset > 0) n.offset = n.offset - 1;
      else {
        if (random(75) === 1) n.dir = random(4) + 1;
        else if (random(50) === 1) {
          const step = (dx, dy, c3check) => {
            if (owmForth(n.x + dx, n.y + dy) === 0 && !blocked(n.x + dx, n.y + dy, c3check)) {
              setForth(n.x, n.y, 0);
              n.x = (n.x + dx) & 255; n.y = (n.y + dy) & 255; n.offset = 20;
              setForth(n.x, n.y, i + 194);
            }
          };
          if (n.dir === 1) step(0, 1, true);
          if (n.dir === 3) step(0, -1, true);
          if (n.dir === 2) step(1, 0, true);
          if (n.dir === 4) step(-1, 0, false);   // the left test ignores whether c3 is alive
        }
      }
      n.frame = Frame(n.x, n.y, n.offset, n.dir);
    }
  };

  /* the boat trip (000:226e) */
  const Intro = async () => {
    const t = IntroStep;
    if (t <= 15) {
      G.c1x = (G.c1x - 1) & 255; G.c1offset = 20; G.c1dir = 4;
      if (t === 10) {
        DarkenMapPal(pal);
        InitRain();
        if (SfxOn) StartSound('THUNDER', 0x14, false);
        if (SfxOn) StartSound('RAIN', 0x14, true);
      }
    }
    if (t >= 16 && t <= 19) { G.c1y = (G.c1y + 1) & 255; G.c1offset = 20; G.c1dir = 1; }
    if (t >= 20 && t <= 24) { G.c1x = (G.c1x - 1) & 255; G.c1offset = 20; G.c1dir = 4; }
    if (t >= 25 && t <= 27) { G.c1y = (G.c1y - 1) & 255; G.c1offset = 20; G.c1dir = 3; }
    if (t >= 28 && t <= 37) {
      G.c1x = (G.c1x - 1) & 255; G.c1offset = 20; G.c1dir = 4;
      if (t === 31) {
        CloseRain();
        SetUpPal();
        if (SfxOn) StopSound(0x14);
      }
    }
    if (t === 38) {
      /* landfall: Seth walks off the boat in Nilta */
      G.map = 130;
      G.c1x = 51; G.c1y = 50; G.c1offset = 0; G.c1dir = 1; G.c1frame = 1;
      G.c1alive = 1; G.c1sprt = SFARM;
      LoadSprite(C1BitMaps, G.c1sprt);
      LoadOWM(maplut.mapname[G.map]);      // without KillOWM first, as the original
      LoadMapTiles(maplut.tileset[G.map]);
      DrawGrid320();
      DrawPanel(0);
      DrawSmallStatus();
      if (MusicOn) StopSound(0x0f);
      await FadeOutPartial(10, pal);
      PushScreen();
      await Fadeto(10, pal);
      if (MusicOn) StartSound('M_TOWN', 0x0f, true);
    }
    if (IntroStep < 200) IntroStep++;
  };

  /* after a full-screen picture: the view and the panel, faded in */
  const fadeInView = async (speed) => {
    DrawGrid320();
    await PushFadeIn(speed);
  };

  /* --- start up (000:260a) --- */
  ClearScreen();
  PushScreen();
  for (let c1 = 0; c1 <= 255; c1++) ASetRGBPalette(c1, 0, 0, 0);
  SetBrowns();
  for (let c1 = 0; c1 <= 3; c1++) ASetRGBPalette(c1 + 20, 40 - c1 * 8, 50 - c1 * 7, 60 - c1 * 8);
  SetPanelGreens();
  SetUpPal();
  DrawGrid320();
  await PushFadeIn(50);
  DrawPanel(0);
  DrawSmallStatus();
  await PanelUp();

  do {
    PollSticks();
    exit = false;

    /* get input to move */
    if (G.c1offset === 0) {
      const tryMove = (dx, dy, dir) => {
        G.c1dir = dir;
        if (owmForth(G.c1x + dx, G.c1y + dy) < 194) {
          MoveParty();
          G.c1x = (G.c1x + dx) & 255; G.c1y = (G.c1y + dy) & 255;
          G.c1offset = 20;
        }
      };
      if (keydown[key_LeftArrow] || gSticks[1].x < left_bound) tryMove(-1, 0, 4);
      else if (keydown[key_RightArrow] || gSticks[1].x > right_bound) tryMove(1, 0, 2);
      else if (keydown[key_UpArrow] || gSticks[1].y < up_bound) tryMove(0, -1, 3);
      else if (keydown[key_DownArrow] || gSticks[1].y > down_bound) tryMove(0, 1, 1);
    }

    /* update party member's frames */
    G.c1frame = Frame(G.c1x, G.c1y, G.c1offset, G.c1dir);
    G.c2frame = Frame(G.c2x, G.c2y, G.c2offset, G.c2dir);
    G.c3frame = Frame(G.c3x, G.c3y, G.c3offset, G.c3dir);

    UpDateNPCs();
    const before = G.c1offset;
    if (G.c3offset !== 0) G.c3offset = (G.c3offset - G.walkrate) & 255;
    if (G.c2offset !== 0) G.c2offset = (G.c2offset - G.walkrate) & 255;
    if (G.c1offset !== 0) G.c1offset = (G.c1offset - G.walkrate) & 255;

    /* map skip: an even warp cell sends the party to its odd partner */
    c1 = owmForth(G.c1x, G.c1y);
    if ((c1 & 1) === 0) {
      c1 = c1 >> 1;
      if (c1 > 2 && c1 < 25) {
        if (SfxOn) StartSound('PLINK', 2, false);
        const w = MapWarpLUT[c1 * 2 + 1];
        G.c1x = w.x; G.c1y = w.y; G.c2x = w.x; G.c2y = w.y; G.c3x = w.x; G.c3y = w.y;
        G.c2dir = G.c1dir; G.c3dir = G.c1dir;
      }
    }

    /* map change */
    if (G.c1offset === 0) {
      c1 = owmForth(G.c1x, G.c1y);
      if (c1 >= 127 && c1 <= 192) {
        if (MusicOn) StopSound(0x0f);
        G.c1offset = 20;
        await FadeOutPartial(10, pal);
        ChangeMap(c1);
        DrawGridFs();
        PushSmallScreenFs();
        await Fadeto(10, pal);
        StartMapMusic(c1);
      }
    }
    if (G.c1offset === 0 && owmForth(G.c1x, G.c1y) === 1) {       // exit
      if (MusicOn) StopSound(0x0f);
      G.c1offset = 20;
      await FadeOutPartial(10, pal);
      ExitMap();
      DrawGridFs();
      PushSmallScreenFs();
      await Fadeto(10, pal);
      StartMapMusic(G.map);
    }

    /* the boat trip */
    if (G.c1offset === 0 && IntroStep !== 39) await Intro();

    /* 1999: wading into trees, hills */
    MidStepCheck(before, G.c1offset);

    /* draw */
    DrawGridFs();
    if (mapon) {
      PushSmallScreenFs();          // no wait for the retrace in this branch
      DrawSmallMap();
      cpu(1.5 + COST_PUSH);
      await sysSync();
    } else {
      await WaitScreen();
      PushSmallScreenFs();
    }
    if (SYS.f_clk[2] === 0) { SYS.f_clk[2] = 50; MoveAni(); }

    /* debug keys, once the boat has landed */
    if (IntroStep === 39) {
      if (keydown[key_M]) mapon = true;
      if (keydown[key_N]) {
        mapon = false;
        DrawPanel(0); DrawSmallStatus(); PushMenu();
      }
      if (keydown[key_R] && !RainOn) {
        DarkenMapPal(pal);
        InitRain();
        if (SfxOn) StartSound('THUNDER', 0x14, false);
        if (SfxOn) StartSound('RAIN', 0x14, true);
      }
      if (keydown[key_T] && RainOn) {
        CloseRain();
        SetUpPal();
        if (SfxOn) StopSound(0x14);
      }
      const setAlive = (n, v) => {
        G['c' + n + 'alive'] = v;
        DrawPanel(0); DrawSmallStatus(); PushMenu();
      };
      if (keydown[key_Q]) setAlive(1, 1);
      if (keydown[key_W]) setAlive(2, 1);
      if (keydown[key_E]) setAlive(3, 1);
      if (keydown[key_A]) setAlive(1, 0);
      if (keydown[key_S]) setAlive(2, 0);
      if (keydown[key_D]) setAlive(3, 0);
    }

    /* talk: look at the cell in front of the leader */
    if (PowerKey()) {
      const d = G.c1dir;
      if (d === 1) c1 = owmForth(G.c1x, G.c1y + 1);
      else if (d === 2) c1 = owmForth(G.c1x + 1, G.c1y);
      else if (d === 3) c1 = owmForth(G.c1x, G.c1y - 1);
      else if (d === 4) c1 = owmForth(G.c1x - 1, G.c1y);
      if (c1 >= 194 && c1 <= 226 && NPCs[c1 - 194]) {
        const n = NPCs[c1 - 194];
        const face = d === 1 ? 3 : d === 2 ? 4 : d === 3 ? 1 : 2;   // turn to face the leader
        n.frame = Frame(n.x, n.y, n.offset, face);
        DrawGridFs();
        PushSmallScreenFs();
        LoadTextBlock(OWM.NPCMAPData[c1 - 194 + 64]);
        while (ButtonDown()) await idle();
        SetBoxColors();
        AsmPush(TheRealScreen, TheScreen);
        DrawPopTxtBk();
        await WaitScreen();
        PushScreen();
        await PopText(Words, 10);
        while (ButtonDown()) await idle();
        DrawPanel(0);
        DrawGrid320();
        DrawSmallStatus();
        PushScreen();
      }
    }

    /* menu: * on the number pad, or button 2 */
    if (keydown[key_NPMult] || gSticks[1].button2) {
      if (SfxOn) StartSound('PLINK', 2, false);
      MenuInfo.title = 'Main Menu';
      MenuInfo.choices[0] = 'Move';
      MenuInfo.choices[1] = 'Status';
      MenuInfo.choices[2] = 'Quit';
      MenuInfo.choices[3] = 'end';
      let men;
      do {
        DrawGridFs();
        PushSmallScreenFs();
        AsmPush(TheRealScreen, TheScreen);
        PushScreen();
        men = await GetChoice(0, 0);
        if (men === 2) exit = true;
        if (men === 1) {
          /* Status: Seth's sheet */
          KillMapTiles();
          if (SfxOn) StartSound('INSOC', 2, false);
          await ClearFunk1();
          await FadeOut(1);
          ClearScreen();
          PushScreen();
          DispFullBtmBuf('sfarstat.btm');
          LoadMapTiles(maplut.tileset[G.map]);
          for (let c = 0; c <= 2; c++) {
            ASetRGBPalette(70 + c, 63 - c * 12, 30 - c * 7, 30 - c * 7);
            ASetRGBPalette(73 + c, 30 - c * 7, 63 - c * 12, 30 - c * 7);
            ASetRGBPalette(76 + c, 30 - c * 7, 30 - c * 7, 63 - c * 12);
            ASetRGBPalette(82 + c, 45 - c * 7, 45 - c * 7, 45 - c * 7);
          }
          ASetRGBPalette(79, 63, 55, 33);
          ASetRGBPalette(80, 50, 45, 25);
          ASetRGBPalette(81, 41, 36, 21);
          OutTextXyNorm1(160, 20, 76, 'NAME:');
          OutTextXyNorm1(160, 30, 76, ' EXP:');
          OutTextXyNorm1(160, 40, 76, ' LEV:');
          OutTextXyNorm1(200, 20, 79, 'SETH');
          OutTextXyNorm1(200, 30, 79, '3245');
          OutTextXyNorm1(200, 40, 79, '3');
          OutTextXyNorm1(120, 60, 76, 'PHYSICAL:');
          OutTextXyNorm1(220, 60, 76, 'MAGICAL:');
          OutTextXyNorm1(110, 70, 70, 'STRENGTH:');
          OutTextXyNorm1(110, 80, 70, ' AGILITY:');
          OutTextXyNorm1(110, 90, 70, ' DEFENCE:');
          OutTextXyNorm1(210, 70, 73, '  POWER:');
          OutTextXyNorm1(210, 80, 73, '  EVADE:');
          OutTextXyNorm1(210, 90, 73, 'DEFENCE:');
          OutTextXyNorm1(185, 70, 79, '7');
          OutTextXyNorm1(185, 80, 79, '6');
          OutTextXyNorm1(185, 90, 79, '8');
          OutTextXyNorm1(280, 70, 79, '7');
          OutTextXyNorm1(280, 80, 79, '4');
          OutTextXyNorm1(280, 90, 79, '8');
          OutTextXyNorm1(120, 120, 76, ' ARMOR:');
          OutTextXyNorm1(190, 120, 79, 'Leather');
          OutTextXyNorm1(120, 140, 76, 'Weapon:');
          OutTextXyNorm1(130, 150, 82, 'Close:');
          OutTextXyNorm1(130, 160, 82, ' Long:');
          OutTextXyNorm1(190, 150, 79, 'Axe');
          OutTextXyNorm1(190, 160, 79, 'Sling');
          cpu(2);
          await PushFadeIn(10);
          while (ButtonDown()) await idle();
          while (!ButtonDown()) await idle();
          while (ButtonDown()) await idle();
          if (SfxOn) StartSound('PLINK', 2, false);
          await FadeOut(10);
          ClearScreen();
          PushScreen();
          SetUpPal();
          SetBrowns();
          if (RainOn) DarkenMapPal(pal);
          // the choice variable doubles as the loop counter above, so the
          // menu always comes back after Status
          men = RainOn ? 188 : 20;
          await fadeInView(20);
        }
      } while (men !== 0 && men !== 2);
      await PanelClose();
      DrawPanel(0);
      SetPanelGreens();
      DrawSmallStatus();
      await PanelUp();
    }

    if (EscapeKey()) {
      if (SfxOn) StartSound('PLINK', 2, false);
      exit = true;
      while (ButtonDown()) await idle();
    }
    if (exit) {
      AsmPush(TheRealScreen, TheScreen);
      if (!(await RUSure('Main Menu'))) exit = false;
    }
  } while (!exit);

  if (SfxOn) StartSound('PLINK', 2, false);
  if (SfxOn) StopSound(0x14);
  Words = null;
}

/* main.RunGame (000:4737) */
async function RunGame() {
  const play = await GameSelect(false);
  if (play !== 5) {
    if (MusicOn) StopSound(0x11);
    await StoryScene();
    LoadGame(play);
    LoadGameConst();
    if (MusicOn) StopSound(0x10);
    if (MusicOn) StartSound('M_STORY', 0x0f, true);
    if (play === 0) GlobalStats.walkrate = 5;
    if (play === 1) GlobalStats.walkrate = 4;
    if (play === 2) GlobalStats.walkrate = 2;
    if (play === 3) GlobalStats.walkrate = 1;
    await Test();
    KillGameConst();
    KillGame();
    if (MusicOn) {
      StopSound(0x0f);
      StartSound('M_SMALL', 0x11, true);
    }
  }
}

/* main.OverAll (000:4804) */
async function OverAll() {
  let conVar = 0;
  await PreScreens();
  if (MusicOn) StartSound('M_SMALL', 0x11, true);
  await TitleScreen();
  do {
    conVar = await MainMenu(conVar);
    IntroStep = 0;
    if (conVar === 0) await RunGame();
    if (conVar === 1) await Credits();
  } while (conVar !== 2);
  if (MusicOn) StopSound(0x11);
}

/* the main program block (000:4aa2) */
async function TalibahProgram(opts) {
  randomize();
  GlobalStats = nilGlobalStats();
  textModeBanner();
  init_maplut();
  Writeln('Maplink look up table created...');
  LoadFont1();
  Writeln('Main font loaded...');
  cpu(300);
  await sysSync();
  await SoundInit(opts);
  TextColor(5);
  SetUpSticks(opts);
  TextColor(4);
  Writeln('Init mode 13h');
  cpu(400);
  await sysSync();
  SetVideoMode(0x13);
  setrate(512);
  await OverAll();
  SetVideoMode(0x3);
  textModeExitScreen();
  setrate(18);
  KillFont1();
  Writeln('Main font unloaded.');
  kill_maplut();
  Writeln('Map look up table disposed.');
  SoundShutdown();
  Writeln('Sound engine shut down.');
  cpu(1500);                // the program has ended; hold its last words
  await sysSync();
}
