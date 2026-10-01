// Owns every system and runs the per-frame tick. Draws only when something changed.
// Menus (title, pause, bag, prompts) are modals: while one is open the world and clock pause.

import { MAX_STEP, MAX_RENDER_SCALE, TILE, VIEW_W, VIEW_H } from '../config.js';
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
import { Inventory, slotName } from '../player/Inventory.js';
import { Farming } from '../farming/Farming.js';
import { ToolSystem } from '../farming/Tools.js';
import { UiKit } from '../ui/UiKit.js';
import { Hud } from '../ui/Hud.js';
import { InventoryMenu } from '../ui/InventoryMenu.js';
import { MenuBox } from '../ui/MenuBox.js';
import { ShopMenu } from '../ui/ShopMenu.js';
import { ForgeMenu } from '../ui/ForgeMenu.js';
import { FurnitureMenu } from '../ui/FurnitureMenu.js';
import { HomeSystem } from '../home/Home.js';
import { DialogueBox } from '../ui/DialogueBox.js';
import { SettingsMenu } from '../ui/SettingsMenu.js';
import { KeybindMenu } from '../ui/KeybindMenu.js';
import { Audio } from '../audio/Audio.js';
import { loadSettings, saveSettings } from './Settings.js';
import { NpcManager } from '../npc/NpcManager.js';
import { chooseLine } from '../dialogue/Dialogue.js';
import { Input, DEFAULT_BINDINGS } from './Input.js';
import { GameLoop } from './GameLoop.js';
import { Debug } from './Debug.js';
import { Clock } from './Clock.js';
import { SaveManager, SAVE_VERSION } from './SaveManager.js';
import { FARM_MAP } from '../data/maps/farm.js';
import { TOWN_MAP } from '../data/maps/town.js';
import { HOME_MAP } from '../data/maps/home.js';
import { ITEMS } from '../data/items.js';
import { INVENTORY, STARTING_ITEMS, DEBUG_ITEMS, TOOLS, ECONOMY } from '../data/tuning.js';

const SLOT_ACTIONS = Array.from({ length: INVENTORY.hotbar }, (_, i) => `slot${i + 1}`);
const MAP_DEFS = { farm: FARM_MAP, town: TOWN_MAP, home: HOME_MAP };

export class Game {
  constructor(canvas, options = {}) {
    this.options = options;
    this.settings = loadSettings();
    this.audio = new Audio(this.settings);
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
    this.npcs = new NpcManager(this.atlas);
    this.entities = [this.player, ...this.npcs.list];
    this.frameDt = 0;
    this.farming = new Farming(this.atlas);
    this.tools = new ToolSystem(this);
    this.ui = new UiKit(this.atlas, this.font);
    this.hud = new Hud(this.ui);
    this.bag = new InventoryMenu(this.ui);
    this.shop = new ShopMenu(this.ui);
    this.forge = new ForgeMenu(this.ui);
    this.furnitureShop = new FurnitureMenu(this.ui, this.atlas);
    this.home = new HomeSystem(this);
    this.glowSprite = this.atlas.get('fx.glow');
    this.dialogue = new DialogueBox(this.ui, this.atlas);
    this.modals = [];
    this.cursorSprite = this.atlas.get('ui.cursor');
    this.changedTiles = [];
    this.started = false; // false on the title screen
    this.dirty = true;
    this.loop = new GameLoop((dt) => this.tick(dt));

    this.resetWorld();
    this.applySettings();
    this.audio.darkness = () => this.clock.darkness;
    this.openTitle();

    // Browsers only allow sound after a user gesture.
    const unlock = () => this.audio.unlock();
    window.addEventListener('keydown', unlock, { once: true });
    window.addEventListener('mousedown', unlock, { once: true });

    // Autosave when the tab is hidden or closed, so a refresh never loses progress.
    const autosave = () => { if (document.visibilityState === 'hidden') this.save(); };
    document.addEventListener('visibilitychange', autosave);
    window.addEventListener('pagehide', () => this.save());
  }

  get day() {
    return this.clock.day;
  }

  get money() {
    return this._money;
  }

  set money(v) {
    this._money = v;
    this.moneyLabel = `${v}g`;
    this.dirty = true;
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
    this.money = ECONOMY.startMoney;
    this.shipping = []; // [{ id, qty }] sold overnight
    this.player.energy = this.player.maxEnergy;
    this.player.action = null;
    this.npcs.loadState(null);
    this.npcs.resetDay(this.clock.minutes);
    this.wakeUp();
  }

