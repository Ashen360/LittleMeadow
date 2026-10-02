# 07 — Playtest Checklist & Handoff

Everything on the roadmap is built except the real art pass. Each phase was tested
automatically in headless Chromium: scripted play-throughs, a whole simulated villager day,
and save/reload round-trips, with no console errors. What automation can't judge is
**feel**: is it fun, readable, cozy, does it sound nice, does it run well on *your* laptop.
That's what this checklist is for.

## How to play
Double-click `Play Little Meadow.html` in the repo folder (or in a GitHub "Download ZIP"); it
works offline. For development, run `node tools/serve.mjs` and open http://localhost:8080
(rebuild the play file with `node tools/build.mjs`). Handy URL flags: `?debug` (overlay on, N = next day, extra potato and
strawberry seeds), `?lowres` (1x rendering for very weak machines). F3 toggles the overlay.

## What's implemented
| Phase | What you get |
|---|---|
| 0 Foundation | Farm map, WASD movement with forgiving corners, camera, crisp scaling, single-file build |
| 1 Farming | Hoe / watering can / axe / pickaxe, soil, 3 crops (strawberry regrows), debris clearing, 24-slot bag, hotbar, energy, eating |
| 2 Time + save | Clock and calendar, evening light, sleeping, autosave, title menu, pause menu |
| 3 Town + economy | Bramblewick, walking between maps, seed shop (9–5), shipping box with overnight pay, money |
| 4 Villagers | Marigold, Otto, June and Pip with daily routines, dialogue with portraits, friendship hearts |
| 5 Polish | Particles, synthesized sound and music, settings, key rebinding, large text, hold-to-repeat, save export/import |

## Needs you (can't be done or judged without a person)
1. **Play it in a real browser** with sound on and go through the checklist below.
2. **Saving from `file://`**: Chrome and Edge keep `localStorage` for local files. If the title
   says "Saving is off in this browser", use the dev server (`node tools/serve.mjs`) or
   another browser. Please tell me which browser you'll use for the gift.
3. **Real art pass**: every sprite is a procedural placeholder. For real art, get a sprite
   sheet made (an artist, or CC0 packs), using the names in `05_ASSET_GUIDELINES.md`, and
   I'll add the sheet loader. No gameplay code changes.
4. **Personal touches**: it's a gift, so review the villagers' lines (`src/data/npcs.js`), the
   town/farm names and the welcome text. Inside jokes and names are easy to swap in.
5. **Balance**: prices, growth days and energy costs are starting values in
   `src/data/tuning.js`, `items.js` and `crops.js`. Tell me what feels slow or grindy.
6. **Music taste**: the music is a generated music box. If you'd rather have a recorded track,
   it can be swapped (budget in `05_ASSET_GUIDELINES.md`).
7. **Your low-end laptop**: open with `?debug` and check FPS and CPU ms on it (targets are in
   `06_PERFORMANCE_GUIDELINES.md`).
8. **Git**: all work is on the `main-6l6oor` branch. Say the word if you want a pull request
   into `main`.

## Decisions worth a second look
- Energy is only spent when a tool actually does something (missing is free).
- Cleared debris goes straight into the bag instead of dropping on the ground.
- Pines, bushes and buildings can't be chopped; round trees can (→ stump → gone).
- The shop is open 9–5 whether or not Marigold is standing at it.
- Villagers walk through you (so nobody can get stuck in a doorway).
- Seasons are names only; crops grow in any season.
- The clock stops at 2:00 AM; you never pass out.
- Rebinding covers movement, use, interact and bag. Esc and 1–9 are fixed.

## Playtest checklist
Tick as you go; note anything odd next to the item.

### First minutes
- [ ] Title screen appears; "New game" starts on the farm with a welcome message
- [ ] Walking feels smooth; sliding around corners and through gaps feels forgiving
- [ ] Pixels look crisp at your screen size (try resizing the window)
- [ ] Music starts after your first key press or click; volume feels gentle

### Farming (field = the brown area east of the house)
- [ ] Only the 3×3 corner inside the twine line can be tilled; the overgrown rest says to
      use the sign
- [ ] E on the plot sign: with too little money it says how much you need; with enough it
      asks, then the field grows (5×4, 8×5, 12×7, 16×9) and the sign moves along
