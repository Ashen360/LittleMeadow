// Owns every system and runs the per-frame tick. Draws only when something changed.

import { MAX_STEP } from '../config.js';
import { Atlas } from '../rendering/Atlas.js';
import { buildPlaceholderArt } from '../rendering/PlaceholderArt.js';
import { Font } from '../rendering/Font.js';
import { Renderer } from '../rendering/Renderer.js';
import { Camera } from '../rendering/Camera.js';
import { GameMap } from '../world/GameMap.js';
import { Player } from '../player/Player.js';
import { Input } from './Input.js';
import { GameLoop } from './GameLoop.js';
import { Debug } from './Debug.js';
import { FARM_MAP } from '../data/maps/farm.js';

export class Game {
  constructor(canvas, options = {}) {
    this.atlas = new Atlas();
    buildPlaceholderArt(this.atlas);
    this.font = new Font();
    this.renderer = new Renderer(canvas, this.atlas, options.lowres ? { maxRenderScale: 1 } : {});
    this.renderer.onResize = () => { this.dirty = true; };
    this.input = new Input(canvas);
    this.camera = new Camera();
    this.debug = new Debug(!!options.debug);
    this.player = new Player(this.atlas);
    this.entities = [this.player];
    this.map = null;
    this.dirty = true;
    this.loop = new GameLoop((dt) => this.tick(dt));

    this.loadMap(FARM_MAP);
  }

  loadMap(def, spawn = def.spawn) {
    this.map = new GameMap(def);
    this.renderer.bakeMap(this.map);
    this.player.placeAtTile(spawn.x, spawn.y);
    this.camera.follow(this.player.x, this.player.y - 10, this.map);
    this.dirty = true;
  }

  start() {
    this.loop.start();
  }

  tick(dt) {
    const t0 = performance.now();
    const input = this.input;

    if (input.wasPressed('debug')) {
      this.debug.visible = !this.debug.visible;
      this.dirty = true;
    }

    let changed = false;
    for (let remaining = dt; remaining > 0; remaining -= MAX_STEP) {
      if (this.player.update(Math.min(remaining, MAX_STEP), input, this.map)) changed = true;
    }
    if (changed || input.activity) this.dirty = true;
    this.camera.follow(this.player.x, this.player.y - 10, this.map);

    // The debug overlay renders continuously so its numbers reflect real drawing cost.
    const rendered = this.dirty || this.debug.visible;
    if (rendered) {
      this.renderer.render(this);
      this.dirty = false;
    }
    input.endFrame();
    this.debug.record(dt, performance.now() - t0, rendered, this);
  }

  drawUI(ctx) {
    this.debug.draw(ctx, this.font);
  }
}
