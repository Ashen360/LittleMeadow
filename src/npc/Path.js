// Breadth-first search on a map's collision grid (4-directional). Maps are small (40x30), and
// a path is computed once per schedule leg, never per frame.

const DX = [0, -1, 1, 0];
const DY = [1, 0, 0, -1];

// Returns [[x, y], ...] from the tile after (sx, sy) up to (gx, gy), [] if already there,
// or null if the goal can't be reached.
export function findPath(map, sx, sy, gx, gy) {
  if (sx === gx && sy === gy) return [];
  if (!map.inBounds(gx, gy) || map.isBlocked(gx, gy)) return null;
  const w = map.w;
  const n = w * map.h;
  const prev = new Int32Array(n).fill(-1);
  const queue = new Int32Array(n);
  const start = sy * w + sx, goal = gy * w + gx;
  prev[start] = start;
  let head = 0, tail = 0;
  queue[tail++] = start;
  while (head < tail) {
    const i = queue[head++];
    if (i === goal) break;
    const x = i % w, y = (i - x) / w;
    for (let d = 0; d < 4; d++) {
      const nx = x + DX[d], ny = y + DY[d];
      if (!map.inBounds(nx, ny)) continue;
      const j = ny * w + nx;
      if (prev[j] !== -1 || map.isBlocked(nx, ny)) continue;
      prev[j] = i;
      queue[tail++] = j;
    }
  }
  if (prev[goal] === -1) return null;
  const path = [];
  for (let i = goal; i !== start; i = prev[i]) path.push([i % w, Math.floor(i / w)]);
  return path.reverse();
}
