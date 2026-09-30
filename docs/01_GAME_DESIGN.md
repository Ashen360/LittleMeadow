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
| Farm | 40×30 tiles | Farmhouse (door = sleep), 16×9 field with debris, pond, trees, rocks, mailbox, shipping box, exit east to town |
| Bramblewick | ~40×30 tiles | General store, town square with fountain, 3 cottages, paths, flower beds, exit west to farm |

## Core loop
Wake at 6:00 AM → water crops → clear debris and till → plant → walk to town, chat,
buy seeds → ship produce in the evening → sleep (save, crops grow, energy restored).

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
| Sleep | E or right click on the farmhouse door |
| Shop / ship | E on the store door / on the shipping box (Shift+E buys 5) |
| Next day (debug builds only, `?debug`) | N |
| Menu / back / pause | Esc |
| Debug overlay | F3 or \` |

## Time
- The day starts at 6:00 AM. Every 10 real seconds, 10 in-game minutes pass, so 1 in-game hour = 1 real minute.
- The clock stops at 2:00 AM with a gentle "It's very late…" prompt. You never pass out.
- The clock pauses in menus, dialogue and the shop.
- 28 days per season: Spring → Summer → Autumn → Winter (names only in the MVP).

## Out of scope for the MVP
Fishing, mining, cooking, animals, weather, festivals, quests, romance, crafting,
furniture, tool upgrades and extra maps. See the roadmap's "Later" list.
