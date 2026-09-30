// Short-lived feedback: floating text ("+1 Wood"), object shakes on tool hits, and small
// particle bursts (dust, droplets, chips, sparkles). Floaters and particles come from fixed
// pools (capped), so nothing is allocated while effects run.

import { PAL } from './palette.js';

const MAX_FLOATERS = 16;
const FLOAT_TIME = 0.9;
const FLOAT_RISE = 12;
const MAX_PARTICLES = 64;

export class Effects {
  constructor() {
    this.floaters = [];
    for (let i = 0; i < MAX_FLOATERS; i++) {
      this.floaters.push({ active: false, text: '', color: '', x: 0, y: 0, t: 0 });
    }
    this.shaking = [];
    this.particles = [];
    for (let i = 0; i < MAX_PARTICLES; i++) {
      this.particles.push({ active: false, x: 0, y: 0, vx: 0, vy: 0, t: 0, life: 0, color: '', size: 1, gravity: 0, floor: 0 });
    }
    this.nextParticle = 0;
  }

  // A burst of n particles at world (x, y). Particles fall back to `y` (the ground) and stop.
  burst(x, y, color, n = 6, { speed = 40, up = 45, gravity = 200, life = 0.45, size = 1 } = {}) {
    for (let i = 0; i < n; i++) {
      const p = this.particles[this.nextParticle];
      this.nextParticle = (this.nextParticle + 1) % MAX_PARTICLES; // the oldest gets reused
      p.active = true;
      p.x = x + (Math.random() - 0.5) * 6;
      p.y = y - Math.random() * 3;
      p.floor = y + 2;
      p.vx = (Math.random() - 0.5) * speed * 2;
      p.vy = -up * (0.5 + Math.random() * 0.7);
      p.t = 0;
      p.life = life * (0.7 + Math.random() * 0.6);
      p.color = color;
      p.size = size;
      p.gravity = gravity;
    }
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
    for (const p of this.particles) {
      if (!p.active) continue;
      p.t += dt;
      if (p.t >= p.life) {
        p.active = false;
        continue;
      }
      p.vy += p.gravity * dt;
      p.x += p.vx * dt;
      p.y = Math.min(p.floor, p.y + p.vy * dt);
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
    for (const p of this.particles) {
      if (!p.active) continue;
      ctx.fillStyle = p.color;
      ctx.fillRect(Math.round(p.x - camX), Math.round(p.y - camY), p.size, p.size);
    }
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
