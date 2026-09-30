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

## Farming ✅
Per-tile soil state on tillable ground: `untilled → tilled → tilled+watered`, `crop?`.
Crop definitions (`data/crops.js`): `{ id, seedItem, harvestItem, days, stages, regrow?, sellPrice }`.
A crop gains one day of growth per night **only if watered that day**. Stage =
`floor(growth / days × (stages−1))`; mature at `growth ≥ days`. Regrowing crops reset
growth to `days − regrow`. Watered flags clear every morning. Tilled soil that stays
empty for 3 nights reverts to plain field.
Only the field (`tillable` ground) can be tilled, and only where no object stands. Crops don't
block movement. Harvest a mature crop with E, or with left click / Space whatever is selected.
Code: `farming/Farming.js` (rules) and `GameMap` (`soil`, `watered`, `fallow`, `cropAt`, `crops`).

## Tools ✅
| Tool | Energy | Range | Cooldown | Effect |
|---|---|---|---|---|
| Hoe | 2 | facing tile | 0.35 s | till tillable ground |
| Watering can | 1 | facing tile | 0.35 s | water tilled soil; refill at the pond (capacity 20) |
| Axe | 3 | facing tile | 0.45 s | branch: 1 hit → wood; tree: 5 hits → stump + 4 wood; stump: 2 hits → wood |
| Pickaxe | 3 | facing tile | 0.45 s | rock: 2 hits → stone |

Target tile = the tile the player faces. Once the mouse moves, the target is the hovered tile
if it's within 1 tile of the player (otherwise the facing tile); pressing a direction key
switches back to facing. A bracket cursor marks the target. Using a tool turns the player
toward the target and locks movement for the swing.
Energy is only spent when the swing does something (tilling, watering, a hit). Filling the
can is free. Pines, bushes and buildings can't be chopped; they show a hint instead.
Breakable objects are data: `breakable: { tool, hits, drops, becomes }` in `data/objects.js`.
Drops go straight into the bag (a floating "+1 Wood" confirms it). If the bag is full, the
hit doesn't land and a message says so.

## Energy ✅
Max 100. Tool use costs the amounts above; walking is free. When energy is below a tool's
cost, the tool doesn't swing and a message suggests resting. The next day (N for now,
sleeping in Phase 2) restores it to full. Eating a crop (right click) restores 10–16
(`energy` on the item).

## Inventory ✅
24 slots (the hotbar is slots 1–9); stack size 99; tools don't stack. Tool state (the can's
water) lives on its slot. Select a hotbar slot with 1–9, the mouse wheel or a click.
The bag (Tab or I; Esc also closes) shows every slot: click or press E/Space on a slot to pick
its item up, then on another slot to swap them. WASD moves the cursor.
Starting items: hoe, watering can, axe, pickaxe, 12 turnip seeds. With `?debug`, also 6 potato
and 4 strawberry seeds, so every crop can be tested before the shop exists.

## Time ✅
10 in-game minutes per 10 real seconds. The day starts at 6:00 and the clock stops at 2:00
("It's very late…"); you never pass out. The clock pauses while any menu or prompt is open.
From 18:00 to 21:00 a plum wash fades in (evening light).
Sleeping (farmhouse door): fade out → ship sales (Phase 3) → grow crops and dry soil on every
map → restore energy → 6:00 next day → reset NPCs (Phase 4) → wake outside the door → save.
Saving after the rollover means reloading lands on the fresh morning.

## Maps & warps ✅
Each map may list `warps: [{ x, y, w, h, to, tx, ty, facing }]`. Stepping onto a tile of the
strip fades to the other map at `(tx, ty)` plus the same offset within the strip, so walking
along the edge of a road lines up on the other side. All maps stay loaded, so crops on the
farm keep growing while you're in town.

## Economy ✅
Starting money 200g plus 12 turnip seeds. Prices live on items: `price` (shop) and
`sellPrice` (shipping). Seeds sell back for half. Wood 2g, stone 3g.
| Item | Buy | Sell |
|---|---|---|
| Turnip seeds / turnip | 20g | 45g |
| Potato seeds / potato | 40g | 90g |
| Strawberry seeds / strawberry | 80g | 60g |
**Shop:** Fenn's Provisions door, open 9:00–17:00 (stock in `ECONOMY.shopStock`). E/click buys
one, Shift buys five; it refuses when you can't afford it or the bag is full.
**Shipping box:** E (or right click) with a stack selected ships the whole stack; with empty
hands it gives back the most recent stack. Everything in the box is sold overnight for
`sellPrice × qty`, and a summary greets you in the morning.

## NPCs & dialogue ✅
Schedule = list of `{ time, map, x, y, facing }` or `{ time, inside: true }` (go home and
disappear indoors). At each leg's start the villager computes one BFS path over the map's
collision grid (4-directional) to the target. If the target is on another map, it paths to that
map's warp strip, appears at the other side and paths again. Villagers keep walking while you're
on another map (only while the clock runs), and walk through the player, so nobody gets stuck.
If a target is unreachable they skip straight to it. Each morning and on load they snap to the
schedule.
| Villager | Day |
|---|---|
| Marigold | outside the store 8:20–17:10, fountain in the evening, home 20:30 |
| Otto | flowerbeds 7:30 and 10:30, the bench 13:00, south beds 17:00, home 19:00 |
| June | your mailbox 7:00, the farm road 8:30, town roads 10:00–18:30, then home |
| Pip | the fountain 8:30, your pond 12:30, the square 15:30, home 19:00 |

Dialogue (`dialogue/Dialogue.js`): the very first chat uses the introduction (tier 0, first
line); later first-chats-of-the-day use the friendship tier's lines (100+ points = tier 1,
300+ = tier 2), rotating by day; further chats that day use short `again` lines. Talking once
per day gives +10 friendship (max 1000, shown as 10 hearts). A `|` in a line starts a new page.
