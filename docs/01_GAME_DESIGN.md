# 01 — Game Design

## Premise
You receive the keys to **Little Meadow Farm**, a tiny overgrown plot left to you by a
great-aunt, a short walk from the sleepy village of **Bramblewick**. Clear the field,
grow a few crops, get to know your neighbours, and make the place feel like home.
There is no failure state and nothing is urgent.

## Feel
Cozy, relaxing, slightly nostalgic, and easy to understand within a minute. Warm colours,
soft round shapes, gentle feedback such as little dust puffs, a "pop" on harvest and
cheerful jingles.

## World (MVP)
| Map | Size | Contents |
|---|---|---|
| Farm | 40×30 tiles | Farmhouse (door = go inside), 16×9 field with debris (you start with a 3×3 corner and buy the rest), pond, trees, rocks, mailbox, shipping box, exit east to town |
| Farmhouse | 13×10 tiles | Your room: a bed (sleep), a lamp, windows; furnish it from Willow & Wool |
| Bramblewick | ~40×30 tiles | General store, town square with fountain, 3 cottages, paths, flower beds, exit west to farm |

## Core loop
Wake at 6:00 AM beside your bed → water crops → clear debris and till → plant → walk to
town, chat, buy seeds → ship produce in the evening → spend savings on tool upgrades and
furniture → sleep (save, crops grow, energy restored).

## Crops (MVP)
| Crop | Seed price | Days to grow | Regrows | Sell price |
|---|---|---|---|---|
| Turnip | 20g | 4 | — | 45g |
| Potato | 40g | 6 | — | 90g |
| Strawberry | 80g | 8 | every 3 days | 60g |

Crops only grow on days when they were watered. Seasons are cosmetic in the MVP: the
calendar shows them, but crops aren't seasonal yet.

## Villagers (MVP, all original)
| Name | Role | Personality | Routine sketch |
|---|---|---|---|
| **Marigold Fenn** | Runs *Fenn's Provisions*, the general store | Warm, chatty, knows everyone's business, calls you "sprout" | Store 9:00–17:00, square in the evening |
| **Otto Brambleby** | Retired botanist, tends the town flowerbeds | Quiet, dry humour, short sentences, secretly delighted by your farm | Flowerbeds in the morning, bench by the fountain in the afternoon |
| **Juniper "June" Park** | Village mail carrier, your neighbour | Energetic, always running, collects stamps | Delivers mail (visits the farm mailbox in the morning), jogs the paths |
| **Pip** | Marigold's nephew, 8 years old | Curious, collects "treasures" (rocks, bugs), asks endless questions | Plays in the square, by the pond after lunch |

Relationship points are tracked in Phase 4 and only change dialogue lightly.

## Controls
| Action | Default |
|---|---|
| Move | WASD (arrow keys also work) |
| Interact / talk / confirm | E |
| Use tool or item | Left click (or Space) |
| Secondary (e.g. eat) | Right click |
| Hotbar | 1–9, mouse wheel, click a slot |
| Bag (inventory) | Tab or I |
| Go home / sleep | E on the farmhouse door to go in; E on the bed to sleep; the doormat leads out |
| Decorate (indoors) | Hold furniture and click / Space to place; click furniture to pick it up; use floor or wallpaper anywhere to apply |
| Shop / ship | E on the store door / on the shipping box (Shift+E buys 5) |
| Next day (debug builds only, `?debug`) | N |
| Menu / back / pause | Esc |
| Debug overlay | F3 or \` |
| Settings / rebinding | Esc → Settings (also on the title screen) |

## Time
- The day starts at 6:00 AM. Every 10 real seconds, 10 in-game minutes pass, so 1 in-game hour = 1 real minute.
- The clock stops at 2:00 AM with a gentle "It's very late…" prompt. You never pass out.
- The clock pauses in menus, dialogue and the shop.
- 28 days per season: Spring → Summer → Autumn → Winter (names only in the MVP).

## Out of scope for the MVP
Fishing, mining, cooking, animals, weather, festivals, quests, romance, crafting,
and extra maps. See the roadmap's "Later" list. (Tool upgrades were added after the first
playtest, and the house interior with furniture in Phase 6.)

## Long-term goals
- **More farmland**: start with a 3×3 plot; the sign by it grows the field in four steps
  (250g → 600g → 1,200g → 2,500g) up to the full 16×9. This is the first goal of the game.
- **Tool upgrades** at the Bramblewick Forge: five tiers per tool, paid in gold and wood.
- **Home**: furnish the farmhouse from Willow & Wool Home Goods: 12 pieces of furniture,
  4 floors and 5 wallpapers, from an 80g chair to a 1200g quilted bed.
