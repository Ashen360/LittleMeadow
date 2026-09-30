# 04 — Gameplay Systems

Numbers are starting values. Tune them in `src/data/`, not in the system code.
✅ = implemented, 🔜 = planned.

## Movement & collision ✅
- Speed 72 px/s (4.5 tiles/s). 8-way input normalized; facing = most recently pressed direction key.
- Feet hitbox 10×6 px. Resolution runs per axis against the `solid` grid. The map border is solid.
- **Corner sliding:** if the player is blocked while moving along one axis but is within
  6 px of a gap, they slide sideways into it (makes doorways and gaps forgiving).
- Walk cycle: frames `step, idle, step, idle` at 0.14 s each. The first step frame shows immediately.

## Maps ✅
ASCII rows + legend (`data/maps/legend.js` holds the shared defaults) + an explicit object
list for multi-tile objects. Loading validates rectangular rows and unknown characters.
Object types declare `w, h, footprint, solid, sprite`. The draw anchor is the bottom
centre of the object's w×h area; the sort key is that area's bottom edge.

## Farming 🔜 (Phase 1)
Per-tile soil state on tillable ground: `untilled → tilled → tilled+watered`, `crop?`.
Crop definitions (`data/crops.js`): `{ id, seedItem, harvestItem, days, stages, regrow?, sellPrice }`.
A crop gains one day of growth per night **only if watered that day**. Stage =
`floor(growth / days × (stages−1))`; mature at `growth ≥ days`. Regrowing crops reset
growth to `days − regrow`. Watered flags clear every morning. Untilled soil that stays
empty for 3 nights reverts (no crop).

## Tools 🔜
| Tool | Energy | Range | Cooldown | Effect |
|---|---|---|---|---|
| Hoe | 2 | facing tile | 0.35 s | till tillable ground |
| Watering can | 1 | facing tile | 0.35 s | water tilled soil; refill at the pond (capacity 20) |
| Axe | 3 | facing tile | 0.45 s | branch: 1 hit → wood; tree: 5 hits → stump + 4 wood |
| Pickaxe | 3 | facing tile | 0.45 s | rock: 2 hits → stone |

Target tile = the tile the player faces. With the mouse, the target is the hovered tile
if it's within 1 tile of the player.

## Energy 🔜
Max 100. Tool use costs the amounts above; walking is free. At 0, tools are disabled
(you get a sweat-drop and a message). Sleeping restores to full. Eating a crop (right click)
restores 10–20.

## Inventory 🔜
24 slots (the hotbar is slots 1–9); stack size 99; tools don't stack. No drag-and-drop in the
MVP: click a slot to select it, and E/click in the inventory to swap two slots.

## Time 🔜 (Phase 2)
10 in-game minutes per 10 real seconds. The day starts at 6:00 and the clock stops at 2:00.
Sleeping: save → grow crops → clear watered → restore energy → reset NPCs → 6:00 next day.

## Economy 🔜 (Phase 3)
Shop buys seeds at the listed price. Shipping box: items placed in it are sold overnight
for `sellPrice × qty`, with a summary on waking. Starting money 200g plus 12 turnip seeds.

## NPCs & dialogue 🔜 (Phase 4)
Schedule = list of `{ time, map, x, y, facing }`. At each time boundary the NPC paths to the
target with BFS on the tile grid, computed once per leg. Dialogue = lines chosen by
`(npc, friendship tier, day parity)`, falling back to generic lines. Talking once per day
gives +10 friendship (max 1000, shown as hearts).
