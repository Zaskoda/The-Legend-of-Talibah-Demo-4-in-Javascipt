# The Legend of Talibah: Demo 4, on the 1999 engine

A browser version of Zaskoda Soft's **The Legend of Talibah, Demo 4** (30 November 1997,
"Snazzy Engine (tm) v.01 (pre alpha)"). It plays Demo 4's maps, people, story, music and
sound effects on the walking engine from the June 1999 source: the 220×200 view, sprites
cut off in trees and shallow water, hills, and the party walking in single file.

Demo 4's source is lost. The game's logic was read from Demo 4's `MAIN.EXE`, with
`LAB.PAS` (29 November 1997, the nearest surviving source) for the names and the shape
of the code. The walking engine is the 1999 port (`talibah-js`). The original data files
are in `data/` and are not changed.

## Running it

* **From disk:** open `dist/TALDEMO4.html`. Every script and data file is inside it, so
  it works from `file://`.
* **Served:** put this folder on any web server (PHP, Apache, `python3 -m http.server`)
  and open `index.html`. It loads `src/*.js` and fetches the files in `data/`.
* **GitHub Pages:** the repository root works as the site as it is (`index.html`, `src/`,
  `data/`). `index.html` has link-preview tags using `preview.png`; their URLs assume
  `https://zaskoda.github.io/taldemo4/`, so change them if the address differs.
* **Rebuild the single file:** `python3 build.py` writes `dist/TALDEMO4.html`.

Browsers won't play sound until the page has been clicked or a key pressed. If that
hasn't happened yet, the page asks for a click before the program starts, so the
opening logo's sound isn't lost.

The setup panel under the screen:

| Setting | Original |
| --- | --- |
| Sound and music | `SOUNDSET.EXE` writing `SOUND.CFG`. Off is the same as having no `SOUND.CFG` |
| Joystick / gamepad | Off makes the program see no stick |
| 4:3 picture | Stretches 320×200 to 4:3 as a CRT did |
| **Play with these settings** | Restarts the program |

**Full screen** is the button, or the **F** key.

## Controls

| Key | Action |
| --- | --- |
| Arrows / number pad | Walk; move in menus |
| Enter | Choose; talk to the person in front of you |
| `*` on the number pad | The game menu (Move, Status, Quit). `Shift`+`8` works too |
| Esc | Back out; while walking, asks to go back to the main menu |
| R / T | Debug: rain on / off |
| M / N | Debug: mini map on / off |
| Q W E / A S D | Debug: party members 1, 2, 3 on / off |

The debug keys work once the boat has landed. Demo 4's `README.TXT` says Space does the
same as Enter, but this EXE only tests Enter.

On a gamepad, the stick or d-pad moves. **A** is button 1 (choose, talk), **B** or
**Start** is button 2 (menu), and **Y** or **Back** is button 4 (Esc).

## What's in it

Everything below is Demo 4, as its EXE does it:

* The text-mode start-up screen, including the sound driver's lines.
* The Zaskoda Electronics logo. It holds until the OPEN sound has played, then washes
  out to white.
* The title screen.
* The main menu, and the credits with their dedication.
* The speed screen: *Too Fast / Fast / Normal / Slow* are walk rates 5 / 4 / 2 / 1, and
  *Slow* is the default.
* The story scene: Seth leaves the mainland, with M_LEAVE playing.
* **The boat trip.** Seth starts as the boat on a second copy of the overworld
  (`OVERDMT.MAP`, map 136). A script steers it 38 steps west. A storm comes in at step
  10: the map darkens, rain falls, and THUNDER and RAIN play. It clears at step 31. At
  step 38 the screen cuts to Nilta (map 130) with Seth on foot.
