// Inside the farmhouse: 13 x 10 tiles. Two rows of wallpapered wall, an 11 x 6 floor, and the
// doormat in the bottom wall. Pressing E on the farmhouse door brings you to `entry`.
// The bed and lamp are ordinary furniture: the player may move them (saved with the map).

import { DEFAULT_DECOR } from '../furniture.js';

export const HOME_MAP = {
  id: 'home',
  name: 'Farmhouse',
  indoor: true,
  decor: DEFAULT_DECOR, // floor and wallpaper styles (GameMap keeps its own copy)
  legend: {
    X: { ground: 'trim' },
    W: { ground: 'wall' },
    _: { ground: 'floor' },
    D: { ground: 'doormat' },
  },
  rows: [
    'XXXXXXXXXXXXX',
    'XWWWWWWWWWWWX',
    'XWWWWWWWWWWWX',
    'X___________X',
    'X___________X',
    'X___________X',
    'X___________X',
    'X___________X',
    'X___________X',
    'XXXXXXDXXXXXX',
  ],
  objects: [
    { type: 'window', x: 3, y: 1 },
    { type: 'window', x: 9, y: 1 },
    { type: 'furn_bedBasic', x: 1, y: 3 },
    { type: 'furn_lampBasic', x: 2, y: 3 },
  ],
  // Stepping onto the doormat goes back outside, in front of the farmhouse door.
  warps: [
    { x: 6, y: 9, w: 1, h: 1, to: 'farm', tx: 6, ty: 7, facing: 0 },
  ],
  entry: { x: 6, y: 8, facing: 3 },
  spawn: { x: 6, y: 8 },
};
