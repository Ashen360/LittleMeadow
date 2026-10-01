// Procedurally generated placeholder art. Every sprite is registered in the atlas under a
// stable name (see docs/05_ASSET_GUIDELINES.md). Replacing art later means supplying the same
// names from a real sprite sheet; gameplay code never draws shapes itself.

import { PAL } from './palette.js';

// ---------------------------------------------------------------- drawing kit

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash2(x, y, seed) {
  let h = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(seed, 1442695041);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

class Pen {
  constructor(w, h) {
    this.canvas = makeCanvas(w, h);
    this.g = this.canvas.getContext('2d');
    this.w = w;
    this.h = h;
  }

  rect(color, x, y, w = 1, h = 1) {
    this.g.fillStyle = color;
    this.g.fillRect(x, y, w, h);
  }

  // Calls fn(x, y) for every pixel; fn returns a colour or null.
  shade(fn) {
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        const c = fn(x, y);
        if (c) this.rect(c, x, y);
      }
    }
  }

  line(color, x0, y0, x1, y1, thick = 1) {
    const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
    for (let i = 0; i <= steps; i++) {
      const t = steps ? i / steps : 0;
      this.rect(color, Math.round(x0 + (x1 - x0) * t), Math.round(y0 + (y1 - y0) * t), thick, thick);
    }
  }

  // 1 px outline around every (mostly) opaque pixel, drawn into transparent neighbours.
  outline(color = PAL.ink) {
    const { w, h } = this;
    const img = this.g.getImageData(0, 0, w, h);
    const d = img.data;
    const solid = new Uint8Array(w * h);
    for (let i = 0; i < w * h; i++) solid[i] = d[i * 4 + 3] > 160 ? 1 : 0;
    const [r, g, b] = hexToRgb(color);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = y * w + x;
        if (solid[i]) continue;
        const near =
          (x > 0 && solid[i - 1]) || (x < w - 1 && solid[i + 1]) ||
          (y > 0 && solid[i - w]) || (y < h - 1 && solid[i + w]);
        if (near) {
          d[i * 4] = r; d[i * 4 + 1] = g; d[i * 4 + 2] = b; d[i * 4 + 3] = 255;
        }
      }
    }
    this.g.putImageData(img, 0, 0);
  }

  flipX() {
    const p = new Pen(this.w, this.h);
    p.g.translate(this.w, 0);
    p.g.scale(-1, 1);
    p.g.drawImage(this.canvas, 0, 0);
    return p;
  }

  // Pixel-art ellipse (no anti-aliasing).
  ellipse(color, cx, cy, rx, ry) {
    this.shade((x, y) => {
      const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
      return dx * dx + dy * dy <= 1 ? color : null;
    });
  }
}

// ---------------------------------------------------------------- ground tiles

function grassTile(seed) {
  const p = new Pen(16, 16);
  const r = rng(seed);
  p.rect(PAL.grass, 0, 0, 16, 16);
  for (let i = 0; i < 5; i++) {
    const x = (r() * 14) | 0, y = 2 + ((r() * 13) | 0);
    // little "v" tuft
    p.rect(PAL.grassDark, x, y - 1);
    p.rect(PAL.grassDark, x + 1, y);
    p.rect(PAL.grassDark, x + 2, y - 1);
  }
  for (let i = 0; i < 4; i++) p.rect(PAL.grassLight, (r() * 16) | 0, (r() * 16) | 0);
  return p.canvas;
}

function flowersDecor(seed) {
  const p = new Pen(16, 16);
  const r = rng(seed);
  const petals = [PAL.cream, PAL.rose, PAL.white, PAL.peach];
  const n = 2 + ((r() * 2) | 0);
  for (let i = 0; i < n; i++) {
    const x = 2 + ((r() * 11) | 0), y = 2 + ((r() * 11) | 0);
    const c = petals[(r() * petals.length) | 0];
    p.rect(PAL.grassDark, x, y + 2); // stem shadow
    p.rect(c, x - 1, y); p.rect(c, x + 1, y); p.rect(c, x, y - 1); p.rect(c, x, y + 1);
    p.rect(PAL.sun, x, y);
  }
  return p.canvas;
}

function pathTile(seed) {
  const p = new Pen(16, 16);
  const r = rng(seed);
  p.rect(PAL.path, 0, 0, 16, 16);
  for (let i = 0; i < 6; i++) {
    const x = (r() * 15) | 0, y = (r() * 15) | 0;
    p.rect(PAL.pathDark, x, y + 1, 2, 1);
    p.rect(PAL.pathLight, x, y);
  }
  for (let i = 0; i < 5; i++) p.rect(PAL.pathDark, (r() * 16) | 0, (r() * 16) | 0);
  return p.canvas;
}

function fieldTile(seed) {
  const p = new Pen(16, 16);
  const r = rng(seed);
  p.rect(PAL.dirt, 0, 0, 16, 16);
  for (let i = 0; i < 7; i++) {
    const x = (r() * 15) | 0, y = (r() * 15) | 0;
    p.rect(PAL.soilLight, x, y + 1, 2, 1);
    p.rect(PAL.dirtLight, x, y);
  }
  for (let i = 0; i < 2; i++) {
    const x = 1 + ((r() * 13) | 0), y = 2 + ((r() * 12) | 0);
    p.rect(PAL.grassDark, x, y); p.rect(PAL.grassDark, x + 1, y - 1);
  }
  return p.canvas;
}

// Field you don't own yet: the same earth, overgrown with grass and weeds.
function fieldWildTile(seed) {
  const p = new Pen(16, 16);
  const r = rng(seed);
  p.rect(PAL.dirt, 0, 0, 16, 16);
  for (let i = 0; i < 5; i++) {
    const cx = r() * 16, cy = r() * 16, rad = 2 + r() * 2.5;
    p.shade((x, y) => {
      const dx = Math.min(Math.abs(x + 0.5 - cx), 16 - Math.abs(x + 0.5 - cx));
      const dy = Math.min(Math.abs(y + 0.5 - cy), 16 - Math.abs(y + 0.5 - cy));
      return dx * dx + dy * dy <= rad * rad ? PAL.grassDark : null;
    });
  }
  for (let i = 0; i < 6; i++) {
    const x = (r() * 15) | 0, y = 1 + ((r() * 14) | 0);
    p.rect(PAL.grass, x, y); p.rect(PAL.grass, x + 1, y - 1);
  }
  for (let i = 0; i < 2; i++) {
    const x = 2 + ((r() * 12) | 0), y = 3 + ((r() * 10) | 0);
    p.rect(PAL.leafDark, x, y, 1, 2); p.rect(PAL.leaf, x - 1, y); p.rect(PAL.leaf, x + 1, y);
  }
  return p.canvas;
}

// The edge of your farmland: a twine line with a little wooden stake.
function stakeEdge(side) {
  return edgeOverlay(side, (put) => {
    for (let x = 0; x < 16; x++) put(PAL.straw, x, 1);
    for (let y = 0; y < 4; y++) {
      put(PAL.woodLight, 7, y);
      put(PAL.bark, 8, y);
    }
  });
}

// The expansion sign: a little board with a sprout and a coin.
function plotSign() {
  const p = new Pen(18, 24);
  p.rect(PAL.wood, 8, 12, 2, 11);
  p.rect(PAL.bark, 9, 12, 1, 11);
  p.rect(PAL.woodLight, 1, 2, 16, 10);
  p.rect(PAL.straw, 1, 2, 16, 1);
  p.rect(PAL.wood, 1, 11, 16, 1);
  p.rect(PAL.leafDark, 6, 6, 1, 4);
  p.rect(PAL.leaf, 4, 5, 2, 2); p.rect(PAL.leafLight, 7, 4, 2, 2);
  p.rect(PAL.soil, 4, 9, 5, 1);
  p.ellipse(PAL.sun, 12.5, 6.5, 2.5, 2.5);
  p.rect(PAL.straw, 12, 6, 1, 2);
  p.outline();
  return p.canvas;
}

function soilTile(wet) {
  const p = new Pen(16, 16);
  const base = wet ? PAL.soilDark : PAL.soil;
  const furrow = wet ? '#3b271e' : PAL.soilDark;
  const ridge = wet ? PAL.soil : PAL.soilLight;
  p.rect(base, 0, 0, 16, 16);
  for (let y = 2; y < 16; y += 5) {
    p.rect(furrow, 1, y + 1, 14, 1);
    p.rect(ridge, 1, y, 14, 1);
  }
  p.rect(furrow, 0, 15, 16, 1);
  return p.canvas;
}

function waterTile(seed) {
  const p = new Pen(16, 16);
  const r = rng(seed);
  p.rect(PAL.water, 0, 0, 16, 16);
  for (let i = 0; i < 3; i++) {
    const x = (r() * 12) | 0, y = 1 + ((r() * 14) | 0);
    p.rect(PAL.waterLight, x, y, 3 + ((r() * 2) | 0), 1);
  }
  for (let i = 0; i < 3; i++) p.rect(PAL.waterDeep, (r() * 15) | 0, (r() * 16) | 0, 2, 1);
  return p.canvas;
}

// Builds an edge overlay authored for the north side, then maps it to any side.
function edgeOverlay(side, drawNorth) {
  const p = new Pen(16, 16);
  const put = (color, x, y) => {
    let px = x, py = y;
    if (side === 's') { py = 15 - y; }
    else if (side === 'w') { px = y; py = x; }
    else if (side === 'e') { px = 15 - y; py = x; }
    p.rect(color, px, py);
  };
  drawNorth(put);
  return p.canvas;
}

// Grass tufts spilling onto a path / field tile from a grassy neighbour.
function grassLip(side) {
  const r = rng(side.charCodeAt(0) * 31);
  return edgeOverlay(side, (put) => {
    for (let x = 0; x < 16; x++) {
      put(PAL.grass, x, 0);
      if (r() < 0.6) put(PAL.grass, x, 1);
      else put(PAL.grassDark, x, 1);
      if (r() < 0.18) put(PAL.grassDark, x, 2);
    }
  });
}

// Pond banks: the north bank shows its earthy face (we look from the south); the
// others get a grass lip and a line of light foam.
function waterEdge(side) {
  const r = rng(side.charCodeAt(0) * 17);
  return edgeOverlay(side, (put) => {
    for (let x = 0; x < 16; x++) {
      if (side === 'n') {
        put(PAL.grassDark, x, 0);
        put(PAL.dirt, x, 1);
        put(PAL.dirt, x, 2);
        put(r() < 0.5 ? PAL.soilLight : PAL.dirt, x, 3);
        put(PAL.waterDeep, x, 4);
      } else {
        put(PAL.grass, x, 0);
        if (r() < 0.5) put(PAL.grassDark, x, 1);
        else put(PAL.waterLight, x, 1);
        if (r() < 0.3) put(PAL.waterLight, x, 2);
      }
    }
  });
}

