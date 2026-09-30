// One texture holding every sprite, addressed by name. Gameplay code only knows names,
// so placeholder art can be swapped for a real sprite sheet without touching it.

const PAD = 1;

export class Atlas {
  constructor(width = 1024, height = 1024) {
    this.canvas = document.createElement('canvas');
    this.canvas.width = width;
    this.canvas.height = height;
    this.ctx = this.canvas.getContext('2d');
    this.sprites = new Map();
    // Simple shelf packer.
    this.shelfX = 0;
    this.shelfY = 0;
    this.shelfH = 0;
  }

  // Copies `source` (canvas/image) into the atlas. (ax, ay) is the anchor inside the sprite.
  add(name, source, ax = 0, ay = 0) {
    const w = source.width, h = source.height;
    if (this.shelfX + w > this.canvas.width) {
      this.shelfX = 0;
      this.shelfY += this.shelfH + PAD;
      this.shelfH = 0;
    }
    if (this.shelfY + h > this.canvas.height) {
      throw new Error(`Atlas full while adding "${name}" (${w}x${h}); raise the atlas size.`);
    }
    const x = this.shelfX, y = this.shelfY;
    this.ctx.drawImage(source, x, y);
    this.shelfX += w + PAD;
    this.shelfH = Math.max(this.shelfH, h);
    const sprite = { name, x, y, w, h, ax, ay };
    this.sprites.set(name, sprite);
    return sprite;
  }

  get(name) {
    const s = this.sprites.get(name);
    if (!s) throw new Error(`Unknown sprite "${name}"`);
    return s;
  }

  has(name) {
    return this.sprites.has(name);
  }

  // Draws a resolved sprite with its anchor at (x, y).
  draw(ctx, s, x, y) {
    ctx.drawImage(this.canvas, s.x, s.y, s.w, s.h, x - s.ax, y - s.ay, s.w, s.h);
  }
}