* Nilta, the overworld and six more maps:

  | Map | File | Tiles | Music |
  | --- | --- | --- | --- |
  | 127 | `OVERDM` | `OVER99` (1999) | M_OVER |
  | 128 | `CENTERDM` | `CAVENTER` | M_STORY |
  | 129 | `CAVEDM` | `CAVE4-7` | M_CAVE |
  | 130 | `ITOWNDM` (Nilta) | `INDTOWN` | M_TOWN |
  | 131 | `TEMPDM` | `TEMP6-22` | M_SMALL |
  | 132 | `DTOWNDM` (Eldurop) | `DESTOWN` | M_TOWN |
  | 133 | `FTOWNDM` | `FORTOWN` | M_TOWN |
  | 134 | `VTOWNDM` | `VILTOWN` | M_TOWN |
  | 136 | `OVERDMT` | `OVER99` (1999) | (the boat trip) |

  The EXE also lists a map 135, `CAVENTER`, with M_STORY, but there's no such file and
  nothing leads to it.
* People who wander about and talk (`SPRITES.WRD`). Each map's exits lead back to the
  overworld, and warps play PLINK.
* The game menu: *Move*, *Status* (Seth's sheet, `SFARSTAT.BTM`, with INSOC) and
  *Quit*. Menus plink on every move.
* The side panel's names and numbers. The HP, MP and gold figures are fixed
  placeholders in the demo.

## Sound

Demo 4 uses Ethan Brodsky's SMIX mixer, as Splat did. What the EXE shows:

* **Rate: 22,025 Hz**, a constant in the mixer. On a Sound Blaster 16 the mixer sends
  that number to the card (DSP command 41h, then 56h 09h). On older cards it becomes the
  time constant 256 − 1000000 div 22025 = 211, which plays at about 22.2 kHz.
* **Samples: signed 8-bit mono.**
* **Voices:** 8. `StartSound(sound, index, loop)` takes the first free voice and does
  nothing if all eight are busy. `StopSound(index)` stops every voice started with that
  index.
* **Mixing:** blocks of 512 samples, with the voices added as signed words. For a
  16-bit card the sum is shifted left 5 bits; for an 8-bit card it is clipped to
  −128..127. The port does the 16-bit path.
* **`DEMO.SND` layout:** a word count (11), then 11 × {name[8], offset: longint,
  size: longint}, then the samples.

How the game uses them:

| Sound | Index | Where |
| --- | --- | --- |
| OPEN | 1 | The logo |
| M_SMALL (loop) | 17 | Title and main menu; the temple |
| INSOC | 1 / 2 | Leaving the title; credits; opening Status |
| PLINK | 2 | Menu moves and choices, warps, quitting |
| M_LEAVE | 16 | The story scene |
| M_STORY (loop) | 15 | The boat trip; maps 128 and 135 |
| THUNDER, RAIN (loop) | 20 | The storm, and the R key |
| M_OVER, M_CAVE, M_TOWN (loop) | 15 | Per map, as in the table above |

## How it maps to the EXE

| Demo 4 code | JavaScript | Notes |
| --- | --- | --- |
| Main program (segment 000h) | `src/main.js` | Comments give each procedure's address |
| VARS unit (A19h) | `src/vars.js` | Maps, map changes, key tests, `init_maplut` |
| MENSYS unit (4D0h) | `src/mensys.js` | `GetChoice` |
| Sound unit (4F6h), SMIX (5ACh) | `src/sound.js` | Web Audio |
| FONTS unit (700h) | `src/fonts.js` | 1999 code, with Demo 4's `PopText` |
| BITMAPS unit (7B0h) | `src/bitmaps.js` | 1999 code: the fs view |
| GRAPHICS unit (962h) | `src/graphics.js` | 1999 code (the same routines) |
| SPX_TIM, MULTKEYS, JOYSTICK, CRT | `src/sys.js`, `src/crt.js` | As in the 1999 port |

The machine model is the same as the 1999 port's:

* VGA mode 13h with a 6-bit DAC.
* The 70.09 Hz retrace, which paces the walking loop.
* SPX_TIM's 512 Hz clock for text speed, key repeat, the water cycling and panel slides.
* Costs approximating a 486 DX66 for work that wasn't waiting on anything.
* Walking is smoothed between 70 Hz steps on a 1280×800 canvas.

## Deliberate differences

From the 1999 engine, as asked:

1. **The view** is the 1999 one: 220×200 with the panel beside it. Demo 4 drew a
   180×160 view inside a border (`OVERLAY.GRD`'s top, bottom and side strips). The
   panel is Demo 4's, from the same file. Where Demo 4 built a whole screen in its back
   buffer (talking, menus, fades), the port places the 220×200 view there instead.
2. **Sprites** come from the 1999 `ALL_SPR.69`:
   * Characters have shadows under their feet.
   * Several sets have a shading pass.
   * Sets 15 and 16 are recoloured.
   * Set 17 has its side-facing frames.
   * Sets 33–38 are new and unused here.

   Demo 4's own sprite file is the same as `ALL_SPR.set` in the 1999 source.
3. **The overworld tiles** come from the 1999 `OVER.SET`, kept here as `OVER99.SET`;
   Demo 4's own `OVER.SET` is still in `data/` but not loaded. Every tile is in the
   same place in both sets. Of the tiles Demo 4's overworld maps use, only these
   differ:
   * **1–10:** the forest and its edges, redrawn darker and denser.
   * **90–102:** the shorelines, which gained a sandy beach edge.
4. **Trees on the overworld.** When `OVERDM` or `OVERDMT` loads, every full forest tile
   (`OVER.SET` tile 1) whose cell is empty gets code 69. That is the 1999 "wade into the
   trees" code without battles, so Seth's lower half is hidden in forests. The 1999
   `OVER.MAP` marks its forests the same way. The `.MAP` files themselves are not changed.
5. **Hills and wading** use the 1999 codes 65–73. Demo 4's maps have none apart from
   the forests above, so in practice this is the trees.
6. **The party follows in single file**, using the 1999 `MoveParty`. Demo 4's `Stupid`
   walked each member towards the one ahead. Only Seth is in the party unless the
   Q/W/E debug keys are used.
7. **The tree check happens when a step crosses its halfway point.** The 1999 code tests
   `offset = 10`. At *Fast* (walk rate 4: 16, 12, 8…) it never fires, so the effect
   didn't work at that speed. At the other speeds both tests fire at the same moment.

Port matters:

8. **Quitting** shows the program's closing text for 1.5 s, then starts again, instead
   of dropping to a DOS prompt.
9. **Joystick calibration** is skipped. A browser gamepad reports calibrated axes, so
   the bounds the calibration would have produced are used.
10. **Sound:**
   * The setup panel stands in for `SOUNDSET.EXE`.
   * The start-up screen shows a Sound Blaster 16 (DSP 4.05) and 15360k of free XMS, as
     under DOSBox.
   * Loading the sounds is given about a second, as from a disk of the time.
   * The mix is played louder than SMIX's 16-bit path would give, with a limiter, so it
     can sit next to other things on the computer. The voices keep their levels relative
     to each other.
11. **Shift+8** is accepted as the number-pad `*` for keyboards without a number pad.
12. **The M debug mini map** is drawn straight into video memory. The 220×200 view keeps
    its map buffer in the back screen, where Demo 4 drew the mini map. As in Demo 4,
    the walking loop doesn't wait for the retrace while the map is on, so walking speeds
    up.
13. **Memory the original read without owning:**
    * Before the first game, `StoryScene` types its text with `GlobalStats` still nil,
      so the text speed is read from address 0000:0000. That is the low byte of the
      INT 0 vector, which the Turbo Pascal runtime sets to 010Ch, so the speed is 12.
      After a game, the speed is the freed record's 10.
    * Talking to NPC slot 32 (code 226) would follow a nil pointer; the port does
      nothing.
14. **`GRID.BTM`**, which the speed screen loads before its real background, wasn't in
    the release. Nothing is shown for it in either version. `BW9X9.FNT` is in the zip but
    never opened.
15. **Display:** the picture is smoothed between 70 Hz steps, and the 4:3 stretch is on
    by default.