// ---------------------------------------------------------------- objects

function roundTree(seed) {
  const W = 34, H = 46, cx = 17;
  const p = new Pen(W, H);
  p.ellipse(PAL.shadow, cx, 42, 10, 3);
  p.rect(PAL.bark, cx - 3, 29, 6, 13);
  p.rect(PAL.barkDark, cx + 1, 29, 2, 13);
  p.rect(PAL.bark, cx - 4, 40, 1, 2);
  p.rect(PAL.barkDark, cx + 3, 40, 1, 2);
  const blobs = [[cx, 14, 11.5], [cx - 8, 20, 7.5], [cx + 8, 20, 7.5], [cx, 23, 9]];
  p.shade((x, y) => {
    let inside = false;
    for (const [bx, by, br] of blobs) {
      if ((x + 0.5 - bx) ** 2 + (y + 0.5 - by) ** 2 <= br * br) { inside = true; break; }
    }
    if (!inside) return null;
    const t = (-(x - cx) * 0.55 - (y - 16) * 0.85) / 14 + (hash2(x, y, seed) - 0.5) * 0.3;
    return t > 0.42 ? PAL.leafLight : t > -0.08 ? PAL.leaf : t > -0.55 ? PAL.leafDark : PAL.leafDeep;
  });
  p.outline();
  return p.canvas;
}

function pineTree(seed) {
  const W = 28, H = 48, cx = 14;
  const p = new Pen(W, H);
  p.ellipse(PAL.shadow, cx, 44, 9, 3);
  p.rect(PAL.bark, cx - 2, 38, 4, 6);
  p.rect(PAL.barkDark, cx, 38, 2, 6);
  const tiers = [[2, 17, 6], [9, 28, 9.5], [18, 40, 12.5]];
  p.shade((x, y) => {
    for (let i = tiers.length - 1; i >= 0; i--) {
      const [top, bottom, half] = tiers[i];
      if (y < top || y > bottom) continue;
      const hw = half * (y - top + 1) / (bottom - top + 1) + 0.5;
      const dx = x + 0.5 - cx;
      if (Math.abs(dx) > hw) continue;
      if (y >= bottom - 1) return PAL.leafDeep;
      const t = -dx / hw + (hash2(x, y, seed) - 0.5) * 0.5;
      return t > 0.45 ? PAL.leaf : t > -0.35 ? PAL.leafDark : PAL.leafDeep;
    }
    return null;
  });
  p.outline();
  return p.canvas;
}

function rock() {
  const p = new Pen(18, 16);
  const cx = 9, cy = 9.5, rx = 7.5, ry = 5.5;
  p.shade((x, y) => {
    if (y > 13) return null;
    const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
    if (dx * dx + dy * dy > 1) return null;
    const t = -dx * 0.6 - dy * 0.8;
    return t > 0.45 ? PAL.stoneLight : t > -0.35 ? PAL.stone : PAL.stoneDark;
  });
  p.rect(PAL.stoneDark, 8, 7); p.rect(PAL.stoneDark, 9, 8); p.rect(PAL.stoneDark, 9, 9);
  p.rect(PAL.stoneLight, 12, 10);
  p.outline();
  return p.canvas;
}

function branch() {
  const p = new Pen(18, 14);
  p.line(PAL.bark, 2, 10, 14, 5, 2);
  p.line(PAL.woodLight, 3, 9, 13, 5);
  p.line(PAL.bark, 8, 8, 10, 11);
  p.rect(PAL.leaf, 14, 3, 2, 2);
  p.rect(PAL.leafLight, 14, 3);
  p.outline();
  return p.canvas;
}

function bush(seed) {
  const p = new Pen(18, 16);
  const blobs = [[9, 8.5, 6], [5, 10, 4.2], [13, 10, 4.2]];
  p.shade((x, y) => {
    let inside = false;
    for (const [bx, by, br] of blobs) {
      if ((x + 0.5 - bx) ** 2 + (y + 0.5 - by) ** 2 <= br * br) { inside = true; break; }
    }
    if (!inside) return null;
    const t = (-(x - 9) * 0.5 - (y - 8) * 0.9) / 6 + (hash2(x, y, seed) - 0.5) * 0.4;
    return t > 0.5 ? PAL.leafLight : t > -0.3 ? PAL.leaf : PAL.leafDark;
  });
  p.rect(PAL.rose, 6, 7); p.rect(PAL.rose, 11, 10); p.rect(PAL.berry, 9, 5); p.rect(PAL.rose, 13, 7);
  p.outline();
  return p.canvas;
}

function house() {
  const p = new Pen(82, 80);
  const R = (c, x, y, w = 1, h = 1) => p.rect(c, x + 1, y + 1, w, h);

  // Chimney (behind the roof).
  R(PAL.stone, 58, 2, 7, 14);
  R(PAL.stoneDark, 63, 2, 2, 14);
  R(PAL.stoneDark, 57, 0, 9, 3);
  R(PAL.stoneLight, 58, 1, 7, 1);

  // Roof: a trapezoid of shingles.
  for (let y = 6; y <= 41; y++) {
    const t = (y - 6) / 35;
    const xl = Math.round(14 - 14 * t), xr = Math.round(65 + 14 * t);
    const band = Math.floor((y - 6) / 5);
    for (let x = xl; x <= xr; x++) {
      let c = PAL.roof;
      if (y <= 7) c = PAL.roofLight;
      else if ((y - 6) % 5 === 4) c = PAL.roofDark;
      else if ((x + band * 3) % 7 === 0) c = PAL.roofDark;
      else if ((y - 6) % 5 === 0) c = PAL.roofLight;
      R(c, x, y);
    }
  }
  R(PAL.roofDark, 0, 40, 80, 2);

  // Walls.
  R(PAL.woodLight, 4, 42, 72, 32);
  for (let y = 46; y < 74; y += 4) R(PAL.wood, 4, y, 72, 1);
  R(PAL.wood, 4, 42, 72, 2); // shadow under the eaves
  R(PAL.wood, 4, 42, 3, 32);
  R(PAL.wood, 73, 42, 3, 32);
  R(PAL.bark, 75, 42, 1, 32);

  // Foundation.
  R(PAL.stone, 3, 74, 74, 4);
  R(PAL.stoneDark, 3, 77, 74, 1);
  for (let x = 7; x < 77; x += 8) R(PAL.stoneDark, x, 74, 1, 3);

  // Door + step.
  R(PAL.bark, 32, 51, 16, 23);
  R(PAL.wood, 34, 53, 12, 21);
  for (let x = 37; x < 46; x += 3) R(PAL.bark, x, 53, 1, 21);
  R(PAL.waterLight, 36, 56, 8, 4);
  R(PAL.cream, 39, 56, 2, 4);
  R(PAL.sun, 43, 64, 1, 2);
  R(PAL.stoneLight, 30, 74, 20, 3);
  R(PAL.stone, 30, 77, 20, 1);

  // Windows with flower boxes.
  for (const wx of [12, 54]) {
    R(PAL.cream, wx, 50, 14, 12);
    R(PAL.waterLight, wx + 1, 51, 12, 10);
    R(PAL.water, wx + 1, 57, 12, 4);
    R(PAL.cream, wx + 6, 51, 2, 10);
    R(PAL.cream, wx + 1, 55, 12, 1);
    R(PAL.white, wx + 2, 52, 2, 2);
    R(PAL.leaf, wx, 61, 14, 1);
    R(PAL.wood, wx - 1, 62, 16, 4);
    R(PAL.bark, wx - 1, 65, 16, 1);
    for (let i = 0; i < 5; i++) R(i % 2 ? PAL.sun : PAL.rose, wx + 1 + i * 3, 60);
  }

  p.outline();
  return p.canvas;
}

function mailbox() {
  const p = new Pen(16, 22);
  p.rect(PAL.wood, 6, 10, 2, 11);
  p.rect(PAL.bark, 7, 10, 1, 11);
  p.rect(PAL.berry, 2, 3, 10, 7);
  p.rect(PAL.rose, 3, 2, 8, 2);
  p.rect(PAL.rose, 2, 4, 10, 1);
  p.rect(PAL.plum, 2, 5, 2, 5);
  p.rect(PAL.stoneDark, 12, 2, 1, 6);
  p.rect(PAL.sun, 13, 2, 2, 2);
  p.outline();
  return p.canvas;
}

function shippingBox() {
  const p = new Pen(20, 18);
  p.rect(PAL.wood, 1, 6, 18, 10);
  p.rect(PAL.woodLight, 1, 6, 18, 1);
  p.rect(PAL.bark, 1, 10, 18, 1);
  p.rect(PAL.bark, 1, 15, 18, 1);
  p.rect(PAL.bark, 6, 6, 1, 10);
  p.rect(PAL.bark, 13, 6, 1, 10);
  p.rect(PAL.woodLight, 0, 2, 20, 4);
  p.rect(PAL.straw, 1, 2, 18, 1);
  p.rect(PAL.wood, 0, 5, 20, 1);
  p.rect(PAL.stone, 8, 4, 4, 3);
  p.rect(PAL.stoneLight, 9, 4, 2, 1);
  p.outline();
  return p.canvas;
}

function sign() {
  const p = new Pen(16, 20);
  p.rect(PAL.wood, 7, 10, 2, 9);
  p.rect(PAL.bark, 8, 10, 1, 9);
  p.rect(PAL.woodLight, 1, 2, 14, 8);
  p.rect(PAL.wood, 1, 9, 14, 1);
  p.rect(PAL.straw, 1, 2, 14, 1);
  p.rect(PAL.barkDark, 4, 5, 7, 1);
  p.rect(PAL.barkDark, 9, 4); p.rect(PAL.barkDark, 9, 6); p.rect(PAL.barkDark, 10, 5);
  p.outline();
  return p.canvas;
}

function smallShadow() {
  const p = new Pen(12, 4);
  p.rect(PAL.shadow, 2, 0, 8, 1);
  p.rect(PAL.shadow, 0, 1, 12, 2);
  p.rect(PAL.shadow, 2, 3, 8, 1);
  return p.canvas;
}

function stump() {
  const p = new Pen(18, 14);
  p.ellipse(PAL.shadow, 9, 12, 7, 2);
  p.rect(PAL.bark, 3, 6, 12, 6);
  p.rect(PAL.barkDark, 11, 6, 4, 6);
  p.rect(PAL.bark, 2, 10, 2, 2);
  p.rect(PAL.barkDark, 14, 10, 2, 2);
  p.ellipse(PAL.woodLight, 9, 6, 6, 2.5);
  p.ellipse(PAL.wood, 9, 6, 3, 1.3);
  p.rect(PAL.woodLight, 9, 6);
  p.outline();
  return p.canvas;
}

// ---------------------------------------------------------------- Bramblewick