  // Puts the player beside their bed in the farmhouse (or by the door if there's no bed).
  wakeUp() {
    const spot = this.home.wakeSpot(this.maps.home);
    this.placePlayer('home', spot.x, spot.y, spot.facing);
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
      money: this.money,
      shipping: this.shipping,
      npcs: this.npcs.saveState(),
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
    this.money = data.money ?? ECONOMY.startMoney;
    this.shipping = (data.shipping || []).filter((e) => ITEMS[e.id]).map((e) => ({ id: e.id, qty: e.qty }));
    this.npcs.loadState(data.npcs);
    this.npcs.resetDay(this.clock.minutes);
    const p = data.player;
    if (this.maps[p.map]) {
      this.placePlayer(p.map, 0, 0, p.facing);
      this.player.x = p.x;
      this.player.y = p.y;
      if (this.player.blockedAt(p.x, p.y, this.map)) this.wakeUp();
    } else {
      this.wakeUp();
    }
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
    this.hud.toastTime = 0; // an old message shouldn't linger over a menu
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

  // ------------------------------------------------------------------ settings

  // Applies (and stores) the current settings: key bindings, render scale, volumes.
  applySettings() {
    const s = this.settings;
    this.input.setBindings({ ...DEFAULT_BINDINGS, ...s.bindings });
    const scale = this.options.lowres ? 1 : s.renderScale || MAX_RENDER_SCALE;
    if (scale !== this.renderer.maxRenderScale) {
      this.renderer.maxRenderScale = scale;
      this.renderer.resize();
    }
    this.audio.applyVolumes();
    saveSettings(s);
    this.dirty = true;
  }

  openSettings() {
    this.openModal(new SettingsMenu(this.ui, this, !this.started));
  }

  openKeybinds() {
    this.openModal(new KeybindMenu(this.ui, this));
  }

  // Downloads the current save as a JSON file (a backup the browser can't clear).
  exportSave() {
    this.save();
    const text = SaveManager.exportText();
    if (!text) {
      this.ask('There is no save yet. Start a farm first!', [{ label: 'OK' }]);
      return;
    }
    const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `little-meadow-day-${this.clock.day}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  // Title screen only: replaces the stored save with one picked from disk.
  importSave() {
    const picker = document.createElement('input');
    picker.type = 'file';
    picker.accept = '.json,application/json';
    picker.addEventListener('change', () => {
      const file = picker.files && picker.files[0];
      if (!file) return;
      file.text().then((text) => {
        const err = SaveManager.importText(text);
        this.closeAllModals();
        this.openTitle();
        this.ask(err || 'Save imported! Choose Continue to play it.', [{ label: 'OK' }]);
      });
    });
    picker.click();
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
      { label: 'Settings', action: () => this.openSettings() },
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
        { label: 'Settings', action: () => this.openSettings() },
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

  // Actions triggered by the `use` spot of an object (see data/objects.js).
  useObject(action) {
    if (action === 'sleep') {
      this.ask('Go to bed and end the day?', [
        { label: 'Sleep', action: () => this.sleep() },
        { label: 'Not yet' },
      ]);
    } else if (action === 'shop') {
      const m = this.clock.minutes;
      if (m < ECONOMY.shopOpen || m >= ECONOMY.shopClose) {
        this.hud.toast('Fenn\'s Provisions is closed. Open 9 am to 5 pm.', 3);
      } else {
        this.shop.reset();
        this.openModal(this.shop);
        this.audio.play('door');
      }
    } else if (action === 'enter') {
      const e = this.maps.home.entry;
      this.audio.play('door');
      this.fade.start(() => this.placePlayer('home', e.x, e.y, e.facing));
    } else if (action === 'furniture') {
      const m = this.clock.minutes;
      if (m < ECONOMY.shopOpen || m >= ECONOMY.shopClose) {
        this.hud.toast('Willow & Wool is closed. Open 9 am to 5 pm.', 3);
      } else {
        this.furnitureShop.reset();
        this.openModal(this.furnitureShop);
        this.audio.play('door');
      }
    } else if (action === 'forge') {
      const m = this.clock.minutes;
      if (m < ECONOMY.shopOpen || m >= ECONOMY.shopClose) {
        this.hud.toast('The forge fire is banked for the night. Open 9 am to 5 pm.', 3);
      } else {
        this.forge.reset();
        this.openModal(this.forge);
        this.audio.play('door');
      }
    } else if (action === 'ship') {
      this.shipSelected();
    }
  }

  // Puts the selected stack in the shipping box. With empty hands, takes the last stack back.
  shipSelected() {
    const inv = this.inventory;
    const slot = inv.selectedSlot;
    if (!slot) {
      const last = this.shipping.pop();
      if (!last) {
        this.hud.toast('Hold something to sell, then use the box. It\'s sold overnight.', 3);
        return;
      }
      const left = inv.add(last.id, last.qty);
      if (left > 0) this.shipping.push({ id: last.id, qty: left });
      this.hud.toast(`Took back ${last.qty - left} ${ITEMS[last.id].name}.`);
      return;
    }
    const item = ITEMS[slot.id];
    if (!item.sellPrice) {
      this.hud.toast(`The ${item.name} can't be sold.`);
      return;
    }
    const entry = this.shipping.find((e) => e.id === slot.id);
    if (entry) entry.qty += slot.qty;
    else this.shipping.push({ id: slot.id, qty: slot.qty });
    this.hud.toast(`Shipped ${slot.qty} ${item.name} (${slot.qty * item.sellPrice}g, paid overnight).`, 3);
    this.effects.float(`${slot.qty * item.sellPrice}g`, this.player.x, this.player.y - 28, PAL.sun);
    inv.slots[inv.selected] = null;
    this.audio.play('ship');
  }

