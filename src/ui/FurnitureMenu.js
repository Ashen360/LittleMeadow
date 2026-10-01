// Willow & Wool Home Goods: furniture, floors and wallpaper. Tabs along the top (Left/Right or
// click), a scrolling list (Up/Down, wheel, hover) and a preview of the selected piece on your
// current floor. E / Space / Enter / click buys one into the bag. Esc leaves.

import { VIEW_W, VIEW_H, TILE } from '../config.js';
import { PAL } from '../rendering/palette.js';
import { ITEMS } from '../data/items.js';
import { SHOP_TABS, FURNITURE, DEFAULT_DECOR } from '../data/furniture.js';
import { confirmPressed } from './MenuBox.js';

const W = 312;
const PAD = 6;
const LIST_W = 196;
const ROW_H = 18;
const VISIBLE = 7;
const TAB_H = 12;
const PREVIEW_H = 54;

export class FurnitureMenu {
  constructor(kit, atlas) {
    this.kit = kit;
    this.atlas = atlas;
    this.tab = 0;
    this.cursor = 0;
    this.top = 0;
    this.message = '';
    this.h = 30 + VISIBLE * ROW_H + 26;
    this.x = Math.floor((VIEW_W - W) / 2);
    this.y = Math.floor((VIEW_H - this.h) / 2);
    this.tabY = this.y + 15;
    this.listY = this.y + 30;
    this.px = this.x + LIST_W + 4;            // preview column
    this.pw = W - LIST_W - 4 - PAD;
    // Tab buttons, laid out once.
    let tx = this.x + PAD;
    this.tabs = SHOP_TABS.map((t) => {
      const w = kit.font.measure(t.label) + 10;
      const tab = { label: t.label, items: t.items, x: tx, w };
      tx += w + 3;
      return tab;
    });
    this.infoId = null;
    this.infoLines = [];
  }

  reset() {
    this.tab = 0;
    this.cursor = 0;
    this.top = 0;
    this.message = 'Make yourself at home. Have a look around!';
  }

  get items() {
    return this.tabs[this.tab].items;
  }

  setTab(i) {
    this.tab = (i + this.tabs.length) % this.tabs.length;
    this.cursor = 0;
    this.top = 0;
  }

  setCursor(i) {
    const n = this.items.length;
    this.cursor = (i + n) % n;
    if (this.cursor < this.top) this.top = this.cursor;
    if (this.cursor >= this.top + VISIBLE) this.top = this.cursor - VISIBLE + 1;
  }

  update(input, game) {
    if (input.wasPressed('menu') || input.wasPressed('inventory')) {
      game.closeModal(this);
      return;
    }
    const m = input.mouse;
    if (input.usingMouse && m.inside) {
      if (m.leftPressed && m.y >= this.tabY && m.y < this.tabY + TAB_H) {
        const i = this.tabs.findIndex((t) => m.x >= t.x && m.x < t.x + t.w);
        if (i >= 0) this.setTab(i);
        return;
      }
      if (m.x >= this.x && m.x < this.x + LIST_W && m.y >= this.listY && m.y < this.listY + VISIBLE * ROW_H) {
        const i = this.top + Math.floor((m.y - this.listY) / ROW_H);
        if (i < this.items.length) {
          this.cursor = i;
          if (m.leftPressed) this.buy(game);
        }
      }
    }
    if (input.wheel !== 0) this.setCursor(this.cursor + Math.sign(input.wheel));
    if (input.wasPressed('left')) this.setTab(this.tab - 1);
    if (input.wasPressed('right')) this.setTab(this.tab + 1);
    if (input.wasPressed('up')) this.setCursor(this.cursor - 1);
    if (input.wasPressed('down')) this.setCursor(this.cursor + 1);
    if (confirmPressed(input)) this.buy(game);
  }

  buy(game) {
    const id = this.items[this.cursor];
    const item = ITEMS[id];
    if (game.money < item.price) {
      this.message = 'You\'ll need a little more money for that.';
      game.audio.play('deny');
    } else if (!game.inventory.canAdd(id, 1)) {
      this.message = 'Your bag is full.';
      game.audio.play('deny');
    } else {
      game.money -= item.price;
      game.inventory.add(id, 1);
      this.message = item.furniture
        ? `The ${item.name} is in your bag. Place it at home!`
        : `${item.name} is in your bag. Use it at home to put it up.`;
      game.audio.play('buy');
    }
  }