// Warm cobblestones: staggered rows of stones with dark mortar.
function plazaTile(seed) {
  const p = new Pen(16, 16);
  const r = rng(seed);
  p.rect(PAL.pathDark, 0, 0, 16, 16);
  for (let row = 0; row < 4; row++) {
    const y = row * 4;
    let x = row % 2 ? -3 : 0;
    while (x < 16) {
      const w = 4 + ((r() * 3) | 0);
      const c = r() < 0.3 ? PAL.pathLight : PAL.path;
      const x0 = Math.max(0, x), x1 = Math.min(16, x + w - 1);
      if (x1 > x0) p.rect(c, x0, y, x1 - x0, 3);
      if (x >= 0) p.rect(PAL.cream, x, y);
      x += w;
    }
  }
  return p.canvas;
}

// A small cottage for a 4x4 area (door on tile column 1, window on the right).
function cottage(roof, roofDark, roofLight, wall, wallDark) {
  const p = new Pen(66, 70);
  const R = (c, x, y, w = 1, h = 1) => p.rect(c, x + 1, y + 1, w, h);
  R(PAL.stone, 44, 2, 6, 12);
  R(PAL.stoneDark, 48, 2, 2, 12);
  R(PAL.stoneDark, 43, 0, 8, 2);
  for (let y = 6; y <= 33; y++) {
    const t = (y - 6) / 27;
    const xl = Math.round(12 - 12 * t), xr = Math.round(51 + 12 * t);
    const band = Math.floor((y - 6) / 4);
    for (let x = xl; x <= xr; x++) {
      let c = roof;
      if (y <= 7) c = roofLight;
      else if ((y - 6) % 4 === 3) c = roofDark;
      else if ((x + band * 2) % 6 === 0) c = roofDark;
      R(c, x, y);
    }
  }
  R(roofDark, 0, 32, 64, 2);
  R(wall, 3, 34, 58, 28);
  for (let y = 38; y < 62; y += 4) R(wallDark, 3, y, 58, 1);
  R(wallDark, 3, 34, 58, 2);
  R(wallDark, 58, 34, 3, 28);
  // Door (tile column 1) and window.
  R(PAL.bark, 18, 42, 12, 20);
  R(PAL.wood, 20, 44, 8, 18);
  R(PAL.bark, 23, 44, 1, 18);
  R(PAL.sun, 26, 53, 1, 2);
  R(PAL.cream, 38, 40, 14, 11);
  R(PAL.waterLight, 39, 41, 12, 9);
  R(PAL.water, 39, 46, 12, 4);
  R(PAL.cream, 44, 41, 2, 9);
  R(PAL.white, 40, 42, 2, 2);
  R(PAL.wood, 37, 51, 16, 3);
  for (let i = 0; i < 5; i++) R(i % 2 ? PAL.sun : PAL.rose, 38 + i * 3, 50);
  R(PAL.stone, 2, 62, 60, 4);
  R(PAL.stoneDark, 2, 65, 60, 1);
  for (let x = 6; x < 62; x += 8) R(PAL.stoneDark, x, 62, 1, 3);
  R(PAL.stoneLight, 16, 62, 16, 3);
  p.outline();
  return p.canvas;
}

// Fenn's Provisions: a 6x5 shop with a striped awning, a painted sign and shop windows.
function store() {
  const p = new Pen(98, 86);
  const R = (c, x, y, w = 1, h = 1) => p.rect(c, x + 1, y + 1, w, h);
  for (let y = 4; y <= 36; y++) {
    const t = (y - 4) / 32;
    const xl = Math.round(14 - 14 * t), xr = Math.round(81 + 14 * t);
    const band = Math.floor((y - 4) / 4);
    for (let x = xl; x <= xr; x++) {
      let c = PAL.leafDark;
      if (y <= 5) c = PAL.leafLight;
      else if ((y - 4) % 4 === 3) c = PAL.leafDeep;
      else if ((x + band * 3) % 7 === 0) c = PAL.leafDeep;
      else if ((y - 4) % 4 === 0) c = PAL.leaf;
      R(c, x, y);
    }
  }
  R(PAL.leafDeep, 0, 36, 96, 2);
  // Walls.
  R(PAL.cream, 3, 38, 90, 40);
  for (let y = 42; y < 78; y += 5) R(PAL.pathLight, 3, y, 90, 1);
  R(PAL.pathDark, 90, 38, 3, 40);
  // Sign board on the roof.
  R(PAL.barkDark, 28, 20, 40, 13);
  R(PAL.woodLight, 29, 21, 38, 11);
  R(PAL.wood, 29, 26, 38, 1);
  p.ellipse(PAL.rose, 1 + 40, 1 + 26.5, 3.5, 3);
  R(PAL.leaf, 39, 21, 3, 2);
  for (let i = 0; i < 4; i++) R(PAL.barkDark, 46 + i * 5, 24, 3, 5);
  // Awning: rose and cream stripes with a scalloped edge.
  for (let x = 3; x < 93; x++) {
    const stripe = Math.floor((x - 3) / 6) % 2 === 0 ? PAL.rose : PAL.cream;
    const len = 7 + (((x - 3) % 6 === 2 || (x - 3) % 6 === 3) ? 1 : 0);
    R(stripe, x, 38, 1, len);
    R(PAL.berry, x, 38 + len, 1, 1);
  }
  R(PAL.berry, 3, 38, 90, 1);
  // Windows with shelves of goods.
  for (const [wx, ww] of [[8, 30], [60, 28]]) {
    R(PAL.bark, wx - 1, 50, ww + 2, 20);
    R(PAL.waterLight, wx, 51, ww, 18);
    R(PAL.water, wx, 60, ww, 9);
    for (const sy of [56, 64]) {
      R(PAL.wood, wx, sy, ww, 1);
      for (let i = 0; i < ww - 2; i += 4) {
        const c = [PAL.rose, PAL.sun, PAL.leafLight, PAL.peach][(i / 4 + sy) % 4];
        R(c, wx + 1 + i, sy - 3, 3, 3);
      }
    }
    R(PAL.white, wx + 2, 52, 3, 2);
  }
  // Door (tile column 3).
  R(PAL.barkDark, 49, 48, 14, 30);
  R(PAL.wood, 51, 50, 10, 28);
  R(PAL.waterLight, 53, 53, 6, 8);
  R(PAL.sun, 59, 65, 1, 2);
  // Foundation and step.
  R(PAL.stone, 2, 78, 92, 4);
  R(PAL.stoneDark, 2, 81, 92, 1);
  R(PAL.stoneLight, 47, 78, 18, 3);
  p.outline();
  return p.canvas;
}

// The Bramblewick Forge: an open-fronted smithy, 3 tiles wide.
function forge() {
  const p = new Pen(50, 58);
  const R = (c, x, y, w = 1, h = 1) => p.rect(c, x + 1, y + 1, w, h);
  // Chimney with a warm glow at the top.
  R(PAL.stone, 34, 2, 7, 14);
  R(PAL.stoneDark, 39, 2, 2, 14);
  R(PAL.stoneDark, 33, 0, 9, 3);
  R(PAL.peach, 35, 1, 5, 1);
  // Slate roof.
  for (let y = 8; y <= 27; y++) {
    const t = (y - 8) / 19;
    const xl = Math.round(8 - 8 * t), xr = Math.round(39 + 8 * t);
    for (let x = xl; x <= xr; x++) {
      let c = PAL.stone;
      if (y <= 9) c = PAL.stoneLight;
      else if ((y - 8) % 4 === 3) c = PAL.stoneDark;
      else if ((x + Math.floor((y - 8) / 4) * 3) % 6 === 0) c = PAL.stoneDark;
      R(c, x, y);
    }
  }
  R(PAL.plumDark, 0, 26, 48, 2);
  // Hanging sign with an anvil emblem.
  R(PAL.barkDark, 15, 14, 18, 9);
  R(PAL.woodLight, 16, 15, 16, 7);
  R(PAL.stoneDark, 19, 17, 10, 2);
  R(PAL.stoneDark, 22, 19, 4, 2);
  R(PAL.stoneDark, 20, 21, 8, 1);
  // Timber frame around a dark, open workshop.
  R(PAL.plumDark, 4, 28, 40, 24);
  R(PAL.wood, 1, 28, 46, 3);
  R(PAL.woodLight, 1, 28, 46, 1);
  R(PAL.wood, 1, 28, 4, 24);
  R(PAL.wood, 43, 28, 4, 24);
  R(PAL.bark, 46, 28, 1, 24);
  // Hearth: a stone arch with a fire.
  R(PAL.stone, 7, 33, 17, 15);
  R(PAL.stoneLight, 7, 33, 17, 1);
  R(PAL.ink, 10, 38, 11, 10);
  R(PAL.roofDark, 11, 39, 9, 9);
  R(PAL.rose, 11, 43, 9, 5);
  R(PAL.sun, 13, 44, 5, 4);
  R(PAL.cream, 15, 46, 2, 2);
  // Tools on the back wall.
  R(PAL.bark, 33, 32, 1, 8);
  R(PAL.stone, 31, 32, 5, 2);
  R(PAL.bark, 38, 32, 1, 8);
  R(PAL.stoneLight, 37, 39, 3, 1);
  // Anvil counter at the front.
  R(PAL.stoneDark, 27, 43, 13, 3);
  R(PAL.stoneLight, 28, 43, 11, 1);
  R(PAL.stoneDark, 25, 44, 2, 1);
  R(PAL.stoneDark, 30, 46, 7, 3);
  R(PAL.stoneDark, 28, 49, 11, 3);
  // Stone floor.
  R(PAL.stone, 0, 52, 48, 4);
  R(PAL.stoneLight, 0, 52, 48, 1);
  R(PAL.stoneDark, 0, 55, 48, 1);
  p.outline();
  return p.canvas;
}

function fountain() {
  const p = new Pen(50, 44);
  const cx = 25;
  p.ellipse(PAL.shadow, cx, 38, 23, 5);
  // Basin rim, water, then the column and upper bowl.
  p.shade((x, y) => {
    const dx = (x + 0.5 - cx) / 23, dy = (y + 0.5 - 30) / 10;
    const d = dx * dx + dy * dy;
    if (d > 1) return null;
    const ix = (x + 0.5 - cx) / 19, iy = (y + 0.5 - 29) / 7;
    if (ix * ix + iy * iy <= 1) return y < 27 ? PAL.water : (x + y) % 7 === 0 ? PAL.waterLight : PAL.water;
    return y > 32 ? PAL.stoneDark : dx < -0.3 ? PAL.stoneLight : PAL.stone;
  });
  p.rect(PAL.stone, cx - 3, 12, 6, 16);
  p.rect(PAL.stoneDark, cx + 1, 12, 2, 16);
  p.ellipse(PAL.stone, cx, 12, 9, 3.5);
  p.ellipse(PAL.water, cx, 11.5, 7, 2.2);
  p.rect(PAL.stoneLight, cx - 1, 3, 2, 7);
  p.rect(PAL.waterLight, cx - 1, 1, 2, 2);
  for (const s of [-1, 1]) {
    p.line(PAL.waterLight, cx + s * 6, 14, cx + s * 12, 24);
  }
  p.outline();
  return p.canvas;
}

