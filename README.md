# Little Meadow

A tiny, cozy 2D pixel-art farming life-sim that runs in the browser, even on low-end laptops.
Clear an overgrown field, grow turnips, potatoes and strawberries, sell your harvest, and
get to know the four villagers of Bramblewick.

## Play
1. On GitHub, click **Code → Download ZIP**, and unzip it.
2. Double-click **`Play Little Meadow.html`**.

That's it: one file that runs in any modern browser (Chrome, Edge, Firefox), works offline,
and needs nothing installed. Your farm saves automatically in the browser. To keep a backup,
use Settings → Export save. (`index.html` is the developer page and won't run straight
from disk.)

## Develop
Run `node tools/serve.mjs` and open http://localhost:8080 (no dependencies to install).
After changing the code, run `node tools/build.mjs` to refresh `Play Little Meadow.html`
and commit it with your change, so the ZIP download stays up to date.

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
