// World object types. w/h = the tile area the object stands on (its sprite is anchored to the
// bottom centre of that area). footprint = [dx, dy, w, h] of tiles it occupies; defaults to the
// whole area.
// breakable = { tool, hits, drops: [[itemId, qty]], becomes? } — cleared with that tool.
// examine = text shown when interacting (E); hint = text shown when a tool can't affect it.
// door = { dx, dy, action }: interacting with that tile of the object triggers the action.

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
    examine: 'Home, sweet home.', door: { dx: 2, dy: 3, action: 'sleep' },
  },
  mailbox: { sprite: 'obj.mailbox', w: 1, h: 1, solid: true, examine: 'The mailbox is empty.' },
  shippingBox: {
    sprite: 'obj.shippingbox', w: 1, h: 1, solid: true,
    examine: 'The shipping box. Selling arrives with the town update.',
  },
  sign: { sprite: 'obj.sign', w: 1, h: 1, solid: true, examine: 'East: Bramblewick.' },
};
