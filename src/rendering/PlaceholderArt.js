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

// frame: 0 = idle / passing, 1 and 2 = opposite contact poses of the walk cycle.
function playerFrame(dir, frame) {
  const p = new Pen(18, 24);
  const R = (c, x, y, w = 1, h = 1) => p.rect(c, x + 1, y + 1, w, h);
  const b = frame === 0 ? 0 : 1; // body dips on contact frames

  if (dir === 'down' || dir === 'up') {
    const liftL = frame === 1 ? 1 : 0, liftR = frame === 2 ? 1 : 0;
    R(PAL.pants, 5, 17, 3, 3 - liftL);
    R(PAL.pants, 8, 17, 3, 3 - liftR);
    R(PAL.pantsDark, 8, 17, 1, 3 - liftR);
    R(PAL.shoes, 5, 20 - liftL, 3, 2);
    R(PAL.shoes, 8, 20 - liftR, 3, 2);

    R(PAL.shirt, 5, 12 + b, 6, 4);
    R(PAL.shirtDark, 10, 12 + b, 1, 4);
    R(PAL.pants, 5, 16 + b, 6, 1);
    R(PAL.shirt, 4, 12 + b, 1, 3);
    R(PAL.shirtDark, 11, 12 + b, 1, 3);
    R(PAL.skin, 4, 15 + b, 1, 1);
    R(PAL.skin, 11, 15 + b, 1, 1);

    R(PAL.hair, 5, 2 + b, 6, 1);
    R(PAL.hair, 4, 3 + b, 8, 4);
    R(PAL.hairLight, 6, 3 + b, 3, 1);
    if (dir === 'down') {
      R(PAL.hair, 4, 7 + b, 1, 3);
      R(PAL.hair, 11, 7 + b, 1, 3);
      R(PAL.skin, 5, 7 + b, 6, 3);
      R(PAL.skin, 6, 10 + b, 4, 1);
      R(PAL.hair, 5, 7 + b, 1, 1);
      R(PAL.hair, 9, 7 + b, 2, 1);
      R(PAL.ink, 6, 8 + b, 1, 1);
      R(PAL.ink, 9, 8 + b, 1, 1);
      R(PAL.rose, 5, 9 + b, 1, 1);
      R(PAL.rose, 10, 9 + b, 1, 1);
      R(PAL.rose, 5, 11 + b, 6, 1);
      R(PAL.rose, 9, 12 + b, 1, 2);
      R(PAL.berry, 10, 12 + b, 1, 1);
    } else {
      R(PAL.hair, 4, 7 + b, 8, 3);
      R(PAL.hair, 5, 10 + b, 6, 1);
      R(PAL.hairLight, 5, 5 + b, 1, 3);
      R(PAL.rose, 5, 11 + b, 6, 1);
      R(PAL.rose, 6, 12 + b, 1, 2);
    }
  } else {
    // Authored facing left; 'right' is mirrored by the caller.
    if (frame === 0) {
      R(PAL.pants, 6, 17, 4, 3);
      R(PAL.pantsDark, 8, 17, 1, 3);
      R(PAL.shoes, 5, 20, 5, 2);
    } else {
      const fwd = frame === 1;
      // back leg first (darker), then the front leg
      R(PAL.pantsDark, fwd ? 8 : 4, 17, 3, fwd ? 2 : 3);
      R(PAL.shoes, fwd ? 9 : 3, fwd ? 19 : 20, 3, 2);
      R(PAL.pants, fwd ? 4 : 8, 17, 3, fwd ? 3 : 2);
      R(PAL.shoes, fwd ? 3 : 8, fwd ? 20 : 19, fwd ? 4 : 3, 2);
    }
    R(PAL.shirt, 6, 12 + b, 4, 4);
    R(PAL.shirtDark, 9, 12 + b, 1, 4);
    R(PAL.pants, 6, 16 + b, 4, 1);
    const armX = frame === 1 ? 8 : frame === 2 ? 6 : 7;
    R(PAL.shirtDark, armX, 12 + b, 2, 3);
    R(PAL.skin, armX, 15 + b, 2, 1);

    R(PAL.hair, 5, 2 + b, 6, 1);
    R(PAL.hair, 4, 3 + b, 8, 4);
    R(PAL.hairLight, 5, 3 + b, 3, 1);
    R(PAL.hair, 8, 7 + b, 4, 3);
    R(PAL.skin, 4, 7 + b, 4, 3);
    R(PAL.skin, 5, 10 + b, 4, 1);
    R(PAL.skin, 3, 8 + b, 1, 1);
    R(PAL.hair, 4, 7 + b, 1, 1);
    R(PAL.skinShade, 8, 8 + b, 1, 1);
    R(PAL.ink, 5, 8 + b, 1, 1);
    R(PAL.rose, 6, 9 + b, 1, 1);
    R(PAL.rose, 5, 11 + b, 6, 1);
    R(PAL.rose, 10, 12 + b, 1, 2);
  }
  p.outline();
  return p;
}

// ---------------------------------------------------------------- registration

export function buildPlaceholderArt(atlas) {
  for (let i = 0; i < 4; i++) atlas.add(`tile.grass${i}`, grassTile(101 + i * 7));
  for (let i = 0; i < 3; i++) atlas.add(`decor.flowers${i}`, flowersDecor(211 + i * 13));
  for (let i = 0; i < 2; i++) atlas.add(`tile.path${i}`, pathTile(307 + i * 5));
  for (let i = 0; i < 2; i++) atlas.add(`tile.field${i}`, fieldTile(401 + i * 11));
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
}
