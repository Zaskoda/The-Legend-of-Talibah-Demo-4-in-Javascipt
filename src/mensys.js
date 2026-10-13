'use strict';
/* ==========================================================================
   mensys.js - the MENSYS unit of Demo 4 (segment 4D0h): the panel menu.
   RUSure lives in the main program in this build and is in main.js.
   ========================================================================== */

let MenuInfo = null;   // {title, choices[0..10]} - option_string = string[10]
function newMenuInfo() { return { title: '', choices: new Array(11).fill('') }; }

/* mensys.GetChoice (4d0:0004): the panel menu built in MenuInfo; returns
   the choice, or 'escape' for Esc.  Plinks on every move and on the way
   out. */
async function GetChoice(cur, escape) {
  await PanelClose();
  DrawPanel(0);
  HiText(10);
  let last = 9;
  for (let c1 = 9; c1 >= 2; c1--) if (MenuInfo.choices[c1] === 'end') last = c1 - 1;
  for (let c1 = 0; c1 <= last; c1++) DulText(c1);
  HiText(cur);
  OutTextXyChoise(270 - MenuInfo.title.length * 4, 10, 10, MenuInfo.title);
  for (let c1 = 0; c1 <= last; c1++)
    OutTextXyChoise(270 - MenuInfo.choices[c1].length * 4, 40 + c1 * 15, c1, MenuInfo.choices[c1]);
  await PanelUp();

  while (ButtonDown()) await idle();
  let chosen;
  do {
    chosen = false;
    if (!SomethingDown()) last_key = 255;
    if (Up()) {
      DulText(cur); cur = cur === 0 ? last : cur - 1; HiText(cur);
      if (SfxOn) StartSound('PLINK', 2, false);
    }
    if (Down()) {
      DulText(cur); cur = cur === last ? 0 : cur + 1; HiText(cur);
      if (SfxOn) StartSound('PLINK', 2, false);
    }
    if (PowerKey()) chosen = true;
    if (EscapeKey()) {
      if (SfxOn) StartSound('PLINK', 2, false);
      DulText(cur); cur = escape; chosen = true; HiText(cur);
      while (ButtonDown()) await idle();
    }
    if (!chosen) await idle();
  } while (!chosen);
  if (SfxOn) StartSound('PLINK', 2, false);
  return cur;
}
