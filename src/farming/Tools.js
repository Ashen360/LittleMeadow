// What happens when the player uses the selected item on the world: tools, seeds, harvesting,
// eating and examining. The target is the tile the player faces, or the hovered tile when the
// mouse is in use and within one tile of the player.

import { TILE } from '../config.js';
import { ITEMS } from '../data/items.js';
import { TOOLS } from '../data/tuning.js';
import { PAL } from '../rendering/palette.js';

// Tile offsets per facing index (down, left, right, up).
const FACING_DX = [0, -1, 1, 0];
const FACING_DY = [1, 0, 0, -1];

export class ToolSystem {
  constructor(game) {
    this.game = game;
    this.cooldown = 0;
    this.tx = 0;
    this.ty = 0;
  }

  update(dt, input) {
    const game = this.game;
    if (this.cooldown > 0) this.cooldown -= dt;
    if (this.updateTarget(input)) game.dirty = true;
    if (game.player.action) return;

    const m = input.mouse;
    if (input.wasPressed('use') || m.leftPressed) this.use();
    else if (input.wasPressed('interact')) this.interact();
    else if (m.rightPressed) this.secondary();
  }

  // Returns true if the target tile moved.
  updateTarget(input) {
    const { player, camera } = this.game;
    const ptx = player.tileX, pty = player.tileY;
    let tx = ptx + FACING_DX[player.facing], ty = pty + FACING_DY[player.facing];
    const m = input.mouse;
    if (input.usingMouse && m.inside) {
      const mtx = Math.floor((m.x + camera.x) / TILE), mty = Math.floor((m.y + camera.y) / TILE);
      if (Math.abs(mtx - ptx) <= 1 && Math.abs(mty - pty) <= 1) {
        tx = mtx;
        ty = mty;
      }
    }
    if (tx === this.tx && ty === this.ty) return false;
    this.tx = tx;
    this.ty = ty;
    return true;
  }

  faceTarget() {
    const p = this.game.player;
    const dx = this.tx - p.tileX, dy = this.ty - p.tileY;
    if (dx === 0 && dy === 0) return;
    if (Math.abs(dx) >= Math.abs(dy)) p.facing = dx < 0 ? 1 : 2;
    else p.facing = dy < 0 ? 3 : 0;
  }

  use() {
    if (this.cooldown > 0) return;
    const { game } = this;
    const { map, farming, inventory } = game;
    const { tx, ty } = this;
    this.faceTarget();
    game.dirty = true;

    const npc = game.npcs.at(map.id, tx, ty);
    if (npc) {
      game.talkTo(npc);
      return;
    }
    const crop = farming.cropAtTile(map, tx, ty);
    if (crop && farming.isMature(crop)) {
      this.harvest(crop);
      return;
    }
    const item = inventory.selectedItem;
    if (!item) return;
    if (item.tool) this.swing(item.tool, inventory.selectedSlot);
    else if (item.seed) this.plant(item);
    else if (item.energy) game.hud.toast('Right-click to eat it.');
  }

  interact() {
    const { game } = this;
    const { map, farming } = game;
    const { tx, ty } = this;
    const npc = game.npcs.at(map.id, tx, ty);
    if (npc) {
      this.faceTarget();
      game.talkTo(npc);
      return;
    }
    const crop = farming.cropAtTile(map, tx, ty);
    if (crop && farming.isMature(crop)) {
      this.faceTarget();
      this.harvest(crop);
      return;
    }
    if (!map.inBounds(tx, ty)) return;
    const obj = map.objectAt[map.index(tx, ty)];
    if (!obj) return;
    this.faceTarget();
    game.dirty = true;
    const use = obj.def.use;
    if (use && tx === obj.x + use.dx && ty === obj.y + use.dy) game.useObject(use.action, obj);
    else if (obj.def.examine) game.hud.toast(obj.def.examine);
  }

  // True if E would do something at the target (used to let right click interact too).
  hasInteraction() {
    const { map } = this.game;
    const { tx, ty } = this;
    if (!map.inBounds(tx, ty)) return false;
    if (this.game.npcs.at(map.id, tx, ty)) return true;
    const obj = map.objectAt[map.index(tx, ty)];
    return !!(obj && (obj.def.use || obj.def.examine));
  }

