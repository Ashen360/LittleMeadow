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

### Farmland expansion ✅
You start owning only a **3×3** corner of the 16×9 field (the top-left, nearest the house).
The rest is overgrown: it looks wild, and it can't be tilled or planted (a message points to
the sign). Debris on it can still be cleared. A staked twine line marks the edge of your plot.
The **plot sign** stands just outside your plot (right edge first, then bottom). E on it offers
the next step, which grows the rectangle from the same corner:

| Step | Size | Cost |
|---|---|---|
| Start | 3×3 | — |
| 1 | 5×4 | 250g |
| 2 | 8×5 | 600g |
| 3 | 12×7 | 1,200g |
| 4 | 16×9 (whole field) | 2,500g |

After buying, the sign moves to the new edge (never onto the player); it disappears once the
whole field is yours. Tuning: `plots` in `data/maps/farm.js`. The level is saved as
`maps.farm.plotLevel`. Saves from before this feature start at 3×3: tilled soil and crops
outside the plot stay, and can still be watered and harvested, but not replanted or re-tilled
(empty soil there returns to wild field after 3 nights).

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

### Tool upgrades ✅
The **Bramblewick Forge** (next to Fenn's, open 9:00–17:00, E at the anvil) upgrades the
pickaxe, axe and hoe through five tiers: Copper, Iron, Silver, Gold, Starlit. Each row in the
forge shows the tool, what the next tier improves, its cost, one bar per tier and a Buy button;
buying always asks to confirm. The upgrade is instant. Costs are gold + wood (stone is too
scarce to ask for):

| Level | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|
| Cost | 100g + 5 wood | 250g + 10 | 500g + 20 | 900g + 30 | 1500g + 40 |
| Pickaxe / axe energy | 2.5 | 2 | 1.5 | 1 | 0.5 |
| Pickaxe / axe swing | 0.41 s | 0.37 s | 0.33 s | 0.29 s | 0.25 s |
| Axe: chops per tree (5 hp) | 3 | 3 | 2 | 2 | 1 |
| Pickaxe: hits per rock (2 hp) | 1 | 1 | 1 | 1 | 1 |
| Hoe energy / swing | 1.6 / 0.32 s | 1.3 / 0.29 s | 1 / 0.26 s | 0.7 / 0.23 s | 0.4 / 0.2 s |

The level is stored on the tool's inventory slot (`slot.level`), so it saves with the bag.
Upgraded tools show their tier in their name ("Copper Axe") and a tier-coloured gem on
their slot. Tuning: `UPGRADES` in `data/tuning.js`.

## Energy ✅
Max 100. Tool use costs the amounts above (less with upgraded tools, and possibly
fractional); walking is free. When energy is below a tool's
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
Sleeping (E on the bed): fade out → ship sales → grow crops and dry soil on every map →
restore energy → 6:00 next day → reset NPCs → wake beside the bed (a free floor tile below
or beside it; by the doormat if there is no bed) → save.

## Home & furniture ✅ (Phase 6)
**Farmhouse:** E on the farmhouse door fades inside to the spot above the doormat; stepping
onto the doormat warps back outside. The room (`data/maps/home.js`) has trim, two rows of
wallpapered wall with windows, and an 11×6 floor. Its `decor` holds the floor and wallpaper
styles and is saved with the map.
**Furniture** (`data/furniture.js`) are map objects of type `furn_<id>`, with an item of the
same id. Holding one indoors shows a ghost at the target (green = fits, red = doesn't):
- Keyboard: the footprint extends away from you from the facing tile. Mouse: any hovered tile
  in the room (indoors the mouse reaches the whole room); the footprint's bottom row sits on
  it, centred.
- It must be all floor, not on the tile above the doormat, and not overlap you or other
  furniture. Rugs (`flat`) are walkable and live in a separate layer (`GameMap.flatAt`), so
  furniture can stand on them; they always draw underneath.
- Using a tool or empty hands on furniture picks it up (standing pieces before rugs). Picking
  up your only bed shows a reminder; you can always put it back.
- Beds (`use: 'sleep'`) work from any of their tiles. `light` pieces (lamp, woodstove) glow
  after 18:00, and with any light the indoor night wash is lighter (0.26 instead of 0.42).
**Floors and wallpaper:** using one anywhere indoors re-styles the whole room (the ground is
re-baked) and puts the previous style's item back in the bag.
**Willow & Wool** (Bramblewick, 9:00–17:00): Furniture / Floors / Wallpaper tabs
(Left/Right or click), a 7-row scrolling list (Up/Down, wheel, hover) and a preview of the
selected piece on your current floor. E / click buys one. Decorations can't be shipped.

| Furniture | Size | Price | | Floors / wallpaper | Price |
|---|---|---|---|---|---|
| Basic Bed (bed) | 1×2 | 300g | | Oak Floor | 100g |
| Little Lamp (light) | 1×1 | 150g | | Honey Parquet | 250g |
| Quilted Bed (bed) | 2×2 | 1200g | | Rose Tile Floor | 300g |
| Oak Chair | 1×1 | 80g | | Mossy Stone Floor | 350g |
| Plum Armchair | 1×1 | 260g | | Cream Wallpaper | 100g |
| Farmhouse Table | 2×1 | 340g | | Sprig Wallpaper | 200g |
| Bookshelf | 2×1 | 420g | | Rosebud Wallpaper | 250g |
| Dresser | 2×1 | 320g | | Sky Stripe Wallpaper | 250g |
| Potted Fern | 1×1 | 90g | | Starry Plum Wallpaper | 350g |
| Little Woodstove (light) | 1×1 | 700g | | | |
| Rose Rug (rug) | 3×2 | 280g | | | |
| Meadow Rug (rug) | 2×2 | 220g | | | |
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

## Feedback & audio ✅
Particles come from a pool of 64 (the oldest are reused) and only exist for half a second.
Sounds are synthesized (`audio/Audio.js`), so there are no audio files: hoe, water, chop,
pick, break, harvest, plant, eat, buy, ship, select, deny, talk, sleep, door. Music is a
music-box improvisation on a major pentatonic scale over a four-chord bass; in the evening it
shifts down and plays fewer notes. Volumes are squared (perceptual) and 0 = off.

## Settings ✅
`core/Settings.js`, saved in `localStorage["littlemeadow.settings"]`, applying to every farm:
| Setting | Values | Default |
|---|---|---|
| Music / Sound effects | Off, 10–100% | 50% / 70% |
| Render scale | Auto (≤3x), 1x (fastest), 2x, 3x | Auto |
| Large text | dialogue and messages at 2x | Off |
| Hold to repeat tools | keep swinging while the button is held | On |
| Controls | rebind move / use / interact / bag (the new key replaces the first one) | |
| Export save file | downloads `little-meadow-day-N.json` | |
| Import save file (title only) | validates and migrates, then Continue | |
