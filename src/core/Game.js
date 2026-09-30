// Owns every system and runs the per-frame tick. Draws only when something changed.
// Menus (title, pause, bag, prompts) are modals: while one is open the world and clock pause.

import { MAX_STEP, TILE, VIEW_W, VIEW_H } from '../config.js';
import { Atlas } from '../rendering/Atlas.js';
import { buildPlaceholderArt } from '../rendering/PlaceholderArt.js';
import { Font } from '../rendering/Font.js';
import { Renderer } from '../rendering/Renderer.js';
import { Camera } from '../rendering/Camera.js';
import { Effects } from '../rendering/Effects.js';
import { Fade } from '../rendering/Fade.js';
import { PAL } from '../rendering/palette.js';
import { GameMap } from '../world/GameMap.js';
import { Player } from '../player/Player.js';
import { Inventory } from '../player/Inventory.js';
import { Farming } from '../farming/Farming.js';
import { ToolSystem } from '../farming/Tools.js';
import { UiKit } from '../ui/UiKit.js';
import { Hud } from '../ui/Hud.js';
import { InventoryMenu } from '../ui/InventoryMenu.js';
import { MenuBox } from '../ui/MenuBox.js';
import { Input } from './Input.js';
import { GameLoop } from './GameLoop.js';
import { Debug } from './Debug.js';
import { Clock } from './Clock.js';
import { SaveManager, SAVE_VERSION } from './SaveManager.js';
import { FARM_MAP } from '../data/maps/farm.js';
import { ITEMS } from '../data/items.js';
import { INVENTORY, STARTING_ITEMS, DEBUG_ITEMS, TOOLS } from '../data/tuning.js';

const SLOT_ACTIONS = Array.from({ length: INVENTORY.hotbar }, (_, i) => `slot${i + 1}`);
const MAP_DEFS = { farm: FARM_MAP };
const HOME = { map: 'farm', x: 6, y: 7, facing: 0 }; // where you wake up: outside the farmhouse door

export class Game {
  constructor(canvas, options = {}) {
    this.options = options;
    this.atlas = new Atlas();
    buildPlaceholderArt(this.atlas);
    this.font = new Font();
    this.renderer = new Renderer(canvas, this.atlas, options.lowres ? { maxRenderScale: 1 } : {});
    this.renderer.onResize = () => { this.dirty = true; };
    this.input = new Input(canvas);
    this.camera = new Camera();
    this.debug = new Debug(!!options.debug);
    this.effects = new Effects();
    this.fade = new Fade();
    this.player = new Player(this.atlas);
    this.entities = [this.player];
    this.farming = new Farming(this.atlas);
    this.tools = new ToolSystem(this);
    this.ui = new UiKit(this.atlas, this.font);
    this.hud = new Hud(this.ui);
    this.bag = new InventoryMenu(this.ui);
    this.modals = [];
    this.cursorSprite = this.atlas.get('ui.cursor');
    this.changedTiles = [];
    this.started = false; // false on the title screen
    this.dirty = true;
    this.loop = new GameLoop((dt) => this.tick(dt));

    this.resetWorld();
    this.openTitle();

    // Autosave when the tab is hidden or closed, so a refresh never loses progress.
    const autosave = () => { if (document.visibilityState === 'hidden') this.save(); };
    document.addEventListener('visibilitychange', autosave);
    window.addEventListener('pagehide', () => this.save());
  }

  get day() {
    return this.clock.day;
  }

  // ------------------------------------------------------------------ world state

  // A brand-new world: fresh maps, starting items, day 1 at 6:00.
  resetWorld() {
    this.maps = {};
    for (const [id, def] of Object.entries(MAP_DEFS)) {
      const map = new GameMap(def);
      this.renderer.bakeMap(map);
      this.maps[id] = map;
    }
    this.clock = new Clock();
    this.inventory = new Inventory();
    for (const [id, qty] of STARTING_ITEMS) this.inventory.add(id, qty);
    if (this.options.debug) for (const [id, qty] of DEBUG_ITEMS) this.inventory.add(id, qty);
    for (const s of this.inventory.slots) {
      if (s && ITEMS[s.id].tool === 'can') s.water = TOOLS.can.capacity;
    }
    this.player.energy = this.player.maxEnergy;
    this.player.action = null;
    this.placePlayer(HOME.map, HOME.x, HOME.y, HOME.facing);
  }

