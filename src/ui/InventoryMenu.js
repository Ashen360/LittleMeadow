// The bag: all inventory slots (the top row is the hotbar). Click or press E/Space on a slot to
// pick its item up, then on another slot to swap them. Movement keys move the cursor.
// A modal: Tab / I / Esc close it.

import { VIEW_W, VIEW_H } from '../config.js';
import { PAL } from '../rendering/palette.js';
import { ITEMS } from '../data/items.js';
import { INVENTORY } from '../data/tuning.js';
import { SLOT } from './UiKit.js';

const COLS = INVENTORY.hotbar;
const ROWS = Math.ceil(INVENTORY.size / COLS);
const PAD = 6;
const HOTBAR_GAP = 4;
const PANEL_W = COLS * SLOT + PAD * 2;
const PANEL_H = 14 + ROWS * SLOT + HOTBAR_GAP + 32 + 10;
const PANEL_X = Math.floor((VIEW_W - PANEL_W) / 2);
const PANEL_Y = Math.floor((VIEW_H - PANEL_H) / 2);
const GRID_X = PANEL_X + PAD;
const GRID_Y = PANEL_Y + 14;
const INFO_Y = GRID_Y + ROWS * SLOT + HOTBAR_GAP + 3;

export class InventoryMenu {
  constructor(kit) {
    this.kit = kit;
    this.cursor = 0;
    this.held = -1;      // slot index picked up, or -1
    this.infoId = null;  // item whose description is wrapped in infoLines
    this.infoLines = [];
  }

  // Called when the bag opens.
  reset(inventory) {
    this.held = -1;
    this.cursor = inventory.selected;
  }

  slotX(i) {
    return GRID_X + (i % COLS) * SLOT;
  }

  slotY(i) {
    const row = Math.floor(i / COLS);
    return GRID_Y + row * SLOT + (row > 0 ? HOTBAR_GAP : 0);
  }

  slotAt(mx, my, count) {
    for (let i = 0; i < count; i++) {
      const x = this.slotX(i), y = this.slotY(i);
      if (mx >= x && mx < x + SLOT && my >= y && my < y + SLOT) return i;
    }
    return -1;
  }

  update(input, game) {
    if (input.wasPressed('inventory') || input.wasPressed('menu')) {
      game.closeModal(this);
      return;
    }
    const inv = game.inventory;
    const n = inv.slots.length;
    const m = input.mouse;
    if (input.usingMouse && m.inside) {
      const i = this.slotAt(m.x, m.y, n);
      if (i >= 0) this.cursor = i;
      if (m.leftPressed && i >= 0) this.act(inv);
    }
    let c = this.cursor;
    if (input.wasPressed('left') && c % COLS > 0) c--;
    if (input.wasPressed('right') && c % COLS < COLS - 1 && c + 1 < n) c++;
    if (input.wasPressed('up') && c - COLS >= 0) c -= COLS;
    if (input.wasPressed('down') && c + COLS < n) c += COLS;
    this.cursor = c;
    if (input.wasPressed('interact') || input.wasPressed('use')) this.act(inv);
  }

  act(inv) {
    if (this.held < 0) {
      if (inv.slots[this.cursor]) this.held = this.cursor;
    } else {
      if (this.held !== this.cursor) inv.swap(this.held, this.cursor);
      this.held = -1;
    }
  }

  draw(ctx, game) {
    const inv = game.inventory;
    const { kit } = this;
    const { font } = kit;
    ctx.fillStyle = 'rgba(29, 21, 32, 0.55)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    kit.panel(ctx, PANEL_X, PANEL_Y, PANEL_W, PANEL_H);
    font.draw(ctx, 'Bag', PANEL_X + PAD, PANEL_Y + 4, PAL.sun);
    font.draw(ctx, 'Tab: close', PANEL_X + PANEL_W - PAD, PANEL_Y + 4, PAL.peach, 'right');

    for (let i = 0; i < inv.slots.length; i++) {
      kit.slot(ctx, inv.slots[i], this.slotX(i), this.slotY(i), i === this.cursor, i === this.held);
    }
    // The picked-up item follows the cursor.
    if (this.held >= 0) {
      const s = inv.slots[this.held];
      kit.icon(ctx, s.id, this.slotX(this.cursor) + SLOT / 2 - 3, this.slotY(this.cursor) + SLOT / 2 - 3);
    }

    // Item info for the slot under the cursor.
    const shown = inv.slots[this.held >= 0 ? this.held : this.cursor];
    const id = shown ? shown.id : null;
    if (id !== this.infoId) {
      this.infoId = id;
      this.infoLines = id ? font.wrap(ITEMS[id].desc, PANEL_W - PAD * 2) : [];
    }
    if (id) {
      font.draw(ctx, ITEMS[id].name, PANEL_X + PAD, INFO_Y, PAL.sun);
      for (let i = 0; i < this.infoLines.length && i < 2; i++) {
        font.draw(ctx, this.infoLines[i], PANEL_X + PAD, INFO_Y + 10 + i * 9, PAL.cream);
      }
    }
    font.draw(ctx, 'Click or E: pick up / swap', PANEL_X + PAD, PANEL_Y + PANEL_H - 11, PAL.peach);
  }
}
