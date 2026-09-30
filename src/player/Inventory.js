// Slots of { id, qty } (null = empty). The first INVENTORY.hotbar slots form the hotbar.
// Tools don't stack; tool state (like the watering can's water) is stored on the slot.

import { ITEMS } from '../data/items.js';
import { INVENTORY } from '../data/tuning.js';

export function maxStack(id) {
  return ITEMS[id].tool ? 1 : INVENTORY.stack;
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

  count(id) {
    let n = 0;
    for (const s of this.slots) if (s && s.id === id) n += s.qty;
    return n;
  }

  swap(a, b) {
    const t = this.slots[a];
    this.slots[a] = this.slots[b];
    this.slots[b] = t;
  }
}