function bench() {
  const p = new Pen(34, 22);
  p.ellipse(PAL.shadow, 17, 19, 15, 2);
  p.rect(PAL.bark, 3, 3, 28, 2);
  p.rect(PAL.woodLight, 3, 6, 28, 3);
  p.rect(PAL.wood, 3, 9, 28, 1);
  p.rect(PAL.woodLight, 2, 11, 30, 3);
  p.rect(PAL.wood, 2, 14, 30, 1);
  for (const x of [4, 28]) {
    p.rect(PAL.barkDark, x, 3, 2, 17);
  }
  p.outline();
  return p.canvas;
}

function lamp() {
  const p = new Pen(14, 38);
  p.rect(PAL.stoneDark, 5, 12, 3, 23);
  p.rect(PAL.stone, 5, 12, 1, 23);
  p.rect(PAL.stoneDark, 3, 33, 7, 3);
  p.rect(PAL.stoneDark, 3, 4, 7, 2);
  p.rect(PAL.sun, 4, 6, 5, 5);
  p.rect(PAL.cream, 5, 7, 2, 2);
  p.rect(PAL.stoneDark, 3, 11, 7, 1);
  p.rect(PAL.stoneDark, 5, 2, 3, 2);
  p.outline();
  return p.canvas;
}

function flowerbed(seed) {
  const p = new Pen(18, 16);
  const r = rng(seed);
  p.rect(PAL.wood, 1, 8, 16, 6);
  p.rect(PAL.bark, 1, 12, 16, 2);
  p.rect(PAL.soil, 2, 8, 14, 3);
  const petals = [PAL.rose, PAL.sun, PAL.cream, PAL.berry, PAL.peach];
  for (let i = 0; i < 6; i++) {
    const x = 3 + i * 2 + ((r() * 2) | 0), y = 3 + ((r() * 4) | 0);
    p.rect(PAL.leaf, x, y + 1, 1, 8 - y);
    p.rect(petals[(r() * petals.length) | 0], x, y);
  }
  p.outline();
  return p.canvas;
}

// ---------------------------------------------------------------- the farmhouse interior

// Floor styles (16x16, seamless).
const FLOOR_ART = {
  oak(p) {
    for (let band = 0; band < 4; band++) {
      const y = band * 4;
      p.rect(band % 2 ? PAL.woodLight : '#bb8250', 0, y, 16, 3);
      p.rect(PAL.wood, 0, y + 3, 16, 1);
      const jx = (band * 7 + 3) % 16;
      p.rect(PAL.bark, jx, y, 1, 3);
      p.rect(PAL.straw, (jx + 5) % 16, y + 1, 2, 1);
    }
  },
  honey(p) {
    for (let by = 0; by < 2; by++) {
      for (let bx = 0; bx < 2; bx++) {
        const x = bx * 8, y = by * 8, across = (bx + by) % 2 === 0;
        p.rect(PAL.straw, x, y, 8, 8);
        for (let k = 0; k < 8; k += 3) {
          if (across) p.rect(PAL.woodLight, x, y + k, 8, 1);
          else p.rect(PAL.woodLight, x + k, y, 1, 8);
        }
        p.rect(PAL.sun, x + 1, y + 1, 2, 1);
        p.rect(PAL.wood, x, y + 7, 8, 1);
        p.rect(PAL.wood, x + 7, y, 1, 8);
      }
    }
  },
  rose(p) {
    p.rect(PAL.cream, 0, 0, 16, 16);
    for (let by = 0; by < 2; by++) {
      for (let bx = 0; bx < 2; bx++) {
        p.rect((bx + by) % 2 ? PAL.peach : PAL.rose, bx * 8, by * 8, 7, 7);
        p.rect(PAL.white, bx * 8 + 1, by * 8 + 1, 2, 1);
      }
    }
  },
  stone(p) {
    p.rect(PAL.stone, 0, 0, 16, 16);
    p.rect(PAL.stoneDark, 0, 7, 16, 1);
    p.rect(PAL.stoneDark, 0, 15, 16, 1);
    p.rect(PAL.stoneDark, 6, 0, 1, 7);
    p.rect(PAL.stoneDark, 12, 8, 1, 7);
    p.rect(PAL.stoneLight, 1, 1, 3, 1);
    p.rect(PAL.stoneLight, 8, 9, 3, 1);
    p.rect(PAL.leafLight, 6, 6); p.rect(PAL.leaf, 7, 7); p.rect(PAL.leafLight, 12, 14);
    p.rect(PAL.leaf, 0, 15); p.rect(PAL.leafLight, 3, 7);
  },
};

// Wallpaper styles (16x16, seamless).
const WALL_ART = {
  cream(p) {
    p.rect(PAL.cream, 0, 0, 16, 16);
    for (let x = 2; x < 16; x += 8) p.rect(PAL.pathLight, x, 0, 2, 16);
  },
  sprig(p) {
    p.rect(PAL.cream, 0, 0, 16, 16);
    for (const [x, y] of [[4, 3], [12, 11]]) {
      p.rect(PAL.leafDark, x, y, 1, 3);
      p.rect(PAL.leaf, x - 1, y); p.rect(PAL.leafLight, x + 1, y + 1); p.rect(PAL.leaf, x - 1, y + 2);
    }
  },
  rosebud(p) {
    p.rect(PAL.peach, 0, 0, 16, 16);
    for (const [x, y] of [[3, 4], [11, 12]]) {
      p.rect(PAL.rose, x, y, 2, 2);
      p.rect(PAL.berry, x + 1, y + 1);
      p.rect(PAL.leaf, x - 1, y + 2);
      p.rect(PAL.leaf, x + 2, y + 2);
    }
  },
  sky(p) {
    p.rect(PAL.white, 0, 0, 16, 16);
    for (let x = 0; x < 16; x += 8) p.rect(PAL.waterLight, x, 0, 4, 16);
  },
  starry(p) {
    p.rect(PAL.plum, 0, 0, 16, 16);
    p.rect(PAL.plumDark, 0, 8, 16, 1);
    for (const [x, y, big] of [[4, 3, true], [12, 11, true], [11, 4, false], [3, 13, false]]) {
      p.rect(PAL.sun, x, y);
      if (big) { p.rect(PAL.straw, x - 1, y); p.rect(PAL.straw, x + 1, y); p.rect(PAL.straw, x, y - 1); p.rect(PAL.straw, x, y + 1); }
    }
  },
};

function tilePen(draw) {
  const p = new Pen(16, 16);
  draw(p);
  return p.canvas;
}

function trimTile() {
  const p = new Pen(16, 16);
  p.rect(PAL.barkDark, 0, 0, 16, 16);
  p.rect(PAL.bark, 0, 0, 16, 1);
  for (let y = 4; y < 16; y += 5) p.rect(PAL.bark, 0, y, 16, 1);
  return p.canvas;
}

function crownEdge() {
  const p = new Pen(16, 16);
  p.rect(PAL.bark, 0, 0, 16, 1);
  p.rect(PAL.woodLight, 0, 1, 16, 1);
  p.rect('rgba(42, 31, 45, 0.15)', 0, 2, 16, 2);
  return p.canvas;
}

function baseboardEdge() {
  const p = new Pen(16, 16);
  p.rect(PAL.woodLight, 0, 12, 16, 1);
  p.rect(PAL.wood, 0, 13, 16, 2);
  p.rect(PAL.bark, 0, 15, 16, 1);
  return p.canvas;
}

function wallShadowEdge() {
  const p = new Pen(16, 16);
  p.rect('rgba(42, 31, 45, 0.28)', 0, 0, 16, 1);
  p.rect('rgba(42, 31, 45, 0.16)', 0, 1, 16, 1);
  p.rect('rgba(42, 31, 45, 0.07)', 0, 2, 16, 1);
  return p.canvas;
}

function doormat() {
  const p = new Pen(16, 16);
  p.rect(PAL.berry, 2, 3, 12, 11);
  p.rect(PAL.rose, 3, 4, 10, 9);
  for (let y = 6; y < 12; y += 3) p.rect(PAL.peach, 3, y, 10, 1);
  for (let x = 2; x < 14; x += 2) { p.rect(PAL.cream, x, 2); p.rect(PAL.cream, x + 1, 14); }
  return p.canvas;
}

function windowSprite() {
  const p = new Pen(18, 24);
  const R = (c, x, y, w = 1, h = 1) => p.rect(c, x + 1, y + 1, w, h);
  R(PAL.cream, 0, 0, 16, 20);
  R(PAL.waterLight, 2, 2, 12, 15);
  R(PAL.white, 2, 2, 12, 4);
  R(PAL.leafLight, 2, 14, 12, 3);
  R(PAL.cream, 7, 2, 2, 15);
  R(PAL.cream, 2, 9, 12, 1);
  R(PAL.peach, 1, 1, 3, 17);
  R(PAL.peach, 12, 1, 3, 17);
  R(PAL.rose, 3, 1, 1, 17);
  R(PAL.rose, 12, 1, 1, 17);
  R(PAL.woodLight, 0, 19, 16, 3);
  R(PAL.wood, 0, 21, 16, 1);
  p.outline();
  return p.canvas;
}

// A soft, round warm light for lamps after dark (drawn additively-ish with alpha).
function glow() {
  const p = new Pen(48, 48);
  p.shade((x, y) => {
    const d = Math.hypot(x + 0.5 - 24, y + 0.5 - 24);
    if (d < 8) return 'rgba(246, 216, 122, 0.5)';
    if (d < 14) return 'rgba(246, 216, 122, 0.32)';
    if (d < 19) return 'rgba(246, 216, 122, 0.18)';
    if (d < 23) return 'rgba(246, 216, 122, 0.08)';
    return null;
  });
  return p.canvas;
}

