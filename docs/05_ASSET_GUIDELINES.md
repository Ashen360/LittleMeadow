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
| Item icon (Phase 1) | 16×16 | top-left |
| Portrait (Phase 4) | 40×40 | top-left |

## Sprite naming
`category.name[.variant][.frame]`, all lowercase:
`tile.grass0..3`, `tile.path0..1`, `tile.field0..1`, `tile.water0..1`, `tile.soil`, `tile.soilwet`,
`edge.grass.{n,s,e,w}`, `edge.water.{n,s,e,w}`, `decor.flowers0..2`,
`obj.tree`, `obj.pine`, `obj.rock`, `obj.branch`, `obj.bush`, `obj.house`, `obj.mailbox`,
`obj.shippingbox`, `obj.sign`, `player.{down,left,right,up}.{0,1,2}`, `shadow.small`.

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
