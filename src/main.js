// Entry point.

import { Game } from './core/Game.js';

const params = new URLSearchParams(location.search);
const canvas = document.getElementById('game');

try {
  const game = new Game(canvas, {
    debug: params.has('debug'),
    lowres: params.has('lowres'),
  });
  game.start();
  canvas.focus();
  document.getElementById('boot').remove();
  window.littleMeadow = game; // handy for poking at state from the console
} catch (err) {
  document.getElementById('boot').textContent = `Little Meadow failed to start: ${err.message}`;
  throw err;
}
