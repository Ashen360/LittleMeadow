// Debug overlay: FPS, CPU time per frame, redraws, entity/sprite counts, heap.
// Stats are sampled every half second so the overlay itself stays cheap.

import { PAL } from '../rendering/palette.js';
import { LINE_H } from '../rendering/Font.js';

const SAMPLE = 0.5;

export class Debug {
  constructor(visible = false) {
    this.visible = visible;
    this.time = 0;
    this.frames = 0;
    this.renders = 0;
    this.cpuSum = 0;
    this.cpuMax = 0;
    this.lines = ['...'];
  }

  // Called once per frame after update/render.
  record(dt, cpuMs, rendered, game) {
    this.time += dt;
    this.frames++;
    if (rendered) this.renders++;
    this.cpuSum += cpuMs;
    if (cpuMs > this.cpuMax) this.cpuMax = cpuMs;
    if (this.time < SAMPLE) return;

    const fps = this.frames / this.time;
    const p = game.player;
    const mem = performance.memory ? `${(performance.memory.usedJSHeapSize / 1048576).toFixed(1)} MB` : 'n/a';
    this.lines = [
      `FPS ${fps.toFixed(0)}  redraws/s ${(this.renders / this.time).toFixed(0)}`,
      `CPU ${(this.cpuSum / this.frames).toFixed(2)} ms  max ${this.cpuMax.toFixed(2)} ms`,
      `entities ${game.map.objects.length + game.map.crops.length + game.entities.length}  sprites ${game.renderer.spritesDrawn}`,
      `scale ${game.renderer.scale}x render / ${game.renderer.displayScale}x screen`,
      `heap ${mem}`,
      `${game.map.id} tile ${p.tileX},${p.tileY}  px ${p.x.toFixed(1)},${p.y.toFixed(1)}`,
    ];
    this.time = 0;
    this.frames = 0;
    this.renders = 0;
    this.cpuSum = 0;
    this.cpuMax = 0;
  }

  draw(ctx, font) {
    if (!this.visible) return;
    let w = 0;
    for (const l of this.lines) w = Math.max(w, font.measure(l));
    ctx.fillStyle = 'rgba(29, 21, 32, 0.78)';
    ctx.fillRect(2, 2, w + 8, this.lines.length * LINE_H + 5);
    for (let i = 0; i < this.lines.length; i++) {
      font.draw(ctx, this.lines[i], 6, 5 + i * LINE_H, i === 0 ? PAL.sun : PAL.cream);
    }
  }
}
