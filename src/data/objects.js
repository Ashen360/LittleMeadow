// World object types. w/h = the tile area the object stands on (its sprite is anchored to the
// bottom centre of that area). footprint = [dx, dy, w, h] of tiles it occupies; defaults to the
// whole area.
// breakable = { tool, hits, drops: [[itemId, qty]], becomes? } — cleared with that tool.
// examine = text shown when interacting (E); hint = text shown when a tool can't affect it.
// use = { dx, dy, action }: interacting with that tile of the object triggers the action
// (sleep, shop, ship, ...); use.any = any tile of the object works.
// flat = lies on the floor (rugs, windows on walls): walkable unless its tile is, drawn under
// everything else, and tracked separately so a normal object can stand on it.
// furniture = key into FURNITURE: the player can pick it up and place it again.

import { FURNITURE } from './furniture.js';

export const OBJECT_TYPES = {
  tree: {
    sprite: 'obj.tree', w: 1, h: 1, solid: true,
    breakable: { tool: 'axe', hits: 5, drops: [['wood', 4]], becomes: 'stump' },
  },
  pine: { sprite: 'obj.pine', w: 1, h: 1, solid: true, hint: 'This old pine is far too sturdy to chop.' },
  stump: {
    sprite: 'obj.stump', w: 1, h: 1, solid: true,
    breakable: { tool: 'axe', hits: 2, drops: [['wood', 1]] },
  },
  rock: {
    sprite: 'obj.rock', w: 1, h: 1, solid: true,
    breakable: { tool: 'pickaxe', hits: 2, drops: [['stone', 1]] },
  },
  branch: {
    sprite: 'obj.branch', w: 1, h: 1, solid: true,
    breakable: { tool: 'axe', hits: 1, drops: [['wood', 1]] },
  },
  bush: { sprite: 'obj.bush', w: 1, h: 1, solid: true, hint: 'The berries on this bush aren\'t ripe yet.' },
  // The top row is roof overhang you can walk behind.
  house: {
    sprite: 'obj.house', w: 5, h: 4, solid: true, footprint: [0, 1, 5, 3],
    examine: 'Home, sweet home.', use: { dx: 2, dy: 3, action: 'enter' },
  },
  // Inside the farmhouse: a window set into the wallpapered wall.
  window: { sprite: 'obj.window', w: 1, h: 2, flat: true, examine: 'Sunlight spills across the floor.' },
  mailbox: { sprite: 'obj.mailbox', w: 1, h: 1, solid: true, examine: 'The mailbox is empty.' },
  shippingBox: { sprite: 'obj.shippingbox', w: 1, h: 1, solid: true, use: { dx: 0, dy: 0, action: 'ship' } },
  sign: { sprite: 'obj.sign', w: 1, h: 1, solid: true, examine: 'East: Bramblewick.' },
  signFarm: { sprite: 'obj.sign', w: 1, h: 1, solid: true, examine: 'West: Little Meadow Farm.' },

  // Bramblewick.
  store: {
    sprite: 'obj.store', w: 6, h: 5, solid: true, footprint: [0, 1, 6, 4],
    examine: 'Fenn\'s Provisions. Seeds, supplies and gossip.', use: { dx: 3, dy: 4, action: 'shop' },
  },
  cottageRose: {
    sprite: 'obj.cottage.rose', w: 4, h: 4, solid: true, footprint: [0, 1, 4, 3],
    examine: 'The Fenn cottage. Something smells like cinnamon.',
  },
  cottageMoss: {
    sprite: 'obj.cottage.moss', w: 4, h: 4, solid: true, footprint: [0, 1, 4, 3],
    examine: 'Otto\'s cottage. Pressed flowers line the windows.',
  },
  cottageSky: {
    sprite: 'obj.cottage.sky', w: 4, h: 4, solid: true, footprint: [0, 1, 4, 3],
    examine: 'June\'s cottage. A bicycle leans by the door.',
  },
  furnitureShop: {
    sprite: 'obj.furnitureshop', w: 5, h: 4, solid: true, footprint: [0, 1, 5, 3],
    examine: 'Willow & Wool Home Goods. Furniture, floors and wallpaper.',
    use: { dx: 2, dy: 3, action: 'furniture' },
  },
  // The top row is roof overhang; the anvil counter is at the front centre.
  forge: {
    sprite: 'obj.forge', w: 3, h: 3, solid: true, footprint: [0, 1, 3, 2],
    examine: 'Bramblewick Forge. The anvil is still warm.', use: { dx: 1, dy: 2, action: 'forge' },
  },
  fountain: { sprite: 'obj.fountain', w: 3, h: 2, solid: true, examine: 'Coins glint at the bottom of the fountain.' },
  bench: { sprite: 'obj.bench', w: 2, h: 1, solid: true, examine: 'A well-loved bench.' },
  lamp: { sprite: 'obj.lamp', w: 1, h: 1, solid: true },
  flowerbed: { sprite: 'obj.flowerbed', w: 1, h: 1, solid: true, examine: 'Otto keeps these beautifully.' },
};

// Placeable furniture (data/furniture.js), keyed like its item: furn_<id>.
for (const [id, f] of Object.entries(FURNITURE)) {
  OBJECT_TYPES[`furn_${id}`] = {
    sprite: `furn.${id}`, w: f.w, h: f.h, solid: !f.flat, flat: !!f.flat, furniture: id,
    light: !!f.light, examine: f.desc,
    use: f.use ? { any: true, action: f.use } : undefined,
  };
}
