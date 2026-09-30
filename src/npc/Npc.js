// A villager: position on some map, the path it is walking, walk animation and friendship.
// Villagers walk through the player (they never block or get blocked), so schedules can't jam.

import { TILE } from '../config.js';
import { DIRS } from '../player/Player.js';
import { NPC } from '../data/tuning.js';

const STEP_TIME = 0.16;
const WALK_CYCLE = [1, 0, 2, 0];

export class Npc {
  constructor(id, def, atlas) {
    this.id = id;
    this.def = def;
    this.name = def.name;
    this.sprites = DIRS.map((d) => [0, 1, 2].map((f) => atlas.get(`npc.${id}.${d}.${f}`)));
    this.shadow = atlas.get('shadow.small');
    this.mapId = def.home.map;
    this.x = 0;
    this.y = 0;
    this.facing = 0;
    this.frame = 0;
    this.animTime = 0;
    this.hidden = false;
    this.path = null;         // remaining [[x, y], ...] on the current map
    this.leg = null;          // the schedule leg being walked
    this.legIndex = -1;
    this.friendship = 0;
    this.talkedDay = 0;       // the last day the player chatted
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

  placeAtTile(mapId, tx, ty) {
    this.mapId = mapId;
    this.x = tx * TILE + TILE / 2;
    this.y = ty * TILE + TILE - 3;
    this.frame = 0;
    this.animTime = 0;
  }

  // Walks toward the next path node. Returns true when the node list is used up.
  walk(dt) {
    let dist = NPC.speed * dt;
    while (dist > 0 && this.path.length) {
      const [nx, ny] = this.path[0];
      const tx = nx * TILE + TILE / 2, ty = ny * TILE + TILE - 3;
      const dx = tx - this.x, dy = ty - this.y;
      const len = Math.abs(dx) + Math.abs(dy);
      if (Math.abs(dx) > Math.abs(dy)) this.facing = dx < 0 ? 1 : 2;
      else if (dy !== 0) this.facing = dy < 0 ? 3 : 0;
      if (len <= dist) {
        this.x = tx;
        this.y = ty;
        dist -= len;
        this.path.shift();
      } else {
        // Paths are 4-directional, so only one of dx / dy is non-zero.
        this.x += Math.sign(dx) * Math.min(dist, Math.abs(dx));
        this.y += Math.sign(dy) * Math.min(dist, Math.abs(dy));
        dist = 0;
      }
    }
    this.animTime += dt;
    this.frame = WALK_CYCLE[Math.floor(this.animTime / STEP_TIME) % WALK_CYCLE.length];
    return this.path.length === 0;
  }

  draw(ctx, atlas, camX, camY, snap) {
    const x = snap(this.x) - camX, y = snap(this.y) - camY;
    atlas.draw(ctx, this.shadow, x, y);
    atlas.draw(ctx, this.sprites[this.facing][this.frame], x, y);
  }
}
