// Rebinding: pick an action, press the new key. The new key replaces the action's first key;
// if another action used it, that action loses it. Esc cancels a pending rebind.

import { VIEW_W, VIEW_H } from '../config.js';
import { PAL } from '../rendering/palette.js';
import { DEFAULT_BINDINGS } from '../core/Input.js';
import { confirmPressed } from './MenuBox.js';

const ACTIONS = [
  ['up', 'Move up'], ['down', 'Move down'], ['left', 'Move left'], ['right', 'Move right'],
  ['use', 'Use tool / item'], ['interact', 'Talk / interact'], ['inventory', 'Open bag'],
];
const W = 220;
const ROW_H = 12;
const PAD = 8;

export function keyName(code) {
  if (!code) return '-';
  if (code.startsWith('Key')) return code.slice(3);
  if (code.startsWith('Digit')) return code.slice(5);
  if (code.startsWith('Arrow')) return code.slice(5);
  if (code.startsWith('Numpad')) return `Num ${code.slice(6)}`;
  return code;
}

export class KeybindMenu {
  constructor(kit, game) {
    this.kit = kit;
    this.game = game;
    this.cursor = 0;
    this.waiting = false;
    this.rows = ACTIONS.length + 2; // + reset + back
    this.h = 34 + this.rows * ROW_H;
    this.x = Math.floor((VIEW_W - W) / 2);
    this.y = Math.floor((VIEW_H - this.h) / 2);
  }

  bindings() {
    return this.game.input.bindings;
  }

  rowAt(mx, my) {
    const i = Math.floor((my - (this.y + 20)) / ROW_H);
    return mx >= this.x && mx < this.x + W && my >= this.y + 20 && i < this.rows ? i : -1;
  }

  activate(i) {
    const game = this.game;
    if (i < ACTIONS.length) {
      this.waiting = true;
      game.input.captureNext((code) => {
        this.waiting = false;
        if (code !== 'Escape') this.rebind(ACTIONS[i][0], code);
        game.dirty = true;
      });
    } else if (i === ACTIONS.length) {
      game.settings.bindings = {};
      game.applySettings();
    } else {
      game.closeModal(this);
    }
  }

  rebind(action, code) {
    const game = this.game;
    const current = { ...DEFAULT_BINDINGS, ...game.settings.bindings };
    const out = { ...game.settings.bindings };
    for (const [a] of ACTIONS) {
      if (a !== action && current[a].includes(code)) out[a] = current[a].filter((c) => c !== code);
    }
    out[action] = [code, ...current[action].slice(1).filter((c) => c !== code)];
    game.settings.bindings = out;
    game.applySettings();
  }

  update(input, game) {
    if (this.waiting) return;
    if (input.wasPressed('menu')) {
      game.closeModal(this);
      return;
    }
    const m = input.mouse;
    if (input.usingMouse && m.inside) {
      const i = this.rowAt(m.x, m.y);
      if (i >= 0) this.cursor = i;
      if (i >= 0 && m.leftPressed) {
        this.activate(i);
        return;
      }
    }
    if (input.wasPressed('up')) this.cursor = (this.cursor + this.rows - 1) % this.rows;
    if (input.wasPressed('down')) this.cursor = (this.cursor + 1) % this.rows;
    if (confirmPressed(input)) this.activate(this.cursor);
  }

  draw(ctx) {
    const { kit } = this;
    const { font } = kit;
    ctx.fillStyle = 'rgba(29, 21, 32, 0.45)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    kit.panel(ctx, this.x, this.y, W, this.h);
    font.draw(ctx, 'Controls', this.x + W / 2, this.y + 6, PAL.sun, 'center');
    const b = this.bindings();
    for (let i = 0; i < this.rows; i++) {
      const y = this.y + 20 + i * ROW_H;
      const sel = i === this.cursor;
      if (sel) {
        ctx.fillStyle = PAL.barkDark;
        ctx.fillRect(this.x + 4, y - 2, W - 8, ROW_H - 1);
      }
      let label, value = '';
      if (i < ACTIONS.length) {
        const [action, name] = ACTIONS[i];
        label = name;
        value = sel && this.waiting ? 'press a key...' : b[action].map(keyName).join(' / ');
      } else {
        label = i === ACTIONS.length ? 'Reset to defaults' : 'Back';
      }
      font.draw(ctx, label, this.x + PAD, y, sel ? PAL.sun : PAL.cream);
      if (value) font.draw(ctx, value, this.x + W - PAD, y, sel ? PAL.sun : PAL.peach, 'right');
    }
    font.draw(ctx, 'Esc: menu (fixed).  1-9: hotbar.', this.x + W / 2, this.y + this.h - 12, PAL.dirtLight, 'center');
  }
}
