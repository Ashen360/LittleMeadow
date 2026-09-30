// Settings: volumes, render scale, accessibility toggles, key bindings and save export/import.
// Up/down choose a row; left/right change a value; E / Space / Enter / click activate or cycle.

import { VIEW_W, VIEW_H } from '../config.js';
import { PAL } from '../rendering/palette.js';
import { confirmPressed } from './MenuBox.js';

const W = 220;
const ROW_H = 12;
const PAD = 8;
const SCALE_NAMES = ['Auto', '1x (fastest)', '2x', '3x (sharpest)'];

export class SettingsMenu {
  // fromTitle: import is only offered on the title screen (it replaces the current farm).
  constructor(kit, game, fromTitle) {
    this.kit = kit;
    this.cursor = 0;
    const s = game.settings;
    const onOff = (v) => (v ? 'On' : 'Off');
    const vol = (v) => (v === 0 ? 'Off' : `${v * 10}%`);
    const clamp = (v) => Math.max(0, Math.min(10, v));
    this.rows = [
      {
        label: 'Music', value: () => vol(s.musicVolume),
        change: (d) => { s.musicVolume = clamp(s.musicVolume + d); },
      },
      {
        label: 'Sound effects', value: () => vol(s.sfxVolume),
        change: (d) => { s.sfxVolume = clamp(s.sfxVolume + d); game.audio.play('select'); },
      },
      {
        label: 'Render scale', value: () => SCALE_NAMES[s.renderScale],
        change: (d) => { s.renderScale = (s.renderScale + d + 4) % 4; },
      },
      { label: 'Large text', value: () => onOff(s.largeText), change: () => { s.largeText = !s.largeText; } },
      { label: 'Hold to repeat tools', value: () => onOff(s.holdToRepeat), change: () => { s.holdToRepeat = !s.holdToRepeat; } },
      { label: 'Controls...', action: () => game.openKeybinds() },
      { label: 'Export save file', action: () => game.exportSave() },
    ];
    if (fromTitle) this.rows.push({ label: 'Import save file', action: () => game.importSave() });
    this.rows.push({ label: 'Back', action: () => game.closeModal(this) });
    this.game = game;
    this.h = 20 + this.rows.length * ROW_H + PAD;
    this.x = Math.floor((VIEW_W - W) / 2);
    this.y = Math.floor((VIEW_H - this.h) / 2);
  }

  rowAt(mx, my) {
    const i = Math.floor((my - (this.y + 20)) / ROW_H);
    return mx >= this.x && mx < this.x + W && my >= this.y + 20 && i < this.rows.length ? i : -1;
  }

  activate(row, dir) {
    if (row.change) {
      row.change(dir);
      this.game.applySettings();
    } else if (row.action) {
      row.action();
    }
  }

  update(input, game) {
    if (input.wasPressed('menu')) {
      game.closeModal(this);
      return;
    }
    const m = input.mouse;
    if (input.usingMouse && m.inside) {
      const i = this.rowAt(m.x, m.y);
      if (i >= 0) this.cursor = i;
      if (i >= 0 && (m.leftPressed || m.rightPressed)) {
        this.activate(this.rows[i], m.rightPressed ? -1 : 1);
        return;
      }
    }
    const n = this.rows.length;
    if (input.wasPressed('up')) this.cursor = (this.cursor + n - 1) % n;
    if (input.wasPressed('down')) this.cursor = (this.cursor + 1) % n;
    const row = this.rows[this.cursor];
    if (row.change && input.wasPressed('left')) this.activate(row, -1);
    else if (row.change && input.wasPressed('right')) this.activate(row, 1);
    else if (confirmPressed(input)) this.activate(row, 1);
  }

  draw(ctx) {
    const { kit } = this;
    const { font } = kit;
    ctx.fillStyle = 'rgba(29, 21, 32, 0.45)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    kit.panel(ctx, this.x, this.y, W, this.h);
    font.draw(ctx, 'Settings', this.x + W / 2, this.y + 6, PAL.sun, 'center');
    for (let i = 0; i < this.rows.length; i++) {
      const row = this.rows[i];
      const y = this.y + 20 + i * ROW_H;
      const sel = i === this.cursor;
      if (sel) {
        ctx.fillStyle = PAL.barkDark;
        ctx.fillRect(this.x + 4, y - 2, W - 8, ROW_H - 1);
      }
      font.draw(ctx, row.label, this.x + PAD, y, sel ? PAL.sun : PAL.cream);
      if (row.value) {
        const v = row.value();
        font.draw(ctx, sel ? `< ${v} >` : v, this.x + W - PAD, y, sel ? PAL.sun : PAL.peach, 'right');
      }
    }
  }
}
