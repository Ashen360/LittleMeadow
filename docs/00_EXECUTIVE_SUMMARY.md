# Little Meadow — Executive Summary

A tiny, original, cozy 2D pixel-art farming life-sim, made as a personal gift.
It runs in any modern browser on low-end laptops (integrated graphics, 4 GB RAM).

## Pillars
- **Cozy over complex.** A small, polished world beats a big unfinished one.
- **Responsive.** Input shows up on screen in the next frame.
- **Light.** No framework, no dependencies, near-zero CPU use when idle.
- **Original.** Our own characters, town, art and writing. No Stardew Valley assets or designs.

## Stack
Vanilla JavaScript (ES modules) + Canvas 2D. Development needs no build step. A
zero-dependency script bundles the game into a single HTML file that runs by
double-clicking it. Saves are versioned JSON in `localStorage`.

## How to run
| What | Command |
|---|---|
| Dev server | `node tools/serve.mjs` → http://localhost:8080 |
| Play (no setup) | Download the repo ZIP, double-click `Play Little Meadow.html` (works offline) |
| Single-file build | `node tools/build.mjs` → `Play Little Meadow.html` (rebuild and commit it with every change) |
| Debug overlay | `F3` or `` ` `` in game, or add `?debug` to the URL |
| Low-power rendering | add `?lowres` to the URL (1× render scale) |

## Status
**Phases 0–6 done** (all but the real art pass, which needs an artist). The full loop
Farm → Grow → Harvest → Sell → Buy → Farm works, with four villagers, saving, sound and
settings. Long-term goals: tool upgrades at the forge, and a farmhouse to furnish (Phase 6). See [03_ROADMAP.md](03_ROADMAP.md) and the playtest checklist in
[07_PLAYTEST_CHECKLIST.md](07_PLAYTEST_CHECKLIST.md).

## Minimum viable vertical slice
One farm, one town, 3 crops, 4 tools, energy, a clock with sleeping, a shipping box, one
shop, 4 villagers with schedules and dialogue, and save/load. The complete loop
**Farm → Grow → Harvest → Sell → Buy → Farm** works across several in-game days and
survives a page refresh.

## Deliberate deviations from the original brief
| Brief | Decision | Why |
|---|---|---|
| 16 or 32 px tiles | 16 px tiles, 384×216 logical view (24×13.5 tiles) | Integer-scales to 1152×648 (3×) on 1366×768 laptops and 1920×1080 (5×) on Full HD |
| 4-direction movement | 8-way movement (normalized), 4-direction sprites | Pressing two WASD keys together feels natural; facing follows the most recent key |
| Suggested file tree | Trimmed: `Tile.js` + `Collision.js` merged into `GameMap.js`; content lives in `src/data/` | Fewer, more cohesive modules; content is data, not code |
| House | No interior for the MVP (the door was the bed); added in Phase 6 with furniture | Kept the MVP small; the playtest then asked for a long-term goal |
| Saves in LocalStorage or IndexedDB | `localStorage` | A save is a few KB; IndexedDB's async API adds complexity for no gain |
| UI text | Original 5 px bitmap font drawn on the canvas | Consistent pixel look, zero DOM/layout cost |
| Watering can | Has a capacity and is refilled at the pond | Gives the pond a purpose at almost no cost |
| Day end | The clock stops at 2:00 AM (no passing out) | Gentle; the brief asked us not to force passing out |
| Debris drops | Cleared debris goes straight into the bag with a "+1 Wood" pop, no pickups on the ground | Same feel, no item-entity system to build |
| Energy | Only spent when a swing does something | Missing a tile shouldn't cost you; fits "cozy over complex" |
