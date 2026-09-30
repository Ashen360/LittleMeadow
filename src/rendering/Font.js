// Original 5 px bitmap font, drawn on the canvas (no DOM text).
// Glyph format: [topRow, 'row/row/...'] where '#' is a pixel. Caps and digits are 5 rows from
// row 0; lowercase x-height is 4 rows from row 1; descenders reach row 6.

const GLYPHS = {
  A: [0, '.##./#..#/####/#..#/#..#'],
  B: [0, '###./#..#/###./#..#/###.'],
  C: [0, '.###/#.../#.../#.../.###'],
  D: [0, '###./#..#/#..#/#..#/###.'],
  E: [0, '####/#.../###./#.../####'],
  F: [0, '####/#.../###./#.../#...'],
  G: [0, '.###/#.../#.##/#..#/.###'],
  H: [0, '#..#/#..#/####/#..#/#..#'],
  I: [0, '###/.#./.#./.#./###'],
  J: [0, '..##/...#/...#/#..#/.##.'],
  K: [0, '#..#/#.#./##../#.#./#..#'],
  L: [0, '#.../#.../#.../#.../####'],
  M: [0, '#...#/##.##/#.#.#/#...#/#...#'],
  N: [0, '#..#/##.#/#.##/#..#/#..#'],
  O: [0, '.##./#..#/#..#/#..#/.##.'],
  P: [0, '###./#..#/###./#.../#...'],
  Q: [0, '.##./#..#/#..#/#.#./.#.#'],
  R: [0, '###./#..#/###./#.#./#..#'],
  S: [0, '.###/#.../.##./...#/###.'],
  T: [0, '#####/..#../..#../..#../..#..'],
  U: [0, '#..#/#..#/#..#/#..#/.##.'],
  V: [0, '#...#/#...#/.#.#./.#.#./..#..'],
  W: [0, '#...#/#...#/#.#.#/##.##/#...#'],
  X: [0, '#..#/#..#/.##./#..#/#..#'],
  Y: [0, '#...#/.#.#./..#../..#../..#..'],
  Z: [0, '####/...#/.##./#.../####'],

  a: [1, '.###/#..#/#..#/.###'],
  b: [0, '#.../###./#..#/#..#/###.'],
  c: [1, '.###/#.../#.../.###'],
  d: [0, '...#/.###/#..#/#..#/.###'],
  e: [1, '.##./####/#.../.###'],
  f: [0, '.##/#../###/#../#..'],
  g: [1, '.###/#..#/#..#/.###/...#/.##.'],
  h: [0, '#.../###./#..#/#..#/#..#'],
  i: [0, '#/./#/#/#'],
  j: [0, '.#/../.#/.#/.#/.#/#.'],
  k: [0, '#.../#..#/#.#./###./#..#'],
  l: [0, '#./#./#./#./.#'],
  m: [1, '####./#.#.#/#.#.#/#.#.#'],
  n: [1, '###./#..#/#..#/#..#'],
  o: [1, '.##./#..#/#..#/.##.'],
  p: [1, '###./#..#/#..#/###./#.../#...'],
  q: [1, '.###/#..#/#..#/.###/...#/...#'],
  r: [1, '#.##/##../#.../#...'],
  s: [1, '.###/##../..##/###.'],
  t: [0, '.#./###/.#./.#./..#'],
  u: [1, '#..#/#..#/#..#/.###'],
  v: [1, '#.#/#.#/#.#/.#.'],
  w: [1, '#...#/#.#.#/#.#.#/.#.#.'],
  x: [1, '#..#/.##./.##./#..#'],
  y: [1, '#..#/#..#/#..#/.###/...#/.##.'],
  z: [1, '####/..#./.#../####'],

  0: [0, '###/#.#/#.#/#.#/###'],
  1: [0, '.#./##./.#./.#./###'],
  2: [0, '##./..#/.#./#../###'],
  3: [0, '##./..#/.#./..#/##.'],
  4: [0, '#.#/#.#/###/..#/..#'],
  5: [0, '###/#../##./..#/##.'],
  6: [0, '.##/#../###/#.#/###'],
  7: [0, '###/..#/.#./.#./.#.'],
  8: [0, '###/#.#/###/#.#/###'],
  9: [0, '###/#.#/###/..#/##.'],

  '.': [4, '#'],
  ',': [4, '.#/#.'],
  '!': [0, '#/#/#/./#'],
  '?': [0, '##./..#/.#./.../.#.'],
  ':': [1, '#/./#'],
  ';': [1, '.#/../.#/#.'],
  "'": [0, '#/#'],
  '"': [0, '#.#/#.#'],
  '-': [2, '###'],
  '+': [1, '.#./###/.#.'],
  '=': [1, '###/.../###'],
  '/': [0, '..#/..#/.#./#../#..'],
  '(': [0, '.#/#./#./#./.#'],
  ')': [0, '#./.#/.#/.#/#.'],
  '[': [0, '##/#./#./#./##'],
  ']': [0, '##/.#/.#/.#/##'],
  '<': [0, '..#/.#./#../.#./..#'],
  '>': [0, '#../.#./..#/.#./#..'],
  '%': [0, '#.#/..#/.#./#../#.#'],
  '*': [1, '#.#/.#./#.#'],
  '&': [0, '.#../#.#./.#.#/#.#./.#.#'],
  '_': [5, '####'],
  '·': [2, '#'], // middle dot
  '♥': [0, '.#.#./#####/#####/.###./..#..'], // heart
  '→': [1, '..#./####/..#.'], // right arrow
  '←': [1, '.#../####/.#..'], // left arrow
};

