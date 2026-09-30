// World object types. w/h = the tile area the object stands on (its sprite is anchored to the
// bottom centre of that area). footprint = [dx, dy, w, h] of tiles it occupies; defaults to the
// whole area.

export const OBJECT_TYPES = {
  tree: { sprite: 'obj.tree', w: 1, h: 1, solid: true },
  pine: { sprite: 'obj.pine', w: 1, h: 1, solid: true },
  rock: { sprite: 'obj.rock', w: 1, h: 1, solid: true },
  branch: { sprite: 'obj.branch', w: 1, h: 1, solid: true },
  bush: { sprite: 'obj.bush', w: 1, h: 1, solid: true },
  // The top row is roof overhang you can walk behind.
  house: { sprite: 'obj.house', w: 5, h: 4, solid: true, footprint: [0, 1, 5, 3] },
  mailbox: { sprite: 'obj.mailbox', w: 1, h: 1, solid: true },
  shippingBox: { sprite: 'obj.shippingbox', w: 1, h: 1, solid: true },
  sign: { sprite: 'obj.sign', w: 1, h: 1, solid: true },
};
