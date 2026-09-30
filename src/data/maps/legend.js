// Shared ASCII legend for map files. A map may extend or override it with its own `legend`.

export const LEGEND = {
  '.': { ground: 'grass' },
  ',': { ground: 'flowers' },
  '=': { ground: 'path' },
  '~': { ground: 'water' },
  ':': { ground: 'field' },
  T: { ground: 'grass', object: 'tree' },
  P: { ground: 'grass', object: 'pine' },
  B: { ground: 'grass', object: 'bush' },
  o: { ground: 'grass', object: 'rock' },
  r: { ground: 'field', object: 'rock' },
  b: { ground: 'field', object: 'branch' },
};
