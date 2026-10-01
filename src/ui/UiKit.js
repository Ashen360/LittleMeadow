// Shared UI drawing: panels, item slots and stack counts. Sprites are resolved once here.

import { PAL } from '../rendering/palette.js';
import { ITEMS } from '../data/items.js';
import { TOOLS } from '../data/tuning.js';

export const SLOT = 20;

// Tool tier colours for levels 1..5: copper, iron, silver, gold, starlit.
export const TIER_GEMS = [PAL.woodLight, PAL.stoneLight, PAL.white, PAL.sun, PAL.waterLight];

// Cached number strings, so stack counts don't allocate while drawing.
const NUM = Array.from({ length: 100 }, (_, i) => String(i));

export class UiKit {
  constructor(atlas, font) {
    this.atlas = atlas;
    this.font = font;
    this.slotSprite = atlas.get('ui.slot');
    this.slotSelSprite = atlas.get('ui.slot.selected');
    this.icons = {};
    for (const id of Object.keys(ITEMS)) this.icons[id] = atlas.get(ITEMS[id].icon);
  }

  panel(ctx, x, y, w, h) {
    ctx.fillStyle = PAL.ink;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = PAL.wood;
    ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
    ctx.fillStyle = PAL.bark;
    ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
  }

  // Item icon centred on (cx, cy).
  icon(ctx, id, cx, cy) {
    this.atlas.draw(ctx, this.icons[id], cx, cy);
  }

  // A slot with its top-left at (x, y). `slot` is { id, qty } or null.
  slot(ctx, slot, x, y, selected, hideItem = false) {
    this.atlas.draw(ctx, selected ? this.slotSelSprite : this.slotSprite, x, y);
    if (!slot || hideItem) return;
    const hasBar = slot.water !== undefined;
    this.icon(ctx, slot.id, x + SLOT / 2, y + SLOT / 2 - (hasBar ? 2 : 0));
    if (slot.qty > 1) {
      this.font.drawShadowed(ctx, NUM[Math.min(slot.qty, 99)], x + SLOT - 2, y + SLOT - 8, PAL.white, PAL.ink, 'right');
    }
    if (slot.level) {
      // Upgraded tool: a small gem in its tier's colour in the top-left corner.
      ctx.fillStyle = PAL.ink;
      ctx.fillRect(x + 2, y + 2, 5, 5);
      ctx.fillStyle = TIER_GEMS[slot.level - 1];
      ctx.fillRect(x + 3, y + 3, 3, 3);
    }
    if (hasBar) {
      // Water gauge along the bottom of the slot.
      const w = SLOT - 6;
      ctx.fillStyle = PAL.ink;
      ctx.fillRect(x + 3, y + SLOT - 5, w, 4);
      ctx.fillStyle = PAL.waterDeep;
      ctx.fillRect(x + 4, y + SLOT - 4, w - 2, 2);
      ctx.fillStyle = PAL.waterLight;
      ctx.fillRect(x + 4, y + SLOT - 4, Math.round((w - 2) * slot.water / TOOLS.can.capacity), 2);
    }
  }
}
