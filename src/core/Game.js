// Owns every system and runs the per-frame tick. Draws only when something changed.

import { MAX_STEP, TILE } from '../config.js';
import { Atlas } from '../rendering/Atlas.js';
import { buildPlaceholderArt } from '../rendering/PlaceholderArt.js';
import { Font } from '../rendering/Font.js';
import { Renderer } from '../rendering/Renderer.js';
import { Camera } from '../rendering/Camera.js';
import { Effects } from '../rendering/Effects.js';
import { GameMap } from '../world/GameMap.js';
import { Player } from '../player/Player.js';
import { Inventory } from '../player/Inventory.js';
import { Farming } from '../farming/Farming.js';
import { ToolSystem } from '../farming/Tools.js';
import { UiKit } from '../ui/UiKit.js';
import { Hud } from '../ui/Hud.js';
import { InventoryMenu } from '../ui/InventoryMenu.js';
import { Input } from './Input.js';
import { GameLoop } from './GameLoop.js';
import { Debug } from './Debug.js';
import { FARM_MAP } from '../data/maps/farm.js';
import { ITEMS } from '../data/items.js';
import { INVENTORY, STARTING_ITEMS, DEBUG_ITEMS, TOOLS } from '../data/tuning.js';

const SLOT_ACTIONS = Array.from({ length: INVENTORY.hotbar }, (_, i) => `slot${i + 1}`);

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
    this.effects = new Effects();
    this.player = new Player(this.atlas);
    this.entities = [this.player];
    this.farming = new Farming(this.atlas);
    this.tools = new ToolSystem(this);
    this.ui = new UiKit(this.atlas, this.font);
    this.hud = new Hud(this.ui);
    this.menu = new InventoryMenu(this.ui);
    this.cursorSprite = this.atlas.get('ui.cursor');
    this.day = 1;
    this.changedTiles = [];
    this.map = null;
    this.dirty = true;
    this.loop = new GameLoop((dt) => this.tick(dt));

    this.inventory = new Inventory();
    for (const [id, qty] of STARTING_ITEMS) this.inventory.add(id, qty);
    if (options.debug) for (const [id, qty] of DEBUG_ITEMS) this.inventory.add(id, qty);
    for (const s of this.inventory.slots) {
      if (s && ITEMS[s.id].tool === 'can') s.water = TOOLS.can.capacity;
    }

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
    if (input.wasPressed('inventory') || (this.menu.open && input.wasPressed('menu'))) {
      this.menu.toggle(this.inventory);
      this.player.stand();
      this.dirty = true;
    }

    if (this.menu.open) {
      this.menu.update(input, this.inventory);
    } else {
      this.updateHotbar(input);
      if (input.wasPressed('nextDay')) this.nextDay();

      let changed = false;
      for (let remaining = dt; remaining > 0; remaining -= MAX_STEP) {
        if (this.player.update(Math.min(remaining, MAX_STEP), input, this.map)) changed = true;
      }
      if (changed) this.dirty = true;
      this.tools.update(dt, input);
    }
    if (input.activity) this.dirty = true;
    if (this.effects.update(dt)) this.dirty = true;
    if (this.hud.update(dt)) this.dirty = true;
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

  // Number keys, the mouse wheel and clicks on the hotbar pick the selected slot.
  updateHotbar(input) {
    const inv = this.inventory;
    const n = INVENTORY.hotbar;
    let sel = inv.selected;
    for (let i = 0; i < n; i++) if (input.wasPressed(SLOT_ACTIONS[i])) sel = i;
    if (input.wheel !== 0) sel = (sel + Math.sign(input.wheel) + n) % n;
    const m = input.mouse;
    if (m.leftPressed) {
      const i = this.hud.slotAt(m.x, m.y);
      if (i >= 0) {
        sel = i;
        m.leftPressed = false; // the click selected a slot; don't also use the tool
      }
    }
    if (sel !== inv.selected) {
      inv.selected = sel;
      const s = inv.slots[sel];
      this.hud.toast(s ? ITEMS[s.id].name : 'Empty hands', 1.2);
      this.dirty = true;
    }
  }

  // Temporary (Phase 1): skip to the next morning. Phase 2 replaces this with sleeping.
  nextDay() {
    const map = this.map;
    this.day++;
    this.farming.newDay(map, this.changedTiles);
    for (const i of this.changedTiles) this.renderer.redrawTile(map, i % map.w, Math.floor(i / map.w));
    this.player.energy = this.player.maxEnergy;
    this.hud.toast(`Day ${this.day}. A fresh morning on the farm.`);
    this.dirty = true;
  }

  // Drawn on top of the ground, under every sprite.
  drawGroundOverlay(ctx, camX, camY) {
    if (this.menu.open || this.player.action) return;
    const t = this.tools;
    if (!this.map.inBounds(t.tx, t.ty)) return;
    this.atlas.draw(ctx, this.cursorSprite, t.tx * TILE - camX, t.ty * TILE - camY);
  }

  drawUI(ctx, camX, camY) {
    this.effects.draw(ctx, this.font, camX, camY);
    this.hud.draw(ctx, this);
    if (this.menu.open) this.menu.draw(ctx, this.inventory);
    this.debug.draw(ctx, this.font);
  }
}
