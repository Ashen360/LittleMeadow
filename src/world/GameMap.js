// A map: ground tile layer, world objects, the collision grid derived from both, and the
// farming layers (soil state and crops; the rules live in farming/Farming.js).

import { TILE } from '../config.js';
import { TILE_TYPES, TILE_ID } from '../data/tiles.js';
import { OBJECT_TYPES } from '../data/objects.js';
import { LEGEND } from '../data/maps/legend.js';

export class GameMap {
  constructor(def) {
    this.id = def.id;
    this.name = def.name;
    this.spawn = def.spawn;
    this.warps = def.warps || [];
    this.indoor = !!def.indoor;
    this.entry = def.entry || null;                     // where you appear when coming in
    this.decor = def.decor ? { ...def.decor } : null;   // indoor floor / wallpaper styles
    const rows = def.rows;
    this.h = rows.length;
    this.w = rows[0].length;
    this.pxW = this.w * TILE;
    this.pxH = this.h * TILE;

    const n = this.w * this.h;
    this.ground = new Uint8Array(n);
    this.solid = new Uint8Array(n);
    this.objectAt = new Array(n).fill(null);
    this.flatAt = new Array(n).fill(null); // rugs and windows: under whatever stands there
    this.objects = [];

    // Farming layers, per tile.
    this.soil = new Uint8Array(n);     // 1 = tilled
    this.watered = new Uint8Array(n);  // 1 = watered today
    this.fallow = new Uint8Array(n);   // nights this tilled tile has stood empty
    this.cropAt = new Array(n).fill(null);
    this.crops = [];

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

  index(tx, ty) {
    return ty * this.w + tx;
  }

  tileAt(tx, ty) {
    return this.inBounds(tx, ty) ? TILE_TYPES[this.ground[ty * this.w + tx]] : TILE_TYPES[0];
  }

  // The warp whose strip contains the tile, or null.
  warpAt(tx, ty) {
    for (const w of this.warps) {
      if (tx >= w.x && tx < w.x + w.w && ty >= w.y && ty < w.y + w.h) return w;
    }
    return null;
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
      // Flat objects sort before everything else (a rug is always under the chair on it).
      sortY: def.flat ? (y + def.h) * TILE - 100000 : (y + def.h) * TILE,
      sprite: null, // resolved lazily by the renderer
      fx: x + fx, fy: y + fy, fw, fh,
    };
    const layer = def.flat ? this.flatAt : this.objectAt;
    this.forFootprint(obj, (i) => {
      layer[i] = obj;
      this.refreshSolid(i);
    });
    this.objects.push(obj);
    return obj;
  }

  removeObject(obj) {
    const k = this.objects.indexOf(obj);
    if (k < 0) return;
    this.objects.splice(k, 1);
    const layer = obj.def.flat ? this.flatAt : this.objectAt;
    this.forFootprint(obj, (i) => {
      if (layer[i] === obj) layer[i] = null;
      this.refreshSolid(i);
    });
  }

  // The object you'd interact with on a tile: a standing one first, then a flat one under it.
  topObjectAt(tx, ty) {
    if (!this.inBounds(tx, ty)) return null;
    const i = ty * this.w + tx;
    return this.objectAt[i] || this.flatAt[i];
  }

  // ---------------------------------------------------------------- save state

  // Objects, soil and crops (crops are rebuilt through Farming so sprites resolve).
  saveState() {
    const state = {
      objects: this.objects.map((o) => (o.hits ? [o.type, o.x, o.y, o.hits] : [o.type, o.x, o.y])),
      soil: Array.from(this.soil).join(''),
      watered: Array.from(this.watered).join(''),
      fallow: Array.from(this.fallow).join(''),
      crops: this.crops.map((c) => [c.id, c.x, c.y, c.growth]),
    };
    if (this.decor) state.decor = { ...this.decor };
    return state;
  }

  loadState(state, farming) {
    if (this.decor && state.decor) Object.assign(this.decor, state.decor);
    for (const o of this.objects.slice()) this.removeObject(o);
    for (const [type, x, y, hits] of state.objects) {
      if (!OBJECT_TYPES[type]) continue; // an object type that no longer exists
      const o = this.addObject(type, x, y);
      if (hits) o.hits = hits;
    }
    const n = this.w * this.h;
    for (let i = 0; i < n; i++) {
      this.soil[i] = Number(state.soil[i]) || 0;
      this.watered[i] = Number(state.watered[i]) || 0;
      this.fallow[i] = Number(state.fallow[i]) || 0;
    }
    this.cropAt.fill(null);
    this.crops.length = 0;
    for (const [id, x, y, growth] of state.crops) {
      if (!this.inBounds(x, y)) continue;
      const crop = farming.plant(this, x, y, id);
      if (!crop) continue;
      crop.growth = growth;
      farming.setStage(crop);
    }
  }

  forFootprint(obj, fn) {
    for (let ty = obj.fy; ty < obj.fy + obj.fh; ty++) {
      for (let tx = obj.fx; tx < obj.fx + obj.fw; tx++) {
        if (this.inBounds(tx, ty)) fn(ty * this.w + tx);
      }
    }
  }
}
