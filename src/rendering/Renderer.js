// Canvas setup, integer scaling, the baked ground layer, and the y-sorted sprite pass.

import { TILE, VIEW_W, VIEW_H, MAX_RENDER_SCALE } from '../config.js';
import { TILE_TYPES } from '../data/tiles.js';
import { PAL } from './palette.js';
import { Effects } from './Effects.js';

const SIDES = [
  // side name, dx, dy
  ['n', 0, -1], ['s', 0, 1], ['w', -1, 0], ['e', 1, 0],
];

function tileHash(x, y) {
  let h = Math.imul(x, 73856093) ^ Math.imul(y, 19349663);
  h = Math.imul(h ^ (h >>> 15), 2246822519);
  return (h ^ (h >>> 13)) >>> 0;
}

const bySortY = (a, b) => a.sortY - b.sortY;

export class Renderer {
  constructor(canvas, atlas, { maxRenderScale = MAX_RENDER_SCALE } = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.atlas = atlas;
    this.maxRenderScale = maxRenderScale;
    this.scale = 1;          // backing-store multiplier
    this.displayScale = 1;   // on-screen multiplier (device pixels per logical pixel)
    this.drawList = [];
    this.spritesDrawn = 0;
    this.onResize = null;
    this.snap = (v) => Math.round(v * this.scale) / this.scale;

    // Tile sprites resolved once.
    const a = atlas;
    const range = (name, n) => Array.from({ length: n }, (_, i) => a.get(`${name}${i}`));
    this.tiles = {
      grass: range('tile.grass', 4),
      flowers: range('decor.flowers', 3),
      path: range('tile.path', 2),
      plaza: range('tile.plaza', 2),
      field: range('tile.field', 2),
      water: range('tile.water', 2),
      soil: a.get('tile.soil'),
      soilWet: a.get('tile.soilwet'),
      grassEdge: Object.fromEntries(SIDES.map(([s]) => [s, a.get(`edge.grass.${s}`)])),
      waterEdge: Object.fromEntries(SIDES.map(([s]) => [s, a.get(`edge.water.${s}`)])),
    };

    window.addEventListener('resize', () => this.resize());
    this.resize();
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;
    const availW = window.innerWidth * dpr, availH = window.innerHeight * dpr;
    const fit = Math.min(availW / VIEW_W, availH / VIEW_H);
    const s = Math.max(1, Math.floor(fit));
    // If the window is tiny, shrink (non-integer) rather than overflow.
    const cssScale = (fit < 1 ? fit : s) / dpr;
    this.displayScale = s;
    this.scale = Math.min(s, this.maxRenderScale);
    this.canvas.width = VIEW_W * this.scale;
    this.canvas.height = VIEW_H * this.scale;
    this.canvas.style.width = `${VIEW_W * cssScale}px`;
    this.canvas.style.height = `${VIEW_H * cssScale}px`;
    this.ctx.imageSmoothingEnabled = false; // resizing resets context state
    if (this.onResize) this.onResize();
  }

  // ------------------------------------------------------------------ ground

  bakeMap(map) {
    const c = document.createElement('canvas');
    c.width = map.pxW;
    c.height = map.pxH;
    map.groundCanvas = c;
    map.groundCtx = c.getContext('2d', { alpha: false });
    for (let ty = 0; ty < map.h; ty++) {
      for (let tx = 0; tx < map.w; tx++) this.drawGroundTile(map, tx, ty);
    }
  }

  // Redraws one tile and its neighbours (their edge overlays depend on it).
  redrawTile(map, tx, ty) {
    this.drawGroundTile(map, tx, ty);
    for (const [, dx, dy] of SIDES) {
      if (map.inBounds(tx + dx, ty + dy)) this.drawGroundTile(map, tx + dx, ty + dy);
    }
  }

