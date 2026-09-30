// A map: ground tile layer, world objects, and the collision grid derived from both.

import { TILE } from '../config.js';
import { TILE_TYPES, TILE_ID } from '../data/tiles.js';
import { OBJECT_TYPES } from '../data/objects.js';
import { LEGEND } from '../data/maps/legend.js';

export class GameMap {
  constructor(def) {
    this.id = def.id;
    this.name = def.name;
    this.spawn = def.spawn;
    const rows = def.rows;
    this.h = rows.length;
    this.w = rows[0].length;
    this.pxW = this.w * TILE;
    this.pxH = this.h * TILE;

    const n = this.w * this.h;
    this.ground = new Uint8Array(n);
    this.solid = new Uint8Array(n);
    this.objectAt = new Array(n).fill(null);
    this.objects = [];

    // Set by the renderer when the ground is baked.
    this.groundCanvas = null;
    this.groundCtx = null;

    const legend = def.legend ? { ...LEGEND, ...def.legend } : LEGEND;
    for (let y = 0; y < this.h; y++) {
      const row = rows[y];
      if (row.length !== this.w) {
        throw new Error(`Map "${this.id}": row ${y} is ${row.length} wide, expected ${this.w}`);
      }
      for (let x = 0; x < this.w; x++) {
        const entry = legend[row[x]];
        if (!entry) throw new Error(`Map "${this.id}": unknown tile '${row[x]}' at ${x},${y}`);
        const id = TILE_ID[entry.ground];
        if (id === undefined) throw new Error(`Map "${this.id}": unknown ground "${entry.ground}"`);
        this.ground[y * this.w + x] = id;
      }
    }
    for (let i = 0; i < n; i++) this.refreshSolid(i);

    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        const entry = legend[rows[y][x]];
        if (entry.object) this.addObject(entry.object, x, y);
      }
    }
    for (const o of def.objects || []) this.addObject(o.type, o.x, o.y);
  }

  inBounds(tx, ty) {
    return tx >= 0 && ty >= 0 && tx < this.w && ty < this.h;
  }

  tileAt(tx, ty) {
    return this.inBounds(tx, ty) ? TILE_TYPES[this.ground[ty * this.w + tx]] : TILE_TYPES[0];
  }

  isBlocked(tx, ty) {
    return !this.inBounds(tx, ty) || this.solid[ty * this.w + tx] === 1;
  }

  // True if any tile overlapped by the pixel rect [left, right) x [top, bottom) is blocked.
  rectBlocked(left, top, right, bottom) {
    const tx0 = Math.floor(left / TILE), tx1 = Math.floor((right - 0.001) / TILE);
    const ty0 = Math.floor(top / TILE), ty1 = Math.floor((bottom - 0.001) / TILE);
    for (let ty = ty0; ty <= ty1; ty++) {
      for (let tx = tx0; tx <= tx1; tx++) {
        if (this.isBlocked(tx, ty)) return true;
      }
    }
    return false;
  }

  refreshSolid(i) {
    const obj = this.objectAt[i];
    this.solid[i] = TILE_TYPES[this.ground[i]].solid || (obj && obj.def.solid) ? 1 : 0;
  }

  addObject(type, x, y) {
    const def = OBJECT_TYPES[type];
    if (!def) throw new Error(`Map "${this.id}": unknown object type "${type}"`);
    const [fx, fy, fw, fh] = def.footprint || [0, 0, def.w, def.h];
    const obj = {
      type, def, x, y,
      // Bottom centre of the object's area, in world pixels: the sprite anchor and sort key.
      px: (x + def.w / 2) * TILE,
      py: (y + def.h) * TILE,
      sortY: (y + def.h) * TILE,
      sprite: null, // resolved lazily by the renderer
      fx: x + fx, fy: y + fy, fw, fh,
    };
    this.forFootprint(obj, (i) => {
      this.objectAt[i] = obj;
      this.refreshSolid(i);
    });
    this.objects.push(obj);
    return obj;
  }

  removeObject(obj) {
    const k = this.objects.indexOf(obj);
    if (k < 0) return;
    this.objects.splice(k, 1);
    this.forFootprint(obj, (i) => {
      if (this.objectAt[i] === obj) this.objectAt[i] = null;
      this.refreshSolid(i);
    });
  }

  forFootprint(obj, fn) {
    for (let ty = obj.fy; ty < obj.fy + obj.fh; ty++) {
      for (let tx = obj.fx; tx < obj.fx + obj.fw; tx++) {
        if (this.inBounds(tx, ty)) fn(ty * this.w + tx);
      }
    }
  }
}
