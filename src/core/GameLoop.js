// requestAnimationFrame driver. Hands a clamped dt to the tick function and measures CPU time.
// The browser pauses rAF in background tabs, so a hidden game costs nothing.

import { MAX_FRAME_DT } from '../config.js';

export class GameLoop {
  constructor(tick) {
    this.tick = tick;
    this.last = 0;
    this.running = false;
    this.frame = this.frame.bind(this);
  }

  start() {
    this.running = true;
    this.last = performance.now();
    requestAnimationFrame(this.frame);
  }

  stop() {
    this.running = false;
  }

  frame(now) {
    if (!this.running) return;
    const dt = Math.min((now - this.last) / 1000, MAX_FRAME_DT);
    this.last = now;
    this.tick(dt);
    requestAnimationFrame(this.frame);
  }
}