  drawGroundTile(map, tx, ty) {
    const g = map.groundCtx, a = this.atlas, t = this.tiles;
    const x = tx * TILE, y = ty * TILE;
    const h = tileHash(tx, ty);
    const type = map.tileAt(tx, ty);

    switch (type.key) {
      case 'grass':
        a.draw(g, t.grass[h % 4], x, y);
        break;
      case 'flowers':
        a.draw(g, t.grass[h % 4], x, y);
        a.draw(g, t.flowers[(h >>> 3) % 3], x, y);
        break;
      case 'path':
        a.draw(g, t.path[h % 2], x, y);
        this.drawEdges(map, tx, ty, x, y, (n) => n.grassy, t.grassEdge);
        break;
      case 'plaza':
        a.draw(g, t.plaza[h % 2], x, y);
        this.drawEdges(map, tx, ty, x, y, (n) => n.grassy, t.grassEdge);
        break;
      case 'field': {
        const i = ty * map.w + tx;
        if (map.soil[i]) a.draw(g, map.watered[i] ? t.soilWet : t.soil, x, y);
        else a.draw(g, t.field[h % 2], x, y);
        this.drawEdges(map, tx, ty, x, y, (n) => n.grassy, t.grassEdge);
        break;
      }
      case 'water':
        a.draw(g, t.water[h % 2], x, y);
        this.drawEdges(map, tx, ty, x, y, (n) => !n.water && n.key !== 'void', t.waterEdge);
        break;
      default:
        g.fillStyle = PAL.bg;
        g.fillRect(x, y, TILE, TILE);
    }
  }

  drawEdges(map, tx, ty, x, y, test, sprites) {
    for (const [side, dx, dy] of SIDES) {
      const nx = tx + dx, ny = ty + dy;
      if (!map.inBounds(nx, ny)) continue;
      if (test(TILE_TYPES[map.ground[ny * map.w + nx]])) this.atlas.draw(map.groundCtx, sprites[side], x, y);
    }
  }

  // ------------------------------------------------------------------ frame

  render(game) {
    const { ctx, atlas } = this;
    const S = this.scale;
    const map = game.map;
    const camX = this.snap(game.camera.x), camY = this.snap(game.camera.y);

    ctx.setTransform(S, 0, 0, S, 0, 0);
    if (map.pxW < VIEW_W || map.pxH < VIEW_H) {
      ctx.fillStyle = PAL.bg;
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    }

    // Ground: one drawImage of the visible slice of the baked layer.
    const sx = Math.max(0, Math.floor(camX)), sy = Math.max(0, Math.floor(camY));
    const sw = Math.min(VIEW_W + 1, map.pxW - sx), sh = Math.min(VIEW_H + 1, map.pxH - sy);
    ctx.drawImage(map.groundCanvas, sx, sy, sw, sh, sx - camX, sy - camY, sw, sh);
    game.drawGroundOverlay(ctx, camX, camY);

    // Sprites: collect visible, sort by feet, draw.
    const list = this.drawList;
    list.length = 0;
    const left = camX - 48, right = camX + VIEW_W + 48;
    const top = camY - 16, bottom = camY + VIEW_H + 96;
    for (const o of map.objects) {
      if (o.px < left || o.px > right || o.py < top || o.py > bottom) continue;
      if (!o.sprite) o.sprite = atlas.get(o.def.sprite);
      list.push(o);
    }
    for (const c of map.crops) {
      if (c.px < left || c.px > right || c.py < top || c.py > bottom) continue;
      list.push(c);
    }
    for (const e of game.entities) list.push(e);
    list.sort(bySortY);

    for (const item of list) {
      if (item.draw) item.draw(ctx, atlas, camX, camY, this.snap);
      else atlas.draw(ctx, item.sprite, item.px - camX + Effects.shakeOffset(item), item.py - camY);
    }
    this.spritesDrawn = list.length;

    // UI in logical pixel space.
    ctx.setTransform(S, 0, 0, S, 0, 0);
    game.drawUI(ctx, camX, camY);
  }
}