  placePlayer(mapId, tx, ty, facing) {
    this.map = this.maps[mapId];
    this.player.placeAtTile(tx, ty);
    this.player.facing = facing;
    this.player.stand();
    this.camera.follow(this.player.x, this.player.y - 10, this.map);
    this.dirty = true;
  }

  snapshot() {
    const p = this.player;
    const maps = {};
    for (const [id, map] of Object.entries(this.maps)) maps[id] = map.saveState();
    return {
      version: SAVE_VERSION,
      savedAt: new Date().toISOString(),
      clock: { day: this.clock.day, minutes: this.clock.minutes },
      player: { map: this.map.id, x: p.x, y: p.y, facing: p.facing, energy: p.energy },
      inventory: { selected: this.inventory.selected, slots: this.inventory.slots },
      maps,
    };
  }

  restore(data) {
    this.clock.set(data.clock.day, data.clock.minutes);
    for (const [id, state] of Object.entries(data.maps)) {
      const map = this.maps[id];
      if (!map) continue;
      map.loadState(state, this.farming);
      this.renderer.bakeMap(map);
    }
    const inv = this.inventory;
    inv.slots.fill(null);
    data.inventory.slots.forEach((s, i) => {
      if (s && ITEMS[s.id] && i < inv.slots.length) inv.slots[i] = { ...s };
    });
    inv.selected = Math.min(data.inventory.selected || 0, INVENTORY.hotbar - 1);
    const p = data.player;
    const mapId = this.maps[p.map] ? p.map : HOME.map;
    this.placePlayer(mapId, 0, 0, p.facing);
    this.player.x = p.x;
    this.player.y = p.y;
    if (this.player.blockedAt(p.x, p.y, this.map)) this.placePlayer(HOME.map, HOME.x, HOME.y, HOME.facing);
    this.player.energy = p.energy;
    this.camera.follow(this.player.x, this.player.y - 10, this.map);
  }

  save() {
    if (!this.started) return false;
    return SaveManager.write(this.snapshot());
  }

  // ------------------------------------------------------------------ modals

  get modal() {
    return this.modals.length ? this.modals[this.modals.length - 1] : null;
  }

  openModal(m) {
    this.modals.push(m);
    this.player.stand();
    this.dirty = true;
  }

  closeModal(m) {
    const k = this.modals.lastIndexOf(m);
    if (k >= 0) this.modals.splice(k, 1);
    this.dirty = true;
  }

  closeAllModals() {
    this.modals.length = 0;
    this.dirty = true;
  }

  // A yes/no style prompt. choices: [{ label, action }]; Esc = the last choice's label only.
  ask(text, choices) {
    const box = new MenuBox(this.ui, {
      text,
      items: choices.map((c) => ({ label: c.label, action: () => { this.closeModal(box); if (c.action) c.action(); } })),
      onCancel: () => this.closeModal(box),
      width: 180,
    });
    this.openModal(box);
  }

  openTitle() {
    const hasSave = SaveManager.hasSave();
    const canSave = SaveManager.available();
    const items = [
      { label: 'Continue', disabled: !hasSave, action: () => this.continueGame() },
      {
        label: 'New game',
        action: () => {
          if (!hasSave) this.newGame();
          else this.ask('Start over? Your current farm will be replaced when the new game saves.', [
            { label: 'Start a new farm', action: () => this.newGame() },
            { label: 'Go back' },
          ]);
        },
      },
    ];
    this.titleMenu = new MenuBox(this.ui, {
      title: 'Little Meadow',
      logo: true,
      text: canSave ? 'A cozy little farm.' : 'Saving is off in this browser, so progress won\'t be kept.',
      items,
      width: 150,
      y: 70,
    });
    this.openModal(this.titleMenu);
  }