// Furniture. Sizes include a 1 px outline margin; anchors are set at registration.
const FURNITURE_ART = {
  bedBasic() {
    const p = new Pen(18, 34);
    const R = (c, x, y, w = 1, h = 1) => p.rect(c, x + 1, y + 1, w, h);
    R(PAL.bark, 0, 0, 16, 7); R(PAL.wood, 1, 1, 14, 5); R(PAL.woodLight, 1, 1, 14, 1);
    R(PAL.wood, 0, 7, 1, 23); R(PAL.wood, 15, 7, 1, 23);
    R(PAL.white, 2, 5, 12, 5); R(PAL.pathLight, 2, 9, 12, 1);
    R(PAL.rose, 1, 11, 14, 18);
    for (let y = 13; y < 29; y += 4) {
      for (let x = 1; x < 15; x += 4) if (((x + y - 1) / 4) % 2 < 1) R(PAL.peach, x, y, Math.min(4, 15 - x), Math.min(4, 29 - y));
    }
    R(PAL.cream, 1, 10, 14, 3); R(PAL.pathLight, 1, 12, 14, 1);
    R(PAL.bark, 0, 29, 16, 3); R(PAL.wood, 1, 29, 14, 1);
    p.outline();
    return p.canvas;
  },
  bedQuilt() {
    const p = new Pen(34, 34);
    const R = (c, x, y, w = 1, h = 1) => p.rect(c, x + 1, y + 1, w, h);
    R(PAL.bark, 0, 0, 32, 8); R(PAL.wood, 1, 1, 30, 6); R(PAL.woodLight, 1, 1, 30, 1);
    R(PAL.bark, 14, 0, 4, 2); R(PAL.sun, 15, 2, 2, 2);
    R(PAL.wood, 0, 8, 1, 22); R(PAL.wood, 31, 8, 1, 22);
    R(PAL.white, 2, 6, 13, 5); R(PAL.white, 17, 6, 13, 5); R(PAL.pathLight, 2, 10, 28, 1);
    R(PAL.plum, 1, 12, 30, 17);
    for (const [hx, hy] of [[4, 16], [14, 15], [24, 17], [8, 23], [19, 23]]) {
      R(PAL.rose, hx, hy, 2, 1); R(PAL.rose, hx + 3, hy, 2, 1); R(PAL.rose, hx, hy + 1, 5, 1);
      R(PAL.rose, hx + 1, hy + 2, 3, 1); R(PAL.rose, hx + 2, hy + 3);
    }
    R(PAL.cream, 1, 11, 30, 3); R(PAL.pathLight, 1, 13, 30, 1);
    R(PAL.bark, 0, 29, 32, 3); R(PAL.wood, 1, 29, 30, 1);
    p.outline();
    return p.canvas;
  },
  lampBasic() {
    const p = new Pen(14, 28);
    const R = (c, x, y, w = 1, h = 1) => p.rect(c, x + 1, y + 1, w, h);
    for (let y = 0; y < 9; y++) {
      const half = 3 + Math.round(y * 3 / 8);
      R(y === 8 ? PAL.straw : PAL.sun, 6 - half, y, half * 2, 1);
    }
    R(PAL.cream, 3, 1, 2, 6);
    R(PAL.bark, 5, 9, 2, 13);
    R(PAL.bark, 3, 21, 6, 1); R(PAL.barkDark, 2, 22, 8, 3);
    p.outline();
    return p.canvas;
  },
  chair() {
    const p = new Pen(16, 22);
    const R = (c, x, y, w = 1, h = 1) => p.rect(c, x + 1, y + 1, w, h);
    R(PAL.wood, 2, 0, 10, 2); R(PAL.wood, 2, 0, 2, 11); R(PAL.wood, 10, 0, 2, 11);
    R(PAL.woodLight, 5, 2, 1, 7); R(PAL.woodLight, 8, 2, 1, 7);
    R(PAL.bark, 3, 13, 1, 7); R(PAL.bark, 10, 13, 1, 7);
    R(PAL.woodLight, 1, 10, 12, 3); R(PAL.wood, 1, 12, 12, 1);
    R(PAL.wood, 1, 13, 2, 7); R(PAL.wood, 11, 13, 2, 7);
    p.outline();
    return p.canvas;
  },
  armchair() {
    const p = new Pen(18, 20);
    const R = (c, x, y, w = 1, h = 1) => p.rect(c, x + 1, y + 1, w, h);
    R(PAL.plum, 2, 0, 12, 9); R(PAL.plumDark, 12, 0, 2, 9);
    R(PAL.berry, 5, 3); R(PAL.berry, 10, 3);
    R(PAL.rose, 3, 9, 10, 4); R(PAL.peach, 3, 9, 10, 1);
    R(PAL.plumDark, 0, 6, 3, 9); R(PAL.plumDark, 13, 6, 3, 9); R(PAL.plum, 0, 6, 3, 1); R(PAL.plum, 13, 6, 3, 1);
    R(PAL.plumDark, 3, 13, 10, 3);
    R(PAL.bark, 1, 15, 2, 2); R(PAL.bark, 13, 15, 2, 2);
    p.outline();
    return p.canvas;
  },
  table() {
    const p = new Pen(34, 24);
    const R = (c, x, y, w = 1, h = 1) => p.rect(c, x + 1, y + 1, w, h);
    R(PAL.bark, 2, 13, 3, 8); R(PAL.bark, 27, 13, 3, 8);
    R(PAL.woodLight, 0, 4, 32, 8); R(PAL.straw, 0, 4, 32, 1); R(PAL.wood, 0, 11, 32, 2);
    R(PAL.white, 4, 6, 7, 3); R(PAL.cream, 5, 7, 5, 1);
    R(PAL.white, 21, 6, 7, 3); R(PAL.cream, 22, 7, 5, 1);
    R(PAL.water, 14, 3, 4, 5); R(PAL.waterLight, 14, 3, 1, 4);
    R(PAL.leaf, 15, 1, 2, 2); R(PAL.rose, 13, 0, 2, 2); R(PAL.sun, 17, 0, 2, 2);
    p.outline();
    return p.canvas;
  },
  bookshelf() {
    const p = new Pen(34, 36);
    const R = (c, x, y, w = 1, h = 1) => p.rect(c, x + 1, y + 1, w, h);
    const r = rng(77);
    R(PAL.bark, 0, 0, 32, 34); R(PAL.woodLight, 0, 0, 32, 2); R(PAL.barkDark, 2, 2, 28, 30);
    const colors = [PAL.rose, PAL.berry, PAL.leaf, PAL.water, PAL.sun, PAL.plum, PAL.cream, PAL.peach];
    for (const shelfY of [11, 21, 31]) {
      let x = 2;
      while (x < 29) {
        const w = 2 + ((r() * 3) | 0), h = 6 + ((r() * 3) | 0);
        if (x + w > 30) break;
        if (r() < 0.12) { x += w; continue; }
        R(colors[(r() * colors.length) | 0], x, shelfY - h, w, h);
        x += w;
      }
      R(PAL.wood, 2, shelfY, 28, 1);
    }
    p.outline();
    return p.canvas;
  },
  dresser() {
    const p = new Pen(34, 26);
    const R = (c, x, y, w = 1, h = 1) => p.rect(c, x + 1, y + 1, w, h);
    R(PAL.cream, 22, 0, 6, 5); R(PAL.waterLight, 23, 1, 4, 3); R(PAL.rose, 6, 2, 2, 2);
    R(PAL.wood, 0, 4, 32, 18); R(PAL.woodLight, 0, 4, 32, 2);
    for (let i = 0; i < 3; i++) {
      const y = 7 + i * 5;
      R(PAL.bark, 2, y, 28, 4); R(PAL.woodLight, 3, y, 26, 3);
      R(PAL.sun, 9, y + 1, 2, 1); R(PAL.sun, 21, y + 1, 2, 1);
    }
    R(PAL.bark, 1, 22, 3, 2); R(PAL.bark, 28, 22, 3, 2);
    p.outline();
    return p.canvas;
  },
  plant() {
    const p = new Pen(16, 24);
    p.line(PAL.leaf, 8, 14, 2, 4); p.line(PAL.leaf, 8, 14, 14, 4); p.line(PAL.leafDark, 8, 14, 8, 1);
    p.line(PAL.leafDark, 8, 14, 3, 10); p.line(PAL.leaf, 8, 14, 13, 10);
    p.rect(PAL.leafLight, 2, 4); p.rect(PAL.leafLight, 14, 4); p.rect(PAL.leafLight, 8, 1);
    p.rect(PAL.roofDark, 3, 14, 10, 2);
    p.rect(PAL.roof, 4, 16, 8, 6); p.rect(PAL.roofLight, 4, 16, 2, 5); p.rect(PAL.roofDark, 5, 21, 6, 1);
    p.outline();
    return p.canvas;
  },
  stove() {
    const p = new Pen(18, 30);
    const R = (c, x, y, w = 1, h = 1) => p.rect(c, x + 1, y + 1, w, h);
    R(PAL.stoneDark, 6, 0, 4, 10); R(PAL.stone, 6, 0, 1, 10);
    R(PAL.stone, 0, 9, 16, 2);
    R(PAL.stoneDark, 1, 11, 14, 13);
    R(PAL.ink, 4, 14, 8, 6); R(PAL.rose, 5, 16, 6, 4); R(PAL.sun, 6, 17, 4, 3); R(PAL.cream, 7, 18, 2, 1);
    R(PAL.stoneDark, 1, 24, 3, 3); R(PAL.stoneDark, 12, 24, 3, 3);
    p.outline();
    return p.canvas;
  },
  rugRose() {
    const p = new Pen(48, 32);
    p.shade((x, y) => {
      const dx = (x + 0.5 - 24) / 23, dy = (y + 0.5 - 16) / 15;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d > 1) return null;
      if (d > 0.88) return PAL.berry;
      if (d > 0.8) return PAL.cream;
      if (d > 0.45) return (Math.round(Math.atan2(dy, dx) * 4) % 2) ? PAL.rose : PAL.peach;
      if (d > 0.38) return PAL.cream;
      return PAL.rose;
    });
    return p.canvas;
  },
  rugMeadow() {
    const p = new Pen(32, 32);
    p.shade((x, y) => {
      const d = Math.hypot(x + 0.5 - 16, y + 0.5 - 16);
      if (d > 15.5) return null;
      if (d > 14) return PAL.leafDark;
      if (d > 12.5) return PAL.cream;
      return PAL.leafLight;
    });
    for (const [x, y] of [[10, 10], [20, 12], [14, 19], [22, 21], [8, 18]]) {
      p.rect(PAL.white, x - 1, y); p.rect(PAL.white, x + 1, y); p.rect(PAL.white, x, y - 1); p.rect(PAL.white, x, y + 1);
      p.rect(PAL.sun, x, y);
    }
    return p.canvas;
  },
};

