// Decorating the farmhouse: placing and picking up furniture, swapping the floor and
// wallpaper, and finding where you wake up. Furniture are ordinary map objects (types
// `furn_<id>`, see data/objects.js), so they save with the map like everything else.
//
// Placing: hold a furniture item and use it (Space / left click). The footprint extends away
// from you (or sits with its bottom row on the hovered tile when using the mouse); a green or
// red ghost previews it. Using a tool or empty hands on furniture picks it up. Using a floor or
// wallpaper item anywhere indoors applies it, and the old style goes back into the bag.

import { TILE } from '../config.js';
import { ITEMS } from '../data/items.js';
import { OBJECT_TYPES } from '../data/objects.js';
import { PAL } from '../rendering/palette.js';

const VALID_FILL = 'rgba(163, 207, 104, 0.35)';
const INVALID_FILL = 'rgba(226, 121, 123, 0.45)';

export class HomeSystem {
  constructor(game) {
    this.game = game;
  }

  // Top-left tile of the footprint for placing `def` at target (tx, ty).
  origin(def, tx, ty, facing, byMouse) {
    const cx = tx - Math.floor((def.w - 1) / 2);
    if (byMouse || facing === 3) return [cx, ty - (def.h - 1)]; // up / mouse: bottom row on target
    if (facing === 0) return [cx, ty];                         // down: top row on target
    if (facing === 1) return [tx - (def.w - 1), ty - (def.h - 1)]; // left
    return [tx, ty - (def.h - 1)];                             // right
  }

  // Why `def` can't go at (ox, oy), or null if it can.
  blockedReason(map, def, ox, oy) {
    for (let y = oy; y < oy + def.h; y++) {
      for (let x = ox; x < ox + def.w; x++) {
        if (map.tileAt(x, y).key !== 'floor') return 'Furniture goes on the floor.';
        if (!def.flat && map.tileAt(x, y + 1).key === 'doormat') return 'Better keep the doorway clear.';
        const layer = def.flat ? map.flatAt : map.objectAt;
        if (layer[map.index(x, y)]) return 'Something\'s already there.';
      }
    }
    if (!def.flat) {
      const p = this.game.player;
      const l = ox * TILE, t = oy * TILE, r = (ox + def.w) * TILE, b = (oy + def.h) * TILE;
      if (p.x + 5 > l && p.x - 5 < r && p.y > t && p.y - 6 < b) return 'You\'re standing right there!';
    }
    return null;
  }

  // Handles the use button indoors. Returns true if it did something (or explained why not).
  use(tx, ty, byMouse) {
    const { game } = this;
    const item = game.inventory.selectedItem;
    if (item && item.furniture) {
      this.place(item, tx, ty, byMouse);
      return true;
    }
    if (item && (item.floor || item.wallpaper)) {
      this.applyStyle(item);
      return true;
    }
    const obj = game.map.topObjectAt(tx, ty);
    if (obj && obj.def.furniture) {
      this.pickUp(obj);
      return true;
    }
    return false;
  }

  place(item, tx, ty, byMouse) {
    const { game } = this;
    const { map, inventory, player } = game;
    const type = `furn_${item.furniture}`;
    const def = OBJECT_TYPES[type];
    const [ox, oy] = this.origin(def, tx, ty, player.facing, byMouse);
    const why = this.blockedReason(map, def, ox, oy);
    if (why) {
      game.hud.toast(why);
      game.audio.play('deny');
      return;
    }
    const obj = map.addObject(type, ox, oy);
    inventory.removeAt(inventory.selected);
    game.effects.burst(obj.px, obj.py - 4, PAL.cream, 6, { up: 30 });
    game.audio.play('place');
    game.dirty = true;
  }

  pickUp(obj) {
    const { game } = this;
    const { map, inventory } = game;
    const id = obj.type; // furniture items share their object type's key
    if (!inventory.canAdd(id, 1)) {
      game.hud.toast('Your bag is full.');
      game.audio.play('deny');
      return;
    }
    map.removeObject(obj);
    inventory.add(id, 1);
    game.effects.float(`+1 ${ITEMS[id].name}`, obj.px, obj.py - 20, PAL.cream);
    game.audio.play('pickup');
    if (obj.def.use && obj.def.use.action === 'sleep' && !this.findBed(map)) {
      game.hud.toast('Put a bed back down before bedtime!', 3);
    }
    game.dirty = true;
  }

  applyStyle(item) {
    const { game } = this;
    const { map, inventory, hud } = game;
    if (!map.decor) return;
    const key = item.floor ? 'floor' : 'wall';
    const style = item.floor || item.wallpaper;
    const current = map.decor[key];
    if (current === style) {
      hud.toast('That\'s what\'s up already.');
      return;
    }
    const oldId = `${key}_${current}`;
    const slot = inventory.selectedSlot;
    if (ITEMS[oldId] && slot.qty > 1 && !inventory.canAdd(oldId, 1)) {
      hud.toast('Your bag is full.');
      game.audio.play('deny');
      return;
    }
    inventory.removeAt(inventory.selected);
    if (ITEMS[oldId]) inventory.add(oldId, 1);
    map.decor[key] = style;
    game.renderer.bakeMap(map);
    hud.toast(`${item.name}: lovely! The old one is back in your bag.`, 3);
    game.audio.play('place');
    game.dirty = true;
  }

  findBed(map) {
    for (const o of map.objects) if (o.def.use && o.def.use.action === 'sleep') return o;
    return null;
  }

  // Where to wake up: a free floor tile beside the bed (facing it), else the entry spot.
  wakeSpot(map) {
    const bed = this.findBed(map);
    if (bed) {
      const { x, y, def } = bed;
      const spots = [];
      for (let i = 0; i < def.w; i++) spots.push([x + i, y + def.h, 3]); // below, facing up
      for (let j = def.h - 1; j >= 0; j--) spots.push([x + def.w, y + j, 1], [x - 1, y + j, 2]);
      for (const [sx, sy, facing] of spots) {
        if (map.tileAt(sx, sy).key === 'floor' && !map.isBlocked(sx, sy)) return { x: sx, y: sy, facing };
      }
    }
    return { x: map.entry.x, y: map.entry.y, facing: map.entry.facing };
  }

  // Ghost preview of the held furniture at the target, drawn on the ground.
  drawGhost(ctx, atlas, item, tx, ty, byMouse, camX, camY) {
    const { map, player } = this.game;
    const type = `furn_${item.furniture}`;
    const def = OBJECT_TYPES[type];
    const [ox, oy] = this.origin(def, tx, ty, player.facing, byMouse);
    const ok = !this.blockedReason(map, def, ox, oy);
    ctx.fillStyle = ok ? VALID_FILL : INVALID_FILL;
    ctx.fillRect(ox * TILE - camX, oy * TILE - camY, def.w * TILE, def.h * TILE);
    ctx.globalAlpha = 0.6;
    atlas.draw(ctx, atlas.get(def.sprite), (ox + def.w / 2) * TILE - camX, (oy + def.h) * TILE - camY);
    ctx.globalAlpha = 1;
  }
}
