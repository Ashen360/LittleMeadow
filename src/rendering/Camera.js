// Top-down camera: centres on a target, clamped to the map (centred if the map is smaller).

import { VIEW_W, VIEW_H } from '../config.js';

export class Camera {
  constructor() {
    this.x = 0;
    this.y = 0;
  }

  follow(tx, ty, map) {
    this.x = clampAxis(tx - VIEW_W / 2, map.pxW, VIEW_W);
    this.y = clampAxis(ty - VIEW_H / 2, map.pxH, VIEW_H);
  }
}

function clampAxis(v, mapSize, viewSize) {
  if (mapSize <= viewSize) return (mapSize - viewSize) / 2;
  return Math.max(0, Math.min(mapSize - viewSize, v));
}
