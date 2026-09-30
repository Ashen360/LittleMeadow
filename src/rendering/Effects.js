// Short-lived feedback: floating text ("+1 Wood") and object shakes on tool hits.
// Floaters come from a fixed pool, so nothing is allocated while effects run.

import { PAL } from './palette.js';

const MAX_FLOATERS = 16;
const FLOAT_TIME = 0.9;
const FLOAT_RISE = 12;

export class Effects {
  constructor() {
    this.floaters = [];
    for (let i = 0; i < MAX_FLOATERS; i++) {
      this.floaters.push({ active: false, text: '', color: '', x: 0, y: 0, t: 0 });
    }
    this.shaking = [];
  }

  // Text that rises from world position (x, y) and fades.
  float(text, x, y, color = PAL.cream) {
    let f = this.floaters[0];
    for (const c of this.floaters) {
      if (!c.active) { f = c; break; }
      if (c.t > f.t) f = c; // all busy: reuse the oldest
    }
    f.active = true;
    f.text = text;
    f.color = color;
    f.x = x;
    f.y = y;
    f.t = 0;
  }

  shake(obj, time = 0.25) {
    if (!(obj.shake > 0)) this.shaking.push(obj);
    obj.shake = time;
  }

  // Returns true while anything is animating (the frame needs a redraw).
  update(dt) {
    let active = false;
    for (const f of this.floaters) {
      if (!f.active) continue;
      f.t += dt;
      if (f.t >= FLOAT_TIME) f.active = false;
      active = true;
    }
    for (let i = this.shaking.length - 1; i >= 0; i--) {
      const o = this.shaking[i];
      o.shake -= dt;
      if (o.shake <= 0) {
        o.shake = 0;
        this.shaking.splice(i, 1);
      }
      active = true;
    }
    return active;
  }

  // Horizontal wobble for a shaking object, in logical px.
  static shakeOffset(obj) {
    return obj.shake > 0 ? ((obj.shake * 40) | 0) % 2 === 0 ? 1 : -1 : 0;
  }

  draw(ctx, font, camX, camY) {
    for (const f of this.floaters) {
      if (!f.active) continue;
      const k = f.t / FLOAT_TIME;
      ctx.globalAlpha = k < 0.6 ? 1 : 1 - (k - 0.6) / 0.4;
      const x = Math.round(f.x - camX), y = Math.round(f.y - camY - FLOAT_RISE * k);
      font.drawShadowed(ctx, f.text, x, y, f.color, PAL.ink, 'center');
    }
    ctx.globalAlpha = 1;
  }
}
