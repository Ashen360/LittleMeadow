// In-game HUD: hotbar, energy bar, day label and a one-line toast for messages.

import { VIEW_W, VIEW_H } from '../config.js';
import { PAL } from '../rendering/palette.js';
import { INVENTORY } from '../data/tuning.js';
import { SLOT } from './UiKit.js';

const HOTBAR_X = Math.floor((VIEW_W - INVENTORY.hotbar * SLOT) / 2);
const HOTBAR_Y = VIEW_H - SLOT - 3;
const BAR_W = 10, BAR_H = 64;
const BAR_X = VIEW_W - BAR_W - 5, BAR_Y = VIEW_H - BAR_H - 5;

export class Hud {
  constructor(kit) {
    this.kit = kit;
    this.toastText = '';
    this.toastTime = 0;
  }

  toast(text, time = 2.2) {
    this.toastText = text;
    this.toastTime = time;
  }

  // Returns true when something visible changed (a toast expired).
  update(dt) {
    if (this.toastTime <= 0) return false;
    this.toastTime -= dt;
    return this.toastTime <= 0;
  }

  // Hotbar slot under the logical point (mx, my), or -1.
  slotAt(mx, my) {
    if (my < HOTBAR_Y || my >= HOTBAR_Y + SLOT || mx < HOTBAR_X) return -1;
    const i = Math.floor((mx - HOTBAR_X) / SLOT);
    return i < INVENTORY.hotbar ? i : -1;
  }

  draw(ctx, game) {
    const { kit } = this;
    const { font } = kit;
    const inv = game.inventory;

    // Hotbar.
    for (let i = 0; i < INVENTORY.hotbar; i++) {
      kit.slot(ctx, inv.slots[i], HOTBAR_X + i * SLOT, HOTBAR_Y, i === inv.selected);
    }

    // Energy bar: fills from the bottom; turns warm when low.
    const p = game.player;
    const k = p.energy / p.maxEnergy;
    kit.panel(ctx, BAR_X, BAR_Y, BAR_W, BAR_H);
    const inner = BAR_H - 6;
    const fill = Math.round(inner * k);
    ctx.fillStyle = PAL.plumDark;
    ctx.fillRect(BAR_X + 3, BAR_Y + 3, BAR_W - 6, inner);
    ctx.fillStyle = k > 0.5 ? PAL.leafLight : k > 0.2 ? PAL.sun : PAL.rose;
    ctx.fillRect(BAR_X + 3, BAR_Y + 3 + inner - fill, BAR_W - 6, fill);
    font.drawShadowed(ctx, 'E', BAR_X + BAR_W / 2, BAR_Y - 9, PAL.cream, PAL.ink, 'center');

    // Clock: date and time (labels are rebuilt by the clock only when they change).
    const clock = game.clock;
    const cw = Math.max(font.measure(clock.dateLabel), 40) + 12;
    const cx = VIEW_W - cw - 4;
    kit.panel(ctx, cx, 4, cw, 23);
    const mid = cx + (cw >> 1);
    font.draw(ctx, clock.dateLabel, mid, 7, PAL.cream, 'center');
    font.draw(ctx, clock.timeLabel, mid, 16, clock.stopped ? PAL.rose : PAL.sun, 'center');

    // Toast.
    if (this.toastTime > 0) {
      const w = font.measure(this.toastText) + 12;
      const x = Math.floor((VIEW_W - w) / 2), y = HOTBAR_Y - 18;
      kit.panel(ctx, x, y, w, 14);
      font.draw(ctx, this.toastText, x + 6, y + 4, PAL.cream);
    }
  }
}
