// A centred panel with an optional title/logo and message, and a vertical list of choices.
// Used for the title screen, the pause menu and yes/no prompts. Keyboard: W/S or arrows to
// move, E / Space / Enter to choose, Esc to cancel. Mouse: hover and click.

import { VIEW_W, VIEW_H } from '../config.js';
import { PAL } from '../rendering/palette.js';
import { LINE_H } from '../rendering/Font.js';

const ITEM_H = 12;
const PAD = 8;

export function confirmPressed(input) {
  return input.wasPressed('interact') || input.wasPressed('use') || input.wasPressed('confirm');
}

export class MenuBox {
  // items: [{ label, action, disabled? }]; onCancel: called on Esc (null = Esc does nothing).
  constructor(kit, { title = '', text = '', items, onCancel = null, logo = false, width = 140, y = null, dim = true }) {
    this.kit = kit;
    this.title = title;
    this.items = items;
    this.onCancel = onCancel;
    this.logo = logo;
    this.dim = dim;
    const font = kit.font;
    this.cursor = Math.max(0, items.findIndex((it) => !it.disabled));

    let w = width;
    for (const it of items) w = Math.max(w, font.measure(it.label) + PAD * 2 + 8);
    this.lines = text ? font.wrap(text, w - PAD * 2) : [];
    this.w = w;
    const titleH = logo ? 26 : title ? 12 : 0;
    const textH = this.lines.length ? this.lines.length * LINE_H + 4 : 0;
    this.h = PAD + titleH + textH + items.length * ITEM_H + PAD - 2;
    this.x = Math.floor((VIEW_W - w) / 2);
    this.y = y === null ? Math.floor((VIEW_H - this.h) / 2) : y;
    this.textY = this.y + PAD + titleH;
    this.itemsY = this.textY + textH;
  }

  itemAt(mx, my) {
    if (mx < this.x || mx >= this.x + this.w) return -1;
    const i = Math.floor((my - this.itemsY) / ITEM_H);
    return i >= 0 && i < this.items.length && my >= this.itemsY ? i : -1;
  }

  move(dir) {
    const n = this.items.length;
    for (let k = 1; k <= n; k++) {
      const i = (this.cursor + dir * k + n * k) % n;
      if (!this.items[i].disabled) {
        this.cursor = i;
        return;
      }
    }
  }

  choose(i, game) {
    const it = this.items[i];
    if (!it || it.disabled) return;
    if (game.audio) game.audio.play('select');
    it.action();
  }

  update(input, game) {
    const m = input.mouse;
    if (input.usingMouse && m.inside) {
      const i = this.itemAt(m.x, m.y);
      if (i >= 0 && !this.items[i].disabled) this.cursor = i;
      if (m.leftPressed && i >= 0) {
        this.choose(i, game);
        return;
      }
    }
    if (input.wasPressed('up')) this.move(-1);
    if (input.wasPressed('down')) this.move(1);
    if (confirmPressed(input)) this.choose(this.cursor, game);
    else if (input.wasPressed('menu') && this.onCancel) this.onCancel();
  }

  draw(ctx) {
    const { kit } = this;
    const { font } = kit;
    if (this.dim) {
      ctx.fillStyle = 'rgba(29, 21, 32, 0.45)';
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    }
    kit.panel(ctx, this.x, this.y, this.w, this.h);
    const cx = this.x + Math.floor(this.w / 2);
    if (this.logo) {
      font.drawScaled(ctx, this.title, cx, this.y + PAD, PAL.sun, 2, PAL.ink);
    } else if (this.title) {
      font.draw(ctx, this.title, cx, this.y + PAD, PAL.sun, 'center');
    }
    for (let i = 0; i < this.lines.length; i++) {
      font.draw(ctx, this.lines[i], cx, this.textY + i * LINE_H, PAL.cream, 'center');
    }
    for (let i = 0; i < this.items.length; i++) {
      const it = this.items[i];
      const y = this.itemsY + i * ITEM_H;
      const color = it.disabled ? PAL.soilLight : i === this.cursor ? PAL.sun : PAL.cream;
      if (i === this.cursor && !it.disabled) {
        ctx.fillStyle = PAL.barkDark;
        ctx.fillRect(this.x + 4, y - 2, this.w - 8, ITEM_H - 1);
        font.draw(ctx, '>', this.x + 8, y, PAL.sun);
      }
      font.draw(ctx, it.label, cx, y, color, 'center');
    }
  }
}
