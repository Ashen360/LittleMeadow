// What happens when the player uses the selected item on the world: tools, seeds, harvesting,
// eating and examining. The target is the tile the player faces, or the hovered tile when the
// mouse is in use and within one tile of the player.

import { TILE } from '../config.js';
import { ITEMS } from '../data/items.js';
import { TOOLS, UPGRADES } from '../data/tuning.js';
import { PAL } from '../rendering/palette.js';

// Tile offsets per facing index (down, left, right, up).
const FACING_DX = [0, -1, 1, 0];
const FACING_DY = [1, 0, 0, -1];

// A tool's stats at an upgrade level: { energy, cooldown, power }.
export function toolStats(tool, level = 0) {
  const base = TOOLS[tool];
  const up = UPGRADES.stats[tool];
  if (!up) return { energy: base.energy, cooldown: base.cooldown, power: 1 };
  return {
    energy: up.energy ? up.energy[level] : base.energy,
    cooldown: up.cooldown ? up.cooldown[level] : base.cooldown,
    power: up.power ? up.power[level] : 1,
  };
}

export class ToolSystem {
  constructor(game) {
    this.game = game;
    this.cooldown = 0;
    this.holding = false; // the use button went down in the world and is still held
    this.tx = 0;
    this.ty = 0;
  }

  update(dt, input) {
    const game = this.game;
    if (this.cooldown > 0) this.cooldown -= dt;
    if (this.updateTarget(input)) game.dirty = true;
    if (game.player.action) return;

    const m = input.mouse;
    if (!input.isDown('use') && !m.left) this.holding = false;
    if (input.wasPressed('use') || m.leftPressed) {
      this.holding = true;
      this.use();
    } else if (input.wasPressed('interact')) {
      this.interact();
    } else if (m.rightPressed) {
      this.secondary();
    } else if (this.holding && this.cooldown <= 0 && game.settings.holdToRepeat) {
      // Holding the button keeps swinging (tools only, so it never re-opens menus).
      const item = game.inventory.selectedItem;
      if (item && item.tool) this.use();
    }
  }

  sound(name) {
    this.game.audio.play(name);
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
      this.sound('eat');
      game.effects.float(`+${item.energy} energy`, player.x, player.y - 28, PAL.leafLight);
    }
    game.dirty = true;
  }

  swing(tool, slot) {
    const { game } = this;
    const { player, hud } = game;
    const t = toolStats(tool, slot.level || 0);
    if (player.energy < t.energy) {
      hud.toast('Too tired to work. Get some sleep.');
      this.sound('deny');
      game.effects.float('...', player.x, player.y - 28, PAL.waterLight);
      return;
    }
    player.startAction(tool, t.cooldown);
    this.cooldown = t.cooldown;
    let worked = false;
    if (tool === 'hoe') worked = this.hoe();
    else if (tool === 'can') worked = this.waterTile(slot);
    else worked = this.hit(tool, t.power);
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
    game.effects.burst(tx * TILE + 8, ty * TILE + 12, PAL.dirtLight, 7);
    this.sound('hoe');
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
      game.effects.burst(tx * TILE + 8, ty * TILE + 10, PAL.waterLight, 8, { up: 60 });
      this.sound('fill');
      game.effects.float('Full!', tx * TILE + TILE / 2, ty * TILE, PAL.waterLight);
      return false;
    }
    if (!farming.canWater(map, tx, ty)) return false;
    if (slot.water <= 0) {
      hud.toast('The can is empty. Refill it at the pond.');
      this.sound('deny');
      return false;
    }
    slot.water--;
    farming.water(map, tx, ty);
    game.renderer.redrawTile(map, tx, ty);
    game.effects.burst(tx * TILE + 8, ty * TILE + 12, PAL.waterLight, 8, { up: 30, speed: 30 });
    this.sound('water');
    return true;
  }

  // Axe / pickaxe on the target tile's object. power = hits dealt (upgraded tools hit harder).
  hit(tool, power) {
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
    const chip = tool === 'axe' ? PAL.woodLight : PAL.stoneLight;
    effects.burst(obj.px, obj.py - 4, chip, 5, { up: 55 });
    if (obj.type === 'tree') effects.burst(obj.px, obj.py - 26, PAL.leafLight, 5, { up: 10, gravity: 60, life: 0.8 });
    obj.hits = (obj.hits || 0) + power;
    if (obj.hits < br.hits) {
      this.sound(tool === 'axe' ? 'chop' : 'pick');
      return true;
    }

    this.sound('break');
    effects.burst(obj.px, obj.py - 4, chip, 12, { up: 70, speed: 55 });
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
      game.effects.burst(tx * TILE + 8, ty * TILE + 12, PAL.soilLight, 4, { up: 25 });
      this.sound('plant');
      game.dirty = true;
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
    effects.burst(crop.px, crop.py - 8, PAL.sun, 6, { up: 60 });
    effects.burst(crop.px, crop.py - 6, PAL.leafLight, 4, { up: 40 });
    this.sound('harvest');
    effects.float(`+1 ${ITEMS[id].name}`, crop.px, crop.py - 22, PAL.sun);
    game.dirty = true;
  }
}
