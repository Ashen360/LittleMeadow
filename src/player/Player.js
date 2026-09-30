// The player: movement with tile collision (plus corner sliding), the walk animation, energy,
// and the tool swing (movement is locked while a swing plays).

import { TILE } from '../config.js';
import { PLAYER, TOOLS } from '../data/tuning.js';

export const DIRS = ['down', 'left', 'right', 'up'];
const DIR_INDEX = { down: 0, left: 1, right: 2, up: 3 };

const SPEED = 72;          // px per second (4.5 tiles/s)
const HALF_W = 5;          // feet hitbox: 10 x 6 px, bottom-centred on (x, y)
const FEET_H = 6;
const NUDGE = 6;           // max px of corner sliding
const STEP_TIME = 0.14;    // seconds per walk frame
const WALK_CYCLE = [1, 0, 2, 0];
const STRIKE_AT = 0.4;     // fraction of the swing spent raising the tool

// Held-tool position (centre of the 16x16 icon) relative to the feet, per facing
// (down, left, right, up): [raiseX, raiseY, strikeX, strikeY].
const TOOL_POSE = [
  [5, -21, 3, -5],
  [3, -21, -9, -9],
  [-3, -21, 9, -9],
  [-5, -21, 2, -24],
];

export class Player {
  constructor(atlas) {
    this.x = 0;
    this.y = 0;
    this.facing = 0;
    this.frame = 0;
    this.moving = false;
    this.animTime = 0;
    this.sprites = DIRS.map((d) => [0, 1, 2].map((f) => atlas.get(`player.${d}.${f}`)));
    this.shadow = atlas.get('shadow.small');
    this.maxEnergy = PLAYER.maxEnergy;
    this.energy = PLAYER.maxEnergy;
    // Tool sprites facing right and left, resolved once.
    this.toolSprites = {};
    for (const t of Object.keys(TOOLS)) {
      this.toolSprites[t] = [atlas.get(`held.${t}`), atlas.get(`held.${t}.left`)];
    }
    this.action = null; // { tool, time, duration } while a swing plays
  }

  startAction(tool, duration) {
    this.action = { tool, time: 0, duration };
    this.stand();
  }

  stand() {
    this.moving = false;
    this.animTime = 0;
    this.frame = 0;
  }

  get sortY() {
    return this.y;
  }

  get tileX() {
    return Math.floor(this.x / TILE);
  }

  get tileY() {
    return Math.floor((this.y - 1) / TILE);
  }

  // Places the player's feet in the middle-bottom of a tile.
  placeAtTile(tx, ty) {
    this.x = tx * TILE + TILE / 2;
    this.y = ty * TILE + TILE - 3;
  }

  // Returns true if anything visible changed.
  update(dt, input, map) {
    if (this.action) {
      this.action.time += dt;
      if (this.action.time >= this.action.duration) this.action = null;
      return true;
    }
    const px = this.x, py = this.y, pf = this.facing, pfr = this.frame;

    const face = input.lastDirection();
    if (face) this.facing = DIR_INDEX[face];

    const ax = input.axisX(), ay = input.axisY();
    this.moving = ax !== 0 || ay !== 0;
    if (this.moving) {
      const scale = ax !== 0 && ay !== 0 ? Math.SQRT1_2 : 1;
      const dist = SPEED * scale * dt;
      if (ax !== 0) this.moveX(ax * dist, map, ay === 0);
      if (ay !== 0) this.moveY(ay * dist, map, ax === 0);
      this.animTime += dt;
      this.frame = WALK_CYCLE[Math.floor(this.animTime / STEP_TIME) % WALK_CYCLE.length];
    } else {
      this.animTime = 0;
      this.frame = 0;
    }

    return px !== this.x || py !== this.y || pf !== this.facing || pfr !== this.frame;
  }

  blockedAt(x, y, map) {
    return map.rectBlocked(x - HALF_W, y - FEET_H, x + HALF_W, y);
  }

  moveX(dx, map, allowNudge) {
    const nx = this.x + dx;
    if (!this.blockedAt(nx, this.y, map)) { this.x = nx; return; }
    if (allowNudge && this.nudge(0, 1, Math.abs(dx), nx, this.y, map)) return;
    if (dx > 0) this.x = Math.floor((nx + HALF_W - 0.001) / TILE) * TILE - HALF_W;
    else this.x = (Math.floor((nx - HALF_W) / TILE) + 1) * TILE + HALF_W;
  }

  moveY(dy, map, allowNudge) {
    const ny = this.y + dy;
    if (!this.blockedAt(this.x, ny, map)) { this.y = ny; return; }
    if (allowNudge && this.nudge(1, 0, Math.abs(dy), this.x, ny, map)) return;
    if (dy > 0) this.y = Math.floor((ny - 0.001) / TILE) * TILE;
    else this.y = (Math.floor((ny - FEET_H) / TILE) + 1) * TILE + FEET_H;
  }

  // Corner sliding: when the straight move is blocked but a free spot exists within NUDGE px
  // along the other axis, slide toward it. (ox, oy) is the axis we slide along.
  nudge(ox, oy, amount, tx, ty, map) {
    for (let n = 1; n <= NUDGE; n++) {
      for (let s = -1; s <= 1; s += 2) {
        if (this.blockedAt(tx + ox * n * s, ty + oy * n * s, map)) continue;
        const step = Math.min(n, amount) * s;
        const sx = this.x + ox * step, sy = this.y + oy * step;
        if (this.blockedAt(sx, sy, map)) continue;
        this.x = sx;
        this.y = sy;
        return true;
      }
    }
    return false;
  }

  draw(ctx, atlas, camX, camY, snap) {
    const x = snap(this.x) - camX, y = snap(this.y) - camY;
    atlas.draw(ctx, this.shadow, x, y);
    const behind = this.action && this.facing === 3; // facing away: the tool is behind the body
    if (behind) this.drawTool(ctx, atlas, x, y);
    atlas.draw(ctx, this.sprites[this.facing][this.frame], x, y);
    if (this.action && !behind) this.drawTool(ctx, atlas, x, y);
  }

  drawTool(ctx, atlas, x, y) {
    const a = this.action;
    const pose = TOOL_POSE[this.facing];
    const k = a.time / a.duration < STRIKE_AT ? 0 : 2;
    const sprite = this.toolSprites[a.tool][this.facing === 1 ? 1 : 0];
    atlas.draw(ctx, sprite, x + pose[k], y + pose[k + 1]);
  }
}