// Willow & Wool Home Goods: a plum-roofed, half-timbered shop (5 x 4 area).
function furnitureShop() {
  const p = new Pen(82, 76);
  const R = (c, x, y, w = 1, h = 1) => p.rect(c, x + 1, y + 1, w, h);
  for (let y = 4; y <= 34; y++) {
    const t = (y - 4) / 30;
    const xl = Math.round(12 - 12 * t), xr = Math.round(67 + 12 * t);
    for (let x = xl; x <= xr; x++) {
      let c = PAL.plum;
      if (y <= 5) c = PAL.rose;
      else if ((y - 4) % 4 === 3) c = PAL.plumDark;
      else if ((x + Math.floor((y - 4) / 4) * 3) % 7 === 0) c = PAL.plumDark;
      R(c, x, y);
    }
  }
  R(PAL.plumDark, 0, 33, 80, 2);
  // Sign with a little chair and a heart.
  R(PAL.barkDark, 26, 14, 28, 13); R(PAL.cream, 27, 15, 26, 11);
  R(PAL.wood, 31, 17, 2, 7); R(PAL.wood, 31, 21, 8, 2); R(PAL.wood, 37, 23, 1, 2); R(PAL.wood, 31, 23, 1, 2);
  R(PAL.rose, 43, 18, 2, 1); R(PAL.rose, 46, 18, 2, 1); R(PAL.rose, 43, 19, 5, 1); R(PAL.rose, 44, 20, 3, 1); R(PAL.rose, 45, 21);
  // Half-timbered walls.
  R(PAL.cream, 3, 35, 74, 35);
  R(PAL.wood, 3, 35, 74, 2);
  for (const x of [3, 28, 50, 74]) R(PAL.wood, x, 35, 3, 35);
  R(PAL.wood, 3, 42, 74, 1);
  // Display window with a chair and a lamp inside.
  R(PAL.barkDark, 8, 45, 18, 18); R(PAL.waterLight, 9, 46, 16, 16); R(PAL.white, 10, 47, 3, 2);
  R(PAL.wood, 11, 53, 2, 7); R(PAL.wood, 11, 57, 6, 1); R(PAL.wood, 16, 58, 1, 2);
  R(PAL.sun, 19, 50, 4, 3); R(PAL.bark, 20, 53, 1, 8);
  R(PAL.wood, 7, 63, 20, 3); R(PAL.rose, 9, 61, 2, 2); R(PAL.sun, 14, 61, 2, 2); R(PAL.rose, 20, 61, 2, 2);
  // Door (tile column 2).
  R(PAL.barkDark, 32, 46, 16, 24); R(PAL.plum, 34, 48, 12, 22); R(PAL.waterLight, 37, 51, 6, 5);
  R(PAL.sun, 43, 60, 1, 2);
  // Right window with curtains.
  R(PAL.barkDark, 54, 45, 16, 14); R(PAL.waterLight, 55, 46, 14, 12);
  R(PAL.peach, 55, 46, 3, 12); R(PAL.peach, 66, 46, 3, 12); R(PAL.cream, 61, 46, 2, 12);
  R(PAL.wood, 53, 59, 18, 3); R(PAL.leafLight, 55, 57, 2, 2); R(PAL.rose, 60, 57, 2, 2); R(PAL.sun, 65, 57, 2, 2);
  // Foundation and step.
  R(PAL.stone, 2, 70, 76, 4); R(PAL.stoneDark, 2, 73, 76, 1); R(PAL.stoneLight, 30, 70, 20, 3);
  p.outline();
  return p.canvas;
}

// A 16x16 icon from a larger sprite: scaled down to fit (nearest neighbour), centred.
function iconFromSprite(canvas) {
  const p = new Pen(16, 16);
  const s = Math.min(1, 15 / canvas.width, 15 / canvas.height);
  const w = Math.max(1, Math.round(canvas.width * s)), h = Math.max(1, Math.round(canvas.height * s));
  p.g.imageSmoothingEnabled = false;
  p.g.drawImage(canvas, Math.floor((16 - w) / 2), Math.floor((16 - h) / 2), w, h);
  return p.canvas;
}

// Floor sample: a square swatch. Wallpaper: a little roll.
function floorIcon(tile) {
  const p = new Pen(16, 16);
  p.g.drawImage(tile, 2, 2, 12, 12, 2, 2, 12, 12);
  p.outline();
  return p.canvas;
}

function wallpaperIcon(tile) {
  const p = new Pen(16, 16);
  p.g.drawImage(tile, 0, 0, 10, 11, 3, 2, 10, 11);
  p.rect(PAL.white, 3, 13, 10, 1);
  p.rect(PAL.pathLight, 3, 12, 10, 1);
  p.rect(PAL.cream, 12, 2, 1, 11);
  p.outline();
  return p.canvas;
}

// ---------------------------------------------------------------- item icons (16x16)

function iconPen(draw) {
  const p = new Pen(16, 16);
  draw(p);
  p.outline();
  return p;
}

function hoeIcon(p) {
  p.line(PAL.bark, 3, 12, 10, 5, 2);
  p.line(PAL.woodLight, 3, 12, 10, 5);
  p.rect(PAL.stone, 9, 2, 5, 2);
  p.rect(PAL.stoneLight, 9, 2, 5, 1);
  p.rect(PAL.stoneDark, 12, 4, 2, 3);
}

function axeIcon(p) {
  p.line(PAL.bark, 3, 12, 10, 4, 2);
  p.line(PAL.woodLight, 3, 12, 10, 4);
  p.rect(PAL.stone, 5, 2, 5, 5);
  p.rect(PAL.stoneLight, 4, 3, 1, 3);
  p.rect(PAL.stoneLight, 5, 2, 5, 1);
  p.rect(PAL.stoneDark, 9, 3, 1, 4);
}

function pickaxeIcon(p) {
  p.line(PAL.bark, 4, 12, 8, 4, 2);
  p.line(PAL.woodLight, 4, 12, 8, 4);
  p.rect(PAL.stone, 4, 2, 8, 2);
  p.rect(PAL.stoneLight, 4, 2, 8, 1);
  p.rect(PAL.stone, 2, 4, 2, 2);
  p.rect(PAL.stone, 12, 4, 2, 2);
  p.rect(PAL.stoneDark, 2, 5, 1, 1);
  p.rect(PAL.stoneDark, 13, 5, 1, 1);
}

function canIcon(p) {
  p.rect(PAL.shirtDark, 4, 4, 5, 1);
  p.rect(PAL.shirtDark, 4, 5, 1, 2);
  p.rect(PAL.shirtDark, 8, 5, 1, 2);
  p.rect(PAL.shirt, 3, 7, 8, 6);
  p.rect(PAL.shirtDark, 9, 7, 2, 6);
  p.rect(PAL.shirtDark, 3, 12, 8, 1);
  p.rect(PAL.waterLight, 4, 8, 1, 3);
  p.line(PAL.shirt, 11, 11, 13, 6);
  p.rect(PAL.shirtDark, 12, 4, 3, 2);
}

function seedsIcon(color) {
  return (p) => {
    p.rect(PAL.pathLight, 3, 2, 10, 12);
    p.rect(PAL.cream, 3, 2, 10, 1);
    p.rect(PAL.pathDark, 3, 4, 10, 1);
    p.rect(PAL.pathDark, 12, 2, 1, 12);
    p.ellipse(color, 8, 9.5, 3, 2.6);
    p.rect(PAL.leaf, 7, 5, 2, 2);
    p.rect(PAL.leafLight, 7, 5);
  };
}

function turnipIcon(p) {
  p.rect(PAL.leaf, 6, 1, 2, 5);
  p.rect(PAL.leafLight, 8, 2, 2, 4);
  p.rect(PAL.leafDark, 5, 3, 1, 2);
  p.shade((x, y) => {
    const dx = (x + 0.5 - 8) / 4.5, dy = (y + 0.5 - 9.5) / 4;
    if (dx * dx + dy * dy > 1) return null;
    if (y <= 8) return x <= 5 ? PAL.rose : PAL.berry;
    return x >= 10 ? PAL.pathLight : PAL.cream;
  });
  p.rect(PAL.cream, 8, 14);
}

function potatoIcon(p) {
  p.shade((x, y) => {
    const dx = (x + 0.5 - 8) / 6, dy = (y + 0.5 - 9) / 4.5;
    if (dx * dx + dy * dy > 1) return null;
    const t = -dx * 0.6 - dy * 0.8;
    return t > 0.4 ? PAL.dirtLight : t > -0.3 ? PAL.dirt : PAL.soilLight;
  });
  p.rect(PAL.soil, 6, 8);
  p.rect(PAL.soil, 10, 10);
  p.rect(PAL.soil, 8, 11);
}

function strawberryIcon(p) {
  const widths = [4, 5.5, 5.5, 5, 4.5, 3.5, 2.5, 1.5, 0.5];
  p.shade((x, y) => {
    const row = y - 6;
    if (row < 0 || row >= widths.length) return null;
    if (Math.abs(x + 0.5 - 8) > widths[row]) return null;
    return x < 7 && y < 10 ? PAL.rose : PAL.berry;
  });
  for (const [x, y] of [[6, 8], [9, 9], [7, 11], [10, 11], [8, 13]]) p.rect(PAL.sun, x, y);
  p.rect(PAL.leaf, 5, 5, 6, 1);
  p.rect(PAL.leafLight, 7, 4, 2, 1);
  p.rect(PAL.leafDark, 8, 3);
}

function woodIcon(p) {
  p.rect(PAL.bark, 2, 6, 11, 6);
  p.rect(PAL.wood, 2, 7, 10, 1);
  p.rect(PAL.barkDark, 2, 10, 11, 2);
  p.ellipse(PAL.woodLight, 12.5, 9, 2.5, 3.2);
  p.rect(PAL.wood, 12, 8, 1, 2);
}

function stoneIcon(p) {
  p.shade((x, y) => {
    const dx = (x + 0.5 - 8) / 5.5, dy = (y + 0.5 - 9.5) / 4.2;
    if (dx * dx + dy * dy > 1) return null;
    const t = -dx * 0.6 - dy * 0.8;
    return t > 0.45 ? PAL.stoneLight : t > -0.35 ? PAL.stone : PAL.stoneDark;
  });
  p.rect(PAL.stoneDark, 7, 8);
  p.rect(PAL.stoneDark, 8, 9);
}

// ---------------------------------------------------------------- crops

// Crop sprites are 18x22; the plant stands on row CROP_BASE.
const CROP_W = 18, CROP_H = 22, CROP_BASE = 17, CROP_CX = 9;

function leafTuft(p, r, seed, dark = false) {
  const cy = CROP_BASE - r;
  const blobs = [[CROP_CX, cy, r], [CROP_CX - r * 0.75, cy + r * 0.45, r * 0.6], [CROP_CX + r * 0.75, cy + r * 0.45, r * 0.6]];
  const light = dark ? PAL.leaf : PAL.leafLight, mid = dark ? PAL.leafDark : PAL.leaf, deep = dark ? PAL.leafDeep : PAL.leafDark;
  p.shade((x, y) => {
    if (y > CROP_BASE) return null;
    let inside = false;
    for (const [bx, by, br] of blobs) {
      if ((x + 0.5 - bx) ** 2 + (y + 0.5 - by) ** 2 <= br * br) { inside = true; break; }
    }
    if (!inside) return null;
    const t = (-(x - CROP_CX) * 0.5 - (y - cy) * 0.9) / r + (hash2(x, y, seed) - 0.5) * 0.4;
    return t > 0.45 ? light : t > -0.3 ? mid : deep;
  });
}

