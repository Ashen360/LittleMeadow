// Home decorating content: furniture you place in the farmhouse, plus floor and wallpaper
// styles. Each entry also becomes an item (see items.js) and furniture becomes an object type
// (see objects.js), keyed `furn_<id>`, `floor_<id>` and `wall_<id>`.
//
// Furniture: w/h = tiles it covers. flat = a rug: walkable, drawn under everything, and other
// furniture can stand on it. use: 'sleep' makes it a bed. light = glows in the evening.
// price = cost at Willow & Wool (every entry here is sold there).

export const FURNITURE = {
  bedBasic: { name: 'Basic Bed', w: 1, h: 2, use: 'sleep', price: 300, desc: 'A narrow bed with a patched quilt. Sleep here.' },
  lampBasic: { name: 'Little Lamp', w: 1, h: 1, light: true, price: 150, desc: 'Glows warm and golden after dark.' },
  bedQuilt: { name: 'Quilted Bed', w: 2, h: 2, use: 'sleep', price: 1200, desc: 'Big, soft, and covered in patchwork hearts.' },
  chair: { name: 'Oak Chair', w: 1, h: 1, price: 80, desc: 'A sturdy chair. It creaks in a friendly way.' },
  armchair: { name: 'Plum Armchair', w: 1, h: 1, price: 260, desc: 'Deep cushions for long evenings.' },
  table: { name: 'Farmhouse Table', w: 2, h: 1, price: 340, desc: 'Room for two plates and a jar of flowers.' },
  bookshelf: { name: 'Bookshelf', w: 2, h: 1, price: 420, desc: 'Full of seed almanacs and storybooks.' },
  dresser: { name: 'Dresser', w: 2, h: 1, price: 320, desc: 'Three drawers of neatly folded sweaters.' },
  plant: { name: 'Potted Fern', w: 1, h: 1, price: 90, desc: 'Easy to love, hard to over-water.' },
  stove: { name: 'Little Woodstove', w: 1, h: 1, light: true, price: 700, desc: 'Crackles softly. Keeps the whole room warm.' },
  rugRose: { name: 'Rose Rug', w: 3, h: 2, flat: true, price: 280, desc: 'A soft oval rug. Furniture can stand on it.' },
  rugMeadow: { name: 'Meadow Rug', w: 2, h: 2, flat: true, price: 220, desc: 'Round and green, with little daisies.' },
};

export const FLOORS = {
  oak: { name: 'Oak Floor', price: 100, desc: 'Warm oak planks. The floor the house came with.' },
  honey: { name: 'Honey Parquet', price: 250, desc: 'Golden blocks laid in a neat pattern.' },
  rose: { name: 'Rose Tile Floor', price: 300, desc: 'Checked tiles in rose and peach.' },
  stone: { name: 'Mossy Stone Floor', price: 350, desc: 'Cool flagstones with a little moss.' },
};

export const WALLPAPERS = {
  cream: { name: 'Cream Wallpaper', price: 100, desc: 'Soft cream stripes. The house came with it.' },
  sprig: { name: 'Sprig Wallpaper', price: 200, desc: 'Little green sprigs on cream.' },
  rosebud: { name: 'Rosebud Wallpaper', price: 250, desc: 'Tiny rosebuds on peach.' },
  sky: { name: 'Sky Stripe Wallpaper', price: 250, desc: 'Fresh blue and white stripes.' },
  starry: { name: 'Starry Plum Wallpaper', price: 350, desc: 'Golden stars on deep plum.' },
};

// The farmhouse's starting styles.
export const DEFAULT_DECOR = { floor: 'oak', wall: 'cream' };

// Willow & Wool's catalogue, one list per tab (item ids, in display order).
export const SHOP_TABS = [
  { label: 'Furniture', items: Object.keys(FURNITURE).map((id) => `furn_${id}`) },
  { label: 'Floors', items: Object.keys(FLOORS).map((id) => `floor_${id}`) },
  { label: 'Wallpaper', items: Object.keys(WALLPAPERS).map((id) => `wall_${id}`) },
];
