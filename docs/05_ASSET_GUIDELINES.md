# 05 — Asset Guidelines

## Visual identity
Warm, soft, slightly faded storybook colours. Round silhouettes, a 1 px dark-plum outline
(`#2a1f2d`) on characters and objects, but **no outlines on ground tiles**. Light comes from
the top-left. The palette is limited and defined in `src/rendering/palette.js`, and every
sprite should stick to it.

Don't copy Stardew Valley (or any other game): no ripped assets, no traced sprites, no
look-alike characters, no copied UI layouts.

## Dimensions
| Kind | Size | Anchor |
|---|---|---|
| Ground tile | 16×16 | top-left |
| Player / NPC frame | 18×24 (includes 1 px outline margin) | feet (9, 23) |
| Tree | 34×46 | trunk base |
| 1-tile object (rock, bush, box) | ≤ 18×20 | bottom centre |
| Farmhouse | 82×80 | bottom centre of its 5×4 footprint |
| Item icon | 16×16 | centre (8, 8) |
| Crop stage | 18×22 | plant base (9, 19) |
| Portrait (Phase 4) | 40×40 | top-left |

## Sprite naming
`category.name[.variant][.frame]`, all lowercase:
`tile.grass0..3`, `tile.path0..1`, `tile.field0..1`, `tile.water0..1`, `tile.soil`, `tile.soilwet`,
`edge.grass.{n,s,e,w}`, `edge.water.{n,s,e,w}`, `decor.flowers0..2`,
`obj.tree`, `obj.pine`, `obj.rock`, `obj.branch`, `obj.bush`, `obj.house`, `obj.mailbox`,
`obj.shippingbox`, `obj.sign`, `obj.stump`, `player.{down,left,right,up}.{0,1,2}`, `shadow.small`.

Phase 1 additions:
- Item icons, 16×16, anchored at their centre (8, 8): `item.hoe`, `item.can`, `item.axe`,
  `item.pickaxe`, `item.seeds.{turnip,potato,strawberry}`, `item.turnip`, `item.potato`,
  `item.strawberry`, `item.wood`, `item.stone`.
- Held tools (drawn in the player's hand while swinging), same size and anchor:
  `held.{hoe,can,axe,pickaxe}` (pointing right) and `held.<tool>.left`.
- Crops, 18×22, anchored at (9, 19) so the plant's base sits 2 px above the tile bottom:
  `crop.turnip.0..3`, `crop.potato.0..4`, `crop.strawberry.0..4` (stage 0 = seeds, last = ripe).
- UI: `ui.slot`, `ui.slot.selected` (20×20, top-left), `ui.cursor` (16×16 tile brackets).

Phase 3 additions (anchor = bottom centre of the object's area, like other objects):
`tile.plaza0..1`, `obj.store` (6×5 area, 98×86), `obj.cottage.{rose,moss,sky}` (4×4, 66×70),
`obj.fountain` (3×2), `obj.bench` (2×1), `obj.lamp`, `obj.flowerbed`.

Phase 4 additions: `npc.<id>.{down,left,right,up}.{0,1,2}` (18×24, feet (9, 23), like the
player) and `portrait.<id>` (40×40, top-left) for `marigold`, `otto`, `june`, `pip`.

## Replacing placeholder art
1. Draw sprites into one PNG sheet (≤ 1024×1024, power of two not required).
2. Write `assets/atlas.json`: `{ "obj.tree": { "x":0, "y":0, "w":34, "h":46, "ax":17, "ay":43 }, … }`.
3. At startup, sprites from the sheet override the procedural ones with the same name;
   anything missing falls back to the placeholder. This loader gets added the first time
   real art exists.

## Audio (Phase 5)
OGG (with MP3 fallback only if needed), mono for SFX, ≤ 100 KB per SFX, one ambient loop
≤ 1.5 MB. Total audio budget 3 MB. Audio must load lazily after the first user input and
must never block play.

## Licensing
Only original work or CC0 assets. Record each non-original asset in `assets/CREDITS.md`
with its source and licence.