  openPause() {
    const box = new MenuBox(this.ui, {
      title: 'Paused',
      items: [
        { label: 'Resume', action: () => this.closeModal(box) },
        {
          label: 'Save and quit to title',
          action: () => {
            this.save();
            this.closeAllModals();
            this.fade.start(() => {
              this.started = false;
              this.resetWorld();
              this.openTitle();
            });
          },
        },
      ],
      onCancel: () => this.closeModal(box),
    });
    this.openModal(box);
  }

  newGame() {
    this.closeAllModals();
    this.fade.start(() => {
      this.resetWorld();
      this.started = true;
      this.save();
      this.hud.toast('Welcome to Little Meadow Farm!', 3);
    });
  }

  continueGame() {
    const data = SaveManager.load();
    if (!data) {
      this.ask('Sorry, the save couldn\'t be read.', [{ label: 'OK' }]);
      return;
    }
    this.closeAllModals();
    this.fade.start(() => {
      this.resetWorld();
      this.restore(data);
      this.started = true;
    });
  }

  // ------------------------------------------------------------------ days

  useDoor(action) {
    if (action === 'sleep') {
      this.ask('Go to bed and end the day?', [
        { label: 'Sleep', action: () => this.sleep() },
        { label: 'Not yet' },
      ]);
    }
  }

  sleep() {
    this.fade.start(() => this.endDay(), () => this.hud.toast(`Good morning! ${this.clock.dateLabel}.`, 3));
  }

  // Overnight: crops grow, soil dries, energy refills, a new day starts at 6:00, then autosave.
  endDay() {
    for (const map of Object.values(this.maps)) {
      this.farming.newDay(map, this.changedTiles);
      for (const i of this.changedTiles) this.renderer.redrawTile(map, i % map.w, Math.floor(i / map.w));
    }
    this.clock.newDay();
    this.player.energy = this.player.maxEnergy;
    this.player.action = null;
    this.placePlayer(HOME.map, HOME.x, HOME.y, HOME.facing);
    this.save();
  }

  // ------------------------------------------------------------------ frame

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

    const modal = this.modal;
    if (this.fade.active) {
      // Input is ignored while the screen fades.
    } else if (modal) {
      modal.update(input, this);
    } else if (input.wasPressed('menu')) {
      this.openPause();
    } else if (input.wasPressed('inventory')) {
      this.bag.reset(this.inventory);
      this.openModal(this.bag);
    } else {
      this.updateWorld(dt, input);
    }

    if (input.activity) this.dirty = true;
    if (this.effects.update(dt)) this.dirty = true;
    if (this.hud.update(dt)) this.dirty = true;
    if (this.fade.update(dt)) this.dirty = true;
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

  updateWorld(dt, input) {
    this.updateHotbar(input);
    if (this.options.debug && input.wasPressed('nextDay')) {
      this.sleep();
      return;
    }

    let changed = false;
    for (let remaining = dt; remaining > 0; remaining -= MAX_STEP) {
      if (this.player.update(Math.min(remaining, MAX_STEP), input, this.map)) changed = true;
    }
    if (changed) this.dirty = true;
    this.tools.update(dt, input);

    const step = this.clock.update(dt);
    if (step) this.dirty = true;
    if (step === 'stopped') this.hud.toast('It\'s very late... time to head home to bed.', 5);
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

  // ------------------------------------------------------------------ drawing

  // Drawn on top of the ground, under every sprite.
  drawGroundOverlay(ctx, camX, camY) {
    if (!this.started || this.modal || this.player.action) return;
    const t = this.tools;
    if (!this.map.inBounds(t.tx, t.ty)) return;
    this.atlas.draw(ctx, this.cursorSprite, t.tx * TILE - camX, t.ty * TILE - camY);
  }

  drawUI(ctx, camX, camY) {
    // Evening light: a plum wash that deepens after 18:00.
    const dark = this.clock.darkness;
    if (dark > 0) {
      ctx.globalAlpha = dark * 0.42;
      ctx.fillStyle = PAL.plumDark;
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
      ctx.globalAlpha = 1;
    }
    this.effects.draw(ctx, this.font, camX, camY);
    if (this.started) this.hud.draw(ctx, this);
    for (const m of this.modals) m.draw(ctx, this);
    this.fade.draw(ctx);
    this.debug.draw(ctx, this.font);
  }
}
