// Ground tile types. The index in this array is the id stored in map tile layers.
// grassy: neighbours draw grass lips onto path/field tiles next to this one.

export const TILE_TYPES = [
  { key: 'void', solid: true },
  { key: 'grass', solid: false, grassy: true },
  { key: 'flowers', solid: false, grassy: true },
  { key: 'path', solid: false },
  { key: 'water', solid: true, water: true },
  { key: 'field', solid: false, tillable: true },
  { key: 'plaza', solid: false },
  // Indoors. floor/wall art follows the map's decor (floor and wallpaper styles).
  { key: 'floor', solid: false, indoor: true },
  { key: 'wall', solid: true, indoor: true },     // wallpapered wall face
  { key: 'trim', solid: true, indoor: true },     // dark wooden wall tops and edges
  { key: 'doormat', solid: false, indoor: true }, // the way out
];

export const TILE_ID = Object.fromEntries(TILE_TYPES.map((t, i) => [t.key, i]));
