// The Bramblewick Forge: upgrade the pickaxe, axe and hoe through five tiers.
// One row per tool: icon, name with its tier, what the next tier improves, its cost, a bar per
// tier and a Buy button. Up/Down (or hover) picks a row; E / Space / Enter or the Buy button
// asks to confirm the upgrade; Esc leaves.

import { VIEW_W, VIEW_H } from '../config.js';
import { PAL } from '../rendering/palette.js';
import { ITEMS } from '../data/items.js';
import { OBJECT_TYPES } from '../data/objects.js';
import { UPGRADES } from '../data/tuning.js';
import { toolStats } from '../farming/Tools.js';
import { slotName } from '../player/Inventory.js';
import { SLOT, TIER_GEMS } from './UiKit.js';
import { confirmPressed } from './MenuBox.js';

const W = 320;
const PAD = 6;
const HEADER = 16;
const ROW_H = 40;
const FOOTER = 24;
const MAX_LEVEL = UPGRADES.cost.length;
const BAR_W = 6, BAR_H = 14, BAR_GAP = 2;
const BARS_W = MAX_LEVEL * BAR_W + (MAX_LEVEL - 1) * BAR_GAP;
const BUTTON_H = 12;

const TREE_HITS = OBJECT_TYPES.tree.breakable.hits;
const ROCK_HITS = OBJECT_TYPES.rock.breakable.hits;

