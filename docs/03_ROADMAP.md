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

## Phase 1: Farming MVP
Soil state layer (tilled / watered) · tools (hoe, can, axe, pickaxe) with animation, energy
cost, range, cooldown · debris removal with item drops · crops from `data/crops.js` ·
inventory (24 slots, stacks) · hotbar (1–9, wheel) · energy bar · a temporary "advance
day" debug key.
**Deliverable:** Plant → Water → (debug) next day → Grow → Harvest.

## Phase 2: Time + Save
Clock HUD (time/day/season) · sleeping at the farmhouse door · day rollover (crop growth,
unwatering, energy) · `SaveManager` (versioned, migrations, autosave) · title menu with
Continue / New Game.
**Deliverable:** several in-game days, safely resumed after a refresh.

## Phase 3: Town + Economy
Town map · map warps with a fade transition · shop UI (buy seeds) · shipping box
(overnight sale + summary) · money HUD.
**Deliverable:** Farm → Grow → Harvest → Sell → Buy → Farm.

## Phase 4: NPCs
4 villagers (`data/npcs.js`) · schedule rules (time → map/tile) with simple grid walking
(BFS on small maps, cached per schedule leg) · dialogue box with portrait and name ·
friendship points (+ for talking once a day).
**Deliverable:** the town feels alive.

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