- [ ] 1 = hoe: Space or left click tills the tile in front of you (or the hovered tile next to you)
- [ ] 2 = watering can: water tilled soil; the gauge in the slot goes down; refill at the pond
      (watering should sound soft and bubbly, not slappy)
- [ ] 5 = turnip seeds: plant on tilled soil
- [ ] Axe on branches and round trees, pickaxe on rocks: shake, chips, "+1 Wood"/"+1 Stone"
- [ ] Holding Space keeps swinging (turn off in Settings → Hold to repeat tools)
- [ ] Energy bar drops as you work; eating a crop (right click) refills a little
- [ ] Tab or I opens the bag; click two slots to swap; the mouse wheel and 1–9 change the hotbar

### Days
- [ ] The clock advances (10 minutes every 10 seconds); the screen dims after 6 PM
- [ ] At 2:00 AM the clock stops with a gentle message
- [ ] E on the bed (inside the farmhouse) asks to sleep; you wake beside it with the new
      date and full energy
- [ ] Watered turnips grow over 4 nights; unwatered ones don't grow that night
- [ ] Harvest a ripe turnip with E (or Space / click)
- [ ] Tilled soil you never planted goes back to field after 3 nights

### Town & money
- [ ] Walk east along the farm road into Bramblewick, then back west
- [ ] Store door (E) between 9 and 5 opens the shop; Shift+E buys five; closed outside hours
- [ ] Hold turnips, press E on the shipping box (next to the house); empty hands takes them back
- [ ] After sleeping, a summary shows what sold; money in the top-right goes up
- [ ] The forge (next to the store, E at the anvil, 9 to 5) lists pickaxe, axe and hoe with
      tier bars; Buy asks to confirm, takes gold + wood, and the bar fills
- [ ] An upgraded axe fells a tree in fewer chops and uses less energy; the tool's name shows
      its tier and its slot shows a coloured gem
- [ ] An old save (from before the forge) still loads, and the forge is there

### Home & furniture
- [ ] A new game starts inside the farmhouse beside the bed; the doormat leads outside, and
      E on the farmhouse door brings you back in
- [ ] Willow & Wool (south-west of the town square, 9 to 5): switch tabs, scroll, and the
      preview shows each piece on your floor; buying puts it in your bag
- [ ] Indoors, hold a piece of furniture: a green ghost shows where it goes (red if it can't),
      with the keyboard or the mouse; Space / click places it
- [ ] Put a chair on a rug; walk over the rug
- [ ] Click furniture with a tool or empty hands to pick it up again
- [ ] Use a wallpaper or floor item indoors: the room changes and the old one returns to
      your bag
- [ ] After 6 PM the lamp (and woodstove) glow and the room stays cosier than outside
- [ ] Reload: furniture, rugs, floor and wallpaper are all where you left them

### Villagers
- [ ] June visits your mailbox around 7–8 AM; Pip visits your pond after lunch
- [ ] Marigold stands outside the store in the day; Otto tends the flowerbeds
- [ ] Talking (E) shows a portrait, name, hearts and text; the first chat ever is an introduction
- [ ] Talking again the same day gives a short line; new lines on later days
- [ ] Dialogue lines break at natural points (sentence ends), with no single word left
      alone on a line; also try it with Large text on
- [ ] Everyone goes home in the evening

### Saving
- [ ] Refresh the page mid-day → Continue puts you back where you were
- [ ] Esc → Save and quit to title → Continue works
- [ ] Settings → Export save file downloads a `.json`; Import (on the title) restores it

### Settings & accessibility
- [ ] Music and sound volume sliders (left/right, or right-click to lower)
- [ ] Render scale 1x looks blurrier but runs lightest; Auto looks sharpest
- [ ] Large text makes dialogue and messages twice as big
- [ ] Controls: rebind "Use tool" to another key, try it, then "Reset to defaults"

### Feel (the important part)
- [ ] Is anything confusing in the first 5 minutes without instructions?
- [ ] Is money too tight or too loose after a week?
- [ ] Are any sounds annoying after an hour?
- [ ] Does any text overflow, overlap or look cramped?
- [ ] Anything you'd love to add before gifting?