  draw(ctx, game) {
    const { kit } = this;
    const { font } = kit;
    ctx.fillStyle = 'rgba(29, 21, 32, 0.45)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    kit.panel(ctx, this.x, this.y, W, this.h);
    font.draw(ctx, 'Willow & Wool Home Goods', this.x + PAD, this.y + 5, PAL.sun);
    font.draw(ctx, game.moneyLabel, this.x + W - PAD, this.y + 5, PAL.sun, 'right');

    for (let i = 0; i < this.tabs.length; i++) {
      const t = this.tabs[i];
      const on = i === this.tab;
      ctx.fillStyle = PAL.ink;
      ctx.fillRect(t.x, this.tabY, t.w, TAB_H);
      ctx.fillStyle = on ? PAL.woodLight : PAL.barkDark;
      ctx.fillRect(t.x + 1, this.tabY + 1, t.w - 2, TAB_H - 1);
      font.draw(ctx, t.label, t.x + t.w / 2, this.tabY + 3, on ? PAL.ink : PAL.dirtLight, 'center');
    }

    const items = this.items;
    for (let row = 0; row < VISIBLE; row++) {
      const i = this.top + row;
      if (i >= items.length) break;
      const id = items[i];
      const item = ITEMS[id];
      const y = this.listY + row * ROW_H;
      const sel = i === this.cursor;
      if (sel) {
        ctx.fillStyle = PAL.wood;
        ctx.fillRect(this.x + 3, y, LIST_W - 3, ROW_H - 1);
      }
      kit.icon(ctx, id, this.x + PAD + 8, y + 9);
      font.draw(ctx, item.name, this.x + PAD + 20, y + 6, sel ? PAL.sun : PAL.cream);
      font.draw(ctx, `${item.price}g`, this.x + LIST_W - 4, y + 6, game.money >= item.price ? PAL.cream : PAL.rose, 'right');
    }
    // Scroll hints.
    ctx.fillStyle = PAL.dirtLight;
    if (this.top > 0) ctx.fillRect(this.x + LIST_W - 12, this.listY - 2, 5, 1);
    if (this.top + VISIBLE < items.length) ctx.fillRect(this.x + LIST_W - 12, this.listY + VISIBLE * ROW_H, 5, 1);

    this.drawPreview(ctx, game, items[this.cursor]);

    const fy = this.listY + VISIBLE * ROW_H + 3;
    font.draw(ctx, this.message, this.x + PAD, fy, PAL.peach);
    font.draw(ctx, 'E: buy   Left/Right: tabs   Esc: leave', this.x + PAD, fy + 11, PAL.dirtLight);
  }

  // The selected piece standing on your current floor, or a sample of a floor / wallpaper.
  drawPreview(ctx, game, id) {
    const { font } = this.kit;
    const a = this.atlas;
    const item = ITEMS[id];
    const decor = (game.maps.home && game.maps.home.decor) || DEFAULT_DECOR;
    const x = this.px, y = this.listY, w = this.pw;
    ctx.fillStyle = PAL.ink;
    ctx.fillRect(x, y, w, PREVIEW_H);
    ctx.save();
    ctx.beginPath();
    ctx.rect(x + 1, y + 1, w - 2, PREVIEW_H - 2);
    ctx.clip();
    const floor = a.get(`tile.floor.${item.floor || decor.floor}`);
    const wall = a.get(`tile.wall.${item.wallpaper || decor.wall}`);
    // Two rows of wall, then floor.
    for (let ty = 0; ty < 4; ty++) {
      for (let tx = 0; tx < 7; tx++) {
        const px = x + 1 + tx * TILE, py = y + 1 + ty * TILE - 10;
        if (ty < 2) a.draw(ctx, wall, px, py);
        else a.draw(ctx, floor, px, py);
        if (ty === 1) a.draw(ctx, a.get('edge.baseboard'), px, py);
        if (ty === 2) a.draw(ctx, a.get('edge.wallshadow'), px, py);
      }
    }
    if (item.furniture) {
      const f = FURNITURE[item.furniture];
      const sprite = a.get(`furn.${item.furniture}`);
      // Stand it on the floor, centred; rugs lie a little lower.
      a.draw(ctx, sprite, x + Math.floor(w / 2), y + PREVIEW_H - (f.flat ? 2 : 6));
    }
    ctx.restore();

    if (id !== this.infoId) {
      this.infoId = id;
      this.infoLines = font.wrap(item.desc, w);
    }
    let ty = y + PREVIEW_H + 4;
    if (item.furniture) {
      const f = FURNITURE[item.furniture];
      const kind = f.flat ? 'rug' : f.use === 'sleep' ? 'bed' : f.light ? 'light' : 'furniture';
      font.draw(ctx, `${f.w} x ${f.h} tiles · ${kind}`, x, ty, PAL.dirtLight);
      ty += 10;
    }
    for (let i = 0; i < this.infoLines.length && i < 5; i++) {
      font.draw(ctx, this.infoLines[i], x, ty + i * 9, PAL.cream);
    }
    const have = game.inventory.count(id);
    if (have > 0) font.draw(ctx, `In your bag: ${have}`, x, y + VISIBLE * ROW_H - 8, PAL.peach);
  }
}
