// Runs villager schedules. At each leg's start time the villager computes one BFS path to the
// target (via a warp if the target is on another map) and walks it, even on maps the player
// isn't on, so they arrive from the right direction. Each morning (and after loading) villagers
// snap to where their schedule says they should be.

import { NPCS } from '../data/npcs.js';
import { FRIENDSHIP } from '../data/tuning.js';
import { parseTime } from '../core/Clock.js';
import { Npc } from './Npc.js';
import { findPath } from './Path.js';

export class NpcManager {
  constructor(atlas) {
    this.list = Object.keys(NPCS).map((id) => {
      const npc = new Npc(id, NPCS[id], atlas);
      npc.times = NPCS[id].schedule.map((leg) => parseTime(leg.time));
      npc.viaWarp = null;
      return npc;
    });
  }

  get(id) {
    return this.list.find((n) => n.id === id) || null;
  }

  // Where a leg ends: its own tile, or home for `inside` legs.
  target(npc, leg) {
    if (leg.inside) return { map: npc.def.home.map, x: npc.def.home.x, y: npc.def.home.y, facing: 3 };
    return { map: leg.map, x: leg.x, y: leg.y, facing: leg.facing || 0 };
  }

  // Puts every villager where their schedule says they are at `minutes`.
  resetDay(minutes) {
    for (const npc of this.list) {
      let k = 0;
      for (let i = 0; i < npc.times.length; i++) if (npc.times[i] <= minutes) k = i;
      this.snapTo(npc, k);
    }
  }

  snapTo(npc, k) {
    const leg = npc.def.schedule[k];
    const t = this.target(npc, leg);
    npc.placeAtTile(t.map, t.x, t.y);
    npc.facing = t.facing;
    npc.hidden = !!leg.inside;
    npc.path = null;
    npc.viaWarp = null;
    npc.leg = leg;
    npc.legIndex = k;
  }

  // Returns true if anything visible on the player's map changed.
  update(dt, game) {
    const minutes = game.clock.minutes;
    const mapId = game.map.id;
    let changed = false;
    for (const npc of this.list) {
      const next = npc.legIndex + 1;
      if (next < npc.times.length && minutes >= npc.times[next]) {
        this.startLeg(npc, next, game.maps);
        changed = true;
      }
      if (!npc.path) continue;
      const visibleBefore = !npc.hidden && npc.mapId === mapId;
      if (npc.walk(dt)) this.arrive(npc, game.maps);
      if (visibleBefore || (!npc.hidden && npc.mapId === mapId)) changed = true;
    }
    return changed;
  }

  startLeg(npc, k, maps) {
    npc.legIndex = k;
    npc.leg = npc.def.schedule[k];
    npc.hidden = false; // step out of the door if they were inside
    this.route(npc, maps);
  }

  route(npc, maps) {
    const t = this.target(npc, npc.leg);
    const map = maps[npc.mapId];
    let path;
    npc.viaWarp = null;
    if (npc.mapId === t.map) {
      path = findPath(map, npc.tileX, npc.tileY, t.x, t.y);
    } else {
      const w = map.warps.find((wp) => wp.to === t.map);
      if (w) {
        npc.viaWarp = w;
        path = findPath(map, npc.tileX, npc.tileY, w.x, w.y + (w.h >> 1));
      }
    }
    if (!path) {
      this.snapTo(npc, npc.legIndex); // unreachable: skip the walk
      return;
    }
    npc.path = path;
    if (path.length === 0) this.arrive(npc, maps);
  }

  arrive(npc, maps) {
    npc.path = null;
    if (npc.viaWarp) {
      const w = npc.viaWarp;
      npc.placeAtTile(w.to, w.tx, w.ty + (w.h >> 1));
      this.route(npc, maps);
      return;
    }
    const t = this.target(npc, npc.leg);
    npc.facing = t.facing;
    npc.frame = 0;
    if (npc.leg.inside) npc.hidden = true;
  }

  // The visible villager standing on a tile, or null.
  at(mapId, tx, ty) {
    for (const npc of this.list) {
      if (!npc.hidden && npc.mapId === mapId && npc.tileX === tx && npc.tileY === ty) return npc;
    }
    return null;
  }

  // Records a chat. Returns true if it was the first today (friendship went up).
  talked(npc, day) {
    if (npc.talkedDay === day) return false;
    npc.talkedDay = day;
    npc.friendship = Math.min(FRIENDSHIP.max, npc.friendship + FRIENDSHIP.perTalk);
    return true;
  }

  tier(npc) {
    let t = 0;
    for (let i = 0; i < FRIENDSHIP.tiers.length; i++) if (npc.friendship >= FRIENDSHIP.tiers[i]) t = i;
    return t;
  }

  saveState() {
    const out = {};
    for (const npc of this.list) out[npc.id] = { friendship: npc.friendship, talkedDay: npc.talkedDay };
    return out;
  }

  loadState(state) {
    for (const npc of this.list) {
      const s = state && state[npc.id];
      npc.friendship = s ? s.friendship : 0;
      npc.talkedDay = s ? s.talkedDay : 0;
    }
  }
}
