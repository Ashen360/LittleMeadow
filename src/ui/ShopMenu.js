// Fenn's Provisions: buy seeds. E / Space / Enter / click buys one; hold Shift for five.

import { VIEW_W, VIEW_H } from '../config.js';
import { PAL } from '../rendering/palette.js';
import { ITEMS } from '../data/items.js';
import { ECONOMY } from '../data/tuning.js';
import { confirmPressed } from './MenuBox.js';

const W = 210;
const ROW_H = 20;
const PAD = 6;

export class ShopMenu {
  constructor(kit) {
    this.kit = kit;
    this.cursor = 0;
    this.message = '';
    this.stock = ECONOMY.shopStock;
    this.h = 16 + this.stock.length * ROW_H + 40;
    this.x = Math.floor((VIEW_W - W) / 2);
    this.y = Math.floor((VIEW_H - this.h) / 2) - 10;
    this.listY = this.y + 16;
    this.infoId = null;
    this.infoLines = [];
  }

  reset() {
    this.cursor = 0;
    this.message = 'What can I get you, sprout?';
  }

  rowAt(mx, my) {
    if (mx < this.x || mx >= this.x + W || my < this.listY) return -1;
    const i = Math.floor((my - this.listY) / ROW_H);
    return i < this.stock.length ? i : -1;
  }

  update(input, game) {
    if (input.wasPressed('menu') || input.wasPressed('inventory')) {
      game.closeModal(this);
      return;
    }
    const bulk = input.isDown('bulk') ? 5 : 1;
    const m = input.mouse;
    if (input.usingMouse && m.inside) {
      const i = this.rowAt(m.x, m.y);
      if (i >= 0) this.cursor = i;
      if (m.leftPressed && i >= 0) {
        this.buy(game, bulk);
        return;
      }
    }
    const n = this.stock.length;
    if (input.wasPressed('up')) this.cursor = (this.cursor + n - 1) % n;
    if (input.wasPressed('down')) this.cursor = (this.cursor + 1) % n;
    if (confirmPressed(input)) this.buy(game, bulk);
  }

  buy(game, qty) {
    const id = this.stock[this.cursor];
    const item = ITEMS[id];
    const cost = item.price * qty;
    if (game.money < cost) {
      this.message = 'You don\'t have enough money for that.';
      if (game.audio) game.audio.play('deny');
    } else if (!game.inventory.canAdd(id, qty)) {
      this.message = 'Your bag is full.';
      if (game.audio) game.audio.play('deny');
    } else {
      game.money -= cost;
      game.inventory.add(id, qty);
      this.message = `Bought ${qty} ${item.name} for ${cost}g.`;
      if (game.audio) game.audio.play('buy');
    }
  }

  draw(ctx, game) {
    const { kit } = this;
    const { font } = kit;
    ctx.fillStyle = 'rgba(29, 21, 32, 0.45)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    kit.panel(ctx, this.x, this.y, W, this.h);
    font.draw(ctx, 'Fenn\'s Provisions', this.x + PAD, this.y + 5, PAL.sun);
    font.draw(ctx, game.moneyLabel, this.x + W - PAD, this.y + 5, PAL.sun, 'right');

    for (let i = 0; i < this.stock.length; i++) {
      const id = this.stock[i];
      const item = ITEMS[id];
      const y = this.listY + i * ROW_H;
      const sel = i === this.cursor;
      kit.slot(ctx, null, this.x + PAD, y, sel);
      kit.icon(ctx, id, this.x + PAD + 10, y + 10);
      const afford = game.money >= item.price;
      font.draw(ctx, item.name, this.x + PAD + 26, y + 7, sel ? PAL.sun : PAL.cream);
      font.draw(ctx, `${item.price}g`, this.x + W - PAD, y + 7, afford ? PAL.cream : PAL.rose, 'right');
      const owned = game.inventory.count(id);
      if (owned > 0) font.draw(ctx, `have ${owned}`, this.x + W - PAD - 30, y + 7, PAL.peach, 'right');
    }

    const id = this.stock[this.cursor];
    if (id !== this.infoId) {
      this.infoId = id;
      this.infoLines = font.wrap(ITEMS[id].desc, W - PAD * 2);
    }
    const iy = this.listY + this.stock.length * ROW_H + 3;
    font.draw(ctx, this.infoLines[0] || '', this.x + PAD, iy, PAL.cream);
    font.draw(ctx, this.message, this.x + PAD, iy + 11, PAL.peach);
    font.draw(ctx, 'E: buy 1   Shift+E: buy 5   Esc: leave', this.x + PAD, iy + 23, PAL.dirtLight);
  }
}
