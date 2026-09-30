// World object types. w/h = the tile area the object stands on (its sprite is anchored to the
// bottom centre of that area). footprint = [dx, dy, w, h] of tiles it occupies; defaults to the
// whole area.
// breakable = { tool, hits, drops: [[itemId, qty]], becomes? } — cleared with that tool.
// examine = text shown when interacting (E); hint = text shown when a tool can't affect it.
// use = { dx, dy, action }: interacting with that tile of the object triggers the action
// (sleep, shop, ship). Other tiles of the object show `examine`.

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
    examine: 'Home, sweet home.', use: { dx: 2, dy: 3, action: 'sleep' },
  },
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
  fountain: { sprite: 'obj.fountain', w: 3, h: 2, solid: true, examine: 'Coins glint at the bottom of the fountain.' },
  bench: { sprite: 'obj.bench', w: 2, h: 1, solid: true, examine: 'A well-loved bench.' },
  lamp: { sprite: 'obj.lamp', w: 1, h: 1, solid: true },
  flowerbed: { sprite: 'obj.flowerbed', w: 1, h: 1, solid: true, examine: 'Otto keeps these beautifully.' },
};
