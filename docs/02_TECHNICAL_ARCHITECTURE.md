# 02 — Technical Architecture

## Stack
- Vanilla JavaScript, ES modules, Canvas 2D. **No runtime or dev dependencies.**
- `tools/serve.mjs`: static dev server (Node, zero dependencies).
- `tools/build.mjs`: bundles `src/` into `dist/LittleMeadow.html`, a single file that runs from `file://`.

## Directory layout
```
index.html              page shell (canvas + boot message)
src/
  main.js               entry point
  config.js             engine constants (tile size, view size, dt limits)
  core/
    Game.js             owns every system; per-frame tick; map switching
    GameLoop.js         requestAnimationFrame driver, dt clamping
    Input.js            keyboard/mouse/wheel → named actions (rebindable)
    Debug.js            FPS / frame-time / memory overlay
  world/
    GameMap.js          tile layers, objects, collision queries
  player/
    Player.js           movement, collision resolution, animation, energy, tool swing
    Inventory.js        slots, stacking, swapping
  farming/
    Farming.js          soil and crop rules: till, water, plant, grow overnight, harvest
    Tools.js            ToolSystem: targeting and what using an item on the world does
  npc/
    Npc.js              a villager: position, path walking, animation, friendship
    NpcManager.js       schedules, routing across maps, friendship, save state
    Path.js             BFS on the collision grid
  dialogue/
    Dialogue.js         picks the line (intro / tier / again)
  ui/
    UiKit.js            shared panels, slots and item icons
    MenuBox.js          title / pause / prompts
    ShopMenu.js         the seed shop
    DialogueBox.js      portrait, hearts, typewriter pages
    Hud.js              hotbar, energy bar, day label, message toast
    InventoryMenu.js    the bag screen
  rendering/
    Renderer.js         canvas scaling, ground baking, y-sorted sprites, UI pass
    Camera.js           follow + clamp to map bounds
    Atlas.js            named sprite regions in one texture
    Effects.js          pooled floating text and object shakes
    PlaceholderArt.js   procedural placeholder sprites (replaceable)
    Font.js             original 5 px bitmap font
    palette.js          the colour palette
  data/                 content only: no logic
    tiles.js  objects.js  items.js  crops.js  tuning.js  maps/*.js   (later: npcs.js …)
tools/  serve.mjs  build.mjs
docs/
```
Planned additions per phase:
`core/Time.js`, `core/SaveManager.js`, `audio/Audio.js`. Each gets created when its phase
starts, not before.

## Frame flow
```
rAF → GameLoop (dt clamped to 0.25 s)
    → Game.tick(dt)
        input actions (once per frame): debug, bag toggle
        bag open → InventoryMenu.update, the world pauses
        otherwise → hotbar, next-day key, player sub-steps of ≤ 1/30 s (no tunnelling),
                    ToolSystem.update (target, use / interact / eat)
        effects + HUD timers (keep redrawing only while something animates)
        camera.follow
        if anything changed → Renderer.render()
        input.endFrame()
```
**Render-on-change:** `Game.dirty` is set by movement, animation ticks, input and
resizes. When nothing changes, no drawing happens, so an idle game costs almost nothing.
The debug overlay forces continuous rendering while it is open.

## Rendering pipeline
1. **Scaling.** The canvas CSS size is `384×216 × S_display`, where `S_display` is an
   integer computed in device pixels, so the result is crisp at 125%/150% Windows scaling.
   The backing store is `384×216 × S_render`, with `S_render = min(S_display, 3)`
   (`?lowres` forces 1). Any remaining upscale is done by the compositor using
   `image-rendering: pixelated`.
2. **Sub-pixel smoothness.** Positions are snapped to `1/S_render` logical pixels, so
   movement is smooth at 3× while every draw still lands on whole device pixels.
3. **Ground.** When a map loads, the whole ground layer is baked into one offscreen
   canvas, including edge overlays (grass lips on paths, pond banks). Each frame draws it
   with a single `drawImage`. Changing a tile redraws only that tile and its 4 neighbours.
4. **Ground overlay.** The target-tile cursor, drawn over the ground and under sprites.
5. **Sprites.** Visible objects, crops and entities are collected into a reused array, sorted
   by `sortY` (feet / footprint bottom), and drawn from the atlas. Shaking objects get a
   ±1 px offset.
6. **UI.** Drawn last, in logical pixel coordinates, with the bitmap font: floating text,
   HUD, then the bag screen and debug overlay.

## Data model
- **Tiles:** `Uint8Array` of tile-type ids per map plus a derived `solid` `Uint8Array`.
  Tile types are defined in `data/tiles.js`.
- **Objects:** plain records `{type, def, x, y}` whose footprint is registered in
  `objectAt[]`. Types are defined in `data/objects.js` (sprite, footprint, solidity).
- **Farming:** per-tile `soil`, `watered` and `fallow` `Uint8Array`s plus `cropAt[]` and a
  `crops` list on each map. Crop records hold `{ id, x, y, growth }`; the stage and sprite are
  derived from them. Tilled/watered soil is drawn into the baked ground, so a change
  redraws just that tile.
- **Items:** `data/items.js` (name, icon, tool / seed / energy). Inventory slots are
  `{ id, qty }` (+ `water` on the can). Balance numbers live in `data/tuning.js`.
- **Maps:** ASCII rows plus a legend plus an explicit object list (`data/maps/*.js`).
  Easy to edit by hand; validated when loaded, with clear errors.

## Asset pipeline
All drawing goes through `Atlas` by **sprite name** (`player.down.1`, `obj.tree`,
`tile.grass2`, …). `PlaceholderArt.js` generates every sprite at startup in about 20 ms.
To use real art, load a PNG sheet plus a JSON of named rects into the same atlas. No
gameplay code changes. See 05_ASSET_GUIDELINES.md.

## Save format
`localStorage["littlemeadow.save"]` = `{ version: 1, savedAt, clock: { day, minutes },
player: { map, x, y, facing, energy }, inventory: { selected, slots }, maps: { <id>: {
objects: [[type, x, y, hits?]], soil, watered, fallow (one digit per tile), crops: [[id, x,
y, growth]] } } }` (+ `money`, `shipping`, `npcs` from Phases 3–4).
Saving writes `littlemeadow.save.tmp`, copies the old save to `littlemeadow.save.bak`, then
writes the main key. Loading tries the main key, then the backup. `SaveManager` runs chained
migrations (`MIGRATIONS[n]` upgrades version n to n+1) on load; bump `SAVE_VERSION` and add
a migration whenever the shape changes. Autosave happens on sleep, when the tab is hidden
and on `pagehide`, so a refresh loses nothing.
Maps store their full object list (not a diff), so removed debris and new stumps survive,
and unknown object/crop/item ids are skipped on load instead of crashing.

## Bundling constraints (keep `tools/build.mjs` simple)
- Named exports only (`export class/function/const`). No `export default`, no `export { }` lists.
- Static relative imports only: `import { A, B as C } from './x.js';`
- No import cycles (the build fails loudly if one appears).
- Don't reassign exported `let` bindings from outside the module.
