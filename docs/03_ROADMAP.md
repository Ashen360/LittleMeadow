# 03 — Roadmap

Every phase ends playable. We stop and verify before moving on.

## Phase 0: Foundation ✅
- [x] Project structure, docs, dev server, single-file build
- [x] Game loop with dt clamping and render-on-change
- [x] Canvas renderer: integer scaling, DPR-aware, baked ground layer, y-sorting
- [x] Input with named, rebindable actions
- [x] Map system (ASCII + legend + objects), collision with corner-sliding
- [x] Player: 8-way movement, 4-direction walk animation
- [x] Camera: follow + clamp
- [x] Placeholder art + bitmap font
- [x] Debug overlay (FPS, frame time, draws, entities, heap)

**Deliverable:** walk around the farm smoothly.

## Phase 1: Farming MVP ✅
- [x] Soil state layer (tilled / watered / fallow nights) on the map, drawn into the baked ground
- [x] Tools: hoe, watering can (capacity 20, refill at the pond), axe, pickaxe, with a swing
      animation, energy cost, facing/mouse targeting and cooldown
- [x] Debris removal (branch, rock, tree → stump → gone) with drops into the bag
- [x] Crops from `data/crops.js` (turnip, potato, strawberry with regrowth), staged sprites
- [x] Inventory (24 slots, stacks of 99) and a bag screen (Tab / I) with pick-up-and-swap
- [x] Hotbar (1–9, mouse wheel, click), energy bar, day label, message toast, floating text
- [x] Eating crops (right click) restores energy
- [x] Temporary "next day" key: **N**

**Deliverable:** Plant → Water → (N) next day → Grow → Harvest. Verified end to end in the
single-file build (turnip: 4 watered nights → harvest; strawberry regrows 3 days later).

## Phase 2: Time + Save ✅
- [x] `Clock`: 10 in-game minutes per 10 real seconds, 6:00 start, stops at 2:00 with a
      gentle message; 28-day seasons, weekdays; HUD panel with date and time
- [x] Evening light: the screen dims gradually from 18:00 to 21:00
- [x] Sleeping: E (or right click) on the farmhouse door → "Go to bed?" → fade → new morning
- [x] Day rollover for every map: crop growth, drying, fallow soil, energy refill
- [x] `SaveManager`: versioned JSON, chained migrations, temp-key write + backup, falls back
      to the backup if the main save is unreadable; autosave on sleep, tab hide and page close
- [x] Title menu (Continue / New game, with an overwrite confirmation) and a pause menu
      (Esc: Resume / Save and quit to title)
- [x] N (next day) is now debug-only (`?debug`) and goes through the normal sleep

**Deliverable:** several in-game days, safely resumed after a refresh. Verified: new game →
till → sleep → reload → Continue restores the date, soil and inventory.

## Phase 3: Town + Economy ✅
- [x] Bramblewick (`data/maps/town.js`): Fenn's Provisions, a cobbled square with a fountain,
      benches and lamps, three cottages, flower beds, a sign back to the farm
- [x] Map warps (`warps` in map data) with a fade; the farm's east road ↔ the town's west road
- [x] Shop (store door, 9:00–17:00): buy seeds one at a time or five with Shift
- [x] Shipping box: E ships the selected stack, E with empty hands takes the last stack back;
      sold overnight with a morning summary
- [x] Money HUD under the clock; 200g to start; money and the shipping box are saved

**Deliverable:** Farm → Grow → Harvest → Sell → Buy → Farm. Verified: walk to town, buy seeds,
ship turnips and wood, sleep, get paid, reload with the money kept.

## Phase 4: NPCs ✅
- [x] Marigold, Otto, June and Pip (`data/npcs.js`): homes, daily schedules, original lines
- [x] Schedules: at each leg's time a villager computes one BFS path (`npc/Path.js`) and walks
      it, crossing between the farm and town through the same warps as the player; `inside`
      legs walk home and go indoors; every morning and after loading they snap to schedule
- [x] Dialogue box: portrait, name, friendship hearts, typewriter text, pages
- [x] Friendship: +10 for the first chat each day (max 1000 = 10 hearts), three dialogue tiers,
      an introduction on the first meeting, short "again" lines after the first chat; saved
- [x] Talk with E, Space / left click or right click on a villager

**Deliverable:** the town feels alive. Verified by simulating a whole day: all 23 schedule legs
arrive at their targets, none needed the unreachable-target fallback.

## Phase 5: Polish
Tool/harvest particles (pooled, capped) · map fade transitions · sound effects plus one
ambient track (WebAudio, lazy-loaded, fully optional) · settings (volume, render scale,
key rebinding) · accessibility (larger UI text option, hold-to-repeat tools) · real art
pass.

## Later (explicitly out of MVP scope)
Fishing, mining, cooking, animals, seasonal crops, weather, festivals, quests, deeper
relationships/romance, farm upgrades, crafting, furniture, more maps.

---

## Technical risks
| Risk | Mitigation |
|---|---|
| ES modules don't load from `file://` | `tools/build.mjs` produces a single classic-script HTML file; `index.html` explains this when opened from disk |
| Old laptops with GPU-blocklisted browsers (software canvas) | Small backing store (≤ 3×, `?lowres` = 1×), render-on-change, one `drawImage` for the ground |
| Frame pacing on 120/144 Hz screens | Variable dt with sub-steps, positions snapped to 1/S px |
| Save corruption / schema changes | Versioned saves, migrations, write to a temp key then swap, keep the previous save as a backup |
| Scope creep | Roadmap gates; "Later" list; nothing gets added in Polish |
| Placeholder art feeling cheap | Procedural shading + automatic outlines + a limited palette; everything is replaceable by name |
| Browser storage cleared by the user | "Export save" (download JSON) in Phase 5 |
