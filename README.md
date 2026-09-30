# Little Meadow

A tiny, cozy 2D pixel-art farming life-sim that runs in the browser, even on low-end laptops.
Clear an overgrown field, grow turnips, potatoes and strawberries, sell your harvest, and
get to know the four villagers of Bramblewick.

## Play
```
node tools/build.mjs
```
Then double-click `dist/LittleMeadow.html` (a single file, works offline). For development,
run `node tools/serve.mjs` and open http://localhost:8080. No dependencies to install.

| Action | Keys |
|---|---|
| Move | WASD / arrow keys |
| Use tool or item | Space / left click (hold to repeat) |
| Talk, harvest, open doors | E / right click |
| Eat | right click with a crop selected |
| Hotbar | 1–9, mouse wheel, click |
| Bag | Tab or I |
| Menu, settings | Esc |

URL flags: `?debug` (performance overlay, N = next day, extra seeds), `?lowres`.

## Docs
Design, architecture, roadmap, systems, asset and performance guides live in [`docs/`](docs/).
Start with [the playtest checklist](docs/07_PLAYTEST_CHECKLIST.md).