  // Right click: interact with doors, boxes and signs, otherwise eat the selected item if edible.
  secondary() {
    const { game } = this;
    const { player, inventory, hud } = game;
    if (this.hasInteraction()) {
      this.interact();
      return;
    }
    const item = inventory.selectedItem;
    if (!item || !item.energy) return;
    if (player.energy >= player.maxEnergy) {
      hud.toast('You\'re already full of energy.');
    } else {
      player.energy = Math.min(player.maxEnergy, player.energy + item.energy);
      inventory.removeAt(inventory.selected);
      game.effects.float(`+${item.energy} energy`, player.x, player.y - 28, PAL.leafLight);
    }
    game.dirty = true;
  }

  swing(tool, slot) {
    const { game } = this;
    const { player, hud } = game;
    const t = TOOLS[tool];
    if (player.energy < t.energy) {
      hud.toast('Too tired to work. Rest until tomorrow (N).');
      game.effects.float('...', player.x, player.y - 28, PAL.waterLight);
      return;
    }
    player.startAction(tool, t.cooldown);
    this.cooldown = t.cooldown;
    let worked = false;
    if (tool === 'hoe') worked = this.hoe();
    else if (tool === 'can') worked = this.waterTile(slot);
    else worked = this.hit(tool);
    // Energy is only spent when the swing actually did something.
    if (worked) player.energy = Math.max(0, player.energy - t.energy);
  }

  hoe() {
    const { game } = this;
    const { map, farming } = game;
    const { tx, ty } = this;
    if (!farming.canTill(map, tx, ty)) {
      if (map.inBounds(tx, ty) && !map.tileAt(tx, ty).tillable && !map.objectAt[map.index(tx, ty)]) {
        game.hud.toast('Only the field soil can be tilled.');
      }
      return false;
    }
    farming.till(map, tx, ty);
    game.renderer.redrawTile(map, tx, ty);
    return true;
  }

  waterTile(slot) {
    const { game } = this;
    const { map, farming, hud } = game;
    const { tx, ty } = this;
    const cap = TOOLS.can.capacity;
    if (slot.water === undefined) slot.water = cap;
    if (map.tileAt(tx, ty).water) {
      slot.water = cap;
      hud.toast('Filled the watering can.');
      game.effects.float('Full!', tx * TILE + TILE / 2, ty * TILE, PAL.waterLight);
      return false;
    }
    if (!farming.canWater(map, tx, ty)) return false;
    if (slot.water <= 0) {
      hud.toast('The can is empty. Refill it at the pond.');
      return false;
    }
    slot.water--;
    farming.water(map, tx, ty);
    game.renderer.redrawTile(map, tx, ty);
    return true;
  }

  // Axe / pickaxe on the target tile's object.
  hit(tool) {
    const { game } = this;
    const { map, inventory, hud, effects } = game;
    const { tx, ty } = this;
    if (!map.inBounds(tx, ty)) return false;
    const obj = map.objectAt[map.index(tx, ty)];
    if (!obj) return false;
    const br = obj.def.breakable;
    if (!br || br.tool !== tool) {
      if (obj.def.hint) hud.toast(obj.def.hint);
      return false;
    }
    for (const [id, qty] of br.drops) {
      if (!inventory.canAdd(id, qty)) {
        hud.toast('Your bag is full.');
        return false;
      }
    }
    effects.shake(obj);
    obj.hits = (obj.hits || 0) + 1;
    if (obj.hits < br.hits) return true;

    map.removeObject(obj);
    if (br.becomes) map.addObject(br.becomes, obj.x, obj.y);
    let y = obj.py - 20;
    for (const [id, qty] of br.drops) {
      inventory.add(id, qty);
      effects.float(`+${qty} ${ITEMS[id].name}`, obj.px, y, PAL.cream);
      y -= 9;
    }
    return true;
  }

  plant(item) {
    const { game } = this;
    const { map, farming, inventory, hud } = game;
    const { tx, ty } = this;
    if (farming.canPlant(map, tx, ty)) {
      farming.plant(map, tx, ty, item.seed);
      inventory.removeAt(inventory.selected);
    } else if (map.inBounds(tx, ty) && !map.soil[map.index(tx, ty)]) {
      hud.toast('Till the soil with the hoe first.');
    }
  }

  harvest(crop) {
    const { game } = this;
    const { map, farming, inventory, hud, effects } = game;
    const id = crop.def.harvestItem;
    if (!inventory.canAdd(id, 1)) {
      hud.toast('Your bag is full.');
      return;
    }
    farming.harvest(map, crop);
    inventory.add(id, 1);
    effects.float(`+1 ${ITEMS[id].name}`, crop.px, crop.py - 22, PAL.sun);
    game.dirty = true;
  }
}