const GLYPH_H = 7;
const SPACE_W = 3;
const LETTER_GAP = 1;
export const LINE_H = 9;

export class Font {
  constructor() {
    // Lay every glyph out in one strip; tinted copies of the strip are cached per colour.
    this.glyphs = new Map();
    let x = 0;
    const entries = Object.entries(GLYPHS);
    for (const [ch, [top, src]] of entries) {
      const rows = src.split('/');
      const w = rows.reduce((m, r) => Math.max(m, r.length), 0);
      this.glyphs.set(ch.charCodeAt(0), { sx: x, w, top, rows });
      x += w + 1;
    }
    this.strip = document.createElement('canvas');
    this.strip.width = x;
    this.strip.height = GLYPH_H;
    const g = this.strip.getContext('2d');
    g.fillStyle = '#fff';
    for (const glyph of this.glyphs.values()) {
      glyph.rows.forEach((row, ry) => {
        for (let rx = 0; rx < row.length; rx++) {
          if (row[rx] === '#') g.fillRect(glyph.sx + rx, glyph.top + ry, 1, 1);
        }
      });
      delete glyph.rows;
    }
    this.fallback = this.glyphs.get(63); // '?'
    this.tints = new Map();
  }

  tint(color) {
    let c = this.tints.get(color);
    if (!c) {
      c = document.createElement('canvas');
      c.width = this.strip.width;
      c.height = GLYPH_H;
      const g = c.getContext('2d');
      g.drawImage(this.strip, 0, 0);
      g.globalCompositeOperation = 'source-in';
      g.fillStyle = color;
      g.fillRect(0, 0, c.width, c.height);
      this.tints.set(color, c);
    }
    return c;
  }

  measure(text) {
    let w = 0;
    for (let i = 0; i < text.length; i++) {
      const code = text.charCodeAt(i);
      w += code === 32 ? SPACE_W : (this.glyphs.get(code) || this.fallback).w;
      w += LETTER_GAP;
    }
    return text.length ? w - LETTER_GAP : 0;
  }

  // Draws text with its top-left at (x, y). align: 'left' | 'center' | 'right'.
  draw(ctx, text, x, y, color, align = 'left') {
    if (align !== 'left') {
      const w = this.measure(text);
      x -= align === 'center' ? Math.floor(w / 2) : w;
    }
    const src = this.tint(color);
    for (let i = 0; i < text.length; i++) {
      const code = text.charCodeAt(i);
      if (code === 32) { x += SPACE_W + LETTER_GAP; continue; }
      const g = this.glyphs.get(code) || this.fallback;
      ctx.drawImage(src, g.sx, 0, g.w, GLYPH_H, x, y, g.w, GLYPH_H);
      x += g.w + LETTER_GAP;
    }
  }

  // Text with a 1 px drop shadow, readable on top of the world.
  drawShadowed(ctx, text, x, y, color, shadow, align = 'left') {
    this.draw(ctx, text, x, y + 1, shadow, align);
    this.draw(ctx, text, x, y, color, align);
  }

  // Splits text into lines no wider than maxWidth (respects explicit '\n').
  wrap(text, maxWidth) {
    const lines = [];
    for (const paragraph of text.split('\n')) {
      let line = '';
      for (const word of paragraph.split(' ')) {
        const next = line ? line + ' ' + word : word;
        if (line && this.measure(next) > maxWidth) {
          lines.push(line);
          line = word;
        } else {
          line = next;
        }
      }
      lines.push(line);
    }
    return lines;
  }
}