function fmt(n) {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

// What the next tier improves, e.g. "Next: 3 chops per tree · 2.5 energy · faster".
export function describeNext(tool, level) {
  if (level >= MAX_LEVEL) return 'Fully upgraded. A tool to be proud of!';
  const a = toolStats(tool, level), b = toolStats(tool, level + 1);
  const parts = [];
  if (b.power !== a.power) {
    if (tool === 'axe') {
      const n = Math.ceil(TREE_HITS / b.power);
      parts.push(n === 1 ? '1 chop per tree' : `${n} chops per tree`);
    } else if (tool === 'pickaxe') {
      const n = Math.ceil(ROCK_HITS / b.power);
      parts.push(n === 1 ? '1 hit per rock' : `${n} hits per rock`);
    }
  }
  if (b.energy < a.energy) parts.push(`${fmt(b.energy)} energy`);
  if (b.cooldown < a.cooldown) parts.push('faster');
  return `Next: ${parts.join(' · ')}`;
}

export class ForgeMenu {
  constructor(kit) {
    this.kit = kit;
    this.cursor = 0;
    this.message = '';
    this.tools = UPGRADES.order;
    this.h = HEADER + this.tools.length * ROW_H + FOOTER;
    this.x = Math.floor((VIEW_W - W) / 2);
    this.y = Math.floor((VIEW_H - this.h) / 2);
    this.listY = this.y + HEADER;
    this.barsX = this.x + W - PAD - BARS_W;
    // Each tool's id in ITEMS (for its icon and name), found once.
    this.itemIds = this.tools.map((t) => Object.keys(ITEMS).find((id) => ITEMS[id].tool === t));
    this.rows = this.tools.map(() => ({ level: -1, next: '' }));
  }

  reset() {
    this.cursor = 0;
    this.message = 'Pick a tool to improve.';
  }

  rowAt(mx, my) {
    if (mx < this.x || mx >= this.x + W || my < this.listY) return -1;
    const i = Math.floor((my - this.listY) / ROW_H);
    return i < this.tools.length ? i : -1;
  }

  overButton(mx, my, i) {
    const by = this.listY + i * ROW_H + 22;
    return mx >= this.barsX && mx < this.barsX + BARS_W && my >= by && my < by + BUTTON_H;
  }

  update(input, game) {
    if (input.wasPressed('menu') || input.wasPressed('inventory')) {
      game.closeModal(this);
      return;
    }
    const m = input.mouse;
    if (input.usingMouse && m.inside) {
      const i = this.rowAt(m.x, m.y);
      if (i >= 0) this.cursor = i;
      if (m.leftPressed && i >= 0 && this.overButton(m.x, m.y, i)) {
        this.tryUpgrade(game);
        return;
      }
    }
    const n = this.tools.length;
    if (input.wasPressed('up')) this.cursor = (this.cursor + n - 1) % n;
    if (input.wasPressed('down')) this.cursor = (this.cursor + 1) % n;
    if (confirmPressed(input)) this.tryUpgrade(game);
  }

  deny(game, message) {
    this.message = message;
    game.audio.play('deny');
  }

  // Checks the cost, then asks before spending anything.
  tryUpgrade(game) {
    const tool = this.tools[this.cursor];
    const slot = game.inventory.findTool(tool);
    if (!slot) {
      this.deny(game, `Bring your ${ITEMS[this.itemIds[this.cursor]].name.toLowerCase()} along first.`);
      return;
    }
    const level = slot.level || 0;
    if (level >= MAX_LEVEL) {
      this.deny(game, `Your ${slotName(slot)} can't get any better.`);
      return;
    }
    const [gold, wood] = UPGRADES.cost[level];
    if (game.money < gold) {
      this.deny(game, `You need ${gold - game.money}g more.`);
      return;
    }
    const have = game.inventory.count('wood');
    if (have < wood) {
      this.deny(game, `You need ${wood - have} more wood. Chop some trees!`);
      return;
    }
    const name = `${UPGRADES.tiers[level + 1]} ${ITEMS[slot.id].name}`;
    game.ask(`Upgrade to the ${name} for ${gold}g and ${wood} wood?`, [
      { label: 'Upgrade', action: () => this.upgrade(game, slot, level, gold, wood) },
      { label: 'Not now' },
    ]);
  }

  upgrade(game, slot, level, gold, wood) {
    game.money -= gold;
    game.inventory.removeId('wood', wood);
    slot.level = level + 1;
    this.message = `Your ${slotName(slot)} is ready. It feels wonderful!`;
    game.audio.play('upgrade');
    game.dirty = true;
  }

  draw(ctx, game) {
    const { kit } = this;
    const { font } = kit;
    const inv = game.inventory;
    ctx.fillStyle = 'rgba(29, 21, 32, 0.45)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    kit.panel(ctx, this.x, this.y, W, this.h);
    font.draw(ctx, 'Bramblewick Forge', this.x + PAD, this.y + 5, PAL.sun);
    font.draw(ctx, game.moneyLabel, this.x + W - PAD, this.y + 5, PAL.sun, 'right');
    const woodHave = inv.count('wood');

    for (let i = 0; i < this.tools.length; i++) {
      const tool = this.tools[i];
      const itemId = this.itemIds[i];
      const slot = inv.findTool(tool);
      const level = slot ? slot.level || 0 : 0;
      const row = this.rows[i];
      if (row.level !== level) {
        row.level = level;
        row.next = describeNext(tool, level);
      }
      const y = this.listY + i * ROW_H;
      const sel = i === this.cursor;
      if (sel) {
        ctx.fillStyle = PAL.wood;
        ctx.fillRect(this.x + 3, y, W - 6, ROW_H - 2);
      }

      kit.slot(ctx, null, this.x + PAD, y + 4, sel);
      kit.icon(ctx, itemId, this.x + PAD + SLOT / 2, y + 4 + SLOT / 2);
      const tx = this.x + PAD + SLOT + 6;
      const name = slot ? slotName(slot) : ITEMS[itemId].name;
      font.drawScaled(ctx, name, tx, y + 3, sel ? PAL.sun : PAL.cream, 2, PAL.ink, 'left');

      const maxed = level >= MAX_LEVEL;
      font.draw(ctx, slot ? row.next : 'Not in your bag.', tx, y + 20, maxed ? PAL.leafLight : PAL.cream);
      let canBuy = false;
      if (slot && !maxed) {
        const [gold, wood] = UPGRADES.cost[level];
        const goldOk = game.money >= gold, woodOk = woodHave >= wood;
        canBuy = goldOk && woodOk;
        let cx = tx;
        font.draw(ctx, 'Cost:', cx, y + 29, PAL.dirtLight);
        cx += font.measure('Cost:') + 4;
        const goldText = `${gold}g`;
        font.draw(ctx, goldText, cx, y + 29, goldOk ? PAL.cream : PAL.rose);
        cx += font.measure(goldText) + 4;
        font.draw(ctx, `+ ${wood} wood`, cx, y + 29, woodOk ? PAL.cream : PAL.rose);
      }

      // One bar per tier, filled up to the current level.
      for (let k = 0; k < MAX_LEVEL; k++) {
        const bx = this.barsX + k * (BAR_W + BAR_GAP);
        ctx.fillStyle = PAL.ink;
        ctx.fillRect(bx, y + 4, BAR_W, BAR_H);
        ctx.fillStyle = k < level ? TIER_GEMS[k] : PAL.barkDark;
        ctx.fillRect(bx + 1, y + 5, BAR_W - 2, BAR_H - 2);
      }

      // Buy button.
      const by = y + 22;
      ctx.fillStyle = PAL.ink;
      ctx.fillRect(this.barsX, by, BARS_W, BUTTON_H);
      ctx.fillStyle = maxed || !slot ? PAL.barkDark : canBuy ? (sel ? PAL.leafLight : PAL.leaf) : PAL.bark;
      ctx.fillRect(this.barsX + 1, by + 1, BARS_W - 2, BUTTON_H - 2);
      const label = maxed ? 'Max' : 'Buy';
      font.draw(ctx, label, this.barsX + BARS_W / 2, by + 3, canBuy ? PAL.white : PAL.dirtLight, 'center');
    }

    const fy = this.listY + this.tools.length * ROW_H + 2;
    font.draw(ctx, this.message, this.x + PAD, fy, PAL.peach);
    font.draw(ctx, `Wood: ${woodHave}`, this.x + W - PAD, fy, PAL.cream, 'right');
    font.draw(ctx, 'E: upgrade   Up/Down: choose   Esc: leave', this.x + PAD, fy + 11, PAL.dirtLight);
  }
}
