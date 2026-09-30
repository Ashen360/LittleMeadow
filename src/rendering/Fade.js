// Full-screen fade to dark and back. onMid runs while the screen is fully dark (switch maps,
// end the day), onDone when it has faded back in.

import { VIEW_W, VIEW_H } from '../config.js';
import { PAL } from './palette.js';

const FADE_TIME = 0.35;

export class Fade {
  constructor() {
    this.alpha = 0;
    this.dir = 0;
    this.onMid = null;
    this.onDone = null;
  }

  get active() {
    return this.dir !== 0;
  }

  start(onMid, onDone = null) {
    this.dir = 1;
    this.onMid = onMid;
    this.onDone = onDone;
  }

  // Returns true while fading (the frame needs a redraw).
  update(dt) {
    if (this.dir === 0) return false;
    this.alpha += (this.dir * Math.min(dt, 0.05)) / FADE_TIME;
    if (this.dir > 0 && this.alpha >= 1) {
      this.alpha = 1;
      this.dir = -1;
      const f = this.onMid;
      this.onMid = null;
      if (f) f();
    } else if (this.dir < 0 && this.alpha <= 0) {
      this.alpha = 0;
      this.dir = 0;
      const f = this.onDone;
      this.onDone = null;
      if (f) f();
    }
    return true;
  }

  draw(ctx) {
    if (this.alpha <= 0) return;
    ctx.globalAlpha = Math.min(1, this.alpha);
    ctx.fillStyle = PAL.bg;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.globalAlpha = 1;
  }
}