  talkTo(npc) {
    const p = this.player;
    // Face each other.
    const dx = p.x - npc.x, dy = p.y - npc.y;
    if (Math.abs(dx) > Math.abs(dy)) npc.facing = dx < 0 ? 1 : 2;
    else npc.facing = dy < 0 ? 3 : 0;
    const firstEver = npc.friendship === 0 && npc.talkedDay === 0;
    const firstToday = this.npcs.talked(npc, this.day);
    const text = chooseLine(npc, this.npcs.tier(npc), this.day, firstToday, firstEver);
    if (firstToday) this.effects.float('♥', npc.x, npc.y - 30, PAL.rose);
    this.dialogue.open(npc, text, this.settings.largeText);
    this.openModal(this.dialogue);
    this.audio.play('talk');
  }

  // Steps onto a warp tile: fade and move to the other map.
  warp(w) {
    const ox = this.player.tileX - w.x, oy = this.player.tileY - w.y;
    this.audio.play('door');
    this.fade.start(() => this.placePlayer(w.to, w.tx + ox, w.ty + oy, w.facing));
  }

  sleep() {
    this.audio.play('sleep');
    let sales = null;
    this.fade.start(() => { sales = this.endDay(); }, () => {
      if (sales) this.ask(sales, [{ label: 'Lovely' }]);
      this.hud.toast(`Good morning! ${this.clock.dateLabel}.`, 3);
    });
  }

  // Pays for shipped items. Returns a summary text, or null if nothing was shipped.
  sellShipping() {
    if (!this.shipping.length) return null;
    let total = 0;
    const lines = ['Shipped yesterday:'];
    for (const e of this.shipping) {
      const value = e.qty * ITEMS[e.id].sellPrice;
      total += value;
      lines.push(`${e.qty} ${ITEMS[e.id].name}: ${value}g`);
    }
    lines.push(`Total: ${total}g`);
    this.money += total;
    this.shipping = [];
    return lines.join('\n');
  }

  // Overnight: shipped items sell, crops grow, soil dries, energy refills, a new day starts at
  // 6:00, then autosave. Returns the sales summary (or null).
  endDay() {
    const sales = this.sellShipping();
    for (const map of Object.values(this.maps)) {
      this.farming.newDay(map, this.changedTiles);
      for (const i of this.changedTiles) this.renderer.redrawTile(map, i % map.w, Math.floor(i / map.w));
    }
    this.clock.newDay();
    this.npcs.resetDay(this.clock.minutes);
    this.player.energy = this.player.maxEnergy;
    this.player.action = null;
    this.wakeUp();
    this.save();
    return sales;
  }

  // ------------------------------------------------------------------ frame

  start() {
    this.loop.start();
  }

  tick(dt) {
    const t0 = performance.now();
    const input = this.input;
    this.frameDt = dt;

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
    if (changed) {
      this.dirty = true;
      const w = this.map.warpAt(this.player.tileX, this.player.tileY);
      if (w) {
        this.warp(w);
        return;
      }
    }
    this.tools.update(dt, input);

    const step = this.clock.update(dt);
    if (step) this.dirty = true;
    if (step === 'stopped') this.hud.toast('It\'s very late... time to head home to bed.', 5);
    if (this.npcs.update(dt, this)) this.dirty = true;
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
      this.hud.toast(s ? slotName(s) : 'Empty hands', 1.2);
      this.audio.play('select');
      this.dirty = true;
    }
  }

  // ------------------------------------------------------------------ drawing

  // Drawn on top of the ground, under every sprite.
  drawGroundOverlay(ctx, camX, camY) {
    if (!this.started || this.modal || this.player.action) return;
    const t = this.tools;
    if (!this.map.inBounds(t.tx, t.ty)) return;
    const item = this.inventory.selectedItem;
    if (this.map.indoor && item && item.furniture) {
      this.home.drawGhost(ctx, this.atlas, item, t.tx, t.ty, t.byMouse, camX, camY);
      return;
    }
    this.atlas.draw(ctx, this.cursorSprite, t.tx * TILE - camX, t.ty * TILE - camY);
  }

  drawUI(ctx, camX, camY) {
    // Evening light: a plum wash that deepens after 18:00. Indoors, lamps soften it and glow.
    const dark = this.clock.darkness;
    if (dark > 0) {
      let lights = 0;
      if (this.map.indoor) for (const o of this.map.objects) if (o.def.light) lights++;
      ctx.globalAlpha = dark * (lights ? 0.26 : 0.42);
      ctx.fillStyle = PAL.plumDark;
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
      if (lights) {
        ctx.globalAlpha = dark;
        for (const o of this.map.objects) {
          if (o.def.light) this.atlas.draw(ctx, this.glowSprite, o.px - camX, o.py - 14 - camY);
        }
      }
      ctx.globalAlpha = 1;
    }
    this.effects.draw(ctx, this.font, camX, camY);
    if (this.started) this.hud.draw(ctx, this);
    for (const m of this.modals) m.draw(ctx, this);
    this.fade.draw(ctx);
    this.debug.draw(ctx, this.font);
  }
}