function seedDots(p) {
  p.rect(PAL.straw, 6, CROP_BASE - 1);
  p.rect(PAL.straw, 9, CROP_BASE - 2);
  p.rect(PAL.straw, 12, CROP_BASE - 1);
}

function sprout(p) {
  p.rect(PAL.leaf, 9, CROP_BASE - 3, 1, 4);
  p.rect(PAL.leafLight, 7, CROP_BASE - 4, 2, 1);
  p.rect(PAL.leafLight, 10, CROP_BASE - 5, 2, 1);
  p.rect(PAL.leaf, 8, CROP_BASE - 3);
}

function dots(p, color, center, spots) {
  for (const [x, y] of spots) {
    p.rect(color, x, y);
    if (center) p.rect(center, x, y + 1);
  }
}

const CROP_STAGES = {
  turnip: [
    seedDots,
    sprout,
    (p) => leafTuft(p, 3.5, 11),
    (p) => {
      leafTuft(p, 4.5, 12);
      p.shade((x, y) => {
        const dx = (x + 0.5 - CROP_CX) / 3.5, dy = (y + 0.5 - (CROP_BASE - 0.5)) / 2.5;
        if (dx * dx + dy * dy > 1 || y > CROP_BASE) return null;
        return y < CROP_BASE - 1 ? PAL.berry : PAL.cream;
      });
    },
  ],
  potato: [
    seedDots,
    sprout,
    (p) => leafTuft(p, 3.5, 21),
    (p) => leafTuft(p, 5, 22),
    (p) => {
      leafTuft(p, 5.5, 23);
      dots(p, PAL.white, null, [[6, 9], [11, 8], [9, 12], [13, 12]]);
    },
  ],
  strawberry: [
    seedDots,
    sprout,
    (p) => leafTuft(p, 4, 31, true),
    (p) => {
      leafTuft(p, 5, 32, true);
      dots(p, PAL.white, null, [[6, 10], [11, 9], [9, 13]]);
    },
    (p) => {
      leafTuft(p, 5, 33, true);
      for (const [x, y] of [[5, 12], [11, 11], [8, 14], [12, 15]]) {
        p.rect(PAL.berry, x, y, 2, 2);
        p.rect(PAL.rose, x, y);
      }
    },
  ],
};

function cropSprite(id, stage) {
  const p = new Pen(CROP_W, CROP_H);
  CROP_STAGES[id][stage](p);
  p.outline();
  return p.canvas;
}

// ---------------------------------------------------------------- UI

function slotSprite(selected) {
  const p = new Pen(20, 20);
  if (selected) {
    p.rect(PAL.ink, 0, 0, 20, 20);
    p.rect(PAL.sun, 1, 1, 18, 18);
    p.rect(PAL.cream, 3, 3, 14, 14);
    p.rect(PAL.pathLight, 3, 3, 14, 1);
    p.rect(PAL.pathLight, 3, 3, 1, 14);
  } else {
    p.rect(PAL.barkDark, 0, 0, 20, 20);
    p.rect(PAL.pathLight, 1, 1, 18, 18);
    p.rect(PAL.pathDark, 1, 1, 18, 1);
    p.rect(PAL.pathDark, 1, 1, 1, 18);
  }
  return p.canvas;
}

// Corner brackets around the targeted tile.
function tileCursor() {
  const p = new Pen(16, 16);
  const corner = (x, y, dx, dy) => {
    p.rect(PAL.ink, x + dx, y + dy, 1, 1);
    for (let i = 0; i < 4; i++) {
      p.rect(PAL.cream, x + dx * i, y, 1, 1);
      p.rect(PAL.cream, x, y + dy * i, 1, 1);
    }
    for (let i = 1; i < 3; i++) {
      p.rect(PAL.ink, x + dx * (i + 1), y + dy, 1, 1);
      p.rect(PAL.ink, x + dx, y + dy * (i + 1), 1, 1);
    }
  };
  corner(0, 0, 1, 1);
  corner(15, 0, -1, 1);
  corner(0, 15, 1, -1);
  corner(15, 15, -1, -1);
  return p.canvas;
}

// ---------------------------------------------------------------- player

const PLAYER_COLORS = {
  hair: PAL.hair, hairLight: PAL.hairLight, skin: PAL.skin, skinShade: PAL.skinShade,
  shirt: PAL.shirt, shirtDark: PAL.shirtDark, pants: PAL.pants, pantsDark: PAL.pantsDark,
  shoes: PAL.shoes, accent: PAL.rose, accentDark: PAL.berry,
};

// frame: 0 = idle / passing, 1 and 2 = opposite contact poses of the walk cycle.
// c = colour scheme (PLAYER_COLORS or a villager's), extra(R, dir, b) draws accessories.
function playerFrame(dir, frame, c = PLAYER_COLORS, extra = null) {
  const p = new Pen(18, 24);
  const R = (c, x, y, w = 1, h = 1) => p.rect(c, x + 1, y + 1, w, h);
  const b = frame === 0 ? 0 : 1; // body dips on contact frames

  if (dir === 'down' || dir === 'up') {
    const liftL = frame === 1 ? 1 : 0, liftR = frame === 2 ? 1 : 0;
    R(c.pants, 5, 17, 3, 3 - liftL);
    R(c.pants, 8, 17, 3, 3 - liftR);
    R(c.pantsDark, 8, 17, 1, 3 - liftR);
    R(c.shoes, 5, 20 - liftL, 3, 2);
    R(c.shoes, 8, 20 - liftR, 3, 2);

    R(c.shirt, 5, 12 + b, 6, 4);
    R(c.shirtDark, 10, 12 + b, 1, 4);
    R(c.pants, 5, 16 + b, 6, 1);
    R(c.shirt, 4, 12 + b, 1, 3);
    R(c.shirtDark, 11, 12 + b, 1, 3);
    R(c.skin, 4, 15 + b, 1, 1);
    R(c.skin, 11, 15 + b, 1, 1);

    R(c.hair, 5, 2 + b, 6, 1);
    R(c.hair, 4, 3 + b, 8, 4);
    R(c.hairLight, 6, 3 + b, 3, 1);
    if (dir === 'down') {
      R(c.hair, 4, 7 + b, 1, 3);
      R(c.hair, 11, 7 + b, 1, 3);
      R(c.skin, 5, 7 + b, 6, 3);
      R(c.skin, 6, 10 + b, 4, 1);
      R(c.hair, 5, 7 + b, 1, 1);
      R(c.hair, 9, 7 + b, 2, 1);
      R(PAL.ink, 6, 8 + b, 1, 1);
      R(PAL.ink, 9, 8 + b, 1, 1);
      R(c.accent, 5, 9 + b, 1, 1);
      R(c.accent, 10, 9 + b, 1, 1);
      R(c.accent, 5, 11 + b, 6, 1);
      R(c.accent, 9, 12 + b, 1, 2);
      R(c.accentDark, 10, 12 + b, 1, 1);
    } else {
      R(c.hair, 4, 7 + b, 8, 3);
      R(c.hair, 5, 10 + b, 6, 1);
      R(c.hairLight, 5, 5 + b, 1, 3);
      R(c.accent, 5, 11 + b, 6, 1);
      R(c.accent, 6, 12 + b, 1, 2);
    }
  } else {
    // Authored facing left; 'right' is mirrored by the caller.
    if (frame === 0) {
      R(c.pants, 6, 17, 4, 3);
      R(c.pantsDark, 8, 17, 1, 3);
      R(c.shoes, 5, 20, 5, 2);
    } else {
      const fwd = frame === 1;
      // back leg first (darker), then the front leg
      R(c.pantsDark, fwd ? 8 : 4, 17, 3, fwd ? 2 : 3);
      R(c.shoes, fwd ? 9 : 3, fwd ? 19 : 20, 3, 2);
      R(c.pants, fwd ? 4 : 8, 17, 3, fwd ? 3 : 2);
      R(c.shoes, fwd ? 3 : 8, fwd ? 20 : 19, fwd ? 4 : 3, 2);
    }
    R(c.shirt, 6, 12 + b, 4, 4);
    R(c.shirtDark, 9, 12 + b, 1, 4);
    R(c.pants, 6, 16 + b, 4, 1);
    const armX = frame === 1 ? 8 : frame === 2 ? 6 : 7;
    R(c.shirtDark, armX, 12 + b, 2, 3);
    R(c.skin, armX, 15 + b, 2, 1);

    R(c.hair, 5, 2 + b, 6, 1);
    R(c.hair, 4, 3 + b, 8, 4);
    R(c.hairLight, 5, 3 + b, 3, 1);
    R(c.hair, 8, 7 + b, 4, 3);
    R(c.skin, 4, 7 + b, 4, 3);
    R(c.skin, 5, 10 + b, 4, 1);
    R(c.skin, 3, 8 + b, 1, 1);
    R(c.hair, 4, 7 + b, 1, 1);
    R(c.skinShade, 8, 8 + b, 1, 1);
    R(PAL.ink, 5, 8 + b, 1, 1);
    R(c.accent, 6, 9 + b, 1, 1);
    R(c.accent, 5, 11 + b, 6, 1);
    R(c.accent, 10, 12 + b, 1, 2);
  }
  if (extra) extra(R, dir, b);
  p.outline();
  return p;
}

// ---------------------------------------------------------------- villagers

