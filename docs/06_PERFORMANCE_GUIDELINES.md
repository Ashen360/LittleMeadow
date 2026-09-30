# 06 — Performance Guidelines

Performance is a feature. Measure with the debug overlay (`F3`) and the browser
profiler; don't guess.

## Budgets (low-end laptop, integrated GPU)
| Metric | Budget |
|---|---|
| Frame CPU (update + render) | < 4 ms (target < 2 ms) |
| Frame rate | stable 60 FPS (vsync) |
| Idle cost (player standing still, nothing animating) | no redraws |
| JS heap | < 30 MB |
| Canvas backing store | ≤ 1152×648 (3×) by default |
| Atlas | 1 texture, ≤ 1024×1024 |
| Active entities per map | < 300 objects, < 10 moving |
| Total download (with future audio) | < 5 MB |

## Rules
1. **Render only on change.** Set `game.dirty = true` whenever the visible state changes.
   If something animates, it must set `dirty` at its own frame rate (e.g. 4–8 Hz for
   ambient animation), not every frame.
2. **Bake static things.** The ground layer is one canvas per map. Redraw single tiles on
   change; never re-bake the whole map during play (day change may re-bake soil tiles only).
3. **No per-frame allocation in hot paths.** Reuse arrays (`list.length = 0`), resolve
   sprites and names once, and avoid template strings, closures, spread and `map`/`filter`
   inside `tick`/`render`.
4. **One texture.** Everything draws from the atlas canvas. No per-sprite canvases at runtime.
5. **Integer-aligned drawing.** Snap to `1/renderScale` logical px, and keep
   `imageSmoothingEnabled = false`.
6. **No DOM in the loop.** All UI is drawn on the canvas. Touch the DOM only at boot and resize.
7. **Simple algorithms on small data.** BFS on ≤ 40×30 grids, computed once per NPC schedule
   leg, never per frame.
8. **Particles** are pooled, capped at 64, and only used where they add feedback.
9. **No dependencies** without a written justification in `02_TECHNICAL_ARCHITECTURE.md`.

## Debug overlay fields
FPS · average and worst CPU ms per frame (update + render) · redraws per second ·
entities in the map · sprites drawn last frame · render scale · JS heap (Chromium only) ·
player tile · map id.

## Measured
| Date | Machine | Scene | FPS | CPU ms avg / max | Heap |
|---|---|---|---|---|---|
| 2026-10-01 | dev machine, in-app Chromium, 3× render | Farm, walking | 60 | 0.18 / — | 2 MB |
| 2026-09-30 | cloud container, headless Chromium, 1280×720, 3× render, `dist/LittleMeadow.html` via `file://` | Farm, walking (overlay on) | 60 | 0.41 / 0.60 | 1.9 MB |
| 2026-09-30 | same | Farm, idle (overlay off) | — (0 redraws in 2 s) | — | — |
| 2026-09-30 | cloud container, headless Chromium, 1152×648, 3× render, dev server | Phase 1 farm with crops + HUD, walking (overlay on) | 60 | 0.60 / 1.00 | 2.5 MB |
| 2026-10-01 | cloud container, headless Chromium, 1152×648, 3× render, `file://` build | Phase 5 town at 10:00 with villagers, walking (overlay on) | 60 | 0.48 / 0.70 | 3.2 MB |
| 2026-10-01 | same | Town, standing still / pause menu open | — (1 redraw in 3 s / 0 in 2 s) | — | — |

Phase 0 notes: the single-file build runs from `file://` with no console errors; 266 map
entities, 90 sprites drawn per frame at the default camera. Headless Chromium uses software
rendering, so its CPU numbers are pessimistic compared with a real GPU-backed browser.
