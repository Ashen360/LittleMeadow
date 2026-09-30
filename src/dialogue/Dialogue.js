// Picks what a villager says: the introduction on the very first chat, the "again" lines after
// the first chat of the day, otherwise a line from their friendship tier (falling back to lower
// tiers, then generic lines), rotating by day so it changes daily.

import { GENERIC_LINES } from '../data/npcs.js';

export function chooseLine(npc, tier, day, firstToday, firstEver) {
  const lines = npc.def.lines || {};
  if (firstEver && lines[0] && lines[0].length) return lines[0][0];
  if (!firstToday && lines.again && lines.again.length) return lines.again[day % lines.again.length];
  for (let t = tier; t >= 0; t--) {
    const list = lines[t];
    if (list && list.length) return list[day % list.length];
  }
  return GENERIC_LINES[day % GENERIC_LINES.length];
}