// Colour schemes, sprite accessories and portrait extras per villager id (see data/npcs.js).
const VILLAGERS = {
  marigold: {
    c: {
      hair: PAL.roofDark, hairLight: PAL.roof, skin: PAL.skin, skinShade: PAL.skinShade,
      shirt: PAL.leaf, shirtDark: PAL.leafDark, pants: PAL.leafDark, pantsDark: PAL.leafDeep,
      shoes: PAL.bark, accent: PAL.cream, accentDark: PAL.straw,
    },
    bg: PAL.peach,
    extra: (R, dir, b) => {
      R(PAL.roofDark, 6, 0 + b, 4, 2); // hair bun
      if (dir === 'down') R(PAL.cream, 6, 13 + b, 4, 4); // apron
    },
    portrait: (p) => {
      p.ellipse(PAL.roofDark, 20, 5, 5, 4);
      p.rect(PAL.cream, 14, 33, 12, 7);
    },
  },
  otto: {
    c: {
      hair: PAL.stoneLight, hairLight: PAL.white, skin: PAL.skin, skinShade: PAL.skinShade,
      shirt: PAL.woodLight, shirtDark: PAL.wood, pants: PAL.stoneDark, pantsDark: PAL.plumDark,
      shoes: PAL.barkDark, accent: PAL.leaf, accentDark: PAL.leafDark,
    },
    bg: PAL.grassLight,
    extra: (R, dir, b) => {
      if (dir === 'down') R(PAL.stoneLight, 5, 10 + b, 6, 2); // beard
      if (dir === 'left') R(PAL.stoneLight, 4, 10 + b, 4, 1);
    },
    portrait: (p) => {
      p.ellipse(PAL.stoneLight, 20, 28, 8, 5);
      p.rect(PAL.skin, 17, 25, 6, 1);
      p.rect(PAL.berry, 18, 26, 4, 1);
      p.rect(PAL.stoneDark, 13, 18, 6, 1);
      p.rect(PAL.stoneDark, 21, 18, 6, 1);
      p.rect(PAL.stoneDark, 19, 19, 2, 1);
    },
  },
  june: {
    c: {
      hair: PAL.plumDark, hairLight: PAL.plum, skin: PAL.skinShade, skinShade: PAL.dirtLight,
      shirt: PAL.water, shirtDark: PAL.waterDeep, pants: PAL.pantsDark, pantsDark: PAL.ink,
      shoes: PAL.rose, accent: PAL.sun, accentDark: PAL.straw,
    },
    bg: PAL.waterLight,
    extra: (R, dir, b) => {
      R(PAL.waterDeep, 4, 1 + b, 8, 3); // cap
      R(PAL.sun, 7, 2 + b, 2, 1);
      if (dir === 'left') R(PAL.waterDeep, 2, 3 + b, 3, 1);
      if (dir === 'down') R(PAL.waterDeep, 4, 4 + b, 8, 1);
    },
    portrait: (p) => {
      p.ellipse(PAL.waterDeep, 20, 9, 13, 6);
      p.rect(PAL.waterDeep, 7, 12, 26, 2);
      p.rect(PAL.sun, 18, 6, 4, 3);
    },
  },
  pip: {
    c: {
      hair: PAL.straw, hairLight: PAL.sun, skin: PAL.skin, skinShade: PAL.skinShade,
      shirt: PAL.rose, shirtDark: PAL.berry, pants: PAL.water, pantsDark: PAL.waterDeep,
      shoes: PAL.bark, accent: PAL.cream, accentDark: PAL.pathLight,
    },
    bg: PAL.sun,
    extra: (R, dir, b) => {
      R(PAL.cream, 5, 14 + b, 6, 1); // stripes
      R(PAL.straw, 7, 1 + b, 1, 1); // cowlick
    },
    portrait: (p) => {
      for (const [x, y] of [[14, 23], [16, 24], [24, 23], [26, 24]]) p.rect(PAL.dirt, x, y);
      p.rect(PAL.straw, 21, 3, 2, 4);
      p.rect(PAL.cream, 8, 36, 24, 1);
    },
  },
};

// A 40x40 head-and-shoulders portrait for the dialogue box.
function portrait(c, bg, extra) {
  const p = new Pen(40, 40);
  p.rect(bg, 0, 0, 40, 40);
  p.ellipse(c.shirtDark, 20, 45, 18, 13);
  p.ellipse(c.shirt, 20, 45, 16, 12);
  p.rect(c.skinShade, 16, 28, 8, 5);
  p.ellipse(c.hair, 20, 18, 13, 13);
  p.ellipse(c.skin, 20, 21, 10, 11);
  p.shade((x, y) => {
    const dx = (x + 0.5 - 20) / 11, dy = (y + 0.5 - 12) / 6;
    return y < 15 && dx * dx + dy * dy <= 1 ? c.hair : null;
  });
  p.rect(c.hairLight, 15, 8, 6, 1);
  p.rect(PAL.ink, 15, 19, 2, 3);
  p.rect(PAL.ink, 23, 19, 2, 3);
  p.rect(PAL.white, 15, 19);
  p.rect(PAL.white, 23, 19);
  p.rect(PAL.rose, 12, 24, 3, 1);
  p.rect(PAL.rose, 25, 24, 3, 1);
  p.rect(PAL.berry, 18, 27, 4, 1);
  p.rect(c.accent, 15, 32, 10, 2);
  if (extra) extra(p);
  return p.canvas;
}

// ---------------------------------------------------------------- registration

export function buildPlaceholderArt(atlas) {
  for (let i = 0; i < 4; i++) atlas.add(`tile.grass${i}`, grassTile(101 + i * 7));
  for (let i = 0; i < 3; i++) atlas.add(`decor.flowers${i}`, flowersDecor(211 + i * 13));
  for (let i = 0; i < 2; i++) atlas.add(`tile.path${i}`, pathTile(307 + i * 5));
  for (let i = 0; i < 2; i++) atlas.add(`tile.field${i}`, fieldTile(401 + i * 11));
  for (let i = 0; i < 4; i++) atlas.add(`tile.fieldwild${i}`, fieldWildTile(421 + i * 13));
  for (const side of ['n', 's', 'e', 'w']) atlas.add(`edge.stake.${side}`, stakeEdge(side));
  atlas.add('obj.plotsign', plotSign(), 9, 24);
  for (let i = 0; i < 2; i++) atlas.add(`tile.water${i}`, waterTile(503 + i * 3));
  atlas.add('tile.soil', soilTile(false));
  atlas.add('tile.soilwet', soilTile(true));
  for (const side of ['n', 's', 'e', 'w']) {
    atlas.add(`edge.grass.${side}`, grassLip(side));
    atlas.add(`edge.water.${side}`, waterEdge(side));
  }

  // Objects: anchor = bottom centre of the footprint area they stand on.
  atlas.add('obj.tree', roundTree(7), 17, 45);
  atlas.add('obj.pine', pineTree(9), 14, 47);
  atlas.add('obj.rock', rock(), 9, 16);
  atlas.add('obj.branch', branch(), 9, 14);
  atlas.add('obj.bush', bush(3), 9, 16);
  atlas.add('obj.house', house(), 41, 80);
  atlas.add('obj.mailbox', mailbox(), 7, 22);
  atlas.add('obj.shippingbox', shippingBox(), 10, 17);
  atlas.add('obj.sign', sign(), 8, 19);
  atlas.add('obj.stump', stump(), 9, 14);

  for (let i = 0; i < 2; i++) atlas.add(`tile.plaza${i}`, plazaTile(601 + i * 9));
  atlas.add('obj.store', store(), 49, 84);
  atlas.add('obj.cottage.rose', cottage(PAL.roof, PAL.roofDark, PAL.roofLight, PAL.woodLight, PAL.wood), 33, 68);
  atlas.add('obj.cottage.moss', cottage(PAL.leafDark, PAL.leafDeep, PAL.leaf, PAL.cream, PAL.pathLight), 33, 68);
  atlas.add('obj.cottage.sky', cottage(PAL.water, PAL.waterDeep, PAL.waterLight, PAL.pathLight, PAL.path), 33, 68);
  atlas.add('obj.forge', forge(), 25, 58);
  atlas.add('obj.furnitureshop', furnitureShop(), 41, 76);

  // The farmhouse interior: floor and wallpaper styles (with item icons), trim, furniture.
  for (const [id, draw] of Object.entries(FLOOR_ART)) {
    const tile = tilePen(draw);
    atlas.add(`tile.floor.${id}`, tile);
    atlas.add(`icon.floor.${id}`, floorIcon(tile), 8, 8);
  }
  for (const [id, draw] of Object.entries(WALL_ART)) {
    const tile = tilePen(draw);
    atlas.add(`tile.wall.${id}`, tile);
    atlas.add(`icon.wall.${id}`, wallpaperIcon(tile), 8, 8);
  }
  atlas.add('tile.trim', trimTile());
  atlas.add('edge.crown', crownEdge());
  atlas.add('edge.baseboard', baseboardEdge());
  atlas.add('edge.wallshadow', wallShadowEdge());
  atlas.add('decor.doormat', doormat());
  atlas.add('obj.window', windowSprite(), 9, 28);
  atlas.add('fx.glow', glow(), 24, 24);
  // Furniture stands on the bottom centre of its footprint, like every object.
  for (const [id, draw] of Object.entries(FURNITURE_ART)) {
    const c = draw();
    atlas.add(`furn.${id}`, c, c.width / 2, c.height);
    atlas.add(`icon.furn.${id}`, iconFromSprite(c), 8, 8);
  }
  atlas.add('obj.fountain', fountain(), 25, 41);
  atlas.add('obj.bench', bench(), 17, 20);
  atlas.add('obj.lamp', lamp(), 7, 37);
  atlas.add('obj.flowerbed', flowerbed(5), 9, 15);
  atlas.add('shadow.small', smallShadow(), 6, 2);

  // Item icons are anchored at their centre. Tools also get held sprites (right / left).
  const tools = { hoe: hoeIcon, can: canIcon, axe: axeIcon, pickaxe: pickaxeIcon };
  for (const [key, draw] of Object.entries(tools)) {
    const pen = iconPen(draw);
    atlas.add(`item.${key}`, pen.canvas, 8, 8);
    atlas.add(`held.${key}`, pen.canvas, 8, 8);
    atlas.add(`held.${key}.left`, pen.flipX().canvas, 8, 8);
  }
  const seedColors = { turnip: PAL.rose, potato: PAL.dirt, strawberry: PAL.berry };
  for (const [crop, color] of Object.entries(seedColors)) {
    atlas.add(`item.seeds.${crop}`, iconPen(seedsIcon(color)).canvas, 8, 8);
  }
  atlas.add('item.turnip', iconPen(turnipIcon).canvas, 8, 8);
  atlas.add('item.potato', iconPen(potatoIcon).canvas, 8, 8);
  atlas.add('item.strawberry', iconPen(strawberryIcon).canvas, 8, 8);
  atlas.add('item.wood', iconPen(woodIcon).canvas, 8, 8);
  atlas.add('item.stone', iconPen(stoneIcon).canvas, 8, 8);

  // Crops: anchored so the plant's base sits 2 px above the tile's bottom edge.
  for (const [id, stages] of Object.entries(CROP_STAGES)) {
    for (let i = 0; i < stages.length; i++) atlas.add(`crop.${id}.${i}`, cropSprite(id, i), CROP_CX, CROP_BASE + 2);
  }

  atlas.add('ui.slot', slotSprite(false));
  atlas.add('ui.slot.selected', slotSprite(true));
  atlas.add('ui.cursor', tileCursor());

  for (const dir of ['down', 'up', 'left']) {
    for (let f = 0; f < 3; f++) {
      const pen = playerFrame(dir, f);
      atlas.add(`player.${dir}.${f}`, pen.canvas, 9, 23);
      if (dir === 'left') atlas.add(`player.right.${f}`, pen.flipX().canvas, 9, 23);
    }
  }

  for (const [id, v] of Object.entries(VILLAGERS)) {
    for (const dir of ['down', 'up', 'left']) {
      for (let f = 0; f < 3; f++) {
        const pen = playerFrame(dir, f, v.c, v.extra);
        atlas.add(`npc.${id}.${dir}.${f}`, pen.canvas, 9, 23);
        if (dir === 'left') atlas.add(`npc.${id}.right.${f}`, pen.flipX().canvas, 9, 23);
      }
    }
    atlas.add(`portrait.${id}`, portrait(v.c, v.bg, v.portrait));
  }
}
