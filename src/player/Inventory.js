// Slots of { id, qty } (null = empty). The first INVENTORY.hotbar slots form the hotbar.
// Tools don't stack; tool state (the watering can's water, a tool's upgrade level) is stored
// on the slot, so it saves with the inventory.

import { ITEMS } from '../data/items.js';
import { INVENTORY, UPGRADES } from '../data/tuning.js';

export function maxStack(id) {
  return ITEMS[id].tool ? 1 : INVENTORY.stack;
}

// Display name including a tool's tier, e.g. "Copper Axe".
export function slotName(slot) {
  const name = ITEMS[slot.id].name;
  return slot.level ? `${UPGRADES.tiers[slot.level]} ${name}` : name;
}

export class Inventory {
  constructor(size = INVENTORY.size) {
    this.slots = new Array(size).fill(null);
    this.selected = 0;
  }

  get selectedSlot() {
    return this.slots[this.selected];
  }

  get selectedItem() {
    const s = this.slots[this.selected];
    return s ? ITEMS[s.id] : null;
  }

  // How many of `id` would fit.
  roomFor(id) {
    const max = maxStack(id);
    let room = 0;
    for (const s of this.slots) {
      if (!s) room += max;
      else if (s.id === id) room += max - s.qty;
    }
    return room;
  }

  canAdd(id, qty = 1) {
    return this.roomFor(id) >= qty;
  }

  // Adds to existing stacks first, then empty slots. Returns how many didn't fit.
  add(id, qty = 1) {
    if (!ITEMS[id]) throw new Error(`Unknown item "${id}"`);
    const max = maxStack(id);
    for (const s of this.slots) {
      if (qty === 0) return 0;
      if (s && s.id === id && s.qty < max) {
        const n = Math.min(qty, max - s.qty);
        s.qty += n;
        qty -= n;
      }
    }
    for (let i = 0; i < this.slots.length && qty > 0; i++) {
      if (this.slots[i]) continue;
      const n = Math.min(qty, max);
      this.slots[i] = { id, qty: n };
      qty -= n;
    }
    return qty;
  }

  removeAt(index, qty = 1) {
    const s = this.slots[index];
    if (!s) return;
    s.qty -= qty;
    if (s.qty <= 0) this.slots[index] = null;
  }

  // Removes qty of `id` across stacks (last stacks first). Returns how many were missing.
  removeId(id, qty) {
    for (let i = this.slots.length - 1; i >= 0 && qty > 0; i--) {
      const s = this.slots[i];
      if (!s || s.id !== id) continue;
      const n = Math.min(qty, s.qty);
      this.removeAt(i, n);
      qty -= n;
    }
    return qty;
  }

  count(id) {
    let n = 0;
    for (const s of this.slots) if (s && s.id === id) n += s.qty;
    return n;
  }

  // The slot holding the tool with this TOOLS key (e.g. 'axe'), or null.
  findTool(tool) {
    for (const s of this.slots) if (s && ITEMS[s.id].tool === tool) return s;
    return null;
  }

  swap(a, b) {
    const t = this.slots[a];
    this.slots[a] = this.slots[b];
    this.slots[b] = t;
  }
}
